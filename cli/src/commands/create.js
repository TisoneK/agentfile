'use strict';

const fs       = require('fs');
const path     = require('path');
const readline = require('readline');
const chalk    = require('chalk');
const { execSync } = require('child_process');
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
    log.info(`To resume an interrupted creation run: ${chalk.cyan(`agentfile continue ${workflowName}`)}`);
    process.exit(1);
  }

  log.step(`Creating workflow: ${chalk.bold(workflowName)}`);

  // ── Get the request ──────────────────────────────────────────────────────────
  let request = opts.request;
  if (!request) {
    request = await prompt(chalk.cyan('  Describe what this workflow should do:\n  > '));
  }

  if (!request || !request.trim()) {
    log.error('A description is required to create a workflow.');
    process.exit(1);
  }

  // ── Check if workflow-creator exists ────────────────────────────────────────
  const creatorDir = path.join(projectRoot, 'workflows', 'workflow-creator');
  const hasCreator = fs.existsSync(path.join(creatorDir, 'workflow.yaml'));

  if (hasCreator) {
    const apiKey = opts.key || process.env.AGENT_API_KEY || process.env.ANTHROPIC_API_KEY;

    if (!apiKey) {
      log.warn('No API key found. Falling back to scaffold mode.');
      log.dim('Set ANTHROPIC_API_KEY or use --key to enable AI-powered generation.');
      console.log('');
      scaffold(workflowDir, workflowName, request);
      return;
    }

    log.info('workflow-creator found — launching AI-powered workflow generation...');
    log.dim('This will call your LLM API and walk you through the creation process.');
    console.log('');

    const os = require('os');
    const isWindows = os.platform() === 'win32';
    const shell = opts.shell || (isWindows ? 'pwsh' : 'bash');

    const runScript = shell === 'pwsh'
      ? path.join(creatorDir, 'scripts', 'cli', 'run.ps1')
      : path.join(creatorDir, 'scripts', 'cli', 'run.sh');

    if (!fs.existsSync(runScript)) {
      log.warn(`workflow-creator run script not found at ${runScript}`);
      log.warn('Falling back to scaffold mode.');
      scaffold(workflowDir, workflowName, request);
      return;
    }

    const cmd = shell === 'pwsh'
      ? `pwsh -ExecutionPolicy Bypass "${runScript}"`
      : `bash "${runScript}"`;

    try {
      execSync(cmd, {
        env: {
          ...process.env,
          ANTHROPIC_API_KEY: apiKey,
          WORKFLOW_REQUEST: `${request.trim()}\n\nWorkflow name: ${workflowName}`,
        },
        stdio: 'inherit',
        cwd: projectRoot,
      });
    } catch (err) {
      log.error('Workflow creator exited with an error.');
      log.info(`Resume the interrupted run: ${chalk.cyan(`agentfile continue ${workflowName}`)}`);
      process.exit(err.status || 1);
    }

  } else {
    log.info('workflow-creator not found — scaffolding blank workflow structure...');
    log.dim('Run `agentfile init` to install the workflow-creator for AI-powered generation.');
    console.log('');
    scaffold(workflowDir, workflowName, request);
  }
};

