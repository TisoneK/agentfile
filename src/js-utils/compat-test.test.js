/**
 * Backward Compatibility Test Module Tests
 * @module compat-test.test
 */

const path = require('path');
const {
  validateWorkflowCompatibility,
  validateAgentCompatibility,
  validateSkillCompatibility,
  runCompatibilityTests,
  getTestFixturesPath,
  ERROR_CODES
} = require('./compat-test');

jest.setTimeout(10000);

// Get the path to test fixtures
const getCompatTestPath = () => path.join(__dirname, '..', '..', 'tests', 'compat');

// ─── validateWorkflowCompatibility ────────────────────────────────────────────

describe('validateWorkflowCompatibility', () => {
  
  // Input validation
  it('rejects non-string workflow path', async () => {
    const r = await validateWorkflowCompatibility(123);
    expect(r.success).toBe(false);
    expect(r.error.code).toBe('WORKFLOW_PARSE_INCOMPATIBLE');
  });

  it('rejects null workflow path', async () => {
    const r = await validateWorkflowCompatibility(null);
    expect(r.success).toBe(false);
    expect(r.error.code).toBe('WORKFLOW_PARSE_INCOMPATIBLE');
  });

  it('rejects missing workflow file', async () => {
    const r = await validateWorkflowCompatibility('/nonexistent/workflow.yaml');
    expect(r.success).toBe(false);
    expect(r.error.code).toBe('WORKFLOW_PARSE_INCOMPATIBLE');
  });

  // Valid workflow tests
  it('validates a valid workflow.yaml', async () => {
    const workflowPath = path.join(getCompatTestPath(), 'workflow.yaml');
    const r = await validateWorkflowCompatibility(workflowPath);
    
    expect(r.success).toBe(true);
    expect(r.result).toBeDefined();
    expect(r.result.fields).toBeDefined();
    expect(r.result.stepTypes).toBeDefined();
    expect(r.result.variables).toBeDefined();
  });

  it('extracts required fields from workflow', async () => {
    const workflowPath = path.join(getCompatTestPath(), 'workflow.yaml');
    const r = await validateWorkflowCompatibility(workflowPath);
    
    expect(r.result.fields.name).toBe('present');
    expect(r.result.fields.description).toBe('present');
    expect(r.result.fields.steps).toBe('present');
  });

  it('extracts optional fields from workflow', async () => {
    const workflowPath = path.join(getCompatTestPath(), 'workflow.yaml');
    const r = await validateWorkflowCompatibility(workflowPath);
    
    expect(r.result.fields.version).toBeDefined();
    expect(r.result.fields.specVersion).toBeDefined();
    expect(r.result.fields.execution).toBeDefined();
    expect(r.result.fields.trigger).toBeDefined();
  });

  it('identifies all step types', async () => {
    const workflowPath = path.join(getCompatTestPath(), 'workflow.yaml');
    const r = await validateWorkflowCompatibility(workflowPath);
    
    expect(r.result.stepTypes.length).toBeGreaterThan(0);
    
    // Find specific step types
    const actionStep = r.result.stepTypes.find(s => s.id === 'step1');
    expect(actionStep).toBeDefined();
    expect(actionStep.types).toContain('action');
    
    const agentStep = r.result.stepTypes.find(s => s.id === 'step2');
    expect(agentStep).toBeDefined();
    expect(agentStep.types).toContain('agent');
    expect(agentStep.types).toContain('skill');
  });

  it('extracts variables from workflow', async () => {
    const workflowPath = path.join(getCompatTestPath(), 'workflow.yaml');
    const r = await validateWorkflowCompatibility(workflowPath);
    
    expect(r.result.variables).toContain('project_name');
    expect(r.result.variables).toContain('output_lang');
  });

  it('detects step optional attribute', async () => {
    const workflowPath = path.join(getCompatTestPath(), 'workflow.yaml');
    const r = await validateWorkflowCompatibility(workflowPath);
    
    const optionalStep = r.result.stepTypes.find(s => s.id === 'step2');
    expect(optionalStep).toBeDefined();
    expect(optionalStep.optional).toBe(false);
  });
});

// ─── validateAgentCompatibility ────────────────────────────────────────────────

describe('validateAgentCompatibility', () => {
  
  // Input validation
  it('rejects non-string agent path', async () => {
    const r = await validateAgentCompatibility(123);
    expect(r.success).toBe(false);
    expect(r.error.code).toBe('AGENT_LOAD_INCOMPATIBLE');
  });

  it('rejects missing agent directory', async () => {
    const r = await validateAgentCompatibility('/nonexistent/agents');
    expect(r.success).toBe(false);
    expect(r.error.code).toBe('AGENT_LOAD_INCOMPATIBLE');
  });

  // Valid agent tests
  it('loads agents from directory', async () => {
    const agentPath = path.join(getCompatTestPath(), 'agents');
    const r = await validateAgentCompatibility(agentPath);
    
    expect(r.success).toBe(true);
    expect(r.result.agents).toBeDefined();
    expect(r.agentCount).toBeGreaterThan(0);
  });

  it('parses agent frontmatter', async () => {
    const agentPath = path.join(getCompatTestPath(), 'agents');
    const r = await validateAgentCompatibility(agentPath);
    
    const testAgent = r.result.agents.find(a => a.file === 'test-agent.md');
    expect(testAgent).toBeDefined();
    expect(testAgent.hasMetadata).toBe(true);
    expect(testAgent.metadata.name).toBe('Test Agent');
    expect(testAgent.metadata.description).toBeDefined();
  });

  it('extracts agent commands', async () => {
    const agentPath = path.join(getCompatTestPath(), 'agents');
    const r = await validateAgentCompatibility(agentPath);
    
    const testAgent = r.result.agents.find(a => a.file === 'test-agent.md');
    expect(testAgent).toBeDefined();
    expect(Array.isArray(testAgent.commands)).toBe(true);
  });
});

