/**
 * CLI Orchestrator Module
 * 
 * Coordinates command execution and workflow management for the Agentfile CLI
 * Integrates with workflow.yaml files, state-manager, cli-parser, env-validator, and progress-tracker
 * 
 * @module cli-orchestrator
 */

const fs = require('fs');
const path = require('path');
const fsPromises = require('fs/promises');
const { spawn } = require('child_process');

// Import integrated modules
const stateManager = require('./state-manager');
const cliParser = require('./cli-parser');
const envValidator = require('./env-validator');
const progressTracker = require('./progress-tracker');

/**
 * Workflow configuration cache
 * @private
 */
const workflowCache = new Map();

/**
 * Execution history storage
 * @private
 */
const executionHistory = new Map();

/**
 * Error codes for cli-orchestrator
 */
const ERROR_CODES = {
  WORKFLOW_LOAD_ERROR: 'WORKFLOW_LOAD_ERROR',
  WORKFLOW_PARSE_ERROR: 'WORKFLOW_PARSE_ERROR',
  WORKFLOW_VALIDATION_ERROR: 'WORKFLOW_VALIDATION_ERROR',
  WORKFLOW_PERMISSION_ERROR: 'WORKFLOW_PERMISSION_ERROR',
  WORKFLOW_NOT_FOUND: 'WORKFLOW_NOT_FOUND',
  STEP_EXECUTION_ERROR: 'STEP_EXECUTION_ERROR',
  STEP_DEPENDENCY_ERROR: 'STEP_DEPENDENCY_ERROR',
  OUTPUT_CAPTURE_ERROR: 'OUTPUT_CAPTURE_ERROR',
  AGENT_EXECUTION_ERROR: 'AGENT_EXECUTION_ERROR',
  NESTED_WORKFLOW_ERROR: 'NESTED_WORKFLOW_ERROR',
  CONDITION_EVALUATION_ERROR: 'CONDITION_EVALUATION_ERROR'
};

/**
 * Validate workflow path
 * @private */
function validateWorkflowPath(workflowPath) {
  if (!workflowPath || typeof workflowPath !== 'string') {
    return {
      success: false,
      error: {
        code: ERROR_CODES.WORKFLOW_LOAD_ERROR,
        message: 'Invalid workflow path',
        details: { operation: 'validateWorkflowPath', workflowPath, expectedType: 'string' }
      }
    };
  }
  return { success: true };
}

/**
 * Validate workflow structure
 * @private */
function validateWorkflowStructure(workflow) {
  const errors = [];
  
  if (!workflow.name || typeof workflow.name !== 'string') {
    errors.push('Missing or invalid required field: name');
  }
  
  if (!workflow.description || typeof workflow.description !== 'string') {
    errors.push('Missing or invalid required field: description');
  }
  
  if (!workflow.steps || !Array.isArray(workflow.steps) || workflow.steps.length === 0) {
    errors.push('Missing or invalid required field: steps (must be non-empty array)');
  } else {
    workflow.steps.forEach((step, index) => {
      if (!step.id) {
        errors.push(`Step ${index}: Missing required field: id`);
      }
      if (!step.name) {
        errors.push(`Step ${index}: Missing required field: name`);
      }
    });
  }
  
  if (errors.length > 0) {
    return {
      success: false,
      error: {
        code: ERROR_CODES.WORKFLOW_VALIDATION_ERROR,
        message: 'Invalid workflow structure',
        details: { errors }
      }
    };
  }
  
  return { success: true };
}

/**
 * Interpolate workflow variables
 * @private */
function interpolateVariables(workflow, context = {}) {
  const variables = {
    ...context,
    'project-root': process.cwd(),
    'date': new Date().toISOString().split('T')[0]
  };
  
  function interpolateValue(value) {
    if (typeof value === 'string') {
      let result = value;
      for (const [key, val] of Object.entries(variables)) {
        result = result.replace(new RegExp(`\\{${key}\\}`, 'g'), val);
      }
      return result;
    }
    if (Array.isArray(value)) {
      return value.map(interpolateValue);
    }
    if (typeof value === 'object' && value !== null) {
      const interpolated = {};
      for (const [k, v] of Object.entries(value)) {
        interpolated[k] = interpolateValue(v);
      }
      return interpolated;
    }
    return value;
  }
  
  return interpolateValue(workflow);
}

