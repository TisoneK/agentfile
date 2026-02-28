/**
 * State Manager Unit Tests
 * @module state-manager.test
 */

const fs = require('fs');
const fsPromises = require('fs/promises');
const path = require('path');
const {
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
  createCheckpoint,
  loadCheckpoint,
  listCheckpoints,
  getCheckpointInfo,
  deleteCheckpoint,
  getLatestCheckpoint,
  resumeFromCheckpoint,
  getCheckpointDir,
  getCheckpointFilePath,
  // Rollback functions (Story 4-4)
  trackFileChange,
  revertFileChanges,
  rollbackToLastCheckpoint,
  rollbackToCheckpoint,
  getRollbackStatus,
  generateRollbackReport
} = require('./state-manager');

const STATE_DIR = '.agentfile/state';
const CHECKPOINT_DIR = '.agentfile/state/checkpoints';

async function cleanupTestState(workflowId) {
  const filePath = getStateFilePath(workflowId);
  if (fs.existsSync(filePath)) {
    fs.unlinkSync(filePath);
  }
}

async function cleanupAllTestStates() {
  if (fs.existsSync(STATE_DIR)) {
    const files = fs.readdirSync(STATE_DIR);
    for (const file of files) {
      if (file.endsWith('.yaml')) {
        fs.unlinkSync(path.join(STATE_DIR, file));
      }
    }
  }
}

async function cleanupTestCheckpoint(workflowId) {
  const checkpointDir = getCheckpointDir(workflowId);
  if (fs.existsSync(checkpointDir)) {
    const files = fs.readdirSync(checkpointDir);
    for (const file of files) {
      if (file.startsWith('checkpoint-')) {
        fs.unlinkSync(path.join(checkpointDir, file));
      }
    }
    // Try to remove the directory
    try {
      fs.rmdirSync(checkpointDir);
    } catch (e) {
      // Directory may not be empty or may not exist
    }
  }
}

async function cleanupAllTestCheckpoints() {
  if (fs.existsSync(CHECKPOINT_DIR)) {
    const dirs = fs.readdirSync(CHECKPOINT_DIR);
    for (const dir of dirs) {
      const dirPath = path.join(CHECKPOINT_DIR, dir);
      if (fs.statSync(dirPath).isDirectory()) {
        const files = fs.readdirSync(dirPath);
        for (const file of files) {
          fs.unlinkSync(path.join(dirPath, file));
        }
        try {
          fs.rmdirSync(dirPath);
        } catch (e) {
          // Directory may not be empty
        }
      }
    }
  }
}

