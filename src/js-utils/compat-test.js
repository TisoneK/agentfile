/**
 * Backward Compatibility Test Module
 * 
 * Validates that existing Agentfile projects work unchanged with JavaScript utilities.
 * Tests workflow.yaml parsing, agent file structure, and skill file structure.
 * 
 * @module compat-test
 */

const fs = require('fs');
const path = require('path');
const fsPromises = require('fs/promises');
const yaml = require('js-yaml');

// Import Epic 5 modules for integration testing
const cliOrchestrator = require('./cli-orchestrator');
const cliParser = require('./cli-parser');
const envValidator = require('./env-validator');
const progressTracker = require('./progress-tracker');

/**
 * Error codes for backward compatibility tests
 */
const ERROR_CODES = {
  COMPAT_TEST_ERROR: 'COMPAT_TEST_ERROR',
  WORKFLOW_PARSE_INCOMPATIBLE: 'WORKFLOW_PARSE_INCOMPATIBLE',
  AGENT_LOAD_INCOMPATIBLE: 'AGENT_LOAD_INCOMPATIBLE',
  SKILL_LOAD_INCOMPATIBLE: 'SKILL_LOAD_INCOMPATIBLE',
  INTEGRATION_TEST_FAILED: 'INTEGRATION_TEST_FAILED'
};

/**
 * Validate workflow.yaml backward compatibility
 * @param {string} workflowPath - Path to workflow.yaml
 * @returns {Promise<Object>} Validation result with all fields parsed
 */
async function validateWorkflowCompatibility(workflowPath) {
  const result = {
    success: true,
    fields: {},
    stepTypes: [],
    variables: [],
    errors: []
  };

  // Validate input
  if (!workflowPath || typeof workflowPath !== 'string') {
    return {
      success: false,
      error: {
        code: ERROR_CODES.WORKFLOW_PARSE_INCOMPATIBLE,
        message: 'Invalid workflow path',
        details: { operation: 'validateWorkflowCompatibility', workflowPath }
      }
    };
  }

  // Check file exists
  if (!fs.existsSync(workflowPath)) {
    return {
      success: false,
      error: {
        code: ERROR_CODES.WORKFLOW_PARSE_INCOMPATIBLE,
        message: `Workflow file not found: ${workflowPath}`,
        details: { operation: 'validateWorkflowCompatibility', workflowPath }
      }
    };
  }

  try {
    // Read and parse workflow.yaml
    const yamlContent = await fsPromises.readFile(workflowPath, 'utf8');
    let workflow;
    
    try {
      workflow = yaml.load(yamlContent);
    } catch (parseError) {
      result.errors.push(`YAML parse error: ${parseError.message}`);
      return {
        success: false,
        error: {
          code: ERROR_CODES.WORKFLOW_PARSE_INCOMPATIBLE,
          message: `Failed to parse workflow YAML: ${parseError.message}`,
          details: { filePath: workflowPath, parseError: parseError.message }
        }
      };
    }

    // Validate required fields
    const requiredFields = ['name', 'description', 'steps'];
    for (const field of requiredFields) {
      if (!workflow[field]) {
        result.errors.push(`Missing required field: ${field}`);
      }
      result.fields[field] = workflow[field] ? 'present' : 'missing';
    }

    // Extract optional fields
    const optionalFields = ['version', 'specVersion', 'execution', 'trigger', 'output', 'variables'];
    for (const field of optionalFields) {
      result.fields[field] = workflow[field] || null;
    }

    // Extract step types
    if (workflow.steps && Array.isArray(workflow.steps)) {
      for (const step of workflow.steps) {
        const stepTypes = [];
        if (step.action) stepTypes.push('action');
        if (step.agent) stepTypes.push('agent');
        if (step.skill) stepTypes.push('skill');
        if (step.check || step.if) stepTypes.push('check');
        if (step.ask) stepTypes.push('ask');
        if (step.invokeWorkflow || step['invoke-workflow']) stepTypes.push('invoke-workflow');
        if (step.templateOutput || step['template-output']) stepTypes.push('template-output');
        if (step.repeat) stepTypes.push('repeat');
        if (step.forEach || step['for-each']) stepTypes.push('for-each');
        
        result.stepTypes.push({
          id: step.id,
          name: step.name,
          types: stepTypes,
          optional: step.optional || false
        });
      }
    }

    // Extract variables
    if (workflow.variables && typeof workflow.variables === 'object') {
      result.variables = Object.keys(workflow.variables);
    }

    // Validate step attributes
    const stepAttrs = ['id', 'name'];
    for (const step of workflow.steps || []) {
      for (const attr of stepAttrs) {
        if (!step[attr]) {
          result.errors.push(`Step missing required attribute: ${attr}`);
        }
      }
    }

    return {
      success: result.errors.length === 0,
      result,
      workflow
    };
  } catch (error) {
    return {
      success: false,
      error: {
        code: ERROR_CODES.WORKFLOW_PARSE_INCOMPATIBLE,
        message: error.message,
        details: { operation: 'validateWorkflowCompatibility', workflowPath, error: error.code }
      }
    };
  }
}