/**
 * Find workflow.yaml in standard locations
 * @private */
async function findWorkflowFile(workflowName, searchPaths = []) {
  const defaultPaths = [
    path.join(process.cwd(), 'workflows', workflowName, 'workflow.yaml'),
    path.join(process.cwd(), 'workflows', `${workflowName}.yaml`),
    path.join(process.cwd(), `${workflowName}.yaml`)
  ];
  
  const allPaths = [...searchPaths, ...defaultPaths];
  
  for (const workflowPath of allPaths) {
    try {
      if (fs.existsSync(workflowPath)) {
        return workflowPath;
      }
    } catch (e) {
      // Continue to next path
    }
  }
  
  return null;
}

/**
 * Load and parse a workflow.yaml file
 * @param {string} workflowPath - Path to workflow.yaml or workflow name
 * @param {Object} options - Load options
 * @param {boolean} [options.useCache=true] - Use cached workflow if available
 * @param {Object} [options.variables] - Additional variables for interpolation
 * @returns {Promise<Object>} Parsed workflow object
 */
async function loadWorkflow(workflowPath, options = {}) {
  const { useCache = true, variables = {} } = options;
  
  const pathValidation = validateWorkflowPath(workflowPath);
  if (!pathValidation.success) {
    return pathValidation;
  }
  
  if (useCache && workflowCache.has(workflowPath)) {
    const cached = workflowCache.get(workflowPath);
    return { success: true, workflow: interpolateVariables(cached, variables), fromCache: true };
  }
  
  let actualPath = workflowPath;
  if (!workflowPath.endsWith('.yaml') && !workflowPath.endsWith('.yml')) {
    actualPath = await findWorkflowFile(workflowPath);
    if (!actualPath) {
      return {
        success: false,
        error: {
          code: ERROR_CODES.WORKFLOW_LOAD_ERROR,
          message: `Workflow file not found: ${workflowPath}`,
          details: { operation: 'loadWorkflow', searchedPaths: [workflowPath] }
        }
      };
    }
  }
  
  if (!fs.existsSync(actualPath)) {
    return {
      success: false,
      error: {
        code: ERROR_CODES.WORKFLOW_LOAD_ERROR,
        message: `Workflow file not found: ${actualPath}`,
        details: { operation: 'loadWorkflow', workflowPath: actualPath }
      }
    };
  }
  
  try {
    const yamlContent = await fsPromises.readFile(actualPath, 'utf8');
    let workflow;
    
    try {
      const yaml = require('js-yaml');
      workflow = yaml.load(yamlContent);
    } catch (parseError) {
      return {
        success: false,
        error: {
          code: ERROR_CODES.WORKFLOW_PARSE_ERROR,
          message: `Failed to parse workflow YAML: ${parseError.message}`,
          details: { operation: 'loadWorkflow', filePath: actualPath, parseError: parseError.message }
        }
      };
    }
    
    const structureValidation = validateWorkflowStructure(workflow);
    if (!structureValidation.success) {
      return structureValidation;
    }
    
    workflow._sourcePath = actualPath;
    workflow._loadedAt = new Date().toISOString();
    
    workflowCache.set(workflowPath, workflow);
    
    const interpolated = interpolateVariables(workflow, variables);
    
    return { success: true, workflow: interpolated, fromCache: false, sourcePath: actualPath };
  } catch (error) {
    let errorCode = ERROR_CODES.WORKFLOW_LOAD_ERROR;
    
    if (error.code === 'EACCES' || error.code === 'EPERM') {
      errorCode = 'WORKFLOW_PERMISSION_ERROR';
    } else if (error.code === 'ENOENT') {
      errorCode = 'WORKFLOW_NOT_FOUND';
    }
    
    return {
      success: false,
      error: {
        code: errorCode,
        message: error.message,
        details: { operation: 'loadWorkflow', workflowPath: actualPath, originalError: error.code }
      }
    };
  }
}

