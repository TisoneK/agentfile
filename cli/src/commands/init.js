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
- Step outputs: \`outputs/<step-id>-<artifact>.<ext>\`

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
