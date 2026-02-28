/**
 * State Manager Module
 * 
 * Provides workflow state persistence using YAML files
 * 
 * @module state-manager
 */

const fs = require('fs');
const path = require('path');
const fsPromises = require('fs/promises');

/**
 * Default state directory (relative to project root)
 * @private
 */
const DEFAULT_STATE_DIR = '.agentfile/state';

/**
 * Find the project root by looking for agentfile.yaml or .agentfile
 * @private
 * @returns {string|null} Project root path or null if not found
 */
function findProjectRoot(startDir) {
  const currentDir = startDir || process.cwd();
  const markerFiles = ['agentfile.yaml', '.agentfile'];
  
  let dir = currentDir;
  // Limit search to 10 levels up
  for (let i = 0; i < 10; i++) {
    for (const marker of markerFiles) {
      if (fs.existsSync(path.join(dir, marker))) {
        return dir;
      }
    }
    const parent = path.dirname(dir);
    if (parent === dir) break; // Reached filesystem root
    dir = parent;
  }
  return null;
}

/**
 * Get the state directory path
 * @param {string} [projectRoot] - Optional project root (auto-detected if not provided)
 * @returns {string} State directory path
 */
function getStateDir(projectRoot) {
  const root = projectRoot || findProjectRoot() || process.cwd();
  return path.join(root, DEFAULT_STATE_DIR);
}

/**
 * WorkflowState interface
 * @typedef {Object} WorkflowState
 * @property {Object} variables - Workflow variables
 * @property {Array<StepState>} stepHistory - History of workflow steps
 * @property {Object} timestamps - Timestamps for workflow events
 * @property {string} [workflowId] - Optional workflow identifier
 */

/**
 * StepState interface
 * @typedef {Object} StepState
 * @property {string} stepId - Step identifier
 * @property {string} status - Step status (pending, in-progress, completed, failed)
 * @property {string} startTime - ISO timestamp when step started
 * @property {string} [endTime] - ISO timestamp when step ended
 * @property {Object} [data] - Step-specific data
 */

/**
 * Ensure state directory exists, create if needed
 * @param {string} [projectRoot] - Optional project root (auto-detected if not provided)
 * @returns {Promise<object>} Result with success or error
 */
async function ensureStateDirectory(projectRoot) {
  const stateDir = getStateDir(projectRoot);
  try {
    await fsPromises.mkdir(stateDir, { recursive: true });
    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: {
        code: 'STATE_DIR_CREATE_ERROR',
        message: `Failed to create state directory: ${error.message}`,
        details: { operation: 'ensureStateDirectory', dirPath: stateDir, originalError: error.code }
      }
    };
  }
}

/**
 * Get the file path for a workflow state
 * @param {string} workflowId - Workflow identifier
 * @param {string} [projectRoot] - Optional project root (auto-detected if not provided)
 * @returns {string} File path
 */
function getStateFilePath(workflowId, projectRoot) {
  // Sanitize workflowId to create a valid filename
  const sanitizedId = workflowId.replace(/[^a-zA-Z0-9-_]/g, '-');
  return path.join(getStateDir(projectRoot), `${sanitizedId}.yaml`);
}

/**
 * Save workflow state to YAML file
 * @param {string} workflowId - Workflow identifier
 * @param {WorkflowState} state - State object to save
 * @returns {Promise<object>} Result with success or error
 */
async function saveState(workflowId, state) {
  try {
    // Validate workflowId
    if (!workflowId || typeof workflowId !== 'string') {
      return {
        success: false,
        error: {
          code: 'STATE_INVALID_WORKFLOW_ID',
          message: 'Invalid workflow ID',
          details: { operation: 'saveState', workflowId, expectedType: 'string' }
        }
      };
    }

    // Validate state
    if (!state || typeof state !== 'object') {
      return {
        success: false,
        error: {
          code: 'STATE_INVALID_STATE',
          message: 'Invalid state object',
          details: { operation: 'saveState', state, expectedType: 'object' }
        }
      };
    }

    // Ensure state directory exists
    const dirResult = await ensureStateDirectory();
    if (!dirResult.success) {
      return dirResult;
    }

    // Get the file path
    const filePath = getStateFilePath(workflowId);

    // Import js-yaml for serialization
    const yaml = require('js-yaml');

    // Add metadata to state
    const stateToSave = {
      ...state,
      workflowId,
      savedAt: new Date().toISOString()
    };

    // Convert state to YAML
    const yamlContent = yaml.dump(stateToSave, {
      indent: 2,
      lineWidth: 120,
      noRefs: true,
      sortKeys: false
    });

    // Write to file
    await fsPromises.writeFile(filePath, yamlContent, 'utf8');

    // Verify write was successful
    const exists = fs.existsSync(filePath);
    if (!exists) {
      return {
        success: false,
        error: {
          code: 'STATE_WRITE_VERIFY_FAILED',
          message: 'State file was written but verification failed',
          details: { operation: 'saveState', filePath }
        }
      };
    }

    return { success: true };
  } catch (error) {
    let errorCode = 'STATE_SAVE_ERROR';

    if (error.code === 'EACCES' || error.code === 'EPERM') {
      errorCode = 'STATE_PERMISSION_ERROR';
    } else if (error.code === 'ENOENT') {
      errorCode = 'STATE_PATH_NOT_FOUND';
    } else if (error.code === 'EISDIR') {
      errorCode = 'STATE_PATH_IS_DIRECTORY';
    } else if (error.code === 'EROFS') {
      errorCode = 'STATE_READONLY';
    }

    return {
      success: false,
      error: {
        code: errorCode,
        message: error.message,
        details: { operation: 'saveState', workflowId, originalError: error.code }
      }
    };
  }
}

/**
 * Load workflow state from YAML file
 * @param {string} workflowId - Workflow identifier
 * @returns {Promise<object>} Result with state or error
 */
async function loadState(workflowId) {
  try {
    // Validate workflowId
    if (!workflowId || typeof workflowId !== 'string') {
      return {
        success: false,
        error: {
          code: 'STATE_INVALID_WORKFLOW_ID',
          message: 'Invalid workflow ID',
          details: { operation: 'loadState', workflowId, expectedType: 'string' }
        }
      };
    }

    // Get the file path
    const filePath = getStateFilePath(workflowId);

    // Check if file exists
    if (!fs.existsSync(filePath)) {
      return {
        success: false,
        error: {
          code: 'STATE_NOT_FOUND',
          message: `State file not found for workflow: ${workflowId}`,
          details: { operation: 'loadState', filePath, workflowId }
        }
      };
    }

    // Read the file
    const yamlContent = await fsPromises.readFile(filePath, 'utf8');

    // Import js-yaml for deserialization
    const yaml = require('js-yaml');

    // Parse YAML
    let state;
    try {
      state = yaml.load(yamlContent);
    } catch (parseError) {
      return {
        success: false,
        error: {
          code: 'STATE_PARSE_ERROR',
          message: `Failed to parse state file: ${parseError.message}`,
          details: { operation: 'loadState', filePath, parseError: parseError.message }
        }
      };
    }

    // Validate parsed state
    if (!state || typeof state !== 'object') {
      return {
        success: false,
        error: {
          code: 'STATE_INVALID_FORMAT',
          message: 'State file contains invalid data',
          details: { operation: 'loadState', filePath }
        }
      };
    }

    // Remove metadata fields that were added during save
    const { savedAt, workflowId: savedWorkflowId, ...cleanState } = state;

    return { 
      success: true, 
      state: cleanState,
      metadata: {
        savedAt,
        workflowId: savedWorkflowId,
        filePath
      }
    };
  } catch (error) {
    let errorCode = 'STATE_LOAD_ERROR';

    if (error.code === 'EACCES' || error.code === 'EPERM') {
      errorCode = 'STATE_PERMISSION_ERROR';
    } else if (error.code === 'ENOENT') {
      errorCode = 'STATE_NOT_FOUND';
    }

    return {
      success: false,
      error: {
        code: errorCode,
        message: error.message,
        details: { operation: 'loadState', workflowId, originalError: error.code }
      }
    };
  }
}