/**
 * Execute a single workflow step
 * @param {Object} step - Step definition from workflow.yaml
 * @param {Object} context - Execution context
 * @param {string} context.workflowId - Workflow identifier
 * @param {Object} context.variables - Workflow variables
 * @param {Array} context.stepHistory - History of executed steps
 * @returns {Promise<Object>} Step result
 */
async function executeStep(step, context) {
  const { workflowId, variables = {}, stepHistory = [] } = context;

  if (!step || !step.id || !step.name) {
    return {
      success: false,
      error: {
        code: ERROR_CODES.STEP_EXECUTION_ERROR,
        message: 'Invalid step definition',
        details: { operation: 'executeStep', step }
      }
    };
  }

  const stepId = step.id;
  const startTime = new Date().toISOString();

  if (workflowId) {
    await stateManager.trackStepStart(workflowId, stepId, { stepName: step.name });
  }

  try {
    let result;
    let output = '';
    let error = null;

    if (step.action) {
      result = await executeActionStep(step, context);
      output = result.output || '';
      error = result.error;
    } else if (step.agent) {
      result = await executeAgentStep(step, context);
      output = result.output || '';
      error = result.error;
    } else if (step.invoke_workflow || step['invoke-workflow']) {
      const nestedWorkflow = step.invoke_workflow || step['invoke-workflow'];
      result = await executeNestedWorkflow(nestedWorkflow, step, context);
      output = result.output || '';
      error = result.error;
    } else if (step.check || step.if) {
      result = await evaluateCondition(step, context);
      output = JSON.stringify(result);
    } else {
      result = { success: true, message: 'Step completed' };
    }

    const endTime = new Date().toISOString();
    const duration = new Date(endTime) - new Date(startTime);

    if (workflowId) {
      await stateManager.trackStepComplete(workflowId, stepId, {
        stepName: step.name,
        output,
        error,
        startTime,
        endTime,
        duration,
        result
      });
    }

    return {
      success: error ? false : true,
      stepId,
      stepName: step.name,
      output,
      error,
      startTime,
      endTime,
      duration,
      result
    };
  } catch (error) {
    const endTime = new Date().toISOString();

    if (workflowId) {
      await stateManager.trackStepComplete(workflowId, stepId, {
        stepName: step.name,
        error: error.message,
        startTime,
        endTime,
        status: 'failed'
      });
    }

    return {
      success: false,
      stepId,
      stepName: step.name,
      error: {
        code: ERROR_CODES.STEP_EXECUTION_ERROR,
        message: error.message,
        details: { operation: 'executeStep', stepId, originalError: error.message }
      }
    };
  }
}

/**
 * Execute an action step (shell command)
 * @private */
async function executeActionStep(step, context) {
  const { variables = {} } = context;

  let command = step.command;
  if (step.action === 'shell') {
    for (const [key, val] of Object.entries(variables)) {
      command = command.replace(new RegExp(`\\{${key}\\}`, 'g'), val);
    }
  }

  return new Promise((resolve) => {
    const outputs = [];
    const errors = [];

    const isShell = step.action === 'shell';
    const cmd = isShell ? (process.platform === 'win32' ? 'cmd.exe' : '/bin/sh') : step.command;
    const args = isShell ? (process.platform === 'win32' ? ['/c', command] : ['-c', command]) : (step.args || []);

    const child = spawn(cmd, args, { shell: false });

    child.stdout.on('data', (data) => {
      outputs.push(data.toString());
    });

    child.stderr.on('data', (data) => {
      errors.push(data.toString());
    });

    child.on('close', (code) => {
      const output = outputs.join('');
      const errorOutput = errors.join('');

      resolve({
        success: code === 0,
        output,
        error: code !== 0 ? errorOutput || `Process exited with code ${code}` : null,
        exitCode: code
      });
    });

    child.on('error', (err) => {
      resolve({
        success: false,
        output: '',
        error: err.message
      });
    });
  });
}

