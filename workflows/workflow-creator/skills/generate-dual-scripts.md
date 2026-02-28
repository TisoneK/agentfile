# Skill: Generate Dual Execution Scripts

## Purpose
Teach agents how to generate both IDE and CLI execution scripts with **equal priority**, and how to reason about what additional scripts a workflow actually needs beyond the basic `run.sh`/`run.ps1` pair.

---

## NEW: Using js-utils Library (Required for JavaScript)

**For JavaScript CLI scripts (`run.js`), you MUST use the js-utils library** from `src/js-utils/` instead of writing manual implementations. This eliminates code duplication and provides robust, tested utilities:

| Module | Purpose | Replaces Manual Code |
|--------|---------|---------------------|
| [`state-manager`](../../src/js-utils/state-manager.js) | Workflow state persistence (YAML) | `initState()`, `loadState()`, `saveState()` |
| [`cli-parser`](../../src/js-utils/cli-parser.js) | CLI argument parsing | Manual `process.argv` handling |
| [`file-ops`](../../src/js-utils/file-ops.js) | Cross-platform file operations | `fs.readFileSync`, `fs.writeFileSync`, `fs.mkdirSync` |
| [`template-processor`](../../src/js-utils/template-processor.js) | Template variable substitution | Manual string replacement |
| [`env-validator`](../../src/js-utils/env-validator.js) | Environment validation | Manual Node.js version checks |
| [`progress-tracker`](../../src/js-utils/progress-tracker.js) | Progress tracking | Manual progress logging |
| [`cli-orchestrator`](../../src/js-utils/cli-orchestrator.js) | Full workflow orchestration | All of the above combined |

### js-utils Import Pattern (Standard Template)

