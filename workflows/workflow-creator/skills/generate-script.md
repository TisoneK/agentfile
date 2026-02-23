# Skill: Generate Script

## Purpose
Teach the Generator how to write complete, robust Bash and PowerShell orchestration scripts for workflows — including how to go beyond the boilerplate `run.sh` / `run.ps1` pair when the workflow requires it.

---

## Step 1 — Think Before You Write

Before generating any script, answer these questions from the workflow design:

1. **Every workflow must implement execution-state.** Read `generate-execution-state.md` and implement `init_state()`, `step_start()`, `step_complete()`, `step_fail()`, `step_await_approval()`, and `check_gate()` in every `run.sh` and `run.ps1`. This is not optional.
2. **Are there setup steps?** (install deps, check tools exist, configure env) → generate `setup.sh`
3. **Does the workflow watch for files or events?** → generate `watch.sh`
4. **Can the workflow run in batch mode over many inputs?** → generate `run-batch.sh`
5. **Does it produce output needing cleanup or archival?** → generate `cleanup.sh`
6. **Does it integrate with git hooks?** → generate `install-hook.sh`
7. **Long pipeline?** The `--resume` flag is handled automatically by execution-state — no separate `resume.sh` needed.

**Rule**: The scripts you generate must fit the workflow. Do not generate irrelevant scripts. Do not skip scripts the workflow clearly needs.

---

## Step 2 — Script Structure (Both Languages)

Every orchestration script must have these sections in order:
1. Shebang + strict mode
2. Path resolution (SCRIPT_DIR, WORKFLOW_DIR, PROJECT_ROOT, SHARED_DIR, OUTPUTS_DIR)
3. Environment variable validation
4. Configuration variables (MODEL, etc.)
5. Helper functions (call_api, load_file, human_gate, log)
6. Step functions — one per workflow step
7. Main execution block

---

## Step 3 — Bash Template