/**
 * Execute an agent step
 * @private
 * @param {Object} step - Step definition with agent property
 * @param {Object} context - Execution context
 * @returns {Promise<Object>} Agent execution result
 */
async function executeAgentStep(step, context) {
  const { variables = {}, workflowId } = context;
  
  if (!step.agent) {
    return {
      success: false,
      output: '',
      error: {
        code: ERROR_CODES.AGENT_EXECUTION_ERROR,
        message: 'No agent specified for agent step'
      }
    };
  }

  const agentName = step.agent;
  const agentParams = step.params || {};
  
  // Interpolate variables in agent params
  const interpolatedParams = {};
  for (const [key, value] of Object.entries(agentParams)) {
    if (typeof value === 'string') {
      let interpolated = value;
      for (const [varKey, varValue] of Object.entries(variables)) {
        interpolated = interpolated.replace(new RegExp(`\\{${varKey}\\}`, 'g'), varValue);
      }
      interpolatedParams[key] = interpolated;
    } else {
      interpolatedParams[key] = value;
    }
  }

  // Track agent start in state
  if (workflowId) {
    await stateManager.trackStepStart(workflowId, `agent-${agentName}`, {
      agentName,
      params: interpolatedParams
    });
  }

  try {
    // For now, simulate agent execution - in production this would call the agent system
    const agentOutput = `Agent: ${agentName} executed with params: ${JSON.stringify(interpolatedParams)}`;
    
    // Simulate some processing time
    await new Promise(resolve => setTimeout(resolve, 100));

    if (workflowId) {
      await stateManager.trackStepComplete(workflowId, `agent-${agentName}`, {
        agentName,
        output: agentOutput
      });
    }

    return {
      success: true,
      output: agentOutput,
      error: null
    };
  } catch (error) {
    if (workflowId) {
      await stateManager.trackStepComplete(workflowId, `agent-${agentName}`, {
        agentName,
        error: error.message
      });
    }

    return {
      success: false,
      output: '',
      error: {
        code: ERROR_CODES.AGENT_EXECUTION_ERROR,
        message: error.message,
        details: { operation: 'executeAgentStep', agentName }
      }
    };
  }
}

/**
 * Execute a nested workflow
 * @private
 * @param {string} workflowName - Name of nested workflow to execute
 * @param {Object} step - Step definition
 * @param {Object} context - Execution context
 * @returns {Promise<Object>} Nested workflow execution result
 */
async function executeNestedWorkflow(workflowName, step, context) {
  const { variables = {}, workflowId } = context;

  if (!workflowName) {
    return {
      success: false,
      output: '',
      error: {
        code: ERROR_CODES.NESTED_WORKFLOW_ERROR,
        message: 'No workflow name specified for nested workflow'
      }
    };
  }

  // Track nested workflow start
  if (workflowId) {
    await stateManager.trackStepStart(workflowId, `nested-${workflowName}`, {
      nestedWorkflow: workflowName
    });
  }

  try {
    // Load and execute the nested workflow
    const loadResult = await loadWorkflow(workflowName, { variables, useCache: false });
    
    if (!loadResult.success) {
      throw new Error(loadResult.error.message);
    }

    // Execute the nested workflow
    const nestedResult = await executeWorkflow(workflowName, {
      variables,
      useProgressTracker: false
    });

    const output = `Nested workflow: ${workflowName} - ${nestedResult.successfulSteps}/${nestedResult.totalSteps} steps completed`;

    if (workflowId) {
      await stateManager.trackStepComplete(workflowId, `nested-${workflowName}`, {
        nestedWorkflow: workflowName,
        output,
        success: nestedResult.success
      });
    }

    return {
      success: nestedResult.success,
      output,
      error: nestedResult.hasFailed ? new Error('Nested workflow failed') : null
    };
  } catch (error) {
    if (workflowId) {
      await stateManager.trackStepComplete(workflowId, `nested-${workflowName}`, {
        nestedWorkflow: workflowName,
        error: error.message
      });
    }

    return {
      success: false,
      output: '',
      error: {
        code: ERROR_CODES.NESTED_WORKFLOW_ERROR,
        message: error.message,
        details: { operation: 'executeNestedWorkflow', workflowName }
      }
    };
  }
}