```javascript
#!/usr/bin/env node
'use strict';

const path = require('path');

// ── js-utils Imports ────────────────────────────────────────────────────────────
// Import js-utils modules from project root
const projectRoot = path.resolve(__dirname, '../../..');
const jsUtilsPath = path.join(projectRoot, 'src/js-utils');

const stateManager = require(path.join(jsUtilsPath, 'state-manager'));
const cliParser = require(path.join(jsUtilsPath, 'cli-parser'));
const fileOps = require(path.join(jsUtilsPath, 'file-ops'));
const envValidator = require(path.join(jsUtilsPath, 'env-validator'));
const progressTracker = require(path.join(jsUtilsPath, 'progress-tracker'));

// ── Configuration ───────────────────────────────────────────────────────────────
const SCRIPT_DIR = path.dirname(__filename);
const WORKFLOW_DIR = path.resolve(SCRIPT_DIR, '../..');
const PROJECT_ROOT = path.resolve(WORKFLOW_DIR, '../..');
const SHARED_DIR = path.join(PROJECT_ROOT, 'shared');
const OUTPUTS_DIR = path.join(WORKFLOW_DIR, 'outputs');
const WORKFLOW_NAME = '<workflow-name>';

// ── Validate Environment ──────────────────────────────────────────────────────────
async function validateEnvironment() {
  const nodeCheck = await envValidator.validateNodeVersion('18');
  if (!nodeCheck.success) {
    console.error(`Node.js version check failed: ${nodeCheck.error.message}`);
    process.exit(1);
  }
  
  const dirsCheck = await envValidator.validateRequiredDirectories([
    WORKFLOW_DIR, SHARED_DIR, OUTPUTS_DIR
  ]);
  if (!dirsCheck.success) {
    console.error(`Directory check failed: ${dirsCheck.error.message}`);
    process.exit(1);
  }
}

// ── State Management with js-utils ───────────────────────────────────────────────
async function initState(input) {
  const now = new Date().toISOString();
  const runId = now.replace(/[:.]/g, '-').slice(0, 19);
  const stateDir = path.join(OUTPUTS_DIR, runId);
  
  // Use file-ops for directory creation
  const dirResult = fileOps.ensureDirectory(path.join(stateDir, 'dummy'));
  if (!dirResult.success) {
    throw new Error(`Failed to create state directory: ${dirResult.error.message}`);
  }
  
  const state = {
    workflow: WORKFLOW_NAME,
    run_id: runId,
    started_at: now,
    updated_at: now,
    status: 'running',
    input: input,
    current_step: null,
    steps: [
      // Workflow-specific steps will be inserted here
    ],
    errors: []
  };
  
  // Use state-manager for saving
  const saveResult = await stateManager.saveState(runId, state);
  if (!saveResult.success) {
    throw new Error(`Failed to save state: ${saveResult.error.message}`);
  }
  
  return { runId, stateDir, state };
}

async function loadState(runId) {
  const loadResult = await stateManager.loadState(runId);
  if (!loadResult.success) {
    throw new Error(`Failed to load state: ${loadResult.error.message}`);
  }
  return loadResult.data;
}

async function saveState(runId, state) {
  state.updated_at = new Date().toISOString();
  const saveResult = await stateManager.saveState(runId, state);
  if (!saveResult.success) {
    throw new Error(`Failed to save state: ${saveResult.error.message}`);
  }
}

// ── CLI Parsing with js-utils ────────────────────────────────────────────────────
function parseArguments() {
  const parseResult = cliParser.parseArguments(process.argv.slice(2), {
    commands: ['run', 'resume'],
    options: {
      input: { type: 'string', required: true },
      'run-id': { type: 'string', required: false }
    }
  });
  
  if (!parseResult.success) {
    console.error(`CLI parsing failed: ${parseResult.error.message}`);
    process.exit(1);
  }
  
  return parseResult.data;
}

// ── Step Management with js-utils ──────────────────────────────────────────────────
async function stepStart(runId, stepId, stepName) {
  const state = await loadState(runId);
  const step = state.steps.find(s => s.id === stepId);
  if (step) {
    step.status = 'in-progress';
    step.started_at = new Date().toISOString();
    await saveState(runId, state);
  }
}

async function stepComplete(runId, stepId, artifact, customData = {}) {
  const state = await loadState(runId);
  const step = state.steps.find(s => s.id === stepId);
  if (step) {
    step.status = 'completed';
    step.completed_at = new Date().toISOString();
    step.artifact = artifact;
    step.custom = { ...step.custom, ...customData };
    await saveState(runId, state);
  }
}

async function stepFail(runId, stepId, error) {
  const state = await loadState(runId);
  const step = state.steps.find(s => s.id === stepId);
  if (step) {
    step.status = 'failed';
    step.completed_at = new Date().toISOString();
    step.error = error;
    await saveState(runId, state);
  }
}

// ── File Operations with js-utils ───────────────────────────────────────────────
function loadFile(filepath) {
  const result = fileOps.readFile(filepath);
  if (!result.success) {
    throw new Error(`Failed to read file ${filepath}: ${result.error.message}`);
  }
  return result.data;
}

function saveFile(filepath, content) {
  const result = fileOps.writeFile(filepath, content);
  if (!result.success) {
    throw new Error(`Failed to write file ${filepath}: ${result.error.message}`);
  }
}

// ── API Call (LLM Integration) ───────────────────────────────────────────────────
async function callApi(system, user) {
  // Standard API call implementation
  // This remains manual as it's specific to each workflow
}

// ── Main Execution ───────────────────────────────────────────────────────────────
async function main() {
  await validateEnvironment();
  
  const args = parseArguments();
  const input = args.command?.input ?? 'default input';
  const runId = args.options?.['run-id'];
  
  let currentRunId;
  if (runId) {
    currentRunId = runId;
    console.log(`🔄 Resuming workflow run: ${currentRunId}`);
  } else {
    const { runId: newRunId } = await initState(input);
    currentRunId = newRunId;
    console.log(`🚀 Starting ${WORKFLOW_NAME}. Run: ${currentRunId}`);
  }
  
  // Create progress tracker
  const progress = progressTracker.create({
    total: 1, // Set to actual number of steps
    workflow: WORKFLOW_NAME,
    runId: currentRunId
  });
  
  // Execute workflow steps here
  // Example:
  // await stepStart(currentRunId, 'step-1', 'Step Name');
  // progress.start('Step Name');
  // try {
  //   const result = await performStep();
  //   await stepComplete(currentRunId, 'step-1', 'artifact.txt', { custom: 'data' });
  //   progress.complete('Step Name');
  // } catch (error) {
  //   await stepFail(currentRunId, 'step-1', error.message);
  //   progress.fail('Step Name', error);
  //   throw error;
  // }
}

main().catch(error => {
  console.error('Workflow failed:', error.message);
  process.exit(1);
});
```