/**
 * Validate agent file backward compatibility
 * @param {string} agentPath - Path to agent directory or file
 * @returns {Promise<Object>} Validation result with all agents loaded
 */
async function validateAgentCompatibility(agentPath) {
  const result = {
    success: true,
    agents: [],
    errors: []
  };

  // Validate input
  if (!agentPath || typeof agentPath !== 'string') {
    return {
      success: false,
      error: {
        code: ERROR_CODES.AGENT_LOAD_INCOMPATIBLE,
        message: 'Invalid agent path',
        details: { operation: 'validateAgentCompatibility', agentPath }
      }
    };
  }

  // Check if path exists
  if (!fs.existsSync(agentPath)) {
    return {
      success: false,
      error: {
        code: ERROR_CODES.AGENT_LOAD_INCOMPATIBLE,
        message: `Agent path not found: ${agentPath}`,
        details: { operation: 'validateAgentCompatibility', agentPath }
      }
    };
  }

  try {
    const stats = await fsPromises.stat(agentPath);
    const agentFiles = [];

    if (stats.isDirectory()) {
      // Find all .md files in directory
      const files = await fsPromises.readdir(agentPath);
      for (const file of files) {
        if (file.endsWith('.md')) {
          agentFiles.push(path.join(agentPath, file));
        }
      }
    } else if (stats.isFile() && agentPath.endsWith('.md')) {
      agentFiles.push(agentPath);
    }

    // Load each agent file
    for (const agentFile of agentFiles) {
      try {
        const content = await fsPromises.readFile(agentFile, 'utf8');
        
        // Parse frontmatter
        let metadata = {};
        let body = content;
        
        if (content.startsWith('---')) {
          const frontmatterEnd = content.indexOf('---', 3);
          if (frontmatterEnd > 0) {
            const frontmatter = content.substring(3, frontmatterEnd).trim();
            try {
              metadata = yaml.load(frontmatter) || {};
            } catch (e) {
              result.errors.push(`Failed to parse frontmatter in ${path.basename(agentFile)}`);
            }
            body = content.substring(frontmatterEnd + 3).trim();
          }
        }

        // Extract commands from ## Commands section
        const commands = [];
        const commandsMatch = body.match(/^##\s+Commands\s*$/m);
        if (commandsMatch) {
          const commandsSection = body.substring(commandsMatch.index);
          const commandMatches = commandsSection.match(/^###\s+(\w+)/gm);
          if (commandMatches) {
            for (const match of commandMatches) {
              const commandName = match.replace(/^###\s+/, '');
              commands.push(commandName);
            }
          }
        }

        result.agents.push({
          file: path.basename(agentFile),
          path: agentFile,
          metadata,
          hasMetadata: Object.keys(metadata).length > 0,
          commands,
          bodyLength: body.length
        });
      } catch (loadError) {
        result.errors.push(`Failed to load agent ${path.basename(agentFile)}: ${loadError.message}`);
      }
    }

    return {
      success: result.errors.length === 0 && result.agents.length > 0,
      result,
      agentCount: result.agents.length
    };
  } catch (error) {
    return {
      success: false,
      error: {
        code: ERROR_CODES.AGENT_LOAD_INCOMPATIBLE,
        message: error.message,
        details: { operation: 'validateAgentCompatibility', agentPath, error: error.code }
      }
    };
  }
}

/**
 * Validate skill file backward compatibility
 * @param {string} skillPath - Path to skill directory or file
 * @returns {Promise<Object>} Validation result with all skills loaded
 */
async function validateSkillCompatibility(skillPath) {
  const result = {
    success: true,
    skills: [],
    errors: []
  };

  // Validate input
  if (!skillPath || typeof skillPath !== 'string') {
    return {
      success: false,
      error: {
        code: ERROR_CODES.SKILL_LOAD_INCOMPATIBLE,
        message: 'Invalid skill path',
        details: { operation: 'validateSkillCompatibility', skillPath }
      }
    };
  }

  // Check if path exists
  if (!fs.existsSync(skillPath)) {
    return {
      success: false,
      error: {
        code: ERROR_CODES.SKILL_LOAD_INCOMPATIBLE,
        message: `Skill path not found: ${skillPath}`,
        details: { operation: 'validateSkillCompatibility', skillPath }
      }
    };
  }

  try {
    const stats = await fsPromises.stat(skillPath);
    const skillFiles = [];

    if (stats.isDirectory()) {
      // Find all .md files in directory
      const files = await fsPromises.readdir(skillPath);
      for (const file of files) {
        if (file.endsWith('.md')) {
          skillFiles.push(path.join(skillPath, file));
        }
      }
    } else if (stats.isFile() && skillPath.endsWith('.md')) {
      skillFiles.push(skillPath);
    }

    // Load each skill file
    for (const skillFile of skillFiles) {
      try {
        const content = await fsPromises.readFile(skillFile, 'utf8');
        
        // Parse frontmatter
        let metadata = {};
        let body = content;
        
        if (content.startsWith('---')) {
          const frontmatterEnd = content.indexOf('---', 3);
          if (frontmatterEnd > 0) {
            const frontmatter = content.substring(3, frontmatterEnd).trim();
            try {
              metadata = yaml.load(frontmatter) || {};
            } catch (e) {
              result.errors.push(`Failed to parse frontmatter in ${path.basename(skillFile)}`);
            }
            body = content.substring(frontmatterEnd + 3).trim();
          }
        }

        // Extract templates
        const templates = [];
        const templatesMatch = body.match(/^###\s+(\w+)\s+Template/gm);
        if (templatesMatch) {
          for (const match of templatesMatch) {
            templates.push(match.replace(/^###\s+/, '').replace(/\s+Template$/, ''));
          }
        }

        // Extract functions
        const functions = [];
        const functionsMatch = body.match(/^###\s+(\w+)\s*\(/gm);
        if (functionsMatch) {
          for (const match of functionsMatch) {
            const funcName = match.replace(/^###\s+/, '').replace(/\($/, '');
            functions.push(funcName);
          }
        }

        result.skills.push({
          file: path.basename(skillFile),
          path: skillFile,
          metadata,
          hasMetadata: Object.keys(metadata).length > 0,
          templates,
          functions,
          bodyLength: body.length
        });
      } catch (loadError) {
        result.errors.push(`Failed to load skill ${path.basename(skillFile)}: ${loadError.message}`);
      }
    }

    return {
      success: result.errors.length === 0 && result.skills.length > 0,
      result,
      skillCount: result.skills.length
    };
  } catch (error) {
    return {
      success: false,
      error: {
        code: ERROR_CODES.SKILL_LOAD_INCOMPATIBLE,
        message: error.message,
        details: { operation: 'validateSkillCompatibility', skillPath, error: error.code }
      }
    };
  }
}

/**
 * Run end-to-end compatibility test
 * @param {string} projectPath - Path to test project
 * @returns {Promise<Object>} Full test results
 */
async function runCompatibilityTests(projectPath) {
  const results = {
    success: true,
    workflow: null,
    agents: null,
    skills: null,
    integration: null,
    errors: []
  };

  // Validate input
  if (!projectPath || typeof projectPath !== 'string') {
    return {
      success: false,
      error: {
        code: ERROR_CODES.INTEGRATION_TEST_FAILED,
        message: 'Invalid project path',
        details: { operation: 'runCompatibilityTests', projectPath }
      }
    };
  }

  // Check if path exists
  if (!fs.existsSync(projectPath)) {
    return {
      success: false,
      error: {
        code: ERROR_CODES.INTEGRATION_TEST_FAILED,
        message: `Project path not found: ${projectPath}`,
        details: { operation: 'runCompatibilityTests', projectPath }
      }
    };
  }

  try {
    // Test 1: Validate workflow.yaml
    const workflowPath = path.join(projectPath, 'workflow.yaml');
    if (fs.existsSync(workflowPath)) {
      const workflowResult = await validateWorkflowCompatibility(workflowPath);
      results.workflow = workflowResult;
      if (!workflowResult.success) {
        results.errors.push(`Workflow validation failed: ${workflowResult.error?.message}`);
      }
    } else {
      results.errors.push('workflow.yaml not found');
      results.workflow = { success: false, error: 'File not found' };
    }

    // Test 2: Validate agents
    const agentPath = path.join(projectPath, 'agents');
    if (fs.existsSync(agentPath)) {
      const agentResult = await validateAgentCompatibility(agentPath);
      results.agents = agentResult;
      if (!agentResult.success) {
        results.errors.push(`Agent validation failed: ${agentResult.error?.message}`);
      }
    } else {
      results.agents = { success: false, error: 'Directory not found' };
    }

    // Test 3: Validate skills
    const skillPath = path.join(projectPath, 'skills');
    if (fs.existsSync(skillPath)) {
      const skillResult = await validateSkillCompatibility(skillPath);
      results.skills = skillResult;
      if (!skillResult.success) {
        results.errors.push(`Skill validation failed: ${skillResult.error?.message}`);
      }
    } else {
      results.skills = { success: false, error: 'Directory not found' };
    }

    // Test 4: Integration test - try to load workflow using cli-orchestrator
    if (results.workflow?.success) {
      try {
        const loadResult = await cliOrchestrator.loadWorkflow(workflowPath);
        results.integration = {
          success: loadResult.success,
          workflowLoaded: loadResult.success,
          fromCache: loadResult.fromCache || false,
          sourcePath: loadResult.sourcePath
        };
        
        if (!loadResult.success) {
          results.errors.push(`Workflow loading failed: ${loadResult.error?.message}`);
        }
      } catch (orchError) {
        results.integration = {
          success: false,
          error: orchError.message
        };
        results.errors.push(`Orchestrator integration failed: ${orchError.message}`);
      }
    }

    // Determine overall success
    results.success = results.errors.length === 0;

    return results;
  } catch (error) {
    return {
      success: false,
      error: {
        code: ERROR_CODES.INTEGRATION_TEST_FAILED,
        message: error.message,
        details: { operation: 'runCompatibilityTests', projectPath, error: error.code }
      }
    };
  }
}

/**
 * Get the path to the default compatibility test project
 * @returns {string} Path to test fixtures
 */
function getTestFixturesPath() {
  return path.join(__dirname, '..', '..', 'tests', 'compat');
}

module.exports = {
  validateWorkflowCompatibility,
  validateAgentCompatibility,
  validateSkillCompatibility,
  runCompatibilityTests,
  getTestFixturesPath,
  ERROR_CODES
};
