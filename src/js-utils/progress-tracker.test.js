/**
 * Progress Tracker Tests
 * 
 * Tests for the progress-tracker module
 * 
 * @module progress-tracker.test
 */

// Mock state-manager before requiring progress-tracker
jest.mock('./state-manager', () => ({
  saveState: jest.fn().mockResolvedValue({ success: true }),
  loadState: jest.fn().mockResolvedValue({ success: false, error: { code: 'STATE_NOT_FOUND' } }),
  deleteState: jest.fn().mockResolvedValue({ success: true })
}));

const {
  createProgressTracker,
  updateProgress,
  completeStep,
  getProgress,
  getPercentage,
  loadProgress,
  render,
  destroy
} = require('./progress-tracker');

describe('Progress Tracker', () => {
  afterEach(async () => {
    await destroy();
  });

  describe('createProgressTracker', () => {
    it('should create a progress tracker with valid options', async () => {
      const result = await createProgressTracker({
        totalSteps: 5,
        workflowName: 'test-workflow',
        verbose: false,
        quiet: false
      });

      expect(result).toBeDefined();
      expect(result.totalSteps).toBe(5);
      expect(result.workflowName).toBe('test-workflow');
      expect(result.currentStep).toBe(0);
      expect(result.completedSteps).toBe(0);
    });

    it('should return error for invalid totalSteps', async () => {
      const result = await createProgressTracker({
        totalSteps: 0,
        workflowName: 'test-workflow'
      });

      expect(result.success).toBe(false);
      expect(result.error.code).toBe('PROGRESS_INIT_ERROR');
    });

    it('should return error for missing required options', async () => {
      const result = await createProgressTracker({});

      expect(result.success).toBe(false);
      expect(result.error.code).toBe('PROGRESS_INIT_ERROR');
    });
  });

  describe('updateProgress', () => {
    it('should update progress to specified step', async () => {
      await createProgressTracker({
        totalSteps: 5,
        workflowName: 'test-workflow'
      });

      const result = await updateProgress(2, 'Step 2: Processing');

      expect(result).toBeDefined();
      expect(result.currentStep).toBe(2);
      expect(result.stepName).toBe('Step 2: Processing');
    });

    it('should return error for invalid step number', async () => {
      await createProgressTracker({
        totalSteps: 5,
        workflowName: 'test-workflow'
      });

      const result = await updateProgress(10, 'Invalid Step');

      expect(result.success).toBe(false);
      expect(result.error.code).toBe('PROGRESS_INVALID_STEP');
    });

    it('should return error for step less than 1', async () => {
      await createProgressTracker({
        totalSteps: 5,
        workflowName: 'test-workflow'
      });

      const result = await updateProgress(0, 'Invalid Step');

      expect(result.success).toBe(false);
      expect(result.error.code).toBe('PROGRESS_INVALID_STEP');
    });
  });

  describe('completeStep', () => {
    it('should mark current step as complete', async () => {
      await createProgressTracker({
        totalSteps: 5,
        workflowName: 'test-workflow'
      });

      await updateProgress(1, 'Step 1');
      const result = await completeStep();

      expect(result).toBeDefined();
      expect(result.completedSteps).toBe(1);
    });
  });

  describe('getProgress', () => {
    it('should return current progress state', async () => {
      await createProgressTracker({
        totalSteps: 5,
        workflowName: 'test-workflow'
      });

      await updateProgress(2, 'Step 2');

      const progress = await getProgress();

      expect(progress.success).toBe(true);
      expect(progress.data).toBeDefined();
      expect(progress.data.currentStep).toBe(2);
      expect(progress.data.totalSteps).toBe(5);
    });
  });

  describe('getPercentage', () => {
    it('should return 0 when no steps completed', async () => {
      await createProgressTracker({
        totalSteps: 5,
        workflowName: 'test-workflow'
      });

      const percentage = getPercentage();

      expect(percentage).toBe(0);
    });

    it('should return correct percentage for completed steps', async () => {
      await createProgressTracker({
        totalSteps: 5,
        workflowName: 'test-workflow'
      });

      await updateProgress(1, 'Step 1');
      await completeStep();

      const percentage = getPercentage();

      expect(percentage).toBe(20); // 1 out of 5 = 20%
    });
  });

  describe('render', () => {
    it('should render simple format', async () => {
      await createProgressTracker({
        totalSteps: 5,
        workflowName: 'test-workflow',
        quiet: false
      });

      await updateProgress(2, 'Step 2');

      const result = await render('simple');

      expect(result.success).toBe(true);
      expect(result.output).toContain('2/5');
    });

    it('should render bar format', async () => {
      await createProgressTracker({
        totalSteps: 5,
        workflowName: 'test-workflow',
        quiet: false
      });

      await updateProgress(1, 'Step 1');
      await completeStep();
      await updateProgress(2, 'Step 2');

      const result = await render('bar');

      expect(result.success).toBe(true);
      expect(result.output).toContain('20%');
    });
  });

  describe('destroy', () => {
    it('should clean up tracker resources', async () => {
      await createProgressTracker({
        totalSteps: 5,
        workflowName: 'test-workflow'
      });

      const result = await destroy();

      expect(result.success).toBe(true);
    });
  });
});
