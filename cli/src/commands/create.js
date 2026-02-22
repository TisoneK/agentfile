'use strict';

const fs        = require('fs');
const path      = require('path');
const readline  = require('readline');
const chalk     = require('chalk');
const { log, findProjectRoot, writeFile } = require('../lib/utils');

module.exports = async function create(workflowName, opts) {
  // Validate name
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

  if (fs.existsSync(workflowDir)) {
    log.error(`Workflow "${workflowName}" already exists at ${workflowDir}`);
    process.exit(1);
  }

  log.step(`Creating workflow: ${chalk.bold(workflowName)}`);

  // ── Get the request ─────────────────────────────────────────────────────────
  let request = opts.request;
  if (!request) {
    request = await prompt(
      chalk.cyan('  Describe what this workflow should do:\n  > ')
    );
  }

  if (!request || !request.trim()) {
    log.error('A description is required to create a workflow.');
    process.exit(1);
  }

  // ── Check if workflow-creator exists and offer to use it ───────────────────
  const creatorDir = path.join(projectRoot, 'workflows', 'workflow-creator');
  const hasCreator = fs.existsSync(path.join(creatorDir, 'workflow.yaml'));

  if (hasCreator) {
    log.info('workflow-creator found — launching AI-powered workflow generation...');
    log.dim('This will call your LLM API and walk you through the creation process.');
    console.log('');

    const apiKey = process.env.AGENT_API_KEY;
    if (!apiKey) {
      log.warn('AGENT_API_KEY is not set. Falling back to scaffold mode.');
      scaffold(workflowDir, workflowName, request);
    } else {
      // Launch the workflow-creator runtime
      const { execSync } = require('child_process');
      try {
        const runScript = path.join(creatorDir, 'scripts', 'run.sh');
        execSync(`bash "${runScript}"`, {
          env: {
            ...process.env,
            WORKFLOW_REQUEST: `${request}\n\nWorkflow name: ${workflowName}`,
          },
          stdio: 'inherit',
        });
      } catch (err) {
        log.error('Workflow creator failed. Falling back to scaffold mode.');
        scaffold(workflowDir, workflowName, request);
      }
    }
  } else {
    log.info('workflow-creator not found — scaffolding blank workflow structure...');
    scaffold(workflowDir, workflowName, request);
  }
};