**IMPORTANT**: This js-utils template is now the **required standard** for all JavaScript CLI scripts. Do not use manual implementations.

---

## Step 2a — Generate CLI Scripts: JavaScript (Required Standard)

CLI scripts call the Anthropic API directly and **must implement execution-state** using js-utils. Every `run.js` must use the js-utils template shown above — **no manual implementations allowed**.

### `scripts/cli/run.js` Template (js-utils Required)

Use the complete js-utils template from the previous section. This is now the **mandatory standard** for all JavaScript CLI scripts.

### Key Requirements for JavaScript CLI Scripts

1. **Must use js-utils imports** - No manual `fs`, `path`, or argument parsing
2. **Must use state-manager** - For all state persistence operations
3. **Must use file-ops** - For all file operations
4. **Must use cli-parser** - For all argument parsing
5. **Must use env-validator** - For environment validation
6. **Must use progress-tracker** - For progress tracking

---

## The Three Script Directories

```
scripts/
  utils/   — Plain terminal scripts. No LLM. Called by both cli/ and ide/.
  cli/     — LLM orchestration. Calls Anthropic API. Calls utils/ scripts.
  ide/     — IDE agent instructions + file assembly. No API. Calls utils/ scripts.
```

**Always generate `utils/` first.** Identify what non-LLM work the workflow needs, decompose it into utility scripts, then wire those into cli/ and ide/. See `generate-utils.md` for full patterns.

---

## CRITICAL: IDE and CLI Are Equal — Neither Is Secondary

Do NOT treat CLI as a fallback or IDE as preferred by default. Read the workflow design's `execution.preferred` field:
- `"ide"` → IDE is default entry point, but **CLI must still be fully implemented**
- `"cli"` → CLI is default entry point, but **IDE scripts must still be fully implemented**
- absent → Generate both fully; let the user choose

**Both paths must be production-quality.** A skeleton CLI script while the IDE path is detailed is a defect, not acceptable output.

---

## Step 1 — Analyze the Workflow's Script Needs

Before writing a single line, ask: **what scripts does this workflow actually need?**

### Always Required
- `scripts/utils/` — utility scripts for all non-LLM operations (file I/O, validation, transformation, etc.) — **generate these first, see `generate-utils.md`**
- `scripts/cli/run.js` — **JavaScript orchestration for CLI mode (recommended)** — wires in utils/
- `scripts/cli/run.sh` — Bash orchestration for CLI mode (legacy)
- `scripts/cli/run.ps1` — PowerShell orchestration for CLI mode (legacy)
- `scripts/ide/instructions.md` — IDE agent setup guide
- `scripts/ide/steps.md` — step-by-step IDE execution guide, references utils/ where needed
- `scripts/README.md` — execution mode comparison table listing all three directories

### Conditionally Required — Think About These
Only generate extras that the workflow genuinely needs. Examples:

| Scenario | Extra script to generate |
|----------|--------------------------|
| Workflow processes files from a directory | `scripts/cli/watch.sh` — file watcher loop |
| Workflow has a setup step (install deps, configure env) | `scripts/cli/setup.sh` |
| Workflow produces output that needs cleanup | `scripts/cli/cleanup.sh` |
| Workflow has multiple entry points (e.g. process one file vs a batch) | `scripts/cli/run-batch.sh` |
| Workflow interacts with git | `scripts/cli/pre-commit-hook.sh` or `scripts/cli/install-hook.sh` |
| Workflow needs to be run on a schedule | `scripts/cli/cron-example.sh` |
| Workflow generates output that must be validated separately | `scripts/cli/validate.sh` |
| Workflow has a long pipeline with checkpointing | `scripts/cli/resume.sh` — resume from a checkpoint |

**Rule**: If the workflow design mentions something that a plain `run.sh` wouldn't handle well, generate the appropriate additional script. Do not default to just `run.sh` + `run.ps1` when the workflow clearly needs more.

---

## Step 2a — Generate CLI Scripts: JavaScript (Recommended)

CLI scripts call the Anthropic API directly and **must implement execution-state**. Every `run.js` must include the full state management pattern from `generate-execution-state.md` and `generate-script.md` — `initState()`, `checkGate()`, `stepStart()`, `stepComplete()`, `stepFail()`, `stepAwaitApproval()`, and `--resume` support.