/**
 * Evaluate a condition/check
 * @private
 * @param {Object} step - Step definition with check or if property
 * @param {Object} context - Execution context with variables
 * @returns {Promise<Object>} Condition evaluation result
 */
async function evaluateCondition(step, context) {
  const { variables = {}, stepHistory = [] } = context;
  
  const condition = step.check || step.if;
  
  if (!condition) {
    return {
      condition: null,
      evaluated: false,
      result: false,
      error: 'No condition specified'
    };
  }

  try {
    // Parse and evaluate simple conditions
    // Supports: variable comparisons, step existence checks, and simple expressions
    let result = false;
    let evaluatedCondition = condition;

    // Replace variable references with actual values
    for (const [key, value] of Object.entries(variables)) {
      evaluatedCondition = evaluatedCondition.replace(new RegExp(`\\{${key}\\}`, 'g'), 
        typeof value === 'string' ? `"${value}"` : value);
    }

    // Replace step history references
    stepHistory.forEach((stepResult, index) => {
      const stepNum = index + 1;
      const pattern = '{step.' + stepNum + '.success}';
      evaluatedCondition = evaluatedCondition.replace(
        pattern,
        stepResult.success ? 'true' : 'false'
      );
    });

    // Handle common comparison operators
    if (evaluatedCondition.includes('===') || evaluatedCondition.includes('==')) {
      const parts = evaluatedCondition.split(/===|==/);
      const left = JSON.parse(parts[0].trim());
      const right = JSON.parse(parts[1].trim());
      result = left === right;
    } else if (evaluatedCondition.includes('!==') || evaluatedCondition.includes('!=')) {
      const parts = evaluatedCondition.split(/!==|!=/);
      const left = JSON.parse(parts[0].trim());
      const right = JSON.parse(parts[1].trim());
      result = left !== right;
    } else if (evaluatedCondition.includes('>')) {
      const parts = evaluatedCondition.split('>');
      const left = parseFloat(parts[0].trim());
      const right = parseFloat(parts[1].trim());
      result = left > right;
    } else if (evaluatedCondition.includes('<')) {
      const parts = evaluatedCondition.split('<');
      const left = parseFloat(parts[0].trim());
      const right = parseFloat(parts[1].trim());
      result = left < right;
    } else if (evaluatedCondition.includes('&&')) {
      const parts = evaluatedCondition.split('&&');
      result = parts.every(p => {
        const val = p.trim();
        return val === 'true' || val === 'false' ? val === 'true' : Boolean(val);
      });
    } else if (evaluatedCondition.includes('||')) {
      const parts = evaluatedCondition.split('||');
      result = parts.some(p => {
        const val = p.trim();
        return val === 'true' || val === 'false' ? val === 'true' : Boolean(val);
      });
    } else {
      // Simple truthy check
      result = Boolean(evaluatedCondition);
    }

    return {
      condition,
      evaluated: true,
      result
    };
  } catch (error) {
    return {
      condition,
      evaluated: false,
      result: false,
      error: {
        code: ERROR_CODES.CONDITION_EVALUATION_ERROR,
        message: error.message,
        details: { operation: 'evaluateCondition' }
      }
    };
  }
}

/**
 * Execute all steps in a workflow
 * @param {string} workflowName - Name of workflow to execute
 * @param {Object} options - Execution options
 * @returns {Promise<Object>} Execution result
 */