// ── Scaffold a blank workflow ──────────────────────────────────────────────────
// Produces the correct directory structure:
//   scripts/utils/    — utility scripts (no LLM)
//   scripts/cli/      — CLI orchestration scripts
//   scripts/ide/      — IDE agent instructions
function scaffold(workflowDir, name, request) {
  const dirs = [
    'agents',
    'skills',
    'scripts/utils',
    'scripts/cli',
    'scripts/ide',
    'outputs',
  ];
  for (const d of dirs) {
    fs.mkdirSync(path.join(workflowDir, d), { recursive: true });
  }

  // workflow.yaml
  writeFile(path.join(workflowDir, 'workflow.yaml'), `name: ${name}
version: 1.0.0
specVersion: "1.0"
description: >
  ${request.trim()}

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

  // scripts/cli/run.sh — includes execution-state
  writeFile(path.join(workflowDir, 'scripts/cli/run.sh'), `#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "\${BASH_SOURCE[0]}")" && pwd)"
WORKFLOW_DIR="$(cd "$SCRIPT_DIR/../.." && pwd)"
PROJECT_ROOT="$(cd "$WORKFLOW_DIR/../.." && pwd)"
SHARED_DIR="$PROJECT_ROOT/shared"
WORKFLOW_NAME="${name}"

: "\${ANTHROPIC_API_KEY:?ANTHROPIC_API_KEY is not set}"
API_KEY="$ANTHROPIC_API_KEY"
MODEL="\${AGENT_MODEL:-claude-sonnet-4-6}"

# ── Execution State ────────────────────────────────────────────────────────────
STATE_DIR="" STATE_FILE="" RUN_ID=""

init_state() {
  local input="$1"
  RUN_ID="$(date -u '+%Y-%m-%dT%H-%M-%S')"
  STATE_DIR="$WORKFLOW_DIR/outputs/$RUN_ID"
  STATE_FILE="$STATE_DIR/execution-state.json"
  mkdir -p "$STATE_DIR"
  cat > "$STATE_FILE" << JSON
{
  "workflow": "$WORKFLOW_NAME",
  "run_id": "$RUN_ID",
  "started_at": "$(date -u '+%Y-%m-%dT%H:%M:%SZ')",
  "updated_at": "$(date -u '+%Y-%m-%dT%H:%M:%SZ')",
  "status": "running",
  "input": $(echo "$input" | jq -Rs .),
  "current_step": null,
  "steps": [
    {"id":"step-one","name":"First Step","status":"pending","started_at":null,"completed_at":null,"artifact":null,"error":null,"custom":{}}
  ],
  "errors": []
}
JSON
  log "Run: $RUN_ID"
}

locate_run() {
  local run_id="\${1:-}"
  if [[ -n "$run_id" ]]; then
    STATE_FILE="$WORKFLOW_DIR/outputs/$run_id/execution-state.json"
    [[ -f "$STATE_FILE" ]] || fail "No state file for run: $run_id"
  else
    STATE_FILE=$(find "$WORKFLOW_DIR/outputs" -name "execution-state.json" 2>/dev/null | sort -r | head -1)
    [[ -n "$STATE_FILE" ]] || fail "No incomplete run found."
  fi
  STATE_DIR="$(dirname "$STATE_FILE")"
  RUN_ID="$(basename "$STATE_DIR")"
  log "Resuming run: $RUN_ID"
}

step_start()          { local id="$1" now; now="$(date -u '+%Y-%m-%dT%H:%M:%SZ')"; jq --arg id "$id" --arg now "$now" '(.steps[]|select(.id==$id))|=(.status="in_progress"|.started_at=$now)|.current_step=$id|.updated_at=$now' "$STATE_FILE" > "$STATE_FILE.tmp" && mv "$STATE_FILE.tmp" "$STATE_FILE"; }
step_complete()       { local id="$1" artifact="\${2:-}" custom="\${3:-{}}" now; now="$(date -u '+%Y-%m-%dT%H:%M:%SZ')"; jq --arg id "$id" --arg now "$now" --arg a "$artifact" --argjson c "$custom" '(.steps[]|select(.id==$id))|=(.status="completed"|.completed_at=$now|.artifact=$a|.custom=$c)|.updated_at=$now' "$STATE_FILE" > "$STATE_FILE.tmp" && mv "$STATE_FILE.tmp" "$STATE_FILE"; }
step_fail()           { local id="$1" err="$2" now; now="$(date -u '+%Y-%m-%dT%H:%M:%SZ')"; jq --arg id "$id" --arg now "$now" --arg err "$err" '(.steps[]|select(.id==$id))|=(.status="failed"|.completed_at=$now|.error=$err)|.status="failed"|.updated_at=$now|.errors+=[{"step":$id,"error":$err,"at":$now}]' "$STATE_FILE" > "$STATE_FILE.tmp" && mv "$STATE_FILE.tmp" "$STATE_FILE"; }
step_await_approval() { local id="$1" artifact="\${2:-}" now; now="$(date -u '+%Y-%m-%dT%H:%M:%SZ')"; jq --arg id "$id" --arg now "$now" --arg a "$artifact" '(.steps[]|select(.id==$id))|=(.status="awaiting_approval"|.completed_at=$now|.artifact=$a)|.status="awaiting_approval"|.current_step=$id|.updated_at=$now' "$STATE_FILE" > "$STATE_FILE.tmp" && mv "$STATE_FILE.tmp" "$STATE_FILE"; }
workflow_complete()   { local now; now="$(date -u '+%Y-%m-%dT%H:%M:%SZ')"; jq --arg now "$now" '.status="completed"|.current_step=null|.updated_at=$now' "$STATE_FILE" > "$STATE_FILE.tmp" && mv "$STATE_FILE.tmp" "$STATE_FILE"; }

check_gate() {
  local id="$1"
  local status; status=$(jq -r --arg id "$id" '.steps[]|select(.id==$id)|.status' "$STATE_FILE")
  case "$status" in
    pending|approved) return 0 ;;
    completed)        log "  ↩ Skipping $id (completed)"; return 1 ;;
    in_progress)      log "  ⚠ $id was in_progress — re-running"; return 0 ;;
    failed)           fail "$id failed. Run: agentfile $WORKFLOW_NAME retry $id" ;;
    awaiting_approval) fail "$id awaiting approval. Run: agentfile $WORKFLOW_NAME approve $id" ;;
    *)                fail "Unknown status for $id: $status" ;;
  esac
}