/**
 * Delete workflow state file
 * @param {string} workflowId - Workflow identifier
 * @returns {Promise<object>} Result with success or error
 */
async function deleteState(workflowId) {
  try {
    // Validate workflowId
    if (!workflowId || typeof workflowId !== 'string') {
      return {
        success: false,
        error: {
          code: 'STATE_INVALID_WORKFLOW_ID',
          message: 'Invalid workflow ID',
          details: { operation: 'deleteState', workflowId, expectedType: 'string' }
        }
      };
    }

    // Get the file path
    const filePath = getStateFilePath(workflowId);

    // Check if file exists
    if (!fs.existsSync(filePath)) {
      return {
        success: false,
        error: {
          code: 'STATE_NOT_FOUND',
          message: `State file not found for workflow: ${workflowId}`,
          details: { operation: 'deleteState', filePath, workflowId }
        }
      };
    }

    // Delete the file
    await fsPromises.unlink(filePath);

    return { success: true };
  } catch (error) {
    let errorCode = 'STATE_DELETE_ERROR';

    if (error.code === 'EACCES' || error.code === 'EPERM') {
      errorCode = 'STATE_PERMISSION_ERROR';
    }

    return {
      success: false,
      error: {
        code: errorCode,
        message: error.message,
        details: { operation: 'deleteState', workflowId, originalError: error.code }
      }
    };
  }
}

/**
 * List all workflow state files
 * @returns {Promise<object>} Result with list of workflow IDs or error
 */
async function listStates(projectRoot) {
  try {
    // Ensure state directory exists
    const dirResult = await ensureStateDirectory(projectRoot);
    if (!dirResult.success) {
      return { success: true, workflows: [] };
    }

    // Read directory
    let files;
    const stateDir = getStateDir(projectRoot);
    try {
      files = await fsPromises.readdir(stateDir);
    } catch (readError) {
      if (readError.code === 'ENOENT') {
        return { success: true, workflows: [] };
      }
      throw readError;
    }

    // Filter for YAML files
    const yamlFiles = files.filter(f => f.endsWith('.yaml') || f.endsWith('.yml'));

    // Extract workflow IDs
    const workflows = yamlFiles.map(f => path.basename(f, path.extname(f)));

    return { success: true, workflows };
  } catch (error) {
    return {
      success: false,
      error: {
        code: 'STATE_LIST_ERROR',
        message: error.message,
        details: { operation: 'listStates', originalError: error.code }
      }
    };
  }
}

/**
 * Track the start of a workflow step
 * @param {string} workflowId - Workflow identifier
 * @param {string} stepId - Step identifier
 * @param {Object} [stepData] - Optional step data
 * @returns {Promise<object>} Result with success or error
 */
async function trackStepStart(workflowId, stepId, stepData = {}) {
  try {
    // Validate workflowId
    if (!workflowId || typeof workflowId !== 'string') {
      return {
        success: false,
        error: {
          code: 'STEP_TRACK_ERROR',
          message: 'Invalid workflow ID',
          details: { operation: 'trackStepStart', workflowId, expectedType: 'string' }
        }
      };
    }

    // Validate stepId
    if (!stepId || typeof stepId !== 'string') {
      return {
        success: false,
        error: {
          code: 'STEP_TRACK_ERROR',
          message: 'Invalid step ID',
          details: { operation: 'trackStepStart', stepId, expectedType: 'string' }
        }
      };
    }

    // Load existing state or create new
    let state;
    const loadResult = await loadState(workflowId);
    
    if (loadResult.success) {
      state = loadResult.state;
    } else if (loadResult.error.code === 'STATE_NOT_FOUND') {
      // Create new state if not found
      state = {
        variables: {},
        stepHistory: [],
        timestamps: { created: new Date().toISOString() }
      };
    } else {
      return loadResult;
    }

    // Initialize stepHistory array if not present
    if (!state.stepHistory) {
      state.stepHistory = [];
    }

    // Check if step already exists
    const existingStepIndex = state.stepHistory.findIndex(s => s.stepId === stepId);
    const startTime = new Date().toISOString();

    if (existingStepIndex >= 0) {
      // Update existing step
      state.stepHistory[existingStepIndex] = {
        ...state.stepHistory[existingStepIndex],
        status: 'in-progress',
        startTime,
        data: stepData
      };
    } else {
      // Add new step
      state.stepHistory.push({
        stepId,
        status: 'in-progress',
        startTime,
        endTime: null,
        duration: null,
        data: stepData,
        error: null
      });
    }

    // Update timestamps
    state.timestamps = state.timestamps || {};
    state.timestamps.updated = new Date().toISOString();

    // Save state
    const saveResult = await saveState(workflowId, state);
    if (!saveResult.success) {
      return saveResult;
    }

    return { success: true, stepId, status: 'in-progress', startTime };
  } catch (error) {
    return {
      success: false,
      error: {
        code: 'STEP_TRACK_ERROR',
        message: error.message,
        details: { operation: 'trackStepStart', workflowId, stepId, originalError: error.code }
      }
    };
  }
}

/**
 * Track the completion of a workflow step
 * @param {string} workflowId - Workflow identifier
 * @param {string} stepId - Step identifier
 * @param {Object} [stepData] - Optional step data (output, error, etc.)
 * @returns {Promise<object>} Result with success or error
 */
async function trackStepComplete(workflowId, stepId, stepData = {}) {
  try {
    // Validate workflowId
    if (!workflowId || typeof workflowId !== 'string') {
      return {
        success: false,
        error: {
          code: 'STEP_TRACK_ERROR',
          message: 'Invalid workflow ID',
          details: { operation: 'trackStepComplete', workflowId, expectedType: 'string' }
        }
      };
    }

    // Validate stepId
    if (!stepId || typeof stepId !== 'string') {
      return {
        success: false,
        error: {
          code: 'STEP_TRACK_ERROR',
          message: 'Invalid step ID',
          details: { operation: 'trackStepComplete', stepId, expectedType: 'string' }
        }
      };
    }

    // Load existing state
    const loadResult = await loadState(workflowId);
    if (!loadResult.success) {
      return loadResult;
    }

    const state = loadResult.state;

    // Initialize stepHistory array if not present
    if (!state.stepHistory) {
      state.stepHistory = [];
    }

    // Find existing step
    const existingStepIndex = state.stepHistory.findIndex(s => s.stepId === stepId);
    const endTime = new Date().toISOString();

    if (existingStepIndex >= 0) {
      const existingStep = state.stepHistory[existingStepIndex];
      const startTime = existingStep.startTime || endTime;
      
      // Calculate duration
      const duration = new Date(endTime) - new Date(startTime);

      // Determine status based on error
      const status = stepData.error ? 'failed' : 'completed';

      // Update existing step
      state.stepHistory[existingStepIndex] = {
        ...existingStep,
        status,
        endTime,
        duration,
        data: { ...existingStep.data, ...stepData },
        error: stepData.error || null
      };
    } else {
      // Add new completed step (started outside tracking)
      state.stepHistory.push({
        stepId,
        status: stepData.error ? 'failed' : 'completed',
        startTime: stepData.startTime || endTime,
        endTime,
        duration: stepData.startTime ? (new Date(endTime) - new Date(stepData.startTime)) : null,
        data: stepData,
        error: stepData.error || null
      });
    }

    // Update timestamps
    state.timestamps = state.timestamps || {};
    state.timestamps.updated = endTime;
    state.timestamps.lastStepComplete = endTime;

    // Save state
    const saveResult = await saveState(workflowId, state);
    if (!saveResult.success) {
      return saveResult;
    }

    return { success: true, stepId, status: stepData.error ? 'failed' : 'completed', endTime };
  } catch (error) {
    return {
      success: false,
      error: {
        code: 'STEP_TRACK_ERROR',
        message: error.message,
        details: { operation: 'trackStepComplete', workflowId, stepId, originalError: error.code }
      }
    };
  }
}