```bash
#!/usr/bin/env bash
set -euo pipefail

# ── Path Resolution ──────────────────────────────────────────────────────────────
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
WORKFLOW_DIR="$(cd "$SCRIPT_DIR/../.." && pwd)"
PROJECT_ROOT="$(cd "$WORKFLOW_DIR/../.." && pwd)"
SHARED_DIR="$PROJECT_ROOT/shared"
WORKFLOW_NAME="<workflow-name>"

# ── Environment & Config ─────────────────────────────────────────────────────────
: "${ANTHROPIC_API_KEY:?Error: ANTHROPIC_API_KEY is not set}"
API_KEY="$ANTHROPIC_API_KEY"
MODEL="claude-sonnet-4-6"

# ── Execution State ──────────────────────────────────────────────────────────────
# See generate-execution-state.md for full patterns.
# STATE_DIR, STATE_FILE, RUN_ID are set by init_state() or locate_run().
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
    {"id":"<step-id>","name":"<Step Name>","status":"pending","started_at":null,"completed_at":null,"artifact":null,"error":null,"custom":{}}
  ],
  "errors": []
}
JSON
  log "Run: $RUN_ID | State: $STATE_FILE"
}

locate_run() {
  local run_id="${1:-}"
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
step_complete()       { local id="$1" artifact="${2:-}" custom="${3:-{}}" now; now="$(date -u '+%Y-%m-%dT%H:%M:%SZ')"; jq --arg id "$id" --arg now "$now" --arg a "$artifact" --argjson c "$custom" '(.steps[]|select(.id==$id))|=(.status="completed"|.completed_at=$now|.artifact=$a|.custom=$c)|.updated_at=$now' "$STATE_FILE" > "$STATE_FILE.tmp" && mv "$STATE_FILE.tmp" "$STATE_FILE"; }
step_fail()           { local id="$1" err="$2" now; now="$(date -u '+%Y-%m-%dT%H:%M:%SZ')"; jq --arg id "$id" --arg now "$now" --arg err "$err" '(.steps[]|select(.id==$id))|=(.status="failed"|.completed_at=$now|.error=$err)|.status="failed"|.updated_at=$now|.errors+=[{"step":$id,"error":$err,"at":$now}]' "$STATE_FILE" > "$STATE_FILE.tmp" && mv "$STATE_FILE.tmp" "$STATE_FILE"; }
step_await_approval() { local id="$1" artifact="${2:-}" now; now="$(date -u '+%Y-%m-%dT%H:%M:%SZ')"; jq --arg id "$id" --arg now "$now" --arg a "$artifact" '(.steps[]|select(.id==$id))|=(.status="awaiting_approval"|.completed_at=$now|.artifact=$a)|.status="awaiting_approval"|.current_step=$id|.updated_at=$now' "$STATE_FILE" > "$STATE_FILE.tmp" && mv "$STATE_FILE.tmp" "$STATE_FILE"; }
workflow_complete()   { local now; now="$(date -u '+%Y-%m-%dT%H:%M:%SZ')"; jq --arg now "$now" '.status="completed"|.current_step=null|.updated_at=$now' "$STATE_FILE" > "$STATE_FILE.tmp" && mv "$STATE_FILE.tmp" "$STATE_FILE"; }

check_gate() {
  local id="$1"
  local status; status=$(jq -r --arg id "$id" '.steps[]|select(.id==$id)|.status' "$STATE_FILE")
  case "$status" in
    pending|approved)      return 0 ;;
    completed)             log "  ↩ Skipping $id (completed)"; return 1 ;;
    in_progress)           log "  ⚠ $id was in_progress — re-running"; return 0 ;;
    failed)                fail "$id failed. Run: agentfile $WORKFLOW_NAME retry $id" ;;
    awaiting_approval)     fail "$id awaiting approval. Run: agentfile $WORKFLOW_NAME approve $id" ;;
    *)                     fail "Unknown status for $id: $status" ;;
  esac
}

# ── Helpers ──────────────────────────────────────────────────────────────────────
call_api() {
  local system_prompt="$1" user_prompt="$2"
  local max_tokens="${3:-4096}" temperature="${4:-0.3}"
  curl -s https://api.anthropic.com/v1/messages \
    -H "x-api-key: $API_KEY" \
    -H "anthropic-version: 2023-06-01" \
    -H "content-type: application/json" \
    -d "$(jq -n \
      --arg model "$MODEL" --arg system "$system_prompt" --arg user "$user_prompt" \
      --argjson max_tokens "$max_tokens" --argjson temperature "$temperature" \
      '{model:$model,max_tokens:$max_tokens,temperature:$temperature,
        system:$system,messages:[{role:"user",content:$user}]}')" \
  | jq -r '.content[0].text'
}
load_file() { cat "$1"; }
log()        { echo "[$(date '+%H:%M:%S')] $*"; }
fail()       { echo "[$(date '+%H:%M:%S')] ERROR: $*" >&2; exit 1; }

# ── Steps ────────────────────────────────────────────────────────────────────────
step_<name>() {
  check_gate "<step-id>" || return 0
  step_start "<step-id>"
  log "▶ Step N/M: <step name>"

  local output_file="$STATE_DIR/<artifact>"
  local system user
  system="$(load_file "$SHARED_DIR/project.md")"$'\n\n'"$(load_file "$WORKFLOW_DIR/agents/<agent>.md")"
  user="$(load_file "$WORKFLOW_DIR/skills/<skill>.md")"$'\n\n'"<input>"

  call_api "$system" "$user" > "$output_file" \
    || { step_fail "<step-id>" "API call failed"; exit 1; }

  step_complete "<step-id>" "<artifact>" '{"<custom>": <value>}'
  log "  ✓ <step name>"
}

# Gated step example:
step_<gated>() {
  check_gate "<step-id>" || return 0
  step_start "<step-id>"
  log "▶ Step N/M: <step name> (requires approval)"

  local output_file="$STATE_DIR/<artifact>"
  call_api "$system" "$user" > "$output_file"

  step_await_approval "<step-id>" "<artifact>"
  log "⏸  Awaiting approval. Approve: agentfile $WORKFLOW_NAME approve <step-id>"
  exit 0
}

# ── Main ─────────────────────────────────────────────────────────────────────────
main() {
  local input="${1:-}" resume="${2:-}" run_id="${3:-}"

  if [[ "$resume" == "--resume" ]]; then
    locate_run "$run_id"
  else
    [[ -n "$input" ]] || fail "Usage: $(basename "$0") \"<input>\""
    init_state "$input"
  fi

  step_<name>
  # ... more steps ...

  workflow_complete
  log "✅ Complete. Run: $RUN_ID | Outputs: $STATE_DIR"
}

main "$@"
```

---