// ─── validateSkillCompatibility ───────────────────────────────────────────────

describe('validateSkillCompatibility', () => {
  
  // Input validation
  it('rejects non-string skill path', async () => {
    const r = await validateSkillCompatibility(123);
    expect(r.success).toBe(false);
    expect(r.error.code).toBe('SKILL_LOAD_INCOMPATIBLE');
  });

  it('rejects missing skill directory', async () => {
    const r = await validateSkillCompatibility('/nonexistent/skills');
    expect(r.success).toBe(false);
    expect(r.error.code).toBe('SKILL_LOAD_INCOMPATIBLE');
  });

  // Valid skill tests
  it('loads skills from directory', async () => {
    const skillPath = path.join(getCompatTestPath(), 'skills');
    const r = await validateSkillCompatibility(skillPath);
    
    expect(r.success).toBe(true);
    expect(r.result.skills).toBeDefined();
    expect(r.skillCount).toBeGreaterThan(0);
  });

  it('parses skill frontmatter', async () => {
    const skillPath = path.join(getCompatTestPath(), 'skills');
    const r = await validateSkillCompatibility(skillPath);
    
    const testSkill = r.result.skills.find(s => s.file === 'test-skill.md');
    expect(testSkill).toBeDefined();
    expect(testSkill.hasMetadata).toBe(true);
    expect(testSkill.metadata.name).toBe('Test Skill');
    expect(testSkill.metadata.description).toBeDefined();
  });

  it('extracts skill templates', async () => {
    const skillPath = path.join(getCompatTestPath(), 'skills');
    const r = await validateSkillCompatibility(skillPath);
    
    const testSkill = r.result.skills.find(s => s.file === 'test-skill.md');
    expect(testSkill).toBeDefined();
    expect(Array.isArray(testSkill.templates)).toBe(true);
  });

  it('extracts skill functions', async () => {
    const skillPath = path.join(getCompatTestPath(), 'skills');
    const r = await validateSkillCompatibility(skillPath);
    
    const testSkill = r.result.skills.find(s => s.file === 'test-skill.md');
    expect(testSkill).toBeDefined();
    expect(Array.isArray(testSkill.functions)).toBe(true);
  });
});

// ─── runCompatibilityTests ────────────────────────────────────────────────────

describe('runCompatibilityTests', () => {
  
  // Input validation
  it('rejects non-string project path', async () => {
    const r = await runCompatibilityTests(123);
    expect(r.success).toBe(false);
    expect(r.error.code).toBe('INTEGRATION_TEST_FAILED');
  });

  it('rejects missing project directory', async () => {
    const r = await runCompatibilityTests('/nonexistent/project');
    expect(r.success).toBe(false);
    expect(r.error.code).toBe('INTEGRATION_TEST_FAILED');
  });

  // Integration tests
  it('runs full compatibility test suite', async () => {
    const projectPath = getCompatTestPath();
    const r = await runCompatibilityTests(projectPath);
    
    expect(r).toBeDefined();
    expect(r.workflow).toBeDefined();
    expect(r.agents).toBeDefined();
    expect(r.skills).toBeDefined();
    expect(r.integration).toBeDefined();
  });

  it('validates workflow in integration test', async () => {
    const projectPath = getCompatTestPath();
    const r = await runCompatibilityTests(projectPath);
    
    expect(r.workflow.success).toBe(true);
  });

  it('validates agents in integration test', async () => {
    const projectPath = getCompatTestPath();
    const r = await runCompatibilityTests(projectPath);
    
    expect(r.agents.success).toBe(true);
    expect(r.agents.agentCount).toBeGreaterThan(0);
  });

  it('validates skills in integration test', async () => {
    const projectPath = getCompatTestPath();
    const r = await runCompatibilityTests(projectPath);
    
    expect(r.skills.success).toBe(true);
    expect(r.skills.skillCount).toBeGreaterThan(0);
  });
});

// ─── getTestFixturesPath ─────────────────────────────────────────────────────

describe('getTestFixturesPath', () => {
  it('returns a valid path', () => {
    const pathResult = getTestFixturesPath();
    expect(pathResult).toBeDefined();
    expect(typeof pathResult).toBe('string');
    expect(pathResult.length).toBeGreaterThan(0);
  });
});