### `scripts/cli/run.js` Template

```javascript
#!/usr/bin/env node
'use strict';

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// ── Configuration ───────────────────────────────────────────────────────────────
const SCRIPT_DIR = path.dirname(__filename__);
const WORKFLOW_DIR = path.resolve(SCRIPT_DIR, '../..');
const PROJECT_ROOT = path.resolve(WORKFLOW_DIR, '../..');
const SHARED_DIR = path.join(PROJECT_ROOT, 'shared');
const OUTPUTS_DIR = path.join(WORKFLOW_DIR, 'outputs');
const API_KEY = process.env.ANTHROPIC_API_KEY ?? (() => { throw new Error('ANTHROPIC_API_KEY is not set'); })();
const MODEL = 'claude-sonnet-4-6';

// Parse arguments
const args = process.argv.slice(2);
const INPUT = args[0] ?? (() => { throw new Error('Usage: node run.js "<input>"'); })();
if (!fs.existsSync(OUTPUTS_DIR)) fs.mkdirSync(OUTPUTS_DIR, { recursive: true });

// ── Execution State ───────────────────────────────────────────────────────────────
let STATE_DIR = '';
let STATE_FILE = '';
let RUN_ID = '';

function initState(input) {
  const now = new Date().toISOString();
  RUN_ID = now.replace(/[:.]/g, '-').slice(0, 19);
  STATE_DIR = path.join(OUTPUTS_DIR, RUN_ID);
  STATE_FILE = path.join(STATE_DIR, 'execution-state.json');
  fs.mkdirSync(STATE_DIR, { recursive: true });
  
  const state = {
    workflow: WORKFLOW_NAME,
    run_id: RUN_ID,
    started_at: now,
    updated_at: now,
    status: 'running',
    input: input,
    current_step: null,
    steps: [
      { id: 'step-1', name: 'Step Name', status: 'pending', started_at: null, completed_at: null, artifact: null, error: null, custom: {} }
    ],
    errors: []
  };
  fs.writeFileSync(STATE_FILE, JSON.stringify(state, null, 2));
  log(`Run: ${RUN_ID}`);
}

function loadState() { return JSON.parse(fs.readFileSync(STATE_FILE, 'utf8')); }
function saveState(state) { state.updated_at = new Date().toISOString(); fs.writeFileSync(STATE_FILE, JSON.stringify(state, null, 2)); }

function stepStart(id) {
  const state = loadState();
  const step = state.steps.find(s => s.id === id);
  if (step) { step.status = 'in_progress'; step.started_at = new Date().toISOString(); }
  state.current_step = id;
  saveState(state);
}

function stepComplete(id, artifact = '', custom = {}) {
  const state = loadState();
  const step = state.steps.find(s => s.id === id);
  if (step) { step.status = 'completed'; step.completed_at = new Date().toISOString(); step.artifact = artifact; step.custom = custom; }
  saveState(state);
}

function stepFail(id, err) {
  const state = loadState();
  const step = state.steps.find(s => s.id === id);
  if (step) { step.status = 'failed'; step.completed_at = new Date().toISOString(); step.error = err; }
  state.status = 'failed';
  state.errors.push({ step: id, error: err, at: new Date().toISOString() });
  saveState(state);
}

function checkGate(id) {
  const state = loadState();
  const step = state.steps.find(s => s.id === id);
  if (!step) throw new Error(`Unknown step: ${id}`);
  switch (step.status) {
    case 'pending': case 'approved': return true;
    case 'completed': log(`  ↩ Skipping ${id} (completed)`); return false;
    case 'in_progress': log(`  ⚠ ${id} was in_progress — re-running`); return true;
    default: throw new Error(`${id} status: ${step.status}`);
  }
}

// ── Helpers ─────────────────────────────────────────────────────────────────────
function callApi(system, user, maxTokens = 4096, temperature = 0.3) {
  const body = JSON.stringify({ model: MODEL, max_tokens: maxTokens, temperature: temperature, system, messages: [{ role: 'user', content: user }] });
  const result = execSync(`curl -s https://api.anthropic.com/v1/messages`, {
    env: { ...process.env, ANTHROPIC_API_KEY: API_KEY },
    input: body, encoding: 'utf8'
  });
  return JSON.parse(result).content[0].text;
}