/**
 * Get the status of a specific step
 * @param {string} workflowId - Workflow identifier
 * @param {string} stepId - Step identifier
 * @returns {Promise<object>} Result with step status or error
 */
async function getStepStatus(workflowId, stepId) {
  try {
    // Validate workflowId
    if (!workflowId || typeof workflowId !== 'string') {
      return {
        success: false,
        error: {
          code: 'STEP_STATUS_ERROR',
          message: 'Invalid workflow ID',
          details: { operation: 'getStepStatus', workflowId, expectedType: 'string' }
        }
      };
    }

    // Validate stepId
    if (!stepId || typeof stepId !== 'string') {
      return {
        success: false,
        error: {
          code: 'STEP_STATUS_ERROR',
          message: 'Invalid step ID',
          details: { operation: 'getStepStatus', stepId, expectedType: 'string' }
        }
      };
    }

    // Load state
    const loadResult = await loadState(workflowId);
    if (!loadResult.success) {
      return loadResult;
    }

    const state = loadResult.state;

    // Find step
    const step = state.stepHistory?.find(s => s.stepId === stepId);

    if (!step) {
      return {
        success: false,
        error: {
          code: 'STEP_NOT_FOUND',
          message: `Step not found: ${stepId}`,
          details: { operation: 'getStepStatus', workflowId, stepId }
        }
      };
    }

    return {
      success: true,
      step: {
        stepId: step.stepId,
        status: step.status,
        startTime: step.startTime,
        endTime: step.endTime,
        duration: step.duration,
        data: step.data,
        error: step.error
      }
    };
  } catch (error) {
    return {
      success: false,
      error: {
        code: 'STEP_STATUS_ERROR',
        message: error.message,
        details: { operation: 'getStepStatus', workflowId, stepId, originalError: error.code }
      }
    };
  }
}

/**
 * Get the progress of a workflow
 * @param {string} workflowId - Workflow identifier
 * @returns {Promise<object>} Result with workflow progress or error
 */
async function getWorkflowProgress(workflowId) {
  try {
    // Validate workflowId
    if (!workflowId || typeof workflowId !== 'string') {
      return {
        success: false,
        error: {
          code: 'PROGRESS_ERROR',
          message: 'Invalid workflow ID',
          details: { operation: 'getWorkflowProgress', workflowId, expectedType: 'string' }
        }
      };
    }

    // Load state
    const loadResult = await loadState(workflowId);
    if (!loadResult.success) {
      return loadResult;
    }

    const state = loadResult.state;
    const stepHistory = state.stepHistory || [];

    // Calculate progress
    const totalSteps = stepHistory.length;
    const completedSteps = stepHistory.filter(s => s.status === 'completed').length;
    const failedSteps = stepHistory.filter(s => s.status === 'failed').length;
    const inProgressSteps = stepHistory.filter(s => s.status === 'in-progress').length;
    const pendingSteps = stepHistory.filter(s => s.status === 'pending').length;

    const progressPercentage = totalSteps > 0 
      ? Math.round(((completedSteps + failedSteps) / totalSteps) * 100) 
      : 0;

    // Calculate total duration
    const totalDuration = stepHistory.reduce((sum, step) => {
      return sum + (step.duration || 0);
    }, 0);

    // Determine current step
    const currentStep = stepHistory.find(s => s.status === 'in-progress');

    return {
      success: true,
      progress: {
        workflowId,
        totalSteps,
        completedSteps,
        failedSteps,
        inProgressSteps,
        pendingSteps,
        progressPercentage,
        totalDuration,
        currentStep: currentStep ? currentStep.stepId : null,
        stepHistory: stepHistory.map(s => ({
          stepId: s.stepId,
          status: s.status,
          startTime: s.startTime,
          endTime: s.endTime,
          duration: s.duration
        }))
      }
    };
  } catch (error) {
    return {
      success: false,
      error: {
        code: 'PROGRESS_ERROR',
        message: error.message,
        details: { operation: 'getWorkflowProgress', workflowId, originalError: error.code }
      }
    };
  }
}

/**
 * Update step status directly
 * @param {string} workflowId - Workflow identifier
 * @param {string} stepId - Step identifier
 * @param {string} status - New status (pending, in-progress, completed, failed)
 * @returns {Promise<object>} Result with success or error
 */
async function updateStepStatus(workflowId, stepId, status) {
  try {
    // Validate workflowId
    if (!workflowId || typeof workflowId !== 'string') {
      return {
        success: false,
        error: {
          code: 'STEP_UPDATE_ERROR',
          message: 'Invalid workflow ID',
          details: { operation: 'updateStepStatus', workflowId, expectedType: 'string' }
        }
      };
    }

    // Validate stepId
    if (!stepId || typeof stepId !== 'string') {
      return {
        success: false,
        error: {
          code: 'STEP_UPDATE_ERROR',
          message: 'Invalid step ID',
          details: { operation: 'updateStepStatus', stepId, expectedType: 'string' }
        }
      };
    }

    // Validate status
    const validStatuses = ['pending', 'in-progress', 'completed', 'failed'];
    if (!validStatuses.includes(status)) {
      return {
        success: false,
        error: {
          code: 'STEP_UPDATE_ERROR',
          message: `Invalid status: ${status}. Must be one of: ${validStatuses.join(', ')}`,
          details: { operation: 'updateStepStatus', workflowId, stepId, status }
        }
      };
    }

    // Load state
    const loadResult = await loadState(workflowId);
    if (!loadResult.success) {
      return loadResult;
    }

    const state = loadResult.state;

    // Initialize stepHistory array if not present
    if (!state.stepHistory) {
      state.stepHistory = [];
    }

    // Find existing step
    const existingStepIndex = state.stepHistory.findIndex(s => s.stepId === stepId);
    const now = new Date().toISOString();

    if (existingStepIndex >= 0) {
      const existingStep = state.stepHistory[existingStepIndex];
      
      // Update timestamps based on status
      let updates = { status };
      
      if (status === 'in-progress' && existingStep.status !== 'in-progress') {
        updates.startTime = now;
      } else if (status === 'completed' || status === 'failed') {
        updates.endTime = now;
        if (existingStep.startTime) {
          updates.duration = new Date(now) - new Date(existingStep.startTime);
        }
      }

      state.stepHistory[existingStepIndex] = {
        ...existingStep,
        ...updates
      };
    } else {
      // Add new step
      state.stepHistory.push({
        stepId,
        status,
        startTime: status === 'in-progress' || status === 'completed' || status === 'failed' ? now : null,
        endTime: status === 'completed' || status === 'failed' ? now : null,
        duration: null,
        data: {},
        error: null
      });
    }

    // Update timestamps
    state.timestamps = state.timestamps || {};
    state.timestamps.updated = now;

    // Save state
    const saveResult = await saveState(workflowId, state);
    if (!saveResult.success) {
      return saveResult;
    }

    return { success: true, stepId, status };
  } catch (error) {
    return {
      success: false,
      error: {
        code: 'STEP_UPDATE_ERROR',
        message: error.message,
        details: { operation: 'updateStepStatus', workflowId, stepId, status, originalError: error.code }
      }
    };
  }
}

/**
 * Checkpoint directory path
 * @private
 */
const CHECKPOINT_DIR = '.agentfile/state/checkpoints';

/**
 * Ensure checkpoint directory exists for a workflow
 * @param {string} workflowId - Workflow identifier
 * @returns {Promise<object>} Result with success or error
 */