describe('state-manager', () => {
  beforeEach(async () => {
    await cleanupAllTestCheckpoints();
    await cleanupAllTestStates();
  });

  afterAll(async () => {
    await cleanupAllTestCheckpoints();
    await cleanupAllTestStates();
  });

  describe('ensureStateDirectory', () => {
    it('should create state directory if it does not exist', async () => {
      if (fs.existsSync(STATE_DIR)) {
        fs.rmSync(STATE_DIR, { recursive: true, force: true });
      }
      const result = await ensureStateDirectory();
      expect(result.success).toBe(true);
      expect(fs.existsSync(STATE_DIR)).toBe(true);
    });

    it('should return success if directory already exists', async () => {
      await ensureStateDirectory();
      const result = await ensureStateDirectory();
      expect(result.success).toBe(true);
    });
  });

  describe('getStateFilePath', () => {
    it('should return correct file path for workflow ID', () => {
      const filePath = getStateFilePath('my-workflow');
      expect(filePath).toContain('my-workflow.yaml');
      expect(filePath.replace(/\\/g, '/')).toContain(STATE_DIR.replace(/\\/g, '/'));
    });

    it('should sanitize workflow IDs with special characters', () => {
      const filePath = getStateFilePath('my-workflow@#$%');
      expect(filePath).toContain('my-workflow----.yaml');
    });
  });

  describe('saveState', () => {
    const testWorkflowId = 'test-workflow-save';

    afterEach(async () => {
      await cleanupTestState(testWorkflowId);
    });

    it('should save state to YAML file', async () => {
      const state = {
        variables: { foo: 'bar' },
        stepHistory: [],
        timestamps: { created: '2026-01-01T00:00:00Z' }
      };
      const result = await saveState(testWorkflowId, state);
      expect(result.success).toBe(true);
      expect(fs.existsSync(getStateFilePath(testWorkflowId))).toBe(true);
    });

    it('should return error for invalid workflow ID', async () => {
      const state = { variables: {} };
      const result = await saveState('', state);
      expect(result.success).toBe(false);
      expect(result.error.code).toBe('STATE_INVALID_WORKFLOW_ID');
    });

    it('should return error for invalid state object', async () => {
      const result = await saveState('test', 'not an object');
      expect(result.success).toBe(false);
      expect(result.error.code).toBe('STATE_INVALID_STATE');
    });

    it('should preserve all state data in YAML format', async () => {
      const state = {
        variables: { name: 'test', count: 42, active: true },
        stepHistory: [
          { stepId: 'step1', status: 'completed', startTime: '2026-01-01T10:00:00Z', endTime: '2026-01-01T10:05:00Z' }
        ],
        timestamps: { started: '2026-01-01T10:00:00Z', updated: '2026-01-01T10:05:00Z' }
      };
      await saveState(testWorkflowId, state);
      const filePath = getStateFilePath(testWorkflowId);
      const content = fs.readFileSync(filePath, 'utf8');
      expect(content).toContain('variables:');
      expect(content).toContain('stepHistory:');
      expect(content).toContain('name: test');
      expect(content).toContain('count: 42');
    });
  });

  describe('loadState', () => {
    const testWorkflowId = 'test-workflow-load';

    afterEach(async () => {
      await cleanupTestState(testWorkflowId);
    });

    it('should load saved state with all data intact', async () => {
      const originalState = {
        variables: { foo: 'bar', count: 123 },
        stepHistory: [
          { stepId: 'step1', status: 'completed', startTime: '2026-01-01T10:00:00Z' }
        ],
        timestamps: { created: '2026-01-01T00:00:00Z' }
      };
      await saveState(testWorkflowId, originalState);
      const result = await loadState(testWorkflowId);
      expect(result.success).toBe(true);
      expect(result.state.variables.foo).toBe('bar');
      expect(result.state.variables.count).toBe(123);
      expect(result.state.stepHistory.length).toBe(1);
      expect(result.state.stepHistory[0].stepId).toBe('step1');
    });

    it('should return error for non-existent workflow', async () => {
      const result = await loadState('non-existent-workflow-xyz');
      expect(result.success).toBe(false);
      expect(result.error.code).toBe('STATE_NOT_FOUND');
    });

    it('should return error for invalid workflow ID', async () => {
      const result = await loadState('');
      expect(result.success).toBe(false);
      expect(result.error.code).toBe('STATE_INVALID_WORKFLOW_ID');
    });
  });

  describe('state isolation', () => {
    it('should isolate state between different workflows', async () => {
      const workflow1 = 'workflow-1';
      const workflow2 = 'workflow-2';
      const state1 = { variables: { name: 'workflow1' }, stepHistory: [], timestamps: {} };
      const state2 = { variables: { name: 'workflow2' }, stepHistory: [], timestamps: {} };
      await saveState(workflow1, state1);
      await saveState(workflow2, state2);
      const result1 = await loadState(workflow1);
      const result2 = await loadState(workflow2);
      expect(result1.state.variables.name).toBe('workflow1');
      expect(result2.state.variables.name).toBe('workflow2');
      await cleanupTestState(workflow1);
      await cleanupTestState(workflow2);
    });
  });

  describe('deleteState', () => {
    const testWorkflowId = 'test-workflow-delete';

    it('should delete state file', async () => {
      const state = { variables: {}, stepHistory: [], timestamps: {} };
      await saveState(testWorkflowId, state);
      expect(fs.existsSync(getStateFilePath(testWorkflowId))).toBe(true);
      const result = await deleteState(testWorkflowId);
      expect(result.success).toBe(true);
      expect(fs.existsSync(getStateFilePath(testWorkflowId))).toBe(false);
    });

    it('should return error when deleting non-existent state', async () => {
      const result = await deleteState('non-existent-delete');
      expect(result.success).toBe(false);
      expect(result.error.code).toBe('STATE_NOT_FOUND');
    });
  });

  describe('listStates', () => {
    it('should list all workflow states', async () => {
      await saveState('workflow-a', { variables: {}, stepHistory: [], timestamps: {} });
      await saveState('workflow-b', { variables: {}, stepHistory: [], timestamps: {} });
      const result = await listStates();
      expect(result.success).toBe(true);
      expect(result.workflows).toContain('workflow-a');
      expect(result.workflows).toContain('workflow-b');
      await cleanupTestState('workflow-a');
      await cleanupTestState('workflow-b');
    });

    it('should return empty array when no states exist', async () => {
      await cleanupAllTestStates();
      const result = await listStates();
      expect(result.success).toBe(true);
      expect(result.workflows).toEqual([]);
    });
  });

  describe('trackStepStart', () => {
    const testWorkflowId = 'test-workflow-step-start';

    afterEach(async () => {
      await cleanupTestState(testWorkflowId);
    });

    it('should track step start for new workflow', async () => {
      const result = await trackStepStart(testWorkflowId, 'step1', { name: 'First Step' });
      expect(result.success).toBe(true);
      expect(result.stepId).toBe('step1');
      expect(result.status).toBe('in-progress');
      expect(result.startTime).toBeDefined();
    });

    it('should track step start for existing workflow', async () => {
      await saveState(testWorkflowId, { variables: {}, stepHistory: [], timestamps: {} });
      const result = await trackStepStart(testWorkflowId, 'step1');
      expect(result.success).toBe(true);
    });

    it('should return error for invalid workflow ID', async () => {
      const result = await trackStepStart('', 'step1');
      expect(result.success).toBe(false);
      expect(result.error.code).toBe('STEP_TRACK_ERROR');
    });

    it('should return error for invalid step ID', async () => {
      const result = await trackStepStart(testWorkflowId, '');
      expect(result.success).toBe(false);
      expect(result.error.code).toBe('STEP_TRACK_ERROR');
    });
  });

  describe('trackStepComplete', () => {
    const testWorkflowId = 'test-workflow-step-complete';

    afterEach(async () => {
      await cleanupTestState(testWorkflowId);
    });

    it('should track step completion', async () => {
      await trackStepStart(testWorkflowId, 'step1');
      const result = await trackStepComplete(testWorkflowId, 'step1', { output: { result: 'success' } });
      expect(result.success).toBe(true);
      expect(result.status).toBe('completed');
      expect(result.endTime).toBeDefined();
    });

    it('should track step failure', async () => {
      await trackStepStart(testWorkflowId, 'step1');
      const result = await trackStepComplete(testWorkflowId, 'step1', { error: { message: 'Step failed' } });
      expect(result.success).toBe(true);
      expect(result.status).toBe('failed');
    });

    it('should calculate duration correctly', async () => {
      await trackStepStart(testWorkflowId, 'step1');
      // Small delay to ensure duration is measurable
      await new Promise(resolve => setTimeout(resolve, 10));
      const result = await trackStepComplete(testWorkflowId, 'step1');
      expect(result.success).toBe(true);
      const stateResult = await loadState(testWorkflowId);
      expect(stateResult.state.stepHistory[0].duration).toBeGreaterThan(0);
    });

    it('should return error for non-existent workflow', async () => {
      const result = await trackStepComplete('non-existent-workflow', 'step1');
      expect(result.success).toBe(false);
    });
  });

  describe('getStepStatus', () => {
    const testWorkflowId = 'test-workflow-get-status';

    afterEach(async () => {
      await cleanupTestState(testWorkflowId);
    });

    it('should get step status', async () => {
      await trackStepStart(testWorkflowId, 'step1');
      const result = await getStepStatus(testWorkflowId, 'step1');
      expect(result.success).toBe(true);
      expect(result.step.stepId).toBe('step1');
      expect(result.step.status).toBe('in-progress');
    });

    it('should return error for non-existent step', async () => {
      await saveState(testWorkflowId, { variables: {}, stepHistory: [], timestamps: {} });
      const result = await getStepStatus(testWorkflowId, 'non-existent-step');
      expect(result.success).toBe(false);
      expect(result.error.code).toBe('STEP_NOT_FOUND');
    });

    it('should return error for invalid workflow ID', async () => {
      const result = await getStepStatus('', 'step1');
      expect(result.success).toBe(false);
      expect(result.error.code).toBe('STEP_STATUS_ERROR');
    });
  });

  describe('getWorkflowProgress', () => {
    const testWorkflowId = 'test-workflow-progress';

    afterEach(async () => {
      await cleanupTestState(testWorkflowId);
    });

    it('should calculate workflow progress', async () => {
      await trackStepStart(testWorkflowId, 'step1');
      await trackStepComplete(testWorkflowId, 'step1');
      await trackStepStart(testWorkflowId, 'step2');
      
      const result = await getWorkflowProgress(testWorkflowId);
      expect(result.success).toBe(true);
      expect(result.progress.totalSteps).toBe(2);
      expect(result.progress.completedSteps).toBe(1);
      expect(result.progress.inProgressSteps).toBe(1);
      expect(result.progress.progressPercentage).toBe(50);
    });

    it('should return 0% progress for empty workflow', async () => {
      await saveState(testWorkflowId, { variables: {}, stepHistory: [], timestamps: {} });
      const result = await getWorkflowProgress(testWorkflowId);
      expect(result.success).toBe(true);
      expect(result.progress.progressPercentage).toBe(0);
      expect(result.progress.totalSteps).toBe(0);
    });

    it('should return error for non-existent workflow', async () => {
      const result = await getWorkflowProgress('non-existent-workflow-progress');
      expect(result.success).toBe(false);
    });

    it('should identify current step', async () => {
      await trackStepComplete(testWorkflowId, 'step1');
      await trackStepStart(testWorkflowId, 'step2');
      
      const result = await getWorkflowProgress(testWorkflowId);
      expect(result.success).toBe(true);
      expect(result.progress.currentStep).toBe('step2');
    });
  });

  describe('updateStepStatus', () => {
    const testWorkflowId = 'test-workflow-update-status';

    afterEach(async () => {
      await cleanupTestState(testWorkflowId);
    });

    it('should update step status', async () => {
      await trackStepStart(testWorkflowId, 'step1');
      const result = await updateStepStatus(testWorkflowId, 'step1', 'completed');
      expect(result.success).toBe(true);
      expect(result.status).toBe('completed');
    });

    it('should return error for invalid status', async () => {
      await saveState(testWorkflowId, { variables: {}, stepHistory: [], timestamps: {} });
      const result = await updateStepStatus(testWorkflowId, 'step1', 'invalid-status');
      expect(result.success).toBe(false);
      expect(result.error.code).toBe('STEP_UPDATE_ERROR');
    });

    it('should add new step if not exists', async () => {
      await saveState(testWorkflowId, { variables: {}, stepHistory: [], timestamps: {} });
      const result = await updateStepStatus(testWorkflowId, 'new-step', 'completed');
      expect(result.success).toBe(true);
      expect(result.status).toBe('completed');
    });
  });

  // ==========================================
  // Checkpoint Functionality Tests (Story 4-3)
  // ==========================================

  describe('getCheckpointDir', () => {
    it('should return correct checkpoint directory path', () => {
      const dir = getCheckpointDir('my-workflow');
      expect(dir.replace(/\\/g, '/')).toContain('checkpoints/my-workflow');
    });

    it('should sanitize workflow IDs with special characters', () => {
      const dir = getCheckpointDir('my-workflow@#$%');
      expect(dir.replace(/\\/g, '/')).toContain('checkpoints/my-workflow----');
    });
  });

  describe('getCheckpointFilePath', () => {
    it('should return correct checkpoint file path', () => {
      const filePath = getCheckpointFilePath('my-workflow', '1234567890');
      expect(filePath.replace(/\\/g, '/')).toContain('checkpoints/my-workflow/checkpoint-1234567890.yaml');
    });
  });

  describe('createCheckpoint', () => {
    const testWorkflowId = 'test-workflow-checkpoint';

    afterEach(async () => {
      await cleanupTestCheckpoint(testWorkflowId);
      await cleanupTestState(testWorkflowId);
    });

    it('should create checkpoint for workflow with existing state', async () => {
      // Setup workflow with state
      await saveState(testWorkflowId, {
        variables: { foo: 'bar', count: 42 },
        stepHistory: [
          { stepId: 'step1', status: 'completed', startTime: '2026-01-01T10:00:00Z', endTime: '2026-01-01T10:05:00Z' },
          { stepId: 'step2', status: 'in-progress', startTime: '2026-01-01T10:05:00Z' }
        ],
        timestamps: { created: '2026-01-01T00:00:00Z' }
      });

      const result = await createCheckpoint(testWorkflowId, 'step2');
      expect(result.success).toBe(true);
      expect(result.checkpointId).toBeDefined();
      expect(result.workflowId).toBe(testWorkflowId);
      expect(result.stepId).toBe('step2');
    });

    it('should create checkpoint for workflow without existing state', async () => {
      const result = await createCheckpoint(testWorkflowId);
      expect(result.success).toBe(true);
      expect(result.checkpointId).toBeDefined();
      expect(result.createdAt).toBeDefined();
    });

    it('should return error for invalid workflow ID', async () => {
      const result = await createCheckpoint('');
      expect(result.success).toBe(false);
      expect(result.error.code).toBe('CHECKPOINT_CREATE_ERROR');
    });

    it('should capture complete state in checkpoint', async () => {
      // Setup workflow with state
      await saveState(testWorkflowId, {
        variables: { testVar: 'testValue', num: 100 },
        stepHistory: [
          { stepId: 'step1', status: 'completed', startTime: '2026-01-01T10:00:00Z', endTime: '2026-01-01T10:05:00Z' }
        ],
        timestamps: { created: '2026-01-01T00:00:00Z', updated: '2026-01-01T10:05:00Z' }
      });

      const checkpointResult = await createCheckpoint(testWorkflowId);
      expect(checkpointResult.success).toBe(true);

      // Load and verify checkpoint data
      const loadedCheckpoint = await loadCheckpoint(testWorkflowId, checkpointResult.checkpointId);
      expect(loadedCheckpoint.success).toBe(true);
      expect(loadedCheckpoint.checkpoint.state.variables.testVar).toBe('testValue');
      expect(loadedCheckpoint.checkpoint.state.variables.num).toBe(100);
      expect(loadedCheckpoint.checkpoint.state.stepHistory.length).toBe(1);
    });

    it('should include metadata in checkpoint', async () => {
      await saveState(testWorkflowId, {
        variables: {},
        stepHistory: [
          { stepId: 'step1', status: 'completed', startTime: '2026-01-01T10:00:00Z', endTime: '2026-01-01T10:05:00Z' },
          { stepId: 'step2', status: 'completed', startTime: '2026-01-01T10:05:00Z', endTime: '2026-01-01T10:10:00Z' },
          { stepId: 'step3', status: 'in-progress', startTime: '2026-01-01T10:10:00Z' }
        ],
        timestamps: {}
      });

      const result = await createCheckpoint(testWorkflowId);
      expect(result.success).toBe(true);
      expect(result.metadata.totalSteps).toBe(3);
      expect(result.metadata.completedSteps).toBe(2);
      expect(result.metadata.progress).toBe(67); // 2/3 = 67%
    });
  });

  describe('loadCheckpoint', () => {
    const testWorkflowId = 'test-workflow-load-checkpoint';

    afterEach(async () => {
      await cleanupTestCheckpoint(testWorkflowId);
      await cleanupTestState(testWorkflowId);
    });

    it('should load checkpoint data', async () => {
      // Create checkpoint first
      await saveState(testWorkflowId, { variables: { test: 'data' }, stepHistory: [], timestamps: {} });
      const checkpointResult = await createCheckpoint(testWorkflowId);
      const checkpointId = checkpointResult.checkpointId;

      // Load the checkpoint
      const result = await loadCheckpoint(testWorkflowId, checkpointId);
      expect(result.success).toBe(true);
      expect(result.checkpoint.checkpointId).toBe(checkpointId);
      expect(result.checkpoint.workflowId).toBe(testWorkflowId);
      expect(result.checkpoint.state.variables.test).toBe('data');
    });

    it('should return error for non-existent checkpoint', async () => {
      const result = await loadCheckpoint(testWorkflowId, 'non-existent-checkpoint');
      expect(result.success).toBe(false);
      expect(result.error.code).toBe('CHECKPOINT_NOT_FOUND');
    });

    it('should return error for invalid workflow ID', async () => {
      const result = await loadCheckpoint('', '123');
      expect(result.success).toBe(false);
      expect(result.error.code).toBe('CHECKPOINT_LOAD_ERROR');
    });

    it('should return error for invalid checkpoint ID', async () => {
      const result = await loadCheckpoint(testWorkflowId, '');
      expect(result.success).toBe(false);
      expect(result.error.code).toBe('CHECKPOINT_LOAD_ERROR');
    });
  });

  describe('listCheckpoints', () => {
    const testWorkflowId = 'test-workflow-list-checkpoints';

    afterEach(async () => {
      await cleanupTestCheckpoint(testWorkflowId);
      await cleanupTestState(testWorkflowId);
    });

    it('should list all checkpoints for a workflow', async () => {
      await saveState(testWorkflowId, { variables: {}, stepHistory: [], timestamps: {} });
      
      // Create multiple checkpoints
      await createCheckpoint(testWorkflowId);
      await new Promise(resolve => setTimeout(resolve, 10)); // Small delay for unique timestamps
      await createCheckpoint(testWorkflowId);
      await new Promise(resolve => setTimeout(resolve, 10));
      await createCheckpoint(testWorkflowId);

      const result = await listCheckpoints(testWorkflowId);
      expect(result.success).toBe(true);
      expect(result.checkpoints.length).toBe(3);
    });

    it('should return empty array when no checkpoints exist', async () => {
      const result = await listCheckpoints(testWorkflowId);
      expect(result.success).toBe(true);
      expect(result.checkpoints).toEqual([]);
    });

    it('should return error for invalid workflow ID', async () => {
      const result = await listCheckpoints('');
      expect(result.success).toBe(false);
      expect(result.error.code).toBe('CHECKPOINT_LIST_ERROR');
    });

    it('should return checkpoints sorted by createdAt descending', async () => {
      await saveState(testWorkflowId, { variables: {}, stepHistory: [], timestamps: {} });
      
      await createCheckpoint(testWorkflowId); // oldest
      await new Promise(resolve => setTimeout(resolve, 20));
      await createCheckpoint(testWorkflowId); // middle
      await new Promise(resolve => setTimeout(resolve, 20));
      await createCheckpoint(testWorkflowId); // newest

      const result = await listCheckpoints(testWorkflowId);
      expect(result.success).toBe(true);
      // Newest should be first
      const dates = result.checkpoints.map(c => new Date(c.createdAt));
      expect(dates[0].getTime()).toBeGreaterThanOrEqual(dates[1].getTime());
      expect(dates[1].getTime()).toBeGreaterThanOrEqual(dates[2].getTime());
    });
  });

  describe('getCheckpointInfo', () => {
    const testWorkflowId = 'test-workflow-get-info';

    afterEach(async () => {
      await cleanupTestCheckpoint(testWorkflowId);
      await cleanupTestState(testWorkflowId);
    });

    it('should get checkpoint info', async () => {
      await saveState(testWorkflowId, { variables: { info: 'test' }, stepHistory: [], timestamps: {} });
      const checkpointResult = await createCheckpoint(testWorkflowId, 'step1');

      const result = await getCheckpointInfo(testWorkflowId, checkpointResult.checkpointId);
      expect(result.success).toBe(true);
      expect(result.checkpointId).toBe(checkpointResult.checkpointId);
      expect(result.workflowId).toBe(testWorkflowId);
      expect(result.stepId).toBe('step1');
    });

    it('should return error for non-existent checkpoint', async () => {
      const result = await getCheckpointInfo(testWorkflowId, 'non-existent');
      expect(result.success).toBe(false);
      expect(result.error.code).toBe('CHECKPOINT_NOT_FOUND');
    });
  });

  describe('deleteCheckpoint', () => {
    const testWorkflowId = 'test-workflow-delete-checkpoint';

    afterEach(async () => {
      await cleanupTestCheckpoint(testWorkflowId);
      await cleanupTestState(testWorkflowId);
    });

    it('should delete checkpoint', async () => {
      await saveState(testWorkflowId, { variables: {}, stepHistory: [], timestamps: {} });
      const checkpointResult = await createCheckpoint(testWorkflowId);
      const checkpointId = checkpointResult.checkpointId;

      // Verify checkpoint exists
      const loadResult = await loadCheckpoint(testWorkflowId, checkpointId);
      expect(loadResult.success).toBe(true);

      // Delete checkpoint
      const deleteResult = await deleteCheckpoint(testWorkflowId, checkpointId);
      expect(deleteResult.success).toBe(true);

      // Verify checkpoint is deleted
      const afterDelete = await loadCheckpoint(testWorkflowId, checkpointId);
      expect(afterDelete.success).toBe(false);
    });

    it('should return error for non-existent checkpoint', async () => {
      const result = await deleteCheckpoint(testWorkflowId, 'non-existent');
      expect(result.success).toBe(false);
      expect(result.error.code).toBe('CHECKPOINT_NOT_FOUND');
    });

    it('should return error for invalid workflow ID', async () => {
      const result = await deleteCheckpoint('', '123');
      expect(result.success).toBe(false);
      expect(result.error.code).toBe('CHECKPOINT_DELETE_ERROR');
    });
  });

  describe('getLatestCheckpoint', () => {
    const testWorkflowId = 'test-workflow-latest-checkpoint';

    afterEach(async () => {
      await cleanupTestCheckpoint(testWorkflowId);
      await cleanupTestState(testWorkflowId);
    });

    it('should get latest checkpoint', async () => {
      await saveState(testWorkflowId, { variables: {}, stepHistory: [], timestamps: {} });
      
      await createCheckpoint(testWorkflowId); // first
      await new Promise(resolve => setTimeout(resolve, 20));
      await createCheckpoint(testWorkflowId); // second
      await new Promise(resolve => setTimeout(resolve, 20));
      const thirdResult = await createCheckpoint(testWorkflowId); // third (latest)

      const result = await getLatestCheckpoint(testWorkflowId);
      expect(result.success).toBe(true);
      expect(result.checkpoint.checkpointId).toBe(thirdResult.checkpointId);
    });

    it('should return error when no checkpoints exist', async () => {
      const result = await getLatestCheckpoint(testWorkflowId);
      expect(result.success).toBe(false);
      expect(result.error.code).toBe('CHECKPOINT_NOT_FOUND');
    });
  });

  describe('resumeFromCheckpoint', () => {
    const testWorkflowId = 'test-workflow-resume';

    afterEach(async () => {
      await cleanupTestCheckpoint(testWorkflowId);
      await cleanupTestState(testWorkflowId);
    });

    it('should resume from latest checkpoint', async () => {
      // Create workflow with specific state
      const originalState = {
        variables: { resumeTest: 'originalValue', count: 99 },
        stepHistory: [
          { stepId: 'step1', status: 'completed', startTime: '2026-01-01T10:00:00Z', endTime: '2026-01-01T10:05:00Z' }
        ],
        timestamps: { created: '2026-01-01T00:00:00Z' }
      };
      await saveState(testWorkflowId, originalState);

      // Create checkpoint
      const checkpointResult = await createCheckpoint(testWorkflowId);

      // Modify the state (simulate workflow progress)
      await saveState(testWorkflowId, {
        variables: { resumeTest: 'modifiedValue', count: 100 },
        stepHistory: [
          { stepId: 'step1', status: 'completed', startTime: '2026-01-01T10:00:00Z', endTime: '2026-01-01T10:05:00Z' },
          { stepId: 'step2', status: 'completed', startTime: '2026-01-01T10:05:00Z', endTime: '2026-01-01T10:10:00Z' }
        ],
        timestamps: {}
      });

      // Resume from checkpoint
      const resumeResult = await resumeFromCheckpoint(testWorkflowId);
      expect(resumeResult.success).toBe(true);
      expect(resumeResult.checkpointId).toBe(checkpointResult.checkpointId);

      // Verify state was restored
      const loadedState = await loadState(testWorkflowId);
      expect(loadedState.success).toBe(true);
      expect(loadedState.state.variables.resumeTest).toBe('originalValue');
      expect(loadedState.state.variables.count).toBe(99);
      expect(loadedState.state.stepHistory.length).toBe(1);
    });

    it('should resume from specific checkpoint', async () => {
      await saveState(testWorkflowId, { variables: { v1: 'first' }, stepHistory: [], timestamps: {} });
      const cp1 = await createCheckpoint(testWorkflowId);
      
      await saveState(testWorkflowId, { variables: { v1: 'second' }, stepHistory: [], timestamps: {} });
      await createCheckpoint(testWorkflowId); // cp2

      // Resume from first checkpoint
      const result = await resumeFromCheckpoint(testWorkflowId, cp1.checkpointId);
      expect(result.success).toBe(true);
      expect(result.checkpointId).toBe(cp1.checkpointId);

      // Verify state
      const loadedState = await loadState(testWorkflowId);
      expect(loadedState.state.variables.v1).toBe('first');
    });

    it('should return error for invalid workflow ID', async () => {
      const result = await resumeFromCheckpoint('');
      expect(result.success).toBe(false);
      expect(result.error.code).toBe('CHECKPOINT_RESUME_ERROR');
    });

    it('should return error when no checkpoints exist', async () => {
      const result = await resumeFromCheckpoint(testWorkflowId);
      expect(result.success).toBe(false);
      expect(result.error.code).toBe('CHECKPOINT_NOT_FOUND');
    });
  });

  // ==========================================
  // Rollback Functionality Tests (Story 4-4)
  // ==========================================

  describe('trackFileChange', () => {
    const testWorkflowId = 'test-workflow-file-change';

    afterEach(async () => {
      await cleanupTestState(testWorkflowId);
    });

    it('should track file change for existing workflow step', async () => {
      // Setup workflow with step
      await trackStepStart(testWorkflowId, 'step1');
      
      const fileChange = {
        operation: 'create',
        path: '/test/file.txt',
        previousContent: null
      };
      
      const result = await trackFileChange(testWorkflowId, 'step1', fileChange);
      expect(result.success).toBe(true);
      expect(result.stepId).toBe('step1');
      expect(result.fileChange.operation).toBe('create');
    });

    it('should return error for invalid workflow ID', async () => {
      const result = await trackFileChange('', 'step1', { operation: 'create', path: '/test.txt' });
      expect(result.success).toBe(false);
      expect(result.error.code).toBe('FILE_TRACK_ERROR');
    });

    it('should return error for invalid file change object', async () => {
      await saveState(testWorkflowId, { variables: {}, stepHistory: [], timestamps: {} });
      const result = await trackFileChange(testWorkflowId, 'step1', 'not an object');
      expect(result.success).toBe(false);
      expect(result.error.code).toBe('FILE_TRACK_ERROR');
    });
  });

  describe('revertFileChanges', () => {
    const fs = require('fs');
    const testDir = '.agentfile/test-revert';

    beforeAll(async () => {
      // Create test directory
      await fsPromises.mkdir(testDir, { recursive: true });
    });

    afterAll(async () => {
      // Cleanup test directory
      try {
        await fsPromises.rm(testDir, { recursive: true, force: true });
      } catch (e) {
        // Ignore cleanup errors
      }
    });

    it('should return success for empty file changes array', async () => {
      const result = await revertFileChanges([]);
      expect(result.success).toBe(true);
      expect(result.revertedCount).toBe(0);
    });

    it('should revert a created file by deleting it', async () => {
      const testFile = path.join(testDir, 'test-create.txt');
      await fsPromises.writeFile(testFile, 'test content', 'utf8');

      const result = await revertFileChanges([{
        operation: 'create',
        path: testFile,
        previousContent: null
      }]);

      expect(result.success).toBe(true);
      expect(result.revertedCount).toBe(1);
      expect(fs.existsSync(testFile)).toBe(false);
    });

    it('should revert a modified file by restoring previous content', async () => {
      const testFile = path.join(testDir, 'test-modify.txt');
      const originalContent = 'original content';
      await fsPromises.writeFile(testFile, originalContent, 'utf8');
      await fsPromises.writeFile(testFile, 'modified content', 'utf8');

      const result = await revertFileChanges([{
        operation: 'modify',
        path: testFile,
        previousContent: originalContent
      }]);

      expect(result.success).toBe(true);
      expect(result.revertedCount).toBe(1);
      const restoredContent = fs.readFileSync(testFile, 'utf8');
      expect(restoredContent).toBe(originalContent);
    });
  });

  describe('rollbackToLastCheckpoint', () => {
    const testWorkflowId = 'test-workflow-rollback-last';

    afterEach(async () => {
      await cleanupTestCheckpoint(testWorkflowId);
      await cleanupTestState(testWorkflowId);
    });

    it('should rollback to latest checkpoint', async () => {
      // Create initial state
      await saveState(testWorkflowId, {
        variables: { foo: 'bar' },
        stepHistory: [
          { stepId: 'step1', status: 'completed', startTime: '2026-01-01T10:00:00Z', endTime: '2026-01-01T10:05:00Z' }
        ],
        timestamps: { created: '2026-01-01T00:00:00Z' }
      });

      // Create checkpoint
      const checkpointResult = await createCheckpoint(testWorkflowId, 'step1');
      expect(checkpointResult.success).toBe(true);

      // Add more steps after checkpoint
      await trackStepStart(testWorkflowId, 'step2');
      await trackStepComplete(testWorkflowId, 'step2', { output: { result: 'done' } });

      // Rollback to last checkpoint
      const result = await rollbackToLastCheckpoint(testWorkflowId);
      expect(result.success).toBe(true);
      expect(result.checkpointId).toBe(checkpointResult.checkpointId);
      expect(result.stepsReverted).toBeGreaterThanOrEqual(0);
    });

    it('should return error when no checkpoints exist', async () => {
      await saveState(testWorkflowId, {
        variables: {},
        stepHistory: [],
        timestamps: {}
      });

      const result = await rollbackToLastCheckpoint(testWorkflowId);
      expect(result.success).toBe(false);
      expect(result.error.code).toBe('ROLLBACK_ERROR');
    });

    it('should return error for invalid workflow ID', async () => {
      const result = await rollbackToLastCheckpoint('');
      expect(result.success).toBe(false);
      expect(result.error.code).toBe('ROLLBACK_ERROR');
    });
  });

  describe('rollbackToCheckpoint', () => {
    const testWorkflowId = 'test-workflow-rollback-specific';

    afterEach(async () => {
      await cleanupTestCheckpoint(testWorkflowId);
      await cleanupTestState(testWorkflowId);
    });

    it('rollback to specific checkpoint', async () => {
      // Create initial state
      await saveState(testWorkflowId, {
        variables: { foo: 'bar' },
        stepHistory: [
          { stepId: 'step1', status: 'completed', startTime: '2026-01-01T10:00:00Z', endTime: '2026-01-01T10:05:00Z' }
        ],
        timestamps: { created: '2026-01-01T00:00:00Z' }
      });

      // Create checkpoint
      const checkpointResult = await createCheckpoint(testWorkflowId, 'step1');
      expect(checkpointResult.success).toBe(true);

      // Add more steps after checkpoint
      await trackStepStart(testWorkflowId, 'step2');
      await trackStepComplete(testWorkflowId, 'step2', { output: { result: 'done' } });

      // Rollback to specific checkpoint
      const result = await rollbackToCheckpoint(testWorkflowId, checkpointResult.checkpointId);
      expect(result.success).toBe(true);
      expect(result.checkpointId).toBe(checkpointResult.checkpointId);
    });

    it('should return error for non-existent checkpoint', async () => {
      await saveState(testWorkflowId, {
        variables: {},
        stepHistory: [],
        timestamps: {}
      });

      const result = await rollbackToCheckpoint(testWorkflowId, 'non-existent-checkpoint');
      expect(result.success).toBe(false);
      expect(result.error.code).toBe('ROLLBACK_ERROR');
    });

    it('should return error for invalid checkpoint ID', async () => {
      await saveState(testWorkflowId, {
        variables: {},
        stepHistory: [],
        timestamps: {}
      });

      const result = await rollbackToCheckpoint(testWorkflowId, '');
      expect(result.success).toBe(false);
      expect(result.error.code).toBe('ROLLBACK_ERROR');
    });
  });

  describe('getRollbackStatus', () => {
    const testWorkflowId = 'test-workflow-rollback-status';

    afterEach(async () => {
      await cleanupTestCheckpoint(testWorkflowId);
      await cleanupTestState(testWorkflowId);
    });

    it('should get rollback status', async () => {
      await saveState(testWorkflowId, {
        variables: {},
        stepHistory: [],
        timestamps: {},
        rollback: {
          lastRollbackAt: '2026-01-01T12:00:00Z',
          lastRollbackCheckpointId: '12345',
          rollbackHistory: []
        }
      });

      const result = await getRollbackStatus(testWorkflowId);
      expect(result.success).toBe(true);
      expect(result.rollbackStatus.workflowId).toBe(testWorkflowId);
      expect(result.rollbackStatus.lastRollbackAt).toBe('2026-01-01T12:00:00Z');
    });

    it('should return default status when no rollback info exists', async () => {
      await saveState(testWorkflowId, {
        variables: {},
        stepHistory: [],
        timestamps: {}
      });

      const result = await getRollbackStatus(testWorkflowId);
      expect(result.success).toBe(true);
      expect(result.rollbackStatus.lastRollbackAt).toBeNull();
      expect(result.rollbackStatus.totalRollbacks).toBe(0);
    });

    it('should return error for invalid workflow ID', async () => {
      const result = await getRollbackStatus('');
      expect(result.success).toBe(false);
      expect(result.error.code).toBe('ROLLBACK_STATUS_ERROR');
    });
  });

  describe('generateRollbackReport', () => {
    const testWorkflowId = 'test-workflow-rollback-report';

    afterEach(async () => {
      await cleanupTestCheckpoint(testWorkflowId);
      await cleanupTestState(testWorkflowId);
    });

    it('should generate rollback report', async () => {
      // Create state with rollback info
      await saveState(testWorkflowId, {
        variables: {},
        stepHistory: [],
        timestamps: {},
        rollback: {
          lastRollbackAt: '2026-01-01T12:00:00Z',
          lastRollbackCheckpointId: '12345',
          rollbackHistory: [
            {
              rollbackAt: '2026-01-01T12:00:00Z',
              checkpointId: '12345',
              stepsReverted: 2,
              filesReverted: 1,
              status: 'success'
            }
          ]
        }
      });

      const result = await generateRollbackReport(testWorkflowId);
      expect(result.success).toBe(true);
      expect(result.report.workflowId).toBe(testWorkflowId);
      expect(result.report.summary.totalRollbacks).toBe(1);
      expect(result.report.recommendations).toBeDefined();
    });

    it('should return error for invalid workflow ID', async () => {
      const result = await generateRollbackReport('');
      expect(result.success).toBe(false);
    });
  });
});

