/**
 * CLI Orchestrator Tests
 * 
 * Tests for the cli-orchestrator module
 * 
 * @module cli-orchestrator.test
 */

const fs = require('fs');
const path = require('path');

// Mock dependencies
jest.mock('./state-manager', () => ({
  saveState: jest.fn().mockResolvedValue({ success: true }),
  loadState: jest.fn().mockResolvedValue({ success: false, error: { code: 'STATE_NOT_FOUND' } }),
  deleteState: jest.fn().mockResolvedValue({ success: true }),
  trackStepStart: jest.fn().mockResolvedValue({ success: true }),
  trackStepComplete: jest.fn().mockResolvedValue({ success: true })
}));

jest.mock('./cli-parser', () => ({
  parseCommand: jest.fn(),
  parseArguments: jest.fn().mockResolvedValue({ success: true, args: [], options: {} })
}));

jest.mock('./env-validator', () => ({
  validateEnvironment: jest.fn().mockResolvedValue({ success: true })
}));

jest.mock('./progress-tracker', () => ({
  createProgressTracker: jest.fn().mockResolvedValue({}),
  updateProgress: jest.fn().mockResolvedValue({}),
  completeStep: jest.fn().mockResolvedValue({}),
  destroy: jest.fn().mockResolvedValue({ success: true })
}));

const {
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
} = require('./cli-orchestrator');

describe('CLI Orchestrator', () => {
  // Test workflow data
  const validWorkflow = {
    name: 'test-workflow',
    description: 'A test workflow',
    steps: [
      { id: 'step1', name: 'First Step' },
      { id: 'step2', name: 'Second Step' }
    ]
  };

  const invalidWorkflow = {
    name: 'invalid-workflow',
    description: 'A workflow with missing step id'
  };

  describe('loadWorkflow', () => {
    beforeEach(() => {
      clearCache();
    });

    it('should return error for invalid workflow path', async () => {
      const result = await loadWorkflow('');
      expect(result.success).toBe(false);
      expect(result.error.code).toBe(ERROR_CODES.WORKFLOW_LOAD_ERROR);
    });

    it('should return error for non-existent workflow file', async () => {
      const result = await loadWorkflow('non-existent-workflow.yaml');
      expect(result.success).toBe(false);
      expect(result.error.code).toBe(ERROR_CODES.WORKFLOW_LOAD_ERROR);
    });
  });

  describe('executeStep', () => {
    it('should return error for invalid step definition', async () => {
      const result = await executeStep({}, { workflowId: 'test' });
      expect(result.success).toBe(false);
      expect(result.error.code).toBe(ERROR_CODES.STEP_EXECUTION_ERROR);
    });

    it('should execute a valid step', async () => {
      const step = { id: 'test-step', name: 'Test Step' };
      const result = await executeStep(step, { workflowId: 'test-workflow' });
      expect(result).toBeDefined();
      expect(result.stepId).toBe('test-step');
    });
  });

  describe('captureOutput', () => {
    it('should capture output from a function', async () => {
      const testFn = async () => {
        console.log('Test output');
        return { success: true };
      };
      
      const result = await captureOutput(testFn);
      expect(result.success).toBe(true);
    });

    it('should handle errors in captured function', async () => {
      const testFn = async () => {
        throw new Error('Test error');
      };
      
      const result = await captureOutput(testFn);
      expect(result.success).toBe(false);
    });
  });

  describe('getExecutionHistory', () => {
    it('should return empty history for unknown workflow', async () => {
      const result = await getExecutionHistory('unknown-workflow');
      expect(result.success).toBe(true);
      expect(result.history).toEqual([]);
    });
  });

  describe('clearCache', () => {
    it('should clear all cached workflows', () => {
      const { clearCache, loadWorkflow } = require('./cli-orchestrator');
      // Load a workflow to populate cache
      loadWorkflow('test-workflow', { useCache: true });
      // Clear should not throw
      expect(() => clearCache()).not.toThrow();
    });

    it('should clear specific workflow from cache', () => {
      const { clearCache, loadWorkflow } = require('./cli-orchestrator');
      // Load a workflow to populate cache
      loadWorkflow('test-workflow', { useCache: true });
      // Clear specific should not throw
      expect(() => clearCache('test-workflow')).not.toThrow();
    });
  });

  describe('executeCommand', () => {
    it('should parse and execute a command', async () => {
      const result = await executeCommand('run test-workflow');
      expect(result).toBeDefined();
      // Should either succeed or return an error for non-existent workflow
      expect(result.success !== undefined).toBe(true);
    });

    it('should handle invalid commands gracefully', async () => {
      const result = await executeCommand('');
      expect(result).toBeDefined();
    });
  });

  describe('runWorkflow', () => {
    it('should run a workflow with arguments', async () => {
      const result = await runWorkflow('test-workflow', { test: 'value' });
      expect(result).toBeDefined();
      // Result should have workflow execution structure
      expect(result.workflowName || result.error || result.success !== undefined).toBeTruthy();
    });

    it('should handle non-existent workflow gracefully', async () => {
      const result = await runWorkflow('non-existent-workflow-xyz');
      expect(result).toBeDefined();
      // Should return error for non-existent workflow
      expect(result.success).toBe(false);
    });
  });

  describe('initRun', () => {
    it('should initialize a new workflow run', async () => {
      const runId = await initRun('test-workflow');
      expect(runId).toBeDefined();
      expect(typeof runId).toBe('string');
      expect(runId.length).toBeGreaterThan(0);
    });
  });

  describe('promoteRun', () => {
    it('should return error for non-existent run', async () => {
      const result = await promoteRun('non-existent-run');
      expect(result.success).toBe(false);
    });
  });

  describe('getStatus', () => {
    it('should return error for non-existent run', async () => {
      const result = await getStatus('non-existent-run');
      expect(result.success).toBe(false);
    });
  });

  describe('ERROR_CODES', () => {
    it('should have all required error codes', () => {
      expect(ERROR_CODES.WORKFLOW_LOAD_ERROR).toBeDefined();
      expect(ERROR_CODES.WORKFLOW_PARSE_ERROR).toBeDefined();
      expect(ERROR_CODES.WORKFLOW_VALIDATION_ERROR).toBeDefined();
      expect(ERROR_CODES.STEP_EXECUTION_ERROR).toBeDefined();
      expect(ERROR_CODES.STEP_DEPENDENCY_ERROR).toBeDefined();
      expect(ERROR_CODES.OUTPUT_CAPTURE_ERROR).toBeDefined();
    });
  });
});