async function ensureCheckpointDirectory(workflowId) {
  try {
    const sanitizedId = workflowId.replace(/[^a-zA-Z0-9-_]/g, '-');
    const checkpointPath = path.join(CHECKPOINT_DIR, sanitizedId);
    await fsPromises.mkdir(checkpointPath, { recursive: true });
    return { success: true, checkpointPath };
  } catch (error) {
    return {
      success: false,
      error: {
        code: 'CHECKPOINT_DIR_ERROR',
        message: `Failed to create checkpoint directory: ${error.message}`,
        details: { operation: 'ensureCheckpointDirectory', workflowId, originalError: error.code }
      }
    };
  }
}

/**
 * Get the checkpoint directory path for a workflow
 * @param {string} workflowId - Workflow identifier
 * @returns {string} Directory path
 */
function getCheckpointDir(workflowId) {
  const sanitizedId = workflowId.replace(/[^a-zA-Z0-9-_]/g, '-');
  return path.join(CHECKPOINT_DIR, sanitizedId);
}

/**
 * Get checkpoint file path
 * @param {string} workflowId - Workflow identifier
 * @param {string} checkpointId - Checkpoint identifier (timestamp-based)
 * @returns {string} File path
 */
function getCheckpointFilePath(workflowId, checkpointId) {
  const sanitizedId = workflowId.replace(/[^a-zA-Z0-9-_]/g, '-');
  return path.join(CHECKPOINT_DIR, sanitizedId, `checkpoint-${checkpointId}.yaml`);
}

/**
 * Create a checkpoint for a workflow at current point
 * @param {string} workflowId - Workflow identifier
 * @param {string} [stepId] - Optional current step ID
 * @returns {Promise<object>} Result with checkpoint info or error
 */
async function createCheckpoint(workflowId, stepId = null) {
  try {
    // Validate workflowId
    if (!workflowId || typeof workflowId !== 'string') {
      return {
        success: false,
        error: {
          code: 'CHECKPOINT_CREATE_ERROR',
          message: 'Invalid workflow ID',
          details: { operation: 'createCheckpoint', workflowId, expectedType: 'string' }
        }
      };
    }

    // Load current workflow state
    const loadResult = await loadState(workflowId);
    if (!loadResult.success && loadResult.error.code !== 'STATE_NOT_FOUND') {
      return loadResult;
    }

    const state = loadResult.success ? loadResult.state : {
      variables: {},
      stepHistory: [],
      timestamps: { created: new Date().toISOString() }
    };

    // Create checkpoint ID (timestamp-based)
    const checkpointId = Date.now().toString();
    const createdAt = new Date().toISOString();

    // Determine current step
    const currentStep = state.stepHistory?.find(s => s.status === 'in-progress');
    const currentStepId = stepId || (currentStep ? currentStep.stepId : null);

    // Count completed steps
    const completedSteps = state.stepHistory?.filter(s => s.status === 'completed').length || 0;
    const totalSteps = state.stepHistory?.length || 0;

    // Build checkpoint data
    const checkpointData = {
      checkpointId,
      workflowId,
      createdAt,
      stepId: currentStepId,
      state: {
        variables: state.variables || {},
        stepHistory: state.stepHistory || [],
        currentStep: currentStepId,
        timestamps: state.timestamps || {}
      },
      metadata: {
        totalSteps,
        completedSteps,
        progress: totalSteps > 0 ? Math.round((completedSteps / totalSteps) * 100) : 0
      }
    };

    // Ensure checkpoint directory exists
    const dirResult = await ensureCheckpointDirectory(workflowId);
    if (!dirResult.success) {
      return {
        success: false,
        error: {
          code: 'CHECKPOINT_CREATE_ERROR',
          message: dirResult.error.message,
          details: { operation: 'createCheckpoint', workflowId }
        }
      };
    }

    // Save checkpoint
    const saveResult = await saveCheckpoint(workflowId, checkpointData);
    if (!saveResult.success) {
      return saveResult;
    }

    return {
      success: true,
      checkpointId,
      workflowId,
      createdAt,
      stepId: currentStepId,
      metadata: checkpointData.metadata
    };
  } catch (error) {
    return {
      success: false,
      error: {
        code: 'CHECKPOINT_CREATE_ERROR',
        message: error.message,
        details: { operation: 'createCheckpoint', workflowId, originalError: error.code }
      }
    };
  }
}

/**
 * Save checkpoint to file
 * @param {string} workflowId - Workflow identifier
 * @param {object} checkpointData - Checkpoint data to save
 * @returns {Promise<object>} Result with success or error
 */
async function saveCheckpoint(workflowId, checkpointData) {
  try {
    const checkpointId = checkpointData.checkpointId;
    const filePath = getCheckpointFilePath(workflowId, checkpointId);

    // Import js-yaml for serialization
    const yaml = require('js-yaml');

    // Convert checkpoint to YAML
    const yamlContent = yaml.dump(checkpointData, {
      indent: 2,
      lineWidth: 120,
      noRefs: true,
      sortKeys: false
    });

    // Write to file
    await fsPromises.writeFile(filePath, yamlContent, 'utf8');

    // Verify write was successful
    const exists = fs.existsSync(filePath);
    if (!exists) {
      return {
        success: false,
        error: {
          code: 'CHECKPOINT_WRITE_ERROR',
          message: 'Checkpoint file was written but verification failed',
          details: { operation: 'saveCheckpoint', filePath }
        }
      };
    }

    return { success: true, checkpointId, filePath };
  } catch (error) {
    let errorCode = 'CHECKPOINT_SAVE_ERROR';

    if (error.code === 'EACCES' || error.code === 'EPERM') {
      errorCode = 'CHECKPOINT_PERMISSION_ERROR';
    } else if (error.code === 'ENOENT') {
      errorCode = 'CHECKPOINT_PATH_NOT_FOUND';
    } else if (error.code === 'EISDIR') {
      errorCode = 'CHECKPOINT_PATH_IS_DIRECTORY';
    } else if (error.code === 'EROFS') {
      errorCode = 'CHECKPOINT_READONLY';
    }

    return {
      success: false,
      error: {
        code: errorCode,
        message: error.message,
        details: { operation: 'saveCheckpoint', workflowId, originalError: error.code }
      }
    };
  }
}

/**
 * Load a checkpoint
 * @param {string} workflowId - Workflow identifier
 * @param {string} checkpointId - Checkpoint identifier
 * @returns {Promise<object>} Result with checkpoint data or error
 */