function loadFile(p) { return fs.readFileSync(p, 'utf8'); }
function log(m) { console.log(`[${new Date().toISOString().slice(11, 19)}] ${m}`); }

// ── Steps ──────────────────────────────────────────────────────────────────────
async function step_NAME() {
  if (!checkGate('step-1')) return;
  stepStart('step-1');
  log('▶ Step 1/N: [Step Name]');
  
  const outputFile = path.join(STATE_DIR, '[artifact]');
  const system = loadFile(path.join(SHARED_DIR, 'project.md')) + '\n\n' + loadFile(path.join(WORKFLOW_DIR, 'agents/[agent].md'));
  const user = loadFile(path.join(WORKFLOW_DIR, 'skills/[skill].md')) + '\n\n' + INPUT;
  
  try {
    const result = callApi(system, user);
    fs.writeFileSync(outputFile, result);
    stepComplete('step-1', '[artifact]', {});
    log('  ✓ [artifact]');
  } catch (e) { stepFail('step-1', e.message); throw e; }
}

// ── Main ─────────────────────────────────────────────────────────────────────────
async function main() {
  log(`🚀 Starting [workflow-name]. Input: ${INPUT}`);
  await step_NAME();
  // ... add more steps ...
  log('✅ Complete. See outputs/ for results.');
}

main().catch(e => { console.error(e); process.exit(1); });
```

---

## Step 2b — Generate CLI Scripts: Bash/PowerShell (Legacy)

CLI scripts call the Anthropic API directly and **must implement execution-state**. Every `run.sh` and `run.ps1` must include the full state management pattern from `generate-execution-state.md` and `generate-script.md` — `init_state()`, `check_gate()`, `step_start()`, `step_complete()`, `step_fail()`, `step_await_approval()`, and `--resume` support. This is not optional.

See `generate-script.md` for the complete templates. The abbreviated structure is:

### `scripts/cli/run.sh` Template

```bash
#!/usr/bin/env bash
set -euo pipefail

# ── Configuration ───────────────────────────────────────────────────────────────
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
WORKFLOW_DIR="$(cd "$SCRIPT_DIR/../.." && pwd)"
PROJECT_ROOT="$(cd "$WORKFLOW_DIR/../.." && pwd)"
SHARED_DIR="$PROJECT_ROOT/shared"
OUTPUTS_DIR="$WORKFLOW_DIR/outputs"
API_KEY="${ANTHROPIC_API_KEY:?ANTHROPIC_API_KEY is not set}"
MODEL="claude-sonnet-4-6"

# Parse arguments
INPUT="${1:?Usage: $0 \"<input>\"}"
mkdir -p "$OUTPUTS_DIR"

# ── Helpers ─────────────────────────────────────────────────────────────────────
call_api() {
  local system_prompt="$1" user_prompt="$2"
  local max_tokens="${3:-4096}" temperature="${4:-0.3}"
  curl -s https://api.anthropic.com/v1/messages \
    -H "x-api-key: $API_KEY" \
    -H "anthropic-version: 2023-06-01" \
    -H "content-type: application/json" \
    -d "$(jq -n \
      --arg model "$MODEL" \
      --arg system "$system_prompt" \
      --arg user "$user_prompt" \
      --argjson max_tokens "$max_tokens" \
      --argjson temperature "$temperature" \
      '{model:$model,max_tokens:$max_tokens,temperature:$temperature,
        system:$system,messages:[{role:"user",content:$user}]}')" \
  | jq -r '.content[0].text'
}

load_file() { cat "$1"; }

human_gate() {
  local step_name="$1" output_file="$2"
  echo ""
  echo "══════════════════════════════════════════════════════"
  echo "  ⏸  GATE: $step_name"
  echo "  📄 Output: $output_file"
  echo "══════════════════════════════════════════════════════"
  cat "$output_file"
  echo ""
  read -rp "  Approve and continue? [y/N] " confirm
  [[ "$confirm" == "y" || "$confirm" == "Y" ]] || { echo "Aborted."; exit 1; }
}

log() { echo "[$(date '+%H:%M:%S')] $*"; }