// ── Scaffold a blank workflow ──────────────────────────────────────────────────
function scaffold(workflowDir, name, request) {
  const dirs = ['agents', 'skills', 'scripts', 'outputs'];
  for (const d of dirs) {
    fs.mkdirSync(path.join(workflowDir, d), { recursive: true });
  }

  // workflow.yaml
  writeFile(path.join(workflowDir, 'workflow.yaml'), `name: ${name}
version: 1.0.0
description: >
  ${request.trim()}

trigger:
  type: natural-language
  input_var: AGENT_INPUT

steps:
  - id: step-one
    name: First Step
    agent: agents/agent.md
    skill: skills/skill.md
    input: \$AGENT_INPUT
    goal: >
      Describe what this step should achieve.
    produces: outputs/01-result.md
    gate: human-approval
`);

  // Blank agent
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

  // Blank skill
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

  // run.sh
  const runSh = `#!/usr/bin/env bash
set -euo pipefail

WORKFLOW_DIR="\$(cd "\$(dirname "\${BASH_SOURCE[0]}")" && pwd)"
SHARED_DIR="\$WORKFLOW_DIR/../../../shared"
OUTPUTS_DIR="\$WORKFLOW_DIR/../outputs"
API_KEY="\${AGENT_API_KEY:?AGENT_API_KEY is not set}"
MODEL="\${AGENT_MODEL:-claude-sonnet-4-6}"
mkdir -p "\$OUTPUTS_DIR"

call_api() {
  local system="\$1" user="\$2" max_tokens="\${3:-4096}" temperature="\${4:-0.3}"
  curl -s https://api.anthropic.com/v1/messages \\
    -H "x-api-key: \$API_KEY" \\
    -H "anthropic-version: 2023-06-01" \\
    -H "content-type: application/json" \\
    -d "\$(jq -n \\
      --arg model "\$MODEL" --arg system "\$system" --arg user "\$user" \\
      --argjson max_tokens "\$max_tokens" --argjson temperature "\$temperature" \\
      '{model:\$model,max_tokens:\$max_tokens,temperature:\$temperature,system:\$system,messages:[{role:"user",content:\$user}]}')" \\
  | jq -r '.content[0].text'
}

load() { cat "\$1"; }

gate() {
  local name="\$1" file="\$2"
  echo ""; echo "══ GATE: \$name ══"; cat "\$file"; echo ""
  read -rp "Approve? [y/N] " c
  [[ "\$c" == "y" || "\$c" == "Y" ]] || { echo "Aborted."; exit 1; }
}

log() { echo "[\$(date '+%H:%M:%S')] \$*"; }

# Step 1
log "▶ Step 1: First Step"
SYSTEM="\$(load "\$SHARED_DIR/project.md")"\$'\\n\\n'"\$(load "\$SHARED_DIR/AGENTS.md")"\$'\\n\\n'"\$(load "\$WORKFLOW_DIR/../agents/agent.md")"
USER="\$(load "\$WORKFLOW_DIR/../skills/skill.md")"\$'\\n\\n---\\n\\n'"\$AGENT_INPUT"
call_api "\$SYSTEM" "\$USER" > "\$OUTPUTS_DIR/01-result.md"
gate "First Step" "\$OUTPUTS_DIR/01-result.md"

log "✅ Done."
`;

  writeFile(path.join(workflowDir, 'scripts/run.sh'), runSh);
  fs.chmodSync(path.join(workflowDir, 'scripts/run.sh'), '755');

  // run.ps1
  writeFile(path.join(workflowDir, 'scripts/run.ps1'), `#!/usr/bin/env pwsh
$ErrorActionPreference = "Stop"

$WorkflowDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$SharedDir   = Join-Path $WorkflowDir "../../../shared"
$OutputsDir  = Join-Path $WorkflowDir "../outputs"
$ApiKey      = if ($env:AGENT_API_KEY) { $env:AGENT_API_KEY } else { throw "AGENT_API_KEY is not set" }
$Model       = if ($env:AGENT_MODEL) { $env:AGENT_MODEL } else { "claude-sonnet-4-6" }
New-Item -ItemType Directory -Force -Path $OutputsDir | Out-Null

function Invoke-Api {
  param([string]$System, [string]$User, [int]$MaxTokens=4096, [float]$Temperature=0.3)
  $body = @{model=$Model;max_tokens=$MaxTokens;temperature=$Temperature;system=$System;messages=@(@{role="user";content=$User})} | ConvertTo-Json -Depth 10 -Compress
  (Invoke-RestMethod -Uri "https://api.anthropic.com/v1/messages" -Method POST \`
    -Headers @{"x-api-key"=$ApiKey;"anthropic-version"="2023-06-01";"content-type"="application/json"} \`
    -Body ([System.Text.Encoding]::UTF8.GetBytes($body))).content[0].text
}

function Read-F { param([string]$P) Get-Content $P -Raw -Encoding UTF8 }

function Invoke-Gate {
  param([string]$Name, [string]$File)
  Write-Host ""; Write-Host "══ GATE: $Name ══"
  Get-Content $File -Raw | Write-Host; Write-Host ""
  $c = Read-Host "Approve? [y/N]"
  if ($c -ne "y") { Write-Host "Aborted."; exit 1 }
}

function Write-Log { param([string]$M) Write-Host "[$(Get-Date -Format 'HH:mm:ss')] $M" }

# Step 1
Write-Log "▶ Step 1: First Step"
$system = (Read-F "$SharedDir/project.md") + "\`n\`n" + (Read-F "$SharedDir/AGENTS.md") + "\`n\`n" + (Read-F "$WorkflowDir/../agents/agent.md")
$user   = (Read-F "$WorkflowDir/../skills/skill.md") + "\`n\`n---\`n\`n" + $env:AGENT_INPUT
Invoke-Api $system $user | Set-Content "$OutputsDir/01-result.md" -Encoding UTF8
Invoke-Gate "First Step" "$OutputsDir/01-result.md"

Write-Log "✅ Done."
`);

  // .gitignore for outputs
  writeFile(path.join(workflowDir, '.gitignore'), 'outputs/\n');

  log.success(`Scaffolded workflow: workflows/${name}/`);
  console.log('');
  console.log(chalk.bold.green('  Workflow created!'));
  console.log('');
  console.log('  Edit these files to define your workflow:');
  console.log(chalk.gray(`    workflows/${name}/workflow.yaml`));
  console.log(chalk.gray(`    workflows/${name}/agents/agent.md`));
  console.log(chalk.gray(`    workflows/${name}/skills/skill.md`));
  console.log('');
  console.log('  Then run it:');
  console.log(chalk.cyan(`    agentfile run ${name} --input "your input"`));
  console.log('');
}

// ── Prompt helper ─────────────────────────────────────────────────────────────
function prompt(question) {
  return new Promise((resolve) => {
    const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
    rl.question(question, (answer) => { rl.close(); resolve(answer); });
  });
}