async function loadCheckpoint(workflowId, checkpointId) {
  try {
    // Validate workflowId
    if (!workflowId || typeof workflowId !== 'string') {
      return {
        success: false,
        error: {
          code: 'CHECKPOINT_LOAD_ERROR',
          message: 'Invalid workflow ID',
          details: { operation: 'loadCheckpoint', workflowId, expectedType: 'string' }
        }
      };
    }

    // Validate checkpointId
    if (!checkpointId || typeof checkpointId !== 'string') {
      return {
        success: false,
        error: {
          code: 'CHECKPOINT_LOAD_ERROR',
          message: 'Invalid checkpoint ID',
          details: { operation: 'loadCheckpoint', checkpointId, expectedType: 'string' }
        }
      };
    }

    const filePath = getCheckpointFilePath(workflowId, checkpointId);

    // Check if file exists
    if (!fs.existsSync(filePath)) {
      return {
        success: false,
        error: {
          code: 'CHECKPOINT_NOT_FOUND',
          message: `Checkpoint not found: ${checkpointId}`,
          details: { operation: 'loadCheckpoint', workflowId, checkpointId, filePath }
        }
      };
    }

    // Read the file
    const yamlContent = await fsPromises.readFile(filePath, 'utf8');

    // Import js-yaml for deserialization
    const yaml = require('js-yaml');

    // Parse YAML
    let checkpoint;
    try {
      checkpoint = yaml.load(yamlContent);
    } catch (parseError) {
      return {
        success: false,
        error: {
          code: 'CHECKPOINT_PARSE_ERROR',
          message: `Failed to parse checkpoint file: ${parseError.message}`,
          details: { operation: 'loadCheckpoint', filePath, parseError: parseError.message }
        }
      };
    }

    // Validate parsed checkpoint
    if (!checkpoint || typeof checkpoint !== 'object') {
      return {
        success: false,
        error: {
          code: 'CHECKPOINT_INVALID_FORMAT',
          message: 'Checkpoint file contains invalid data',
          details: { operation: 'loadCheckpoint', filePath }
        }
      };
    }

    return {
      success: true,
      checkpoint,
      metadata: {
        checkpointId: checkpoint.checkpointId,
        workflowId: checkpoint.workflowId,
        createdAt: checkpoint.createdAt,
        stepId: checkpoint.stepId,
        filePath
      }
    };
  } catch (error) {
    let errorCode = 'CHECKPOINT_LOAD_ERROR';

    if (error.code === 'EACCES' || error.code === 'EPERM') {
      errorCode = 'CHECKPOINT_PERMISSION_ERROR';
    }

    return {
      success: false,
      error: {
        code: errorCode,
        message: error.message,
        details: { operation: 'loadCheckpoint', workflowId, checkpointId, originalError: error.code }
      }
    };
  }
}

/**
 * List all checkpoints for a workflow
 * @param {string} workflowId - Workflow identifier
 * @returns {Promise<object>} Result with list of checkpoints or error
 */
async function listCheckpoints(workflowId) {
  try {
    // Validate workflowId
    if (!workflowId || typeof workflowId !== 'string') {
      return {
        success: false,
        error: {
          code: 'CHECKPOINT_LIST_ERROR',
          message: 'Invalid workflow ID',
          details: { operation: 'listCheckpoints', workflowId, expectedType: 'string' }
        }
      };
    }

    const checkpointDir = getCheckpointDir(workflowId);

    // Check if directory exists
    if (!fs.existsSync(checkpointDir)) {
      return { success: true, checkpoints: [] };
    }

    // Read directory
    let files;
    try {
      files = await fsPromises.readdir(checkpointDir);
    } catch (readError) {
      if (readError.code === 'ENOENT') {
        return { success: true, checkpoints: [] };
      }
      throw readError;
    }

    // Filter for checkpoint files
    const checkpointFiles = files.filter(f => f.startsWith('checkpoint-') && (f.endsWith('.yaml') || f.endsWith('.yml')));

    // Parse checkpoint IDs and metadata
    const checkpoints = [];
    for (const file of checkpointFiles) {
      const checkpointId = file.replace('checkpoint-', '').replace('.yaml', '').replace('.yml', '');
      const filePath = path.join(checkpointDir, file);
      
      try {
        const yamlContent = await fsPromises.readFile(filePath, 'utf8');
        const yaml = require('js-yaml');
        const checkpoint = yaml.load(yamlContent);
        
        if (checkpoint && checkpoint.checkpointId) {
          checkpoints.push({
            checkpointId: checkpoint.checkpointId,
            workflowId: checkpoint.workflowId,
            createdAt: checkpoint.createdAt,
            stepId: checkpoint.stepId,
            metadata: checkpoint.metadata
          });
        }
      } catch (parseError) {
        // Skip invalid checkpoint files
        continue;
      }
    }

    // Sort by createdAt descending (newest first)
    checkpoints.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    return { success: true, checkpoints };
  } catch (error) {
    return {
      success: false,
      error: {
        code: 'CHECKPOINT_LIST_ERROR',
        message: error.message,
        details: { operation: 'listCheckpoints', workflowId, originalError: error.code }
      }
    };
  }
}

/**
 * Get info for a specific checkpoint
 * @param {string} workflowId - Workflow identifier
 * @param {string} checkpointId - Checkpoint identifier
 * @returns {Promise<object>} Result with checkpoint info or error
 */
async function getCheckpointInfo(workflowId, checkpointId) {
  try {
    // Validate workflowId
    if (!workflowId || typeof workflowId !== 'string') {
      return {
        success: false,
        error: {
          code: 'CHECKPOINT_INFO_ERROR',
          message: 'Invalid workflow ID',
          details: { operation: 'getCheckpointInfo', workflowId, expectedType: 'string' }
        }
      };
    }

    // Validate checkpointId
    if (!checkpointId || typeof checkpointId !== 'string') {
      return {
        success: false,
        error: {
          code: 'CHECKPOINT_INFO_ERROR',
          message: 'Invalid checkpoint ID',
          details: { operation: 'getCheckpointInfo', checkpointId, expectedType: 'string' }
        }
      };
    }

    const filePath = getCheckpointFilePath(workflowId, checkpointId);

    // Check if file exists
    if (!fs.existsSync(filePath)) {
      return {
        success: false,
        error: {
          code: 'CHECKPOINT_NOT_FOUND',
          message: `Checkpoint not found: ${checkpointId}`,
          details: { operation: 'getCheckpointInfo', workflowId, checkpointId }
        }
      };
    }

    // Read and parse checkpoint
    const yamlContent = await fsPromises.readFile(filePath, 'utf8');
    const yaml = require('js-yaml');
    const checkpoint = yaml.load(yamlContent);

    return {
      success: true,
      checkpointId: checkpoint.checkpointId,
      workflowId: checkpoint.workflowId,
      createdAt: checkpoint.createdAt,
      stepId: checkpoint.stepId,
      state: checkpoint.state,
      metadata: checkpoint.metadata
    };
  } catch (error) {
    let errorCode = 'CHECKPOINT_INFO_ERROR';

    if (error.code === 'EACCES' || error.code === 'EPERM') {
      errorCode = 'CHECKPOINT_PERMISSION_ERROR';
    }

    return {
      success: false,
      error: {
        code: errorCode,
        message: error.message,
        details: { operation: 'getCheckpointInfo', workflowId, checkpointId, originalError: error.code }
      }
    };
  }
}

/**
 * Delete a checkpoint
 * @param {string} workflowId - Workflow identifier
 * @param {string} checkpointId - Checkpoint identifier
 * @returns {Promise<object>} Result with success or error
 */
async function deleteCheckpoint(workflowId, checkpointId) {
  try {
    // Validate workflowId
    if (!workflowId || typeof workflowId !== 'string') {
      return {
        success: false,
        error: {
          code: 'CHECKPOINT_DELETE_ERROR',
          message: 'Invalid workflow ID',
          details: { operation: 'deleteCheckpoint', workflowId, expectedType: 'string' }
        }
      };
    }

    // Validate checkpointId
    if (!checkpointId || typeof checkpointId !== 'string') {
      return {
        success: false,
        error: {
          code: 'CHECKPOINT_DELETE_ERROR',
          message: 'Invalid checkpoint ID',
          details: { operation: 'deleteCheckpoint', checkpointId, expectedType: 'string' }
        }
      };
    }

    const filePath = getCheckpointFilePath(workflowId, checkpointId);

    // Check if file exists
    if (!fs.existsSync(filePath)) {
      return {
        success: false,
        error: {
          code: 'CHECKPOINT_NOT_FOUND',
          message: `Checkpoint not found: ${checkpointId}`,
          details: { operation: 'deleteCheckpoint', workflowId, checkpointId }
        }
      };
    }

    // Delete the checkpoint file
    await fsPromises.unlink(filePath);

    return { success: true, checkpointId };
  } catch (error) {
    let errorCode = 'CHECKPOINT_DELETE_ERROR';

    if (error.code === 'EACCES' || error.code === 'EPERM') {
      errorCode = 'CHECKPOINT_PERMISSION_ERROR';
    }

    return {
      success: false,
      error: {
        code: errorCode,
        message: error.message,
        details: { operation: 'deleteCheckpoint', workflowId, checkpointId, originalError: error.code }
      }
    };
  }
}