async function executeWorkflow(workflowName, options = {}) {
  const {
    variables = {},
    onStepStart,
    onStepComplete,
    useProgressTracker = true
  } = options;

  // Load workflow
  const loadResult = await loadWorkflow(workflowName, { variables });
  if (!loadResult.success) {
    return loadResult;
  }

  const workflow = loadResult.workflow;
  const workflowId = workflowName.toLowerCase().replace(/[^a-z0-9]/g, '-');

  // Initialize progress tracker
  let tracker = null;
  if (useProgressTracker) {
    tracker = await progressTracker.createProgressTracker({
      totalSteps: workflow.steps.length,
      workflowName: workflow.name
    });
  }

  // Initialize state
  const initialState = {
    workflowId,
    workflowName: workflow.name,
    variables,
    startedAt: new Date().toISOString(),
    steps: {}
  };

  await stateManager.saveState(workflowId, initialState);

  const stepResults = [];
  let hasFailed = false;

  // Execute each step sequentially
  for (let i = 0; i < workflow.steps.length; i++) {
    const step = workflow.steps[i];

    if (hasFailed && !step.continueOnError) {
      break;
    }

    // Update progress
    if (tracker) {
      await progressTracker.updateProgress(i + 1, step.name);
    }

    // Call step start callback
    if (onStepStart) {
      await onStepStart(step, i + 1, workflow.steps.length);
    }

    // Execute step
    const context = {
      workflowId,
      variables,
      stepHistory: stepResults,
      workflow
    };

    const stepResult = await executeStep(step, context);
    stepResults.push(stepResult);

    // Call step complete callback
    if (onStepComplete) {
      await onStepComplete(stepResult, i + 1, workflow.steps.length);
    }

    // Complete progress step
    if (tracker) {
      await progressTracker.completeStep();
    }

    if (!stepResult.success && !step.continueOnError) {
      hasFailed = true;
    }
  }

  // Destroy progress tracker
  if (tracker) {
    await progressTracker.destroy();
  }

  // Calculate summary
  const successfulSteps = stepResults.filter(r => r.success).length;
  const failedSteps = stepResults.filter(r => !r.success).length;
  const totalDuration = stepResults.reduce((sum, r) => sum + (r.duration || 0), 0);

  // Store execution history
  const executionRecord = {
    workflowId,
    workflowName: workflow.name,
    startedAt: initialState.startedAt,
    completedAt: new Date().toISOString(),
    totalSteps: workflow.steps.length,
    successfulSteps,
    failedSteps,
    totalDuration,
    stepResults
  };

  executionHistory.set(workflowId, executionRecord);

  return {
    success: !hasFailed,
    workflowId,
    workflowName: workflow.name,
    totalSteps: workflow.steps.length,
    successfulSteps,
    failedSteps,
    totalDuration,
    stepResults,
    executionRecord
  };
}

/**
 * Capture output from a step execution
 * @param {Function} stepFn - Step function to execute
 * @returns {Promise<Object>} Output result
 */
async function captureOutput(stepFn) {
  const originalStdout = process.stdout;
  const originalStderr = process.stderr;

  let stdoutChunks = [];
  let stderrChunks = [];

  // Create custom stream to capture output
  const createCaptureStream = (collector) => {
    return {
      write: (data) => {
        collector.push(data.toString());
      },
      isTTY: false
    };
  };

  process.stdout = createCaptureStream(stdoutChunks);
  process.stderr = createCaptureStream(stderrChunks);

  try {
    const result = await stepFn();

    const stdout = stdoutChunks.join('');
    const stderr = stderrChunks.join('');

    return {
      success: result.success !== false,
      output: stdout,
      error: stderr,
      result
    };
  } catch (error) {
    const stdout = stdoutChunks.join('');
    const stderr = stderrChunks.join('');
    
    return {
      success: false,
      output: stdout,
      error: {
        code: ERROR_CODES.OUTPUT_CAPTURE_ERROR,
        message: error.message,
        details: { operation: 'captureOutput' }
      }
    };
  } finally {
    process.stdout = originalStdout;
    process.stderr = originalStderr;
  }
}

