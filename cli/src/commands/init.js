'use strict';

const fs   = require('fs');
const path = require('path');
const chalk = require('chalk');
const { log, writeFile } = require('../lib/utils');

module.exports = async function init(opts) {
  const cwd  = process.cwd();
  const name = opts.name;

  log.step('Initializing Agentfile project');
  log.dim(`Directory: ${cwd}`);

  // Guard: don't re-init
  if (fs.existsSync(path.join(cwd, 'workflows'))) {
    log.warn('A workflows/ directory already exists. Skipping init.');
    return;
  }

  // ── Scaffold structure ──────────────────────────────────────────────────────
  const dirs = [
    'workflows',
    'shared',
    'examples',
    'docs',
  ];

  for (const dir of dirs) {
    fs.mkdirSync(path.join(cwd, dir), { recursive: true });
    log.success(`Created ${dir}/`);
  }

  // ── shared/project.md ──────────────────────────────────────────────────────
  writeFile(path.join(cwd, 'shared/project.md'), `# Project Convention

## Purpose
This file is injected into every agent call as part of the system prompt.
It defines the project's conventions, stack, and global rules.
It is agent-agnostic — does not reference any specific LLM provider or IDE.

## Stack
- **Workflow format**: Agentfile (YAML + Markdown)
- **Runtime scripts**: Bash + PowerShell
- **No external frameworks or SDKs required**

## Conventions
- Workflow configs: \`workflow.yaml\`
- Agents: \`agents/<role>.md\`
- Skills: \`skills/<skill-name>.md\`
- Generation artifacts: \`artifacts/<workflow-name>/<run-id>/<step-id>-<artifact>.<ext>\`
- Runtime step outputs: \`outputs/<step-id>-<artifact>.<ext>\`

## Agent Behavior
- Be concise and structured in outputs
- If something is unclear, say so explicitly — never guess
- Never invent file paths — use only paths defined in workflow.yaml
`);
  log.success('Created shared/project.md');

  // ── shared/AGENTS.md ───────────────────────────────────────────────────────
  writeFile(path.join(cwd, 'shared/AGENTS.md'), `# Global Agent Rules

These rules apply to every agent in every workflow.

1. **Stay in role.** You are the agent defined in your agent file.
2. **Output only what is asked.** If a step asks for YAML, output only valid YAML.
3. **Be explicit about uncertainty.** Say exactly what is missing — never fabricate.
4. **Produce complete outputs.** Never truncate. Never use placeholders like \`# TODO\`.
5. **Reference only real files.** Never reference a file that doesn't exist.

## Output Format Rules
- YAML must be valid and parseable
- Markdown must use consistent heading hierarchy
- Shell scripts must include a shebang line
- All scripts must be idempotent where possible
`);
  log.success('Created shared/AGENTS.md');

  // ── .gitignore ─────────────────────────────────────────────────────────────
  writeFile(path.join(cwd, '.gitignore'), `# Agentfile runtime artifacts
outputs/

# Agentfile artifact staging — run directories are transient
artifacts/**/
!artifacts/.gitkeep

# Environment files
.env
.env.local
.env.*.local

# Logs
*.log
npm-debug.log*
yarn-debug.log*
yarn-error.log*

# OS generated files
.DS_Store
.DS_Store?
._*
.Spotlight-V100
.Trashes
ehthumbs.db
Thumbs.db

# IDE files
.vscode/
.idea/
*.swp
*.swo
*~

# Node.js
node_modules/
.npm
.eslintcache

# Temporary files
*.tmp
*.temp
`);
  log.success('Created .gitignore');

  // ── agentfile.yaml (project manifest) ─────────────────────────────────────
  writeFile(path.join(cwd, 'agentfile.yaml'), `# Agentfile Project Manifest
name: ${name}
version: 1.0.0
spec: "1.0.0"

workflows_dir: workflows/
examples_dir: examples/
shared_dir: shared/
`);
  log.success('Created agentfile.yaml');

  // ── Root AGENTS.md — read by IDE agents at project open ───────────────────
  writeFile(path.join(cwd, 'AGENTS.md'), `# Agentfile Project — IDE Agent Instructions

This is an **Agentfile project**. When working in this repo, you must follow the slash command protocol below for all workflow operations. Do not improvise — the protocol is exact.

---

## Slash Command Protocol

### \`/agentfile:run <workflow-name> <args>\`
Run an existing workflow in IDE mode.

1. Read \`workflows/<workflow-name>/workflow.yaml\`
2. Read \`workflows/<workflow-name>/scripts/ide/instructions.md\` if it exists
3. Load each step's agent file as your persona, load the skill file as context
4. Execute steps sequentially using your LLM — **do not run any scripts in \`scripts/cli/\`**
5. The only scripts you may execute are in \`scripts/ide/\` (e.g. \`register.sh\`) — these are API-key-free file operations

### \`/agentfile:create <workflow-name> <description>\`
Create a new workflow using the \`workflow-creator\` pipeline.

**This is NOT a free-form task. Follow these exact steps:**

1. Set \`WORKFLOW_NAME\` = the name argument
2. Set \`WORKFLOW_REQUEST\` = \`"Create a workflow named <n>. <description>"\`
3. Read \`workflows/workflow-creator/scripts/ide/instructions.md\` — follow it exactly
4. Generate \`RUN_ID\` = current UTC timestamp \`YYYY-MM-DDTHH-MM-SS\` (e.g. \`2026-02-23T10-41-22\`).
5. Set \`ARTIFACT_DIR\` = \`artifacts/{workflow_name}/{run_id}/\`
6. Execute the full workflow-creator pipeline:
   - **Step 0 (Init):** Create \`ARTIFACT_DIR\`. Write initial \`manifest.json\` using \`skills/generate-manifest.md\`. Status: \`generating\`, all steps \`pending\`.
   - **Step 1 (Clarify):** Load \`agents/analyst.md\` + \`skills/ask-clarifying.md\`. Produce \`{ARTIFACT_DIR}/01-clarification.md\`. Update manifest. Wait for human approval.
   - **Step 2 (Design):** Load \`agents/architect.md\` + \`skills/design-workflow.md\`. Input: \`{ARTIFACT_DIR}/01-clarification.md\`. Produce \`{ARTIFACT_DIR}/02-design.md\`. Update manifest. Wait for human approval.
   - **Step 3 (Generate YAML):** Load generator + \`skills/generate-yaml.md\`. Produce \`{ARTIFACT_DIR}/03-workflow.yaml\`. Register in manifest.
   - **Step 4 (Generate Agents):** Load generator + \`skills/generate-agent.md\`. Produce \`{ARTIFACT_DIR}/04-agents/\`. Register in manifest.
   - **Step 5 (Generate Skills):** Load generator + \`skills/generate-skill.md\`. Produce \`{ARTIFACT_DIR}/05-skills/\`. Register in manifest.
   - **Step 6 (Generate Scripts):** Load generator + \`skills/generate-dual-scripts.md\`. Produce \`{ARTIFACT_DIR}/06-scripts/\`. Register in manifest.
   - **Step 7 (Review):** Load \`agents/reviewer.md\` + \`skills/review-workflow.md\`. Produce \`{ARTIFACT_DIR}/07-review.md\`. Set manifest \`status: validated\`. Wait for human approval.
   - **Step 8 (Promote):** Run \`bash workflows/workflow-creator/scripts/ide/register.sh {ARTIFACT_DIR}\` (Unix) or \`pwsh ... {ARTIFACT_DIR}\` (Windows). Promotes to \`workflows/{name}/\`, archives to \`outputs/{name}/{run_id}/build/\`. No API key needed.

**Never** create a \`.md\` file directly in \`workflows/\`. **Never** skip steps. **Never** run \`scripts/cli/\` scripts.

### \`/agentfile:list\`
Scan \`workflows/*/workflow.yaml\`. For each, read \`name\` and \`description\`. Return a formatted list. No LLM call needed.

---

## Hard Rules

- **Never create files directly in \`workflows/\`** — new workflows are always created via the \`workflow-creator\` pipeline
- **Never run \`scripts/cli/\` scripts in IDE mode** — they require \`ANTHROPIC_API_KEY\` and will fail
- **Always read \`scripts/ide/instructions.md\`** before executing any workflow
- **Always wait at \`gate: human-approval\` steps** — do not proceed without confirmation
- **Generation artifacts go in \`artifacts/<workflow-name>/<run-id>/\`** — never directly in \`workflows/\` or \`outputs/\`
`);
  log.success('Created AGENTS.md');

  // ── IDE rules files — pointer to AGENTS.md for each IDE ───────────────────
  const ideRulesContent = `This is an Agentfile project. Read AGENTS.md at the project root before doing anything.\nAll workflow operations use the /agentfile: slash command protocol defined there.\n`;
  writeFile(path.join(cwd, '.cursorrules'),   ideRulesContent);
  writeFile(path.join(cwd, '.windsurfrules'), ideRulesContent);
  writeFile(path.join(cwd, '.clinerules'),    ideRulesContent);
  writeFile(path.join(cwd, 'CLAUDE.md'),      ideRulesContent);
  log.success('Created IDE rules files (.cursorrules, .windsurfrules, .clinerules, CLAUDE.md)');

  // ── README ─────────────────────────────────────────────────────────────────
  writeFile(path.join(cwd, 'README.md'), `# ${name}

An [Agentfile](https://github.com/TisoneK/agentfile) project.

## Workflows

| Name | Description |
|------|-------------|
| *(none yet — run \`agentfile create <name>\` to add one)* | |

## Usage

\`\`\`bash
# Create a new workflow
agentfile create my-workflow

# Run a workflow
agentfile run my-workflow --input "your input here"

# List all workflows
agentfile list

# Validate a workflow
agentfile validate my-workflow
\`\`\`
`);
  log.success('Created README.md');

  // ── Done ───────────────────────────────────────────────────────────────────
  console.log('');
  console.log(chalk.bold.green('  Project initialized successfully!'));
  console.log('');
  console.log('  Next steps:');
  console.log(chalk.cyan('    agentfile create my-first-workflow'));
  console.log(chalk.cyan('    agentfile list'));
  console.log('');
};