## Step 4 — PowerShell Template

```powershell
#!/usr/bin/env pwsh
$ErrorActionPreference = "Stop"

# ── Path Resolution ──────────────────────────────────────────────────────────────
$ScriptDir    = Split-Path -Parent $MyInvocation.MyCommand.Path
$WorkflowDir  = Split-Path -Parent (Split-Path -Parent $ScriptDir)
$ProjectRoot  = Split-Path -Parent (Split-Path -Parent $WorkflowDir)
$SharedDir    = Join-Path $ProjectRoot "shared"
$WorkflowName = "<workflow-name>"

# ── Environment & Config ─────────────────────────────────────────────────────────
param([string]$Input="", [string]$Resume="", [string]$RunId="")
$ApiKey = $env:ANTHROPIC_API_KEY ?? $(throw "ANTHROPIC_API_KEY is not set")
$Model  = "claude-sonnet-4-6"

# ── Execution State ──────────────────────────────────────────────────────────────
$script:StateDir  = ""
$script:StateFile = ""
$script:RunId     = ""

function Initialize-State([string]$inp) {
  $script:RunId     = (Get-Date -Format 'yyyy-MM-ddTHH-mm-ss')
  $script:StateDir  = Join-Path $WorkflowDir "outputs/$($script:RunId)"
  $script:StateFile = Join-Path $script:StateDir "execution-state.json"
  New-Item -ItemType Directory -Force -Path $script:StateDir | Out-Null

  @{
    workflow     = $WorkflowName; run_id = $script:RunId
    started_at   = (Get-Date -Format 'o'); updated_at = (Get-Date -Format 'o')
    status       = "running"; input = $inp; current_step = $null
    steps        = @(
      @{id="<step-id>";name="<Step>";status="pending";started_at=$null;completed_at=$null;artifact=$null;error=$null;custom=@{}}
    )
    errors = @()
  } | ConvertTo-Json -Depth 10 | Set-Content $script:StateFile
  Write-Log "Run: $($script:RunId)"
}

function Find-Run([string]$runId="") {
  if ($runId) {
    $script:StateFile = Join-Path $WorkflowDir "outputs/$runId/execution-state.json"
    if (-not (Test-Path $script:StateFile)) { throw "No state file for run: $runId" }
  } else {
    $f = Get-ChildItem -Path (Join-Path $WorkflowDir "outputs") -Filter "execution-state.json" -Recurse |
         Sort-Object FullName -Descending | Select-Object -First 1
    if (-not $f) { throw "No incomplete run found." }
    $script:StateFile = $f.FullName
  }
  $script:StateDir = Split-Path $script:StateFile -Parent
  $script:RunId    = Split-Path $script:StateDir -Leaf
  Write-Log "Resuming: $($script:RunId)"
}

function Update-State([scriptblock]$transform) {
  $s = Get-Content $script:StateFile | ConvertFrom-Json
  $s = & $transform $s
  $s.updated_at = (Get-Date -Format 'o')
  $s | ConvertTo-Json -Depth 10 | Set-Content $script:StateFile
}

function Start-Step([string]$id) {
  Update-State { param($s); ($s.steps | Where-Object {$_.id -eq $id} | Select-Object -First 1).status = "in_progress"; ($s.steps | Where-Object {$_.id -eq $id} | Select-Object -First 1).started_at = (Get-Date -Format 'o'); $s.current_step = $id; $s }
}
function Complete-Step([string]$id, [string]$artifact="", [hashtable]$custom=@{}) {
  Update-State { param($s); $step = $s.steps | Where-Object {$_.id -eq $id} | Select-Object -First 1; $step.status="completed"; $step.completed_at=(Get-Date -Format 'o'); $step.artifact=$artifact; $step.custom=$custom; $s }
}
function Fail-Step([string]$id, [string]$err) {
  Update-State { param($s); $step = $s.steps | Where-Object {$_.id -eq $id} | Select-Object -First 1; $step.status="failed"; $step.completed_at=(Get-Date -Format 'o'); $step.error=$err; $s.status="failed"; $s.errors += @{step=$id;error=$err;at=(Get-Date -Format 'o')}; $s }
}
function Await-Approval([string]$id, [string]$artifact="") {
  Update-State { param($s); $step = $s.steps | Where-Object {$_.id -eq $id} | Select-Object -First 1; $step.status="awaiting_approval"; $step.completed_at=(Get-Date -Format 'o'); $step.artifact=$artifact; $s.status="awaiting_approval"; $s.current_step=$id; $s }
}
function Complete-Workflow() {
  Update-State { param($s); $s.status="completed"; $s.current_step=$null; $s }
}

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

# ── Helpers ──────────────────────────────────────────────────────────────────────
function Invoke-Api([string]$System, [string]$User, [int]$MaxTokens=4096, [float]$Temp=0.3) {
  $body = @{model=$Model;max_tokens=$MaxTokens;temperature=$Temp;
    system=$System;messages=@(@{role="user";content=$User})} | ConvertTo-Json -Depth 10
  $r = Invoke-RestMethod -Uri "https://api.anthropic.com/v1/messages" -Method POST `
    -Headers @{"x-api-key"=$ApiKey;"anthropic-version"="2023-06-01";"content-type"="application/json"} `
    -Body $body
  return $r.content[0].text
}
function Get-FC([string]$Path) { Get-Content $Path -Raw }
function Write-Log([string]$m) { Write-Host "[$(Get-Date -Format 'HH:mm:ss')] $m" }

# ── Steps ────────────────────────────────────────────────────────────────────────
function Step-<Name> {
  if (-not (Test-Gate "<step-id>")) { return }
  Start-Step "<step-id>"
  Write-Log "▶ Step N/M: <step name>"

  $outputFile = Join-Path $script:StateDir "<artifact>"
  $sys = (Get-FC "$SharedDir/project.md") + "`n`n" + (Get-FC "$WorkflowDir/agents/<agent>.md")
  $usr = (Get-FC "$WorkflowDir/skills/<skill>.md") + "`n`n<input>"

  try {
    Invoke-Api $sys $usr | Set-Content $outputFile
    Complete-Step "<step-id>" "<artifact>" @{"<custom>"="<value>"}
    Write-Log "  ✓ <step name>"
  } catch {
    Fail-Step "<step-id>" $_.Exception.Message; throw
  }
}

# ── Main ─────────────────────────────────────────────────────────────────────────
if ($Resume -eq "--resume") { Find-Run $RunId }
else {
  if (-not $Input) { throw "Usage: run.ps1 <input>" }
  Initialize-State $Input
}

Step-<Name>
# ... more steps ...

Complete-Workflow
Write-Log "✅ Complete. Run: $($script:RunId) | Outputs: $($script:StateDir)"
```