/**
 * Get the latest checkpoint for a workflow
 * @param {string} workflowId - Workflow identifier
 * @returns {Promise<object>} Result with latest checkpoint or error
 */
async function getLatestCheckpoint(workflowId) {
  try {
    // Validate workflowId
    if (!workflowId || typeof workflowId !== 'string') {
      return {
        success: false,
        error: {
          code: 'CHECKPOINT_GET_ERROR',
          message: 'Invalid workflow ID',
          details: { operation: 'getLatestCheckpoint', workflowId, expectedType: 'string' }
        }
      };
    }

    // List all checkpoints
    const listResult = await listCheckpoints(workflowId);
    if (!listResult.success) {
      return listResult;
    }

    // Check if any checkpoints exist
    if (!listResult.checkpoints || listResult.checkpoints.length === 0) {
      return {
        success: false,
        error: {
          code: 'CHECKPOINT_NOT_FOUND',
          message: `No checkpoints found for workflow: ${workflowId}`,
          details: { operation: 'getLatestCheckpoint', workflowId }
        }
      };
    }

    // Return the first (newest) checkpoint
    const latestCheckpoint = listResult.checkpoints[0];

    // Load full checkpoint data
    const loadResult = await loadCheckpoint(workflowId, latestCheckpoint.checkpointId);
    if (!loadResult.success) {
      return loadResult;
    }

    return {
      success: true,
      checkpoint: loadResult.checkpoint,
      metadata: loadResult.metadata
    };
  } catch (error) {
    return {
      success: false,
      error: {
        code: 'CHECKPOINT_GET_ERROR',
        message: error.message,
        details: { operation: 'getLatestCheckpoint', workflowId, originalError: error.code }
      }
    };
  }
}

/**
 * Resume workflow from a checkpoint
 * @param {string} workflowId - Workflow identifier
 * @param {string} [checkpointId] - Optional specific checkpoint ID; uses latest if not provided
 * @returns {Promise<object>} Result with restored state or error
 */
async function resumeFromCheckpoint(workflowId, checkpointId = null) {
  try {
    // Validate workflowId
    if (!workflowId || typeof workflowId !== 'string') {
      return {
        success: false,
        error: {
          code: 'CHECKPOINT_RESUME_ERROR',
          message: 'Invalid workflow ID',
          details: { operation: 'resumeFromCheckpoint', workflowId, expectedType: 'string' }
        }
      };
    }

    // Get checkpoint to resume from
    let checkpointResult;
    if (checkpointId) {
      // Resume from specific checkpoint
      checkpointResult = await loadCheckpoint(workflowId, checkpointId);
    } else {
      // Use latest checkpoint
      checkpointResult = await getLatestCheckpoint(workflowId);
    }

    if (!checkpointResult.success) {
      // Return the original error code from getLatestCheckpoint
      return {
        success: false,
        error: {
          code: checkpointResult.error.code,
          message: checkpointResult.error.message,
          details: { operation: 'resumeFromCheckpoint', workflowId, checkpointId }
        }
      };
    }

    const checkpoint = checkpointResult.checkpoint;

    // Restore workflow state
    const restoredState = {
      variables: checkpoint.state.variables || {},
      stepHistory: checkpoint.state.stepHistory || [],
      timestamps: checkpoint.state.timestamps || {}
    };

    // Save restored state
    const saveResult = await saveState(workflowId, restoredState);
    if (!saveResult.success) {
      return {
        success: false,
        error: {
          code: 'CHECKPOINT_RESUME_ERROR',
          message: 'Failed to restore workflow state',
          details: { operation: 'resumeFromCheckpoint', workflowId, checkpointId: checkpoint.checkpointId }
        }
      };
    }

    return {
      success: true,
      workflowId,
      checkpointId: checkpoint.checkpointId,
      restoredAt: new Date().toISOString(),
      restoredState,
      metadata: {
        stepId: checkpoint.stepId,
        progress: checkpoint.metadata
      }
    };
  } catch (error) {
    return {
      success: false,
      error: {
        code: 'CHECKPOINT_RESUME_ERROR',
        message: error.message,
        details: { operation: 'resumeFromCheckpoint', workflowId, checkpointId, originalError: error.code }
      }
    };
  }
}

// ==========================================
// ROLLBACK FUNCTIONALITY (Story 4-4)
// ==========================================

/**
 * Track file changes during workflow execution
 * @param {string} workflowId - Workflow identifier
 * @param {string} stepId - Step identifier
 * @param {Object} fileChange - File change record
 * @returns {Promise<object>} Result with success or error
 */
async function trackFileChange(workflowId, stepId, fileChange) {
  try {
    // Validate workflowId
    if (!workflowId || typeof workflowId !== 'string') {
      return {
        success: false,
        error: {
          code: 'FILE_TRACK_ERROR',
          message: 'Invalid workflow ID',
          details: { operation: 'trackFileChange', workflowId, expectedType: 'string' }
        }
      };
    }

    // Validate stepId
    if (!stepId || typeof stepId !== 'string') {
      return {
        success: false,
        error: {
          code: 'FILE_TRACK_ERROR',
          message: 'Invalid step ID',
          details: { operation: 'trackFileChange', stepId, expectedType: 'string' }
        }
      };
    }

    // Validate fileChange
    if (!fileChange || typeof fileChange !== 'object') {
      return {
        success: false,
        error: {
          code: 'FILE_TRACK_ERROR',
          message: 'Invalid file change object',
          details: { operation: 'trackFileChange', expectedType: 'object' }
        }
      };
    }

    // Load existing state
    const loadResult = await loadState(workflowId);
    if (!loadResult.success) {
      return loadResult;
    }

    const state = loadResult.state;

    // Initialize stepHistory and rollback arrays if not present
    if (!state.stepHistory) {
      state.stepHistory = [];
    }

    // Find existing step
    const existingStepIndex = state.stepHistory.findIndex(s => s.stepId === stepId);
    const timestamp = new Date().toISOString();

    // Build file change record
    const changeRecord = {
      operation: fileChange.operation || 'modify',
      path: fileChange.path,
      previousContent: fileChange.previousContent || null,
      timestamp
    };

    if (existingStepIndex >= 0) {
      // Add to existing step's fileChanges
      if (!state.stepHistory[existingStepIndex].fileChanges) {
        state.stepHistory[existingStepIndex].fileChanges = [];
      }
      state.stepHistory[existingStepIndex].fileChanges.push(changeRecord);
    } else {
      // Add new step with file change
      state.stepHistory.push({
        stepId,
        status: 'in-progress',
        startTime: timestamp,
        fileChanges: [changeRecord]
      });
    }

    // Update timestamps
    state.timestamps = state.timestamps || {};
    state.timestamps.updated = timestamp;

    // Save state
    const saveResult = await saveState(workflowId, state);
    if (!saveResult.success) {
      return saveResult;
    }

    return { success: true, stepId, fileChange: changeRecord };
  } catch (error) {
    return {
      success: false,
      error: {
        code: 'FILE_TRACK_ERROR',
        message: error.message,
        details: { operation: 'trackFileChange', workflowId, stepId, originalError: error.code }
      }
    };
  }
}

/**
 * Revert file changes based on change records
 * @param {Array} fileChanges - Array of file change records
 * @returns {Promise<object>} Result with success or error
 */