# ── Steps ────────────────────────────────────────────────────────────────────────
step_[NAME]() {
  log "▶ Step N/M: [Step Name]"
  local system user
  system="$(load_file "$SHARED_DIR/project.md")"$'\n\n'"$(load_file "$WORKFLOW_DIR/agents/[agent].md")"
  user="$(load_file "$WORKFLOW_DIR/skills/[skill].md")"$'\n\n'"[input]"
  call_api "$system" "$user" > "$OUTPUTS_DIR/[artifact]"
  log "  ✓ [artifact]"
}

# ── Main ─────────────────────────────────────────────────────────────────────────
main() {
  log "🚀 Starting [workflow-name]"
  log "   Input: $INPUT"
  step_[NAME]
  # ... add more steps ...
  log "✅ Complete. See outputs/ for results."
}
main "$@"
```

### `scripts/cli/run.ps1` Template

```powershell
#!/usr/bin/env pwsh
$ErrorActionPreference = "Stop"

# ── Configuration ───────────────────────────────────────────────────────────────
$ScriptDir   = Split-Path -Parent $MyInvocation.MyCommand.Path
$WorkflowDir = Split-Path -Parent (Split-Path -Parent $ScriptDir)
$ProjectRoot = Split-Path -Parent (Split-Path -Parent $WorkflowDir)
$SharedDir   = Join-Path $ProjectRoot "shared"
$OutputsDir  = Join-Path $WorkflowDir "outputs"
$ApiKey      = $env:ANTHROPIC_API_KEY ?? $(throw "ANTHROPIC_API_KEY is not set")
$Model       = "claude-sonnet-4-6"

param([Parameter(Mandatory=$true)][string]$Input)
New-Item -ItemType Directory -Force -Path $OutputsDir | Out-Null

# ── Helpers ─────────────────────────────────────────────────────────────────────
function Invoke-Api {
  param([string]$System, [string]$User, [int]$MaxTokens=4096, [float]$Temp=0.3)
  $body = @{model=$Model;max_tokens=$MaxTokens;temperature=$Temp;
    system=$System;messages=@(@{role="user";content=$User})} | ConvertTo-Json -Depth 10
  $r = Invoke-RestMethod -Uri "https://api.anthropic.com/v1/messages" -Method POST `
    -Headers @{"x-api-key"=$ApiKey;"anthropic-version"="2023-06-01";"content-type"="application/json"} `
    -Body $body
  return $r.content[0].text
}
function Get-FC([string]$Path) { Get-Content $Path -Raw }
function Write-Log([string]$m) { Write-Host "[$(Get-Date -Format 'HH:mm:ss')] $m" }
function Invoke-Gate([string]$Name, [string]$File) {
  Write-Host "`n══════════════════════════════════════════"
  Write-Host "  GATE: $Name  |  $File"
  Get-Content $File | Write-Host
  $c = Read-Host "Approve? [y/N]"
  if ($c -ne "y") { throw "Aborted at gate: $Name" }
}

# ── Steps ────────────────────────────────────────────────────────────────────────
function Step-[Name] {
  Write-Log "▶ Step N/M: [Step Name]"
  $sys = (Get-FC "$SharedDir/project.md") + "`n`n" + (Get-FC "$WorkflowDir/agents/[agent].md")
  $usr = (Get-FC "$WorkflowDir/skills/[skill].md") + "`n`n[input]"
  Invoke-Api $sys $usr | Set-Content "$OutputsDir/[artifact]"
}

# ── Main ─────────────────────────────────────────────────────────────────────────
Write-Log "🚀 Starting [workflow-name]. Input: $Input"
Step-[Name]
# ... more steps ...
Write-Log "✅ Complete."
```

---

## Step 3 — Generate IDE Scripts (`scripts/ide/`)

IDE scripts guide an IDE agent (Cursor, Windsurf, Cline, etc.) through the workflow interactively. **They must never call the API** — the IDE agent IS the LLM.

### `scripts/ide/instructions.md`

```markdown
# IDE Execution Instructions — [workflow-name]

## Overview
This workflow runs inside your IDE agent (Cursor, Windsurf, Cline, etc.).
The IDE agent provides the LLM reasoning. No API key is needed to run the steps.

## Execution Mode Warning

