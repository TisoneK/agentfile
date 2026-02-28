/**
 * Progress Tracker Module
 * 
 * Provides workflow progress tracking with multiple output formats
 * 
 * @module progress-tracker
 */

const stateManager = require('./state-manager');

/**
 * Global tracker instance
 * @private
 */
let trackerInstance = null;

/**
 * Validate tracker options
 * @private
 */
function validateOptions(options) {
  if (!options || typeof options !== 'object') {
    return {
      success: false,
      error: {
        code: 'PROGRESS_INIT_ERROR',
        message: 'Invalid options object',
        details: { operation: 'validateOptions' }
      }
    };
  }

  if (!options.totalSteps || typeof options.totalSteps !== 'number' || options.totalSteps < 1) {
    return {
      success: false,
      error: {
        code: 'PROGRESS_INIT_ERROR',
        message: 'Invalid totalSteps: must be a positive number',
        details: { operation: 'validateOptions', totalSteps: options.totalSteps }
      }
    };
  }

  if (!options.workflowName || typeof options.workflowName !== 'string') {
    return {
      success: false,
      error: {
        code: 'PROGRESS_INIT_ERROR',
        message: 'Invalid workflowName: must be a non-empty string',
        details: { operation: 'validateOptions', workflowName: options.workflowName }
      }
    };
  }

  return { success: true };
}

/**
 * Create a new progress tracker for a workflow
 * @param {Object} options - Tracker options
 * @param {number} options.totalSteps - Total number of steps in workflow
 * @param {string} options.workflowName - Name of the workflow
 * @param {boolean} [options.verbose=false] - Enable detailed output
 * @param {boolean} [options.quiet=false] - Minimal output mode
 * @returns {Promise<Object>} Progress tracker instance
 */
async function createProgressTracker(options) {
  // Validate options
  const validation = validateOptions(options);
  if (!validation.success) {
    return validation;
  }

  // Initialize tracker state
  trackerInstance = {
    totalSteps: options.totalSteps,
    workflowName: options.workflowName,
    currentStep: 0,
    completedSteps: 0,
    stepName: '',
    stepStartTime: null,
    stepDurations: [],
    verbose: options.verbose || false,
    quiet: options.quiet || false,
    workflowId: options.workflowName.toLowerCase().replace(/[^a-z0-9]/g, '-'),
    createdAt: new Date().toISOString()
  };

  // Persist initial state if state manager available
  try {
    await stateManager.saveState(trackerInstance.workflowId, {
      progress: {
        totalSteps: trackerInstance.totalSteps,
        currentStep: trackerInstance.currentStep,
        completedSteps: trackerInstance.completedSteps,
        stepName: trackerInstance.stepName
      }
    });
  } catch (err) {
    // Continue without persistence - non-critical
  }

  return trackerInstance;
}

/**
 * Update progress to a specific step
 * @param {number} step - Step number (1-based)
 * @param {string} stepName - Name of the step
 * @returns {Promise<Object>} Updated progress state
 */
async function updateProgress(step, stepName) {
  // Validate tracker exists
  if (!trackerInstance) {
    return {
      success: false,
      error: {
        code: 'PROGRESS_UPDATE_ERROR',
        message: 'No progress tracker initialized',
        details: { operation: 'updateProgress' }
      }
    };
  }

  // Validate step number
  if (!step || typeof step !== 'number' || step < 1 || step > trackerInstance.totalSteps) {
    return {
      success: false,
      error: {
        code: 'PROGRESS_INVALID_STEP',
        message: `Invalid step number: ${step}. Must be between 1 and ${trackerInstance.totalSteps}`,
        details: { operation: 'updateProgress', step, maxStep: trackerInstance.totalSteps }
      }
    };
  }

  // Record step start time
  const stepStartTime = new Date().toISOString();
  
  // Update tracker state
  trackerInstance.currentStep = step;
  trackerInstance.stepName = stepName || `Step ${step}`;
  trackerInstance.stepStartTime = stepStartTime;

  // Persist state
  try {
    await stateManager.saveState(trackerInstance.workflowId, {
      progress: {
        totalSteps: trackerInstance.totalSteps,
        currentStep: trackerInstance.currentStep,
        completedSteps: trackerInstance.completedSteps,
        stepName: trackerInstance.stepName,
        stepStartTime: trackerInstance.stepStartTime
      }
    });
  } catch (err) {
    // Continue without persistence
  }

  return trackerInstance;
}