async function revertFileChanges(fileChanges) {
  try {
    if (!Array.isArray(fileChanges) || fileChanges.length === 0) {
      return { success: true, revertedCount: 0, failedCount: 0, changes: [] };
    }

    const results = [];
    let revertedCount = 0;
    let failedCount = 0;

    // Process changes in reverse order (newest first)
    for (const change of fileChanges) {
      try {
        const changePath = change.path;
        const operation = change.operation;
        const previousContent = change.previousContent;

        let revertSuccess = false;

        switch (operation) {
          case 'create':
            // Delete the created file
            if (fs.existsSync(changePath)) {
              await fsPromises.unlink(changePath);
              revertSuccess = true;
            } else {
              // File doesn't exist, consider it reverted
              revertSuccess = true;
            }
            break;

          case 'modify':
            // Restore previous content
            if (previousContent !== null && previousContent !== undefined) {
              await fsPromises.writeFile(changePath, previousContent, 'utf8');
              revertSuccess = true;
            } else {
              // No previous content, can't revert
              revertSuccess = false;
            }
            break;

          case 'delete':
            // Recreate the deleted file
            if (previousContent !== null && previousContent !== undefined) {
              // Ensure parent directory exists
              const dir = path.dirname(changePath);
              await fsPromises.mkdir(dir, { recursive: true });
              await fsPromises.writeFile(changePath, previousContent, 'utf8');
              revertSuccess = true;
            } else {
              revertSuccess = false;
            }
            break;

          case 'copy':
          case 'move':
            // Remove the copied/moved file
            if (fs.existsSync(changePath)) {
              await fsPromises.unlink(changePath);
              revertSuccess = true;
            } else {
              revertSuccess = true;
            }
            break;

          default:
            revertSuccess = false;
        }

        if (revertSuccess) {
          revertedCount++;
          results.push({ path: changePath, operation, status: 'reverted' });
        } else {
          failedCount++;
          results.push({ path: changePath, operation, status: 'failed', reason: 'Cannot revert - no previous content' });
        }
      } catch (changeError) {
        failedCount++;
        results.push({ path: change.path, operation: change.operation, status: 'failed', reason: changeError.message });
      }
    }

    const status = failedCount === 0 ? 'success' : (revertedCount > 0 ? 'partial' : 'failed');

    return {
      success: true,
      status,
      revertedCount,
      failedCount,
      changes: results
    };
  } catch (error) {
    return {
      success: false,
      error: {
        code: 'FILE_REVERT_ERROR',
        message: error.message,
        details: { operation: 'revertFileChanges', originalError: error.code }
      }
    };
  }
}

/**
 * Rollback workflow to last checkpoint
 * @param {string} workflowId - Workflow identifier
 * @returns {Promise<object>} Result with rollback info or error
 */
async function rollbackToLastCheckpoint(workflowId) {
  try {
    // Validate workflowId
    if (!workflowId || typeof workflowId !== 'string') {
      return {
        success: false,
        error: {
          code: 'ROLLBACK_ERROR',
          message: 'Invalid workflow ID',
          details: { operation: 'rollbackToLastCheckpoint', workflowId, expectedType: 'string' }
        }
      };
    }

    // Get the latest checkpoint
    const checkpointResult = await getLatestCheckpoint(workflowId);
    if (!checkpointResult.success) {
      return {
        success: false,
        error: {
          code: 'ROLLBACK_ERROR',
          message: checkpointResult.error.message,
          details: { operation: 'rollbackToLastCheckpoint', workflowId, reason: 'No checkpoint found' }
        }
      };
    }

    const checkpoint = checkpointResult.checkpoint;

    // Load current workflow state to identify steps after checkpoint
    const loadResult = await loadState(workflowId);
    let stepsReverted = 0;
    let filesReverted = 0;

    if (loadResult.success) {
      const state = loadResult.state;
      const checkpointTime = new Date(checkpoint.createdAt);

      // Find steps that occurred after the checkpoint
      const stepsAfterCheckpoint = (state.stepHistory || []).filter(step => {
        const stepTime = step.startTime ? new Date(step.startTime) : null;
        return stepTime && stepTime > checkpointTime;
      });

      stepsReverted = stepsAfterCheckpoint.length;

      // Collect all file changes from steps after checkpoint
      const fileChanges = [];
      for (const step of stepsAfterCheckpoint) {
        if (step.fileChanges && Array.isArray(step.fileChanges)) {
          fileChanges.push(...step.fileChanges);
        }
      }

      // Revert file changes
      if (fileChanges.length > 0) {
        const revertResult = await revertFileChanges(fileChanges);
        if (revertResult.success) {
          filesReverted = revertResult.revertedCount;
        }
      }

      // Restore state from checkpoint
      const restoredState = {
        variables: checkpoint.state.variables || {},
        stepHistory: checkpoint.state.stepHistory || [],
        timestamps: checkpoint.state.timestamps || {}
      };

      // Add rollback tracking to state
      restoredState.rollback = state.rollback || {
        lastRollbackAt: null,
        lastRollbackCheckpointId: null,
        rollbackHistory: []
      };

      // Add this rollback to history
      const rollbackAt = new Date().toISOString();
      restoredState.rollback.lastRollbackAt = rollbackAt;
      restoredState.rollback.lastRollbackCheckpointId = checkpoint.checkpointId;
      restoredState.rollback.rollbackHistory = restoredState.rollback.rollbackHistory || [];
      restoredState.rollback.rollbackHistory.push({
        rollbackAt,
        checkpointId: checkpoint.checkpointId,
        stepsReverted,
        filesReverted,
        status: filesReverted > 0 ? 'success' : 'partial'
      });

      // Update timestamps
      restoredState.timestamps.updated = rollbackAt;

      // Save restored state
      const saveResult = await saveState(workflowId, restoredState);
      if (!saveResult.success) {
        return {
          success: false,
          error: {
            code: 'ROLLBACK_ERROR',
            message: 'Failed to save restored state',
            details: { operation: 'rollbackToLastCheckpoint', workflowId }
          }
        };
      }
    }

    return {
      success: true,
      workflowId,
      checkpointId: checkpoint.checkpointId,
      rollbackAt: new Date().toISOString(),
      stepsReverted,
      filesReverted,
      status: filesReverted > 0 ? 'success' : 'partial',
      restoredState: checkpoint.state
    };
  } catch (error) {
    return {
      success: false,
      error: {
        code: 'ROLLBACK_ERROR',
        message: error.message,
        details: { operation: 'rollbackToLastCheckpoint', workflowId, originalError: error.code }
      }
    };
  }
}

/**
 * Rollback workflow to a specific checkpoint
 * @param {string} workflowId - Workflow identifier
 * @param {string} checkpointId - Checkpoint identifier
 * @returns {Promise<object>} Result with rollback info or error
 */