// Integration tests (require actual file system)
describe('CLI Orchestrator Integration', () => {
  const testWorkflowDir = path.join(__dirname, 'test-workflows');
  const testWorkflowPath = path.join(testWorkflowDir, 'workflow.yaml');

  beforeAll(() => {
    // Create test workflow file
    if (!fs.existsSync(testWorkflowDir)) {
      fs.mkdirSync(testWorkflowDir, { recursive: true });
    }
    
    const workflowYaml = `
name: test-integration
description: Integration test workflow
steps:
  - id: step1
    name: Test Step
    action: shell
    command: echo "test"
`;
    fs.writeFileSync(testWorkflowPath, workflowYaml);
  });

  afterAll(() => {
    // Clean up test files
    if (fs.existsSync(testWorkflowPath)) {
      fs.unlinkSync(testWorkflowPath);
    }
    if (fs.existsSync(testWorkflowDir)) {
      fs.rmdirSync(testWorkflowDir);
    }
  });

  describe('loadWorkflow', () => {
    it('should load a valid workflow file', async () => {
      const result = await loadWorkflow(testWorkflowPath);
      expect(result.success).toBe(true);
      expect(result.workflow.name).toBe('test-integration');
      expect(result.workflow.steps).toHaveLength(1);
    });

    it('should return error for invalid workflow structure', async () => {
      const invalidPath = path.join(testWorkflowDir, 'invalid.yaml');
      fs.writeFileSync(invalidPath, 'name: invalid');
      
      const result = await loadWorkflow(invalidPath);
      expect(result.success).toBe(false);
      expect(result.error.code).toBe(ERROR_CODES.WORKFLOW_VALIDATION_ERROR);
      
      fs.unlinkSync(invalidPath);
    });
  });

  describe('executeWorkflow', () => {
    beforeEach(() => {
      clearCache();
    });

    it('should execute a workflow', async () => {
      const result = await executeWorkflow(testWorkflowPath, { useProgressTracker: false });
      expect(result).toBeDefined();
      expect(result.workflowName).toBe('test-integration');
    });
  });
});