/**
 * Get workflow execution history
 * @param {string} workflowName - Workflow name
 * @returns {Promise<Array>} Execution history
 */
async function getExecutionHistory(workflowName) {
  const workflowId = workflowName.toLowerCase().replace(/[^a-z0-9]/g, '-');

  if (executionHistory.has(workflowId)) {
    return { success: true, history: [executionHistory.get(workflowId)] };
  }

  // Try to load from state manager
  const loadResult = await stateManager.loadState(workflowId);
  if (loadResult.success) {
    return { success: true, history: [loadResult.state] };
  }

  return { success: true, history: [] };
}

/**
 * Clear workflow cache
 * @param {string} [workflowPath] - Optional specific workflow to clear
 */
function clearCache(workflowPath) {
  if (workflowPath) {
    workflowCache.delete(workflowPath);
  } else {
    workflowCache.clear();
  }
}

/**
 * Execute an agentfile command
 * @param {string} command - Command to execute
 * @param {Object} options - Execution options
 * @returns {Promise<Object>} Execution result
 */
async function executeCommand(command, options = {}) {
  // Parse command using cli-parser
  const parsed = await cliParser.parseArguments(command.split(' '));

  if (!parsed.success) {
    return parsed;
  }

  // Validate environment
  const envResult = await envValidator.validateEnvironment();
  if (!envResult.success) {
    return envResult;
  }

  // Execute workflow if command is 'run'
  if (parsed.args[0] === 'run' && parsed.args[1]) {
    return await executeWorkflow(parsed.args[1], options);
  }

  return { success: true, command: parsed.args[0], options: parsed.options };
}

/**
 * Run a workflow
 * @param {string} workflowName - Name of workflow to run
 * @param {Object} args - Workflow arguments
 * @returns {Promise<Object>} Workflow result
 */
async function runWorkflow(workflowName, args = {}) {
  return await executeWorkflow(workflowName, { variables: args });
}

/**
 * Initialize a new workflow run
 * @param {string} workflowName - Name of workflow
 * @returns {Promise<string>} Run ID
 */
async function initRun(workflowName) {
  const workflowId = workflowName.toLowerCase().replace(/[^a-z0-9]/g, '-');
  const runId = `${workflowId}-${Date.now()}`;

  await stateManager.saveState(runId, {
    workflowId,
    workflowName,
    status: 'initialized',
    initializedAt: new Date().toISOString()
  });

  return runId;
}

/**
 * Promote a completed workflow
 * @param {string} runId - Run identifier
 * @returns {Promise<Object>} Promotion result
 */
async function promoteRun(runId) {
  const loadResult = await stateManager.loadState(runId);

  if (!loadResult.success) {
    return {
      success: false,
      error: {
        code: 'PROMOTE_ERROR',
        message: `Run not found: ${runId}`
      }
    };
  }

  return { success: true, runId, promotedAt: new Date().toISOString() };
}

/**
 * Get workflow status
 * @param {string} runId - Run identifier
 * @returns {Promise<Object>} Status information
 */
async function getStatus(runId) {
  const loadResult = await stateManager.loadState(runId);

  if (!loadResult.success) {
    return {
      success: false,
      error: {
        code: 'STATUS_ERROR',
        message: `Run not found: ${runId}`
      }
    };
  }

  const state = loadResult.state;
  return {
    success: true,
    status: state.status || 'unknown',
    step: state.currentStep || '',
    workflowName: state.workflowName,
    updatedAt: state.savedAt
  };
}

module.exports = {
  loadWorkflow,
  executeWorkflow,
  executeStep,
  captureOutput,
  getExecutionHistory,
  clearCache,
  executeCommand,
  runWorkflow,
  initRun,
  promoteRun,
  getStatus,
  ERROR_CODES
};