# ── Helpers ────────────────────────────────────────────────────────────────────
call_api() {
  local system_prompt="$1" user_prompt="$2" max_tokens="\${3:-4096}" temperature="\${4:-0.3}"
  curl -s https://api.anthropic.com/v1/messages \\
    -H "x-api-key: $API_KEY" \\
    -H "anthropic-version: 2023-06-01" \\
    -H "content-type: application/json" \\
    -d "$(jq -n \\
      --arg model   "$MODEL" \\
      --arg system  "$system_prompt" \\
      --arg user    "$user_prompt" \\
      --argjson max_tokens  "$max_tokens" \\
      --argjson temperature "$temperature" \\
      '{model:$model,max_tokens:$max_tokens,temperature:$temperature,
        system:$system,messages:[{role:"user",content:$user}]}')" \\
  | jq -r '.content[0].text'
}

load_file() { cat "$1"; }
log()        { echo "[$(date '+%H:%M:%S')] $*"; }
fail()       { echo "[$(date '+%H:%M:%S')] ERROR: $*" >&2; exit 1; }

# ── Steps ──────────────────────────────────────────────────────────────────────
step_step_one() {
  check_gate "step-one" || return 0
  step_start "step-one"
  log "▶ Step 1/1: First Step"

  local output_file="$STATE_DIR/01-result.md"
  local system user
  system="$(load_file "$SHARED_DIR/project.md")"$'\\n\\n'"$(load_file "$WORKFLOW_DIR/agents/agent.md")"
  user="$(load_file "$WORKFLOW_DIR/skills/skill.md")"$'\\n\\n'"---\\n\\n$AGENT_INPUT"

  call_api "$system" "$user" > "$output_file" \\
    || { step_fail "step-one" "API call failed"; exit 1; }

  step_await_approval "step-one" "01-result.md"
  log "⏸  Awaiting approval. Approve: agentfile $WORKFLOW_NAME approve step-one"
  exit 0
}

# ── Main ───────────────────────────────────────────────────────────────────────
main() {
  local input="\${1:-}" resume="\${2:-}" run_id="\${3:-}"

  if [[ "$resume" == "--resume" ]]; then
    locate_run "$run_id"
  else
    [[ -n "$input" ]] || input="\${AGENT_INPUT:?Usage: $(basename "$0") \"<input>\"}"
    init_state "$input"
  fi

  step_step_one

  workflow_complete
  log "✅ Complete. Run: $RUN_ID | Outputs: $STATE_DIR"
}

main "$@"
`);
  fs.chmodSync(path.join(workflowDir, 'scripts/cli/run.sh'), '755');

  // scripts/cli/run.ps1
  writeFile(path.join(workflowDir, 'scripts/cli/run.ps1'), `#!/usr/bin/env pwsh
$ErrorActionPreference = "Stop"

$ScriptDir   = Split-Path -Parent $MyInvocation.MyCommand.Path
$WorkflowDir = Split-Path -Parent (Split-Path -Parent $ScriptDir)
$ProjectRoot = Split-Path -Parent (Split-Path -Parent $WorkflowDir)
$SharedDir   = Join-Path $ProjectRoot "shared"
$WorkflowName = "${name}"

param([string]$Input="", [string]$Resume="", [string]$RunId="")
$ApiKey = $env:ANTHROPIC_API_KEY ?? $(throw "ANTHROPIC_API_KEY is not set")
$Model  = $env:AGENT_MODEL ?? "claude-sonnet-4-6"

$script:StateDir  = ""
$script:StateFile = ""
$script:RunId     = ""