async function rollbackToCheckpoint(workflowId, checkpointId) {
  try {
    // Validate workflowId
    if (!workflowId || typeof workflowId !== 'string') {
      return {
        success: false,
        error: {
          code: 'ROLLBACK_ERROR',
          message: 'Invalid workflow ID',
          details: { operation: 'rollbackToCheckpoint', workflowId, expectedType: 'string' }
        }
      };
    }

    // Validate checkpointId
    if (!checkpointId || typeof checkpointId !== 'string') {
      return {
        success: false,
        error: {
          code: 'ROLLBACK_ERROR',
          message: 'Invalid checkpoint ID',
          details: { operation: 'rollbackToCheckpoint', checkpointId, expectedType: 'string' }
        }
      };
    }

    // Verify checkpoint exists
    const checkpointInfoResult = await getCheckpointInfo(workflowId, checkpointId);
    if (!checkpointInfoResult.success) {
      return {
        success: false,
        error: {
          code: 'ROLLBACK_ERROR',
          message: checkpointInfoResult.error.message,
          details: { operation: 'rollbackToCheckpoint', workflowId, checkpointId, reason: 'Checkpoint not found' }
        }
      };
    }

    // Load checkpoint data
    const checkpointResult = await loadCheckpoint(workflowId, checkpointId);
    if (!checkpointResult.success) {
      return {
        success: false,
        error: {
          code: 'ROLLBACK_ERROR',
          message: checkpointResult.error.message,
          details: { operation: 'rollbackToCheckpoint', workflowId, checkpointId }
        }
      };
    }

    const checkpoint = checkpointResult.checkpoint;

    // Load current workflow state to identify steps after checkpoint
    const loadResult = await loadState(workflowId);
    let stepsReverted = 0;
    let filesReverted = 0;

    if (loadResult.success) {
      const state = loadResult.state;
      const checkpointTime = new Date(checkpoint.createdAt);

      // Find steps that occurred after the checkpoint
      const stepsAfterCheckpoint = (state.stepHistory || []).filter(step => {
        const stepTime = step.startTime ? new Date(step.startTime) : null;
        return stepTime && stepTime > checkpointTime;
      });

      stepsReverted = stepsAfterCheckpoint.length;

      // Collect all file changes from steps after checkpoint
      const fileChanges = [];
      for (const step of stepsAfterCheckpoint) {
        if (step.fileChanges && Array.isArray(step.fileChanges)) {
          fileChanges.push(...step.fileChanges);
        }
      }

      // Revert file changes
      if (fileChanges.length > 0) {
        const revertResult = await revertFileChanges(fileChanges);
        if (revertResult.success) {
          filesReverted = revertResult.revertedCount;
        }
      }

      // Restore state from checkpoint
      const restoredState = {
        variables: checkpoint.state.variables || {},
        stepHistory: checkpoint.state.stepHistory || [],
        timestamps: checkpoint.state.timestamps || {}
      };

      // Add rollback tracking to state
      restoredState.rollback = state.rollback || {
        lastRollbackAt: null,
        lastRollbackCheckpointId: null,
        rollbackHistory: []
      };

      // Add this rollback to history
      const rollbackAt = new Date().toISOString();
      restoredState.rollback.lastRollbackAt = rollbackAt;
      restoredState.rollback.lastRollbackCheckpointId = checkpoint.checkpointId;
      restoredState.rollback.rollbackHistory = restoredState.rollback.rollbackHistory || [];
      restoredState.rollback.rollbackHistory.push({
        rollbackAt,
        checkpointId: checkpoint.checkpointId,
        stepsReverted,
        filesReverted,
        status: filesReverted > 0 ? 'success' : 'partial'
      });

      // Update timestamps
      restoredState.timestamps.updated = rollbackAt;

      // Save restored state
      const saveResult = await saveState(workflowId, restoredState);
      if (!saveResult.success) {
        return {
          success: false,
          error: {
            code: 'ROLLBACK_ERROR',
            message: 'Failed to save restored state',
            details: { operation: 'rollbackToCheckpoint', workflowId, checkpointId }
          }
        };
      }
    }

    return {
      success: true,
      workflowId,
      checkpointId: checkpoint.checkpointId,
      rollbackAt: new Date().toISOString(),
      stepsReverted,
      filesReverted,
      status: filesReverted > 0 ? 'success' : 'partial',
      restoredState: checkpoint.state
    };
  } catch (error) {
    return {
      success: false,
      error: {
        code: 'ROLLBACK_ERROR',
        message: error.message,
        details: { operation: 'rollbackToCheckpoint', workflowId, checkpointId, originalError: error.code }
      }
    };
  }
}

/**
 * Get rollback status for a workflow
 * @param {string} workflowId - Workflow identifier
 * @returns {Promise<object>} Result with rollback status or error
 */
async function getRollbackStatus(workflowId) {
  try {
    // Validate workflowId
    if (!workflowId || typeof workflowId !== 'string') {
      return {
        success: false,
        error: {
          code: 'ROLLBACK_STATUS_ERROR',
          message: 'Invalid workflow ID',
          details: { operation: 'getRollbackStatus', workflowId, expectedType: 'string' }
        }
      };
    }

    // Load workflow state
    const loadResult = await loadState(workflowId);
    if (!loadResult.success) {
      return loadResult;
    }

    const state = loadResult.state;
    const rollback = state.rollback || {
      lastRollbackAt: null,
      lastRollbackCheckpointId: null,
      rollbackHistory: []
    };

    // Get available checkpoints
    const checkpointsResult = await listCheckpoints(workflowId);
    const availableCheckpoints = checkpointsResult.success ? checkpointsResult.checkpoints : [];

    // Build rollback report
    const report = {
      workflowId,
      lastRollbackAt: rollback.lastRollbackAt,
      lastRollbackCheckpointId: rollback.lastRollbackCheckpointId,
      totalRollbacks: rollback.rollbackHistory ? rollback.rollbackHistory.length : 0,
      rollbackHistory: rollback.rollbackHistory || [],
      availableCheckpoints: availableCheckpoints.map(cp => ({
        checkpointId: cp.checkpointId,
        createdAt: cp.createdAt,
        stepId: cp.stepId
      })),
      canRollback: availableCheckpoints.length > 0
    };

    return {
      success: true,
      rollbackStatus: report
    };
  } catch (error) {
    return {
      success: false,
      error: {
        code: 'ROLLBACK_STATUS_ERROR',
        message: error.message,
        details: { operation: 'getRollbackStatus', workflowId, originalError: error.code }
      }
    };
  }
}

/**
 * Generate detailed rollback report
 * @param {string} workflowId - Workflow identifier
 * @returns {Promise<object>} Result with rollback report or error
 */
async function generateRollbackReport(workflowId) {
  try {
    const statusResult = await getRollbackStatus(workflowId);
    if (!statusResult.success) {
      return statusResult;
    }

    const status = statusResult.rollbackStatus;

    // Build detailed report
    const report = {
      workflowId,
      generatedAt: new Date().toISOString(),
      summary: {
        totalRollbacks: status.totalRollbacks,
        lastRollbackAt: status.lastRollbackAt,
        availableCheckpoints: status.availableCheckpoints.length
      },
      rollbackHistory: status.rollbackHistory.map(r => ({
        rollbackAt: r.rollbackAt,
        checkpointId: r.checkpointId,
        stepsReverted: r.stepsReverted,
        filesReverted: r.filesReverted,
        status: r.status
      })),
      checkpoints: status.availableCheckpoints,
      recommendations: {
        canRollback: status.canRollback,
        latestCheckpoint: status.availableCheckpoints.length > 0 
          ? status.availableCheckpoints[0] 
          : null,
        suggestedAction: status.canRollback 
          ? `Use rollbackToLastCheckpoint('${workflowId}') or rollbackToCheckpoint('${workflowId}', '<checkpointId>')`
          : 'Create a checkpoint first using createCheckpoint()'
      }
    };

    return {
      success: true,
      report
    };
  } catch (error) {
    return {
      success: false,
      error: {
        code: 'ROLLBACK_REPORT_ERROR',
        message: error.message,
        details: { operation: 'generateRollbackReport', workflowId, originalError: error.code }
      }
    };
  }
}

module.exports = {
  ensureStateDirectory,
  saveState,
  loadState,
  deleteState,
  listStates,
  getStateFilePath,
  trackStepStart,
  trackStepComplete,
  getStepStatus,
  getWorkflowProgress,
  updateStepStatus,
  // Checkpoint functions
  createCheckpoint,
  saveCheckpoint,
  loadCheckpoint,
  listCheckpoints,
  getCheckpointInfo,
  deleteCheckpoint,
  getLatestCheckpoint,
  resumeFromCheckpoint,
  // Helper functions (for testing)
  getCheckpointDir,
  getCheckpointFilePath,
  // Rollback functions (Story 4-4)
  trackFileChange,
  revertFileChanges,
  rollbackToLastCheckpoint,
  rollbackToCheckpoint,
  getRollbackStatus,
  generateRollbackReport
};