---

## Step 5 — Additional Script Patterns

### Watch Script (`watch.sh`)
```bash
#!/usr/bin/env bash
set -euo pipefail
WATCH_DIR="${1:?Usage: $0 <directory-to-watch>}"
log() { echo "[$(date '+%H:%M:%S')] $*"; }
log "👁  Watching: $WATCH_DIR"
while inotifywait -q -e close_write,moved_to "$WATCH_DIR"; do
  for f in "$WATCH_DIR"/*; do
    [[ -f "$f" ]] || continue
    log "Processing: $f"
    bash "$(dirname "$0")/run.sh" "$f" && mv "$f" "$WATCH_DIR/processed/"
  done
done
```

### Batch Script (`run-batch.sh`)
```bash
#!/usr/bin/env bash
set -euo pipefail
INPUT_DIR="${1:?Usage: $0 <input-dir>}"
SUCCESS=0; FAIL=0
for f in "$INPUT_DIR"/*; do
  [[ -f "$f" ]] || continue
  if bash "$(dirname "$0")/run.sh" "$f"; then ((SUCCESS++))
  else echo "FAILED: $f"; ((FAIL++)); fi
done
echo "Done: $SUCCESS success, $FAIL failed"
```

---

## Step 6 — Key Patterns to Always Follow

- Execution state is mandatory — every run.sh must implement init_state/check_gate/step_start/step_complete/step_fail
- `--resume` flag in main() makes resume automatic — no separate resume.sh needed
- Gate steps call `step_await_approval` and `exit 0` — do not continue execution
- State file lives at `workflows/<n>/outputs/<run-id>/execution-state.json`
- Always resolve paths relative to `$SCRIPT_DIR` — never assume CWD
- System prompts load `project.md` + `AGENTS.md` + agent file
- PowerShell script is functionally equivalent to Bash — not a stub
- Meaningful `custom` fields per step — not empty `{}`
