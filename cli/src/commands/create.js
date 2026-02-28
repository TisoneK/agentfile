'use strict';

const path     = require('path');
const readline = require('readline');
const chalk    = require('chalk');
const fileOps = require('../../../src/js-utils/file-ops');
const { log, findProjectRoot, writeFile } = require('../lib/utils');

// ── create ─────────────────────────────────────────────────────────────────────
// Scaffolds a blank workflow structure.
// AI-powered generation is handled by the IDE agent using /agentfile:create,
// which calls `agentfile init-run` then `agentfile promote` when done.
// No shell exec, no API key required.
// ──────────────────────────────────────────────────────────────────────────────

module.exports = async function create(workflowName, opts) {
  if (!/^[a-z][a-z0-9-]*$/.test(workflowName)) {
    log.error('Workflow name must be lowercase and hyphenated (e.g. my-workflow)');
    process.exit(1);
  }

  const projectRoot = findProjectRoot();
  if (!projectRoot) {
    log.error('No Agentfile project found. Run `agentfile init` first.');
    process.exit(1);
  }

  const workflowDir = path.join(projectRoot, 'workflows', workflowName);
  if (fileOps.existsSync(workflowDir)) {
    log.error(`Workflow "${workflowName}" already exists at ${workflowDir}`);
    process.exit(1);
  }

  log.step(`Scaffolding workflow: ${chalk.bold(workflowName)}`);

  let request = opts.request;
  if (!request) {
    request = await prompt(chalk.cyan('  Describe what this workflow should do:\n  > '));
  }
  if (!request || !request.trim()) {
    log.error('A description is required.');
    process.exit(1);
  }

  scaffold(workflowDir, workflowName, request.trim());
};

// ── scaffold ──────────────────────────────────────────────────────────────────
function scaffold(workflowDir, name, description) {
  const dirs = ['agents', 'skills', 'scripts/utils', 'scripts/cli', 'scripts/ide', 'outputs'];
  for (const d of dirs) {
    const dirResult = fileOps.ensureDir(path.join(workflowDir, d));
    if (!dirResult.success) {
      throw new Error(`Failed to create directory: ${dirResult.error.message}`);
    }
  }

  writeFile(path.join(workflowDir, 'workflow.yaml'), `name: ${name}
version: 1.0.0
specVersion: "1.0"
description: >
  ${description}

execution:
  preferred: "ide"

trigger:
  type: natural-language
  input_var: AGENT_INPUT

output:
  directory: outputs/

steps:
  - id: step-one
    name: First Step
    agent: agents/agent.md
    skill: skills/skill.md
    input: $AGENT_INPUT
    goal: >
      Describe what this step should achieve.
    produces: outputs/01-result.md
    gate: human-approval
`);

  writeFile(path.join(workflowDir, 'agents/agent.md'), `# Agent: Agent

## Persona
You are a helpful agent. Describe your role and mindset here.

## Responsibilities
- Describe what this agent does

## Rules
- Be specific and structured in your outputs
- Never truncate or use placeholders

## Output Format
\`\`\`markdown
# Result

## Section
<content>
\`\`\`
`);

  writeFile(path.join(workflowDir, 'skills/skill.md'), `# Skill: Skill

## Purpose
One sentence describing what capability this skill gives an agent.

## Instructions

1. Step one
2. Step two
3. Step three

## Examples

| Good | Bad |
|------|-----|
| Specific example | Vague example |
`);

  writeFile(path.join(workflowDir, 'scripts/ide/instructions.md'), `# IDE Instructions: ${name}

## Setup
Load these files into your IDE agent's context before starting:
1. \`workflow.yaml\` — workflow definition
2. \`agents/agent.md\` — agent persona and rules
3. \`skills/skill.md\` — skill instructions

## Execution
Follow the steps in \`scripts/ide/steps.md\`.

## Output
Write all outputs to \`outputs/<run-id>/\` where run-id = UTC timestamp YYYY-MM-DDTHH-MM-SS.
Update \`outputs/<run-id>/execution-state.json\` after each step.

## Gate steps
When a step has \`gate: human-approval\`, stop and run:
\`\`\`
agentfile ${name} approve <step-id>
\`\`\`
`);

  writeFile(path.join(workflowDir, 'scripts/ide/steps.md'), `# IDE Steps: ${name}

> All outputs go to \`outputs/<run-id>/\` where run-id = UTC timestamp YYYY-MM-DDTHH-MM-SS

### Step 0: Initialise Run
1. Generate \`RUN_ID\` = UTC timestamp \`YYYY-MM-DDTHH-MM-SS\`
2. Create \`outputs/<RUN_ID>/\`
3. Write \`outputs/<RUN_ID>/execution-state.json\` — status \`running\`, step \`step-one\` as \`pending\`

### Step 1: First Step
1. Load \`agents/agent.md\` as your persona
2. Load \`skills/skill.md\` as instructions
3. Process the input
4. Write result to \`outputs/<RUN_ID>/01-result.md\`
5. Update execution-state: \`step-one\` → \`awaiting_approval\`, artifact \`01-result.md\`
6. **Gate:** run \`agentfile ${name} approve step-one\` to continue
`);

  writeFile(path.join(workflowDir, 'scripts/README.md'), `# Scripts: ${name}

| Mode | How to run |
|------|------------|
| IDE  | Load \`scripts/ide/instructions.md\` into your IDE agent |

## Manage runs
\`\`\`
agentfile status ${name}
agentfile approve ${name} step-one
agentfile resume ${name}
agentfile retry ${name} step-one
\`\`\`
`);

  writeFile(path.join(workflowDir, '.gitignore'), 'outputs/\n');

  console.log('');
  log.success(`Scaffolded: workflows/${name}/`);
  console.log('');
  console.log(chalk.bold.green('  Workflow scaffolded!'));
  console.log('');
  console.log('  Edit these files to define your workflow:');
  console.log(chalk.gray(`    workflows/${name}/workflow.yaml`));
  console.log(chalk.gray(`    workflows/${name}/agents/agent.md`));
  console.log(chalk.gray(`    workflows/${name}/skills/skill.md`));
  console.log('');
  console.log('  Or let your IDE agent generate it fully:');
  console.log(chalk.cyan(`    /agentfile:create ${name} "${description}"`));
  console.log('');
  console.log('  Manage runs:');
  console.log(chalk.cyan(`    agentfile status ${name}`));
  console.log(chalk.cyan(`    agentfile approve ${name} <step-id>`));
  console.log('');
}

function prompt(question) {
  return new Promise(resolve => {
    const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
    rl.question(question, answer => { rl.close(); resolve(answer); });
  });
}
