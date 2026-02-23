# Skill: Generate Dual Execution Scripts

## Purpose
Teach agents how to generate both IDE and CLI execution scripts with **equal priority**, and how to reason about what additional scripts a workflow actually needs beyond the basic `run.sh`/`run.ps1` pair.

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
- `scripts/cli/run.sh` — full Bash orchestration for CLI mode, wires in utils/
- `scripts/cli/run.ps1` — full PowerShell orchestration for CLI mode, wires in utils/
- `scripts/ide/instructions.md` — IDE agent setup guide
- `scripts/ide/steps.md` — step-by-step IDE execution guide, references utils/ where needed
- `scripts/ide/register.sh` + `register.ps1` — post-IDE file assembly, calls utils/ scripts
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

## Step 2 — Generate CLI Scripts (`scripts/cli/`)

CLI scripts call the Anthropic API directly and must be self-contained, robust, and runnable without an IDE.

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
| `scripts/ide/register.sh` / `.ps1` | ❌ No | After IDE execution — assembles outputs |
| `scripts/cli/run.sh` / `.ps1` | ✅ Yes | CLI / CI/CD / automation |

Never run `scripts/cli/` scripts inside your IDE agent session.

## Setup
1. Open the project root in your IDE
2. Load `agents/[primary-agent].md` as your system prompt (or paste it into context)
3. Follow `scripts/ide/steps.md`

## Output
All outputs land in `outputs/` (gitignored). Run `scripts/ide/register.sh` to assemble.
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

### Final Step — Register
Run the register script (no API key needed):
```bash
bash scripts/ide/register.sh
# or on Windows:
pwsh scripts/ide/register.ps1
```
````

### `scripts/ide/register.sh`

```bash
#!/usr/bin/env bash
set -euo pipefail
# IDE-safe: NO API KEY REQUIRED. Pure file assembly.

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
WORKFLOW_DIR="$(cd "$SCRIPT_DIR/../.." && pwd)"
OUTPUTS_DIR="$WORKFLOW_DIR/outputs"

log() { echo "[$(date '+%H:%M:%S')] $*"; }

[[ -d "$OUTPUTS_DIR" ]] || { echo "ERROR: outputs/ not found. Run the workflow steps first."; exit 1; }

# Add workflow-specific assembly logic here
# e.g., copy outputs to a deliverable location, concatenate files, generate a summary

log "✅ Registration complete. See outputs/ for results."
```

### `scripts/ide/register.ps1`

```powershell
#!/usr/bin/env pwsh
$ErrorActionPreference = "Stop"
# IDE-safe: NO API KEY REQUIRED. Pure file assembly.

$ScriptDir   = Split-Path -Parent $MyInvocation.MyCommand.Path
$WorkflowDir = Split-Path -Parent (Split-Path -Parent $ScriptDir)
$OutputsDir  = Join-Path $WorkflowDir "outputs"

if (-not (Test-Path $OutputsDir)) { throw "outputs/ not found. Run workflow steps first." }

# Add workflow-specific assembly logic here

Write-Host "✅ Registration complete. See outputs/ for results."
```

---

## Step 4 — Generate `scripts/README.md`

```markdown
# Execution Scripts — [workflow-name]

## Quick Start

### IDE Mode (interactive, no API key in shell)
1. Open project in your IDE agent (Cursor, Windsurf, Cline…)
2. Follow `scripts/ide/instructions.md`
3. Execute steps per `scripts/ide/steps.md`
4. Assemble output: `bash scripts/ide/register.sh`

### CLI Mode (automated, requires ANTHROPIC_API_KEY)
```bash
export ANTHROPIC_API_KEY=sk-...
bash scripts/cli/run.sh "[your input here]"
```

## Script Reference

| Script | API Key? | Purpose |
|--------|----------|---------|
| `scripts/cli/run.sh` | ✅ | Full pipeline (Bash) |
| `scripts/cli/run.ps1` | ✅ | Full pipeline (PowerShell) |
| `scripts/ide/register.sh` | ❌ | Output assembly (Bash) |
| `scripts/ide/register.ps1` | ❌ | Output assembly (PowerShell) |
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
- [ ] `register.sh` and `register.ps1` call `utils/` scripts for file assembly
- [ ] IDE scripts contain NO API calls or API key references

**Both**
- [ ] `README.md` lists all scripts across all three directories (utils/, cli/, ide/)
- [ ] File paths use correct relative navigation from each script's location