/**
 * Mark current step as complete and advance
 * @returns {Promise<Object>} Updated progress state
 */
async function completeStep() {
  // Validate tracker exists
  if (!trackerInstance) {
    return {
      success: false,
      error: {
        code: 'PROGRESS_UPDATE_ERROR',
        message: 'No progress tracker initialized',
        details: { operation: 'completeStep' }
      }
    };
  }

  // Record step duration
  if (trackerInstance.stepStartTime) {
    const duration = Date.now() - new Date(trackerInstance.stepStartTime).getTime();
    trackerInstance.stepDurations.push({
      step: trackerInstance.currentStep,
      duration: duration
    });
  }

  // Update completed steps
  trackerInstance.completedSteps = trackerInstance.currentStep;

  // Auto-advance to next step
  if (trackerInstance.currentStep < trackerInstance.totalSteps) {
    trackerInstance.currentStep += 1;
    trackerInstance.stepStartTime = new Date().toISOString();
  }

  // Persist state
  try {
    await stateManager.saveState(trackerInstance.workflowId, {
      progress: {
        totalSteps: trackerInstance.totalSteps,
        currentStep: trackerInstance.currentStep,
        completedSteps: trackerInstance.completedSteps,
        stepName: trackerInstance.stepName
      }
    });
  } catch (err) {
    // Continue without persistence
  }

  return trackerInstance;
}

/**
 * Get current progress state
 * @returns {Promise<Object>} Current progress
 */
async function getProgress() {
  if (!trackerInstance) {
    return {
      success: false,
      error: {
        code: 'PROGRESS_UPDATE_ERROR',
        message: 'No progress tracker initialized',
        details: { operation: 'getProgress' }
      }
    };
  }

  return {
    success: true,
    data: {
      totalSteps: trackerInstance.totalSteps,
      currentStep: trackerInstance.currentStep,
      completedSteps: trackerInstance.completedSteps,
      stepName: trackerInstance.stepName,
      stepStartTime: trackerInstance.stepStartTime,
      stepDurations: trackerInstance.stepDurations
    }
  };
}

/**
 * Calculate and return progress percentage
 * @returns {number} Progress percentage (0-100)
 */
function getPercentage() {
  if (!trackerInstance) {
    return 0;
  }

  if (trackerInstance.totalSteps === 0) {
    return 0;
  }

  return Math.round((trackerInstance.completedSteps / trackerInstance.totalSteps) * 100);
}

/**
 * Load progress from persisted state (for resume capability)
 * @param {string} workflowId - Workflow identifier to load
 * @returns {Promise<Object>} Loaded progress state
 */
async function loadProgress(workflowId) {
  try {
    const result = await stateManager.loadState(workflowId);
    
    if (!result.success) {
      if (result.error.code === 'STATE_NOT_FOUND') {
        return {
          success: false,
          error: {
            code: 'PROGRESS_NOT_FOUND',
            message: `No saved progress found for workflow: ${workflowId}`,
            details: { operation: 'loadProgress', workflowId }
          }
        };
      }
      return result;
    }

    const savedProgress = result.state.progress;
    
    if (!savedProgress) {
      return {
        success: false,
        error: {
          code: 'PROGRESS_NOT_FOUND',
          message: 'No progress data found in saved state',
          details: { operation: 'loadProgress', workflowId }
        }
      };
    }

    // Restore tracker instance
    trackerInstance = {
      totalSteps: savedProgress.totalSteps,
      workflowName: savedProgress.workflowName || workflowId,
      currentStep: savedProgress.currentStep || 0,
      completedSteps: savedProgress.completedSteps || 0,
      stepName: savedProgress.stepName || '',
      stepStartTime: savedProgress.stepStartTime,
      stepDurations: savedProgress.stepDurations || [],
      verbose: savedProgress.verbose || false,
      quiet: savedProgress.quiet || false,
      workflowId: workflowId,
      createdAt: new Date().toISOString()
    };

    return {
      success: true,
      progress: trackerInstance
    };
  } catch (error) {
    return {
      success: false,
      error: {
        code: 'PROGRESS_LOAD_ERROR',
        message: `Failed to load progress: ${error.message}`,
        details: { operation: 'loadProgress', workflowId, originalError: error.message }
      }
    };
  }
}