function Initialize-State([string]$inp) {
  $script:RunId     = (Get-Date -Format 'yyyy-MM-ddTHH-mm-ss')
  $script:StateDir  = Join-Path $WorkflowDir "outputs/$($script:RunId)"
  $script:StateFile = Join-Path $script:StateDir "execution-state.json"
  New-Item -ItemType Directory -Force -Path $script:StateDir | Out-Null
  @{
    workflow="$WorkflowName"; run_id=$script:RunId
    started_at=(Get-Date -Format 'o'); updated_at=(Get-Date -Format 'o')
    status="running"; input=$inp; current_step=$null
    steps=@(@{id="step-one";name="First Step";status="pending";started_at=$null;completed_at=$null;artifact=$null;error=$null;custom=@{}})
    errors=@()
  } | ConvertTo-Json -Depth 10 | Set-Content $script:StateFile
  Write-Log "Run: $($script:RunId)"
}

function Find-Run([string]$runId="") {
  if ($runId) {
    $script:StateFile = Join-Path $WorkflowDir "outputs/$runId/execution-state.json"
    if (-not (Test-Path $script:StateFile)) { throw "No state file for run: $runId" }
  } else {
    $f = Get-ChildItem -Path (Join-Path $WorkflowDir "outputs") -Filter "execution-state.json" -Recurse -ErrorAction SilentlyContinue |
         Sort-Object FullName -Descending | Select-Object -First 1
    if (-not $f) { throw "No incomplete run found." }
    $script:StateFile = $f.FullName
  }
  $script:StateDir = Split-Path $script:StateFile -Parent
  $script:RunId    = Split-Path $script:StateDir -Leaf
  Write-Log "Resuming: $($script:RunId)"
}

function Update-State([scriptblock]$fn) {
  $s = Get-Content $script:StateFile | ConvertFrom-Json
  $s = & $fn $s; $s.updated_at = (Get-Date -Format 'o')
  $s | ConvertTo-Json -Depth 10 | Set-Content $script:StateFile
}

function Start-Step([string]$id)                              { Update-State { param($s); ($s.steps|Where-Object{$_.id -eq $id}|Select-Object -First 1).status="in_progress"; ($s.steps|Where-Object{$_.id -eq $id}|Select-Object -First 1).started_at=(Get-Date -Format 'o'); $s.current_step=$id; $s } }
function Complete-Step([string]$id,[string]$a="",[hashtable]$c=@{}) { Update-State { param($s); $step=$s.steps|Where-Object{$_.id -eq $id}|Select-Object -First 1; $step.status="completed"; $step.completed_at=(Get-Date -Format 'o'); $step.artifact=$a; $step.custom=$c; $s } }
function Fail-Step([string]$id,[string]$err)                  { Update-State { param($s); $step=$s.steps|Where-Object{$_.id -eq $id}|Select-Object -First 1; $step.status="failed"; $step.completed_at=(Get-Date -Format 'o'); $step.error=$err; $s.status="failed"; $s.errors+= @{step=$id;error=$err;at=(Get-Date -Format 'o')}; $s } }
function Await-Approval([string]$id,[string]$a="")            { Update-State { param($s); $step=$s.steps|Where-Object{$_.id -eq $id}|Select-Object -First 1; $step.status="awaiting_approval"; $step.completed_at=(Get-Date -Format 'o'); $step.artifact=$a; $s.status="awaiting_approval"; $s.current_step=$id; $s } }
function Complete-Workflow()                                   { Update-State { param($s); $s.status="completed"; $s.current_step=$null; $s } }

function Test-Gate([string]$id) {
  $s = Get-Content $script:StateFile | ConvertFrom-Json
  $step = $s.steps | Where-Object {$_.id -eq $id} | Select-Object -First 1
  switch ($step.status) {
    "pending"           { return $true }
    "approved"          { return $true }
    "completed"         { Write-Log "  ↩ Skipping $id (completed)"; return $false }
    "in_progress"       { Write-Log "  ⚠ $id was in_progress — re-running"; return $true }
    "failed"            { throw "$id failed. Run: agentfile $WorkflowName retry $id" }
    "awaiting_approval" { throw "$id awaiting approval. Run: agentfile $WorkflowName approve $id" }
  }
}