| Script | API key? | When to use |
|--------|----------|-------------|
| `scripts/cli/run.js` | ✅ Yes | CLI / CI/CD / automation (recommended) |
| `scripts/cli/run.sh` / `.ps1` | ✅ Yes | CLI / CI/CD / automation (legacy) |

Never run `scripts/cli/` scripts inside your IDE agent session.
Use `agentfile` CLI commands for all lifecycle operations (approve, status, promote).

## Setup
1. Open the project root in your IDE
2. Load `agents/[primary-agent].md` as your system prompt (or paste it into context)
3. Follow `scripts/ide/steps.md`

## Output
All step outputs land in `outputs/` (gitignored). Use `agentfile approve`, `status`, and
`agentfile promote` to manage the run lifecycle.
```

### `scripts/ide/steps.md`

````markdown
## IDE Execution Steps — [workflow-name]

> Run these steps in your IDE agent session. Each step produces a file in `outputs/`.

### Step 1 — [Step Name]
**Agent**: Load `agents/[agent].md` as system prompt
**Skill**: Paste contents of `skills/[skill].md` into your message
**Input**: [describe input]
**Output**: `outputs/[artifact]`
**Instruction**: "[Concrete instruction for IDE agent]"

### Step 2 — [Step Name]
...

### Final Step — Approve & Complete
When all steps are done, mark the run complete:
```
agentfile approve <workflow-name> <final-step-id>
agentfile status <workflow-name>
```
````


---

## Step 4 — Generate `scripts/README.md`

```markdown
# Execution Scripts — [workflow-name]

## Quick Start

### IDE Mode (interactive, no API key in shell)
1. Open project in your IDE agent (Cursor, Windsurf, Cline…)
2. Follow `scripts/ide/instructions.md`
3. Execute steps per `scripts/ide/steps.md`
4. Approve gate steps: `agentfile approve <workflow> <step-id>`

### CLI Mode (automated, requires ANTHROPIC_API_KEY)
```bash
# JavaScript (recommended - cross-platform)
export ANTHROPIC_API_KEY=sk-...
node scripts/cli/run.js "[your input here]"

# Bash (Unix/Linux/macOS)
bash scripts/cli/run.sh "[your input here]"

# PowerShell (Windows)
pwsh -File scripts/cli/run.ps1 -Input "[your input here]"
```

## Script Reference

| Script | API Key? | Purpose |
|--------|----------|---------|
| `scripts/cli/run.js` | ✅ | Full pipeline (JavaScript - recommended) |
| `scripts/cli/run.sh` | ✅ | Full pipeline (Bash) |
| `scripts/cli/run.ps1` | ✅ | Full pipeline (PowerShell) |
| `scripts/ide/instructions.md` | ❌ | IDE setup guide |
| `scripts/ide/steps.md` | ❌ | IDE step-by-step guide |
[Add any additional scripts here with descriptions]

## Switch Modes
Edit `execution.preferred` in `workflow.yaml`:
```yaml
execution:
  preferred: "ide"   # or "cli"
```
```

---

## Step 5 — Quality Checklist

Before finalizing scripts, verify:

**utils/ scripts**
- [ ] Every non-LLM operation has a dedicated utility script
- [ ] Both `.sh` and `.ps1` versions exist for every utility script
- [ ] Each script accepts inputs as arguments — no hardcoded paths
- [ ] Scripts exit with code 1 and a clear message on failure

**CLI scripts**
- [ ] `run.sh` covers every step in workflow.yaml
- [ ] `run.ps1` is functionally identical to `run.sh` (not a skeleton)
- [ ] Both call into `utils/` scripts rather than inlining non-LLM logic
- [ ] All required env vars validated at startup
- [ ] `human_gate` / `Invoke-Gate` implemented for all `gate: human-approval` steps
- [ ] System prompts load `project.md` + `AGENTS.md` + agent file
- [ ] Each step's output written to `outputs/` with a logical filename

**IDE scripts**
- [ ] `instructions.md` tells the user exactly how to load agents into context
- [ ] `steps.md` has one section per workflow step with concrete instructions
- [ ] `steps.md` references any `utils/` scripts the user needs to run manually
- [ ] IDE scripts contain NO API calls or API key references

**Both**
- [ ] `README.md` lists all scripts across all three directories (utils/, cli/, ide/)
- [ ] File paths use correct relative navigation from each script's location