/**
 * Render progress to console
 * @param {string} [format='simple'] - Output format: 'simple', 'bar', 'detailed'
 */
async function render(format = 'simple') {
  if (!trackerInstance) {
    return {
      success: false,
      error: {
        code: 'PROGRESS_RENDER_ERROR',
        message: 'No progress tracker initialized',
        details: { operation: 'render' }
      }
    };
  }

  // Handle quiet mode
  if (trackerInstance.quiet) {
    return { success: true, output: '' };
  }

  const percentage = getPercentage();
  let output = '';

  // Generate step indicators: ✓ for complete, → for current, ○ for pending
  function getStepIndicators() {
    let indicators = '';
    for (let i = 1; i <= trackerInstance.totalSteps; i++) {
      if (i < trackerInstance.currentStep || (i === trackerInstance.currentStep && trackerInstance.completedSteps >= i)) {
        indicators += '✓ ';
      } else if (i === trackerInstance.currentStep) {
        indicators += '→ ';
      } else {
        indicators += '○ ';
      }
    }
    return indicators.trim();
  }

  // Format timestamp
  function formatTimestamp(isoString) {
    if (!isoString) return 'N/A';
    const date = new Date(isoString);
    return date.toLocaleTimeString();
  }

  switch (format) {
    case 'simple':
      output = `Step ${trackerInstance.currentStep}/${trackerInstance.totalSteps}: ${trackerInstance.stepName} [${percentage}%]`;
      break;

    case 'bar':
      const barWidth = 20;
      const filled = Math.round((percentage / 100) * barWidth);
      const bar = '█'.repeat(filled) + '░'.repeat(barWidth - filled);
      output = `[${bar}] ${percentage}% - Step ${trackerInstance.currentStep} of ${trackerInstance.totalSteps}`;
      break;

    case 'detailed':
      const elapsed = trackerInstance.stepDurations.reduce((sum, d) => sum + d.duration, 0);
      const avgDuration = trackerInstance.stepDurations.length > 0 
        ? elapsed / trackerInstance.stepDurations.length 
        : 0;
      const eta = avgDuration * (trackerInstance.totalSteps - trackerInstance.completedSteps);
      const stepIndicators = getStepIndicators();
      
      output = `Workflow: ${trackerInstance.workflowName}
  Step: ${trackerInstance.currentStep}/${trackerInstance.totalSteps} - ${trackerInstance.stepName}
  Progress: ${percentage}%
  Steps: ${stepIndicators}
  Started: ${formatTimestamp(trackerInstance.stepStartTime)}
  Avg Step Duration: ${Math.round(avgDuration)}ms
  ETA: ${Math.round(eta)}ms`;
      break;

    default:
      output = `Step ${trackerInstance.currentStep}/${trackerInstance.totalSteps}: ${trackerInstance.stepName} [${percentage}%]`;
  }

  // Console output (in real implementation would use console.log)
  if (!trackerInstance.quiet) {
    console.log(output);
  }

  return { success: true, output };
}

/**
 * Clean up progress tracker resources
 */
async function destroy() {
  if (trackerInstance) {
    // Clear persisted state
    try {
      await stateManager.deleteState(trackerInstance.workflowId);
    } catch (err) {
      // Ignore cleanup errors
    }
    
    trackerInstance = null;
  }
  return { success: true };
}

module.exports = {
  createProgressTracker,
  updateProgress,
  completeStep,
  getProgress,
  getPercentage,
  loadProgress,
  render,
  destroy
};