function Invoke-Api([string]$Sys,[string]$Usr,[int]$MaxTok=4096,[float]$Temp=0.3) {
  $body = @{model=$Model;max_tokens=$MaxTok;temperature=$Temp;system=$Sys;messages=@(@{role="user";content=$Usr})} | ConvertTo-Json -Depth 10
  (Invoke-RestMethod -Uri "https://api.anthropic.com/v1/messages" -Method POST \`
    -Headers @{"x-api-key"=$ApiKey;"anthropic-version"="2023-06-01";"content-type"="application/json"} \`
    -Body ([System.Text.Encoding]::UTF8.GetBytes($body))).content[0].text
}
function Get-FC([string]$P) { Get-Content $P -Raw -Encoding UTF8 }
function Write-Log([string]$M) { Write-Host "[$(Get-Date -Format 'HH:mm:ss')] $M" }

function Step-StepOne {
  if (-not (Test-Gate "step-one")) { return }
  Start-Step "step-one"
  Write-Log "▶ Step 1/1: First Step"
  $out = Join-Path $script:StateDir "01-result.md"
  $sys = (Get-FC "$SharedDir/project.md") + "\`n\`n" + (Get-FC "$WorkflowDir/agents/agent.md")
  $usr = (Get-FC "$WorkflowDir/skills/skill.md") + "\`n\`n---\`n\`n" + $env:AGENT_INPUT
  try {
    Invoke-Api $sys $usr | Set-Content $out -Encoding UTF8
    Await-Approval "step-one" "01-result.md"
    Write-Log "⏸  Awaiting approval. Approve: agentfile $WorkflowName approve step-one"
    exit 0
  } catch { Fail-Step "step-one" $_.Exception.Message; throw }
}

if ($Resume -eq "--resume") { Find-Run $RunId }
elseif ($Input)             { Initialize-State $Input }
else {
  $inp = $env:AGENT_INPUT
  if (-not $inp) { throw "Usage: run.ps1 <input>" }
  Initialize-State $inp
}

Step-StepOne
Complete-Workflow
Write-Log "✅ Complete. Run: $($script:RunId) | Outputs: $($script:StateDir)"
`);

  // scripts/ide/instructions.md
  writeFile(path.join(workflowDir, 'scripts/ide/instructions.md'), `# IDE Instructions: ${name}

## Setup
Load these files into your IDE agent's context before starting:
1. \`workflow.yaml\` — workflow definition
2. \`agents/agent.md\` — agent persona and rules
3. \`skills/skill.md\` — skill instructions

## Execution
Follow the steps in \`scripts/ide/steps.md\`.

## Rules
- Write all outputs to \`outputs/<run-id>/\`
- Never call the Anthropic API directly — you are the LLM
- Update \`outputs/<run-id>/execution-state.json\` after each step
`);

  // scripts/ide/steps.md
  writeFile(path.join(workflowDir, 'scripts/ide/steps.md'), `# IDE Steps: ${name}

> All outputs go to \`outputs/<run-id>/\` where run-id = current UTC timestamp (YYYY-MM-DDTHH-MM-SS)

### Step 0: Initialise Run
1. Generate \`RUN_ID\` = UTC timestamp \`YYYY-MM-DDTHH-MM-SS\`
2. Create \`outputs/<RUN_ID>/\`
3. Write \`outputs/<RUN_ID>/execution-state.json\` — status \`running\`, step \`step-one\` as \`pending\`

### Step 1: First Step
1. Load \`agents/agent.md\` as system context
2. Load \`skills/skill.md\` as instructions
3. Process the input
4. Write result to \`outputs/<RUN_ID>/01-result.md\`
5. Update execution-state: \`step-one\` → \`awaiting_approval\`, artifact \`01-result.md\`
6. **Wait for approval:** \`agentfile ${name} approve step-one\`
`);

  // scripts/README.md
  writeFile(path.join(workflowDir, 'scripts/README.md'), `# Scripts: ${name}

| Mode | Command |
|------|---------|
| CLI  | \`bash scripts/cli/run.sh "<input>"\` |
| CLI  | \`pwsh scripts/cli/run.ps1 -Input "<input>"\` |
| IDE  | Load \`scripts/ide/instructions.md\` into your IDE agent |

## Resume
\`\`\`
agentfile ${name} resume
agentfile ${name} status
agentfile ${name} approve step-one
\`\`\`
`);

  // .gitignore
  writeFile(path.join(workflowDir, '.gitignore'), 'outputs/\n');

  log.success(`Scaffolded: workflows/${name}/`);
  console.log('');
  console.log(chalk.bold.green('  Workflow scaffolded!'));
  console.log('');
  console.log('  Edit these files to define your workflow:');
  console.log(chalk.gray(`    workflows/${name}/workflow.yaml`));
  console.log(chalk.gray(`    workflows/${name}/agents/agent.md`));
  console.log(chalk.gray(`    workflows/${name}/skills/skill.md`));
  console.log('');
  console.log('  Run it:');
  console.log(chalk.cyan(`    agentfile run ${name} --input "your input"`));
  console.log('');
}

// ── Prompt helper ──────────────────────────────────────────────────────────────
function prompt(question) {
  return new Promise((resolve) => {
    const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
    rl.question(question, (answer) => { rl.close(); resolve(answer); });
  });
}
