# Skill: Generate Execution State

## Purpose
Teach the Generator how to implement `execution-state.json` in every workflow —
the single source of truth for runtime progress, gate control, and resume.

---

## What execution-state.json Is

Every workflow run writes its own state file at:
```
workflows/<n>/outputs/<run-id>/execution-state.json
```

This file:
- **Controls execution** — a step cannot start unless its predecessor is `completed`
- **Controls gates** — steps with `gate: human-approval` halt at `awaiting_approval` until explicitly approved
- **Enables resume** — `agentfile <n> resume` reads this file and skips completed steps
- **Enables status** — `agentfile <n> status` reads this file and renders progress
- **Is workflow-specific** — the steps, artifacts, and custom fields match the workflow's own design

Each run is fully isolated. Multiple runs coexist under `outputs/<run-id>/`.

---

## Step Lifecycle

```
pending → in_progress → completed
                     → failed
                     → awaiting_approval  (gate: human-approval steps only)
                          ↓  (agentfile <n> approve <step>)
                       approved → in_progress → completed
```

**Rules:**
- A step may only start if its predecessor's status is `completed`
- A `failed` step halts execution — subsequent steps stay `pending`
- `awaiting_approval` halts execution — the next step stays `pending` until approved
- Resume starts from the first step that is NOT `completed`

---

## State File Structure

```json
{
  "workflow": "<workflow-name>",
  "run_id": "<YYYY-MM-DDTHH-MM-SS>",
  "started_at": "<ISO-8601>",
  "updated_at": "<ISO-8601>",
  "status": "running | completed | failed | awaiting_approval",
  "input": "<original input value>",
  "current_step": "<step-id>",
  "steps": [
    {
      "id": "<step-id>",
      "name": "<Human Readable Name>",
      "status": "pending | in_progress | awaiting_approval | approved | completed | failed",
      "started_at": "<ISO-8601 or null>",
      "completed_at": "<ISO-8601 or null>",
      "artifact": "<path relative to run outputs dir, or null>",
      "error": "<error message or null>",
      "custom": {}
    }
  ],
  "errors": []
}
```

### The `custom` field
Each workflow defines its own per-step tracking data inside `custom`. Examples:

```json
// file-flow workflow — file processing step
"custom": {
  "files_processed": 12,
  "files_failed": 1,
  "output_size_bytes": 48320
}

// code-reviewer workflow — analysis step
"custom": {
  "files_analysed": 8,
  "issues_found": 14,
  "severity_breakdown": { "error": 2, "warning": 9, "info": 3 }
}

// git-commit workflow — commit step
"custom": {
  "commit_hash": "a3f9c12",
  "files_committed": 5,
  "branch": "main"
}
```

The Generator must identify meaningful custom fields for each step based on the workflow design.

---

## Bash Implementation Pattern

### Initialisation (call at start of main())

```bash
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
    $(generate_step_entries)
  ],
  "errors": []
}
JSON
  log "Run ID: $RUN_ID"
  log "State:  $STATE_FILE"
}
```

### Step entry generator (workflow-specific)

```bash
generate_step_entries() {
  # Each workflow generates this based on its own steps
  cat << 'JSON'
    {"id":"step-one","name":"Step One","status":"pending","started_at":null,"completed_at":null,"artifact":null,"error":null,"custom":{}},
    {"id":"step-two","name":"Step Two","status":"pending","started_at":null,"completed_at":null,"artifact":null,"error":null,"custom":{}},
    {"id":"step-three","name":"Step Three","status":"pending","started_at":null,"completed_at":null,"artifact":null,"error":null,"custom":{}}
JSON
}
```

### State update functions

```bash
# Mark a step as started
step_start() {
  local step_id="$1"
  local now; now="$(date -u '+%Y-%m-%dT%H:%M:%SZ')"
  jq --arg id "$step_id" --arg now "$now" \
    '(.steps[] | select(.id==$id)) |= (.status="in_progress" | .started_at=$now)
     | .current_step = $id
     | .updated_at = $now' \
    "$STATE_FILE" > "$STATE_FILE.tmp" && mv "$STATE_FILE.tmp" "$STATE_FILE"
}

# Mark a step as completed
step_complete() {
  local step_id="$1" artifact="${2:-}" custom="${3:-{}}"
  local now; now="$(date -u '+%Y-%m-%dT%H:%M:%SZ')"
  jq --arg id "$step_id" --arg now "$now" \
     --arg artifact "$artifact" --argjson custom "$custom" \
    '(.steps[] | select(.id==$id)) |=
       (.status="completed" | .completed_at=$now | .artifact=$artifact | .custom=$custom)
     | .updated_at = $now' \
    "$STATE_FILE" > "$STATE_FILE.tmp" && mv "$STATE_FILE.tmp" "$STATE_FILE"
}

# Mark a step as failed
step_fail() {
  local step_id="$1" error_msg="$2"
  local now; now="$(date -u '+%Y-%m-%dT%H:%M:%SZ')"
  jq --arg id "$step_id" --arg now "$now" --arg err "$error_msg" \
    '(.steps[] | select(.id==$id)) |= (.status="failed" | .completed_at=$now | .error=$err)
     | .status = "failed"
     | .updated_at = $now
     | .errors += [{"step": $id, "error": $err, "at": $now}]' \
    "$STATE_FILE" > "$STATE_FILE.tmp" && mv "$STATE_FILE.tmp" "$STATE_FILE"
}

# Mark a step as awaiting approval (gate: human-approval)
step_await_approval() {
  local step_id="$1" artifact="${2:-}"
  local now; now="$(date -u '+%Y-%m-%dT%H:%M:%SZ')"
  jq --arg id "$step_id" --arg now "$now" --arg artifact "$artifact" \
    '(.steps[] | select(.id==$id)) |=
       (.status="awaiting_approval" | .completed_at=$now | .artifact=$artifact)
     | .status = "awaiting_approval"
     | .current_step = $id
     | .updated_at = $now' \
    "$STATE_FILE" > "$STATE_FILE.tmp" && mv "$STATE_FILE.tmp" "$STATE_FILE"
}

# Mark overall workflow as completed
workflow_complete() {
  local now; now="$(date -u '+%Y-%m-%dT%H:%M:%SZ')"
  jq --arg now "$now" \
    '.status="completed" | .current_step=null | .updated_at=$now' \
    "$STATE_FILE" > "$STATE_FILE.tmp" && mv "$STATE_FILE.tmp" "$STATE_FILE"
}
```

### Gate check (use before every step)

```bash
# Check if a step is cleared to run
check_gate() {
  local step_id="$1"
  local status
  status=$(jq -r --arg id "$step_id" \
    '.steps[] | select(.id==$id) | .status' "$STATE_FILE")

  case "$status" in
    pending)   return 0 ;;   # ready to run
    completed) log "  ↩ Skipping $step_id (already completed)"; return 1 ;;
    failed)    fail "Step $step_id previously failed. Run: agentfile $WORKFLOW_NAME retry $step_id" ;;
    awaiting_approval) fail "Step $step_id is awaiting approval. Run: agentfile $WORKFLOW_NAME approve $step_id" ;;
    in_progress) log "  ⚠ Step $step_id was in_progress — may have crashed. Re-running." ; return 0 ;;
    *) fail "Unknown step status for $step_id: $status" ;;
  esac
}
```

### Step wrapper pattern (use in every step function)

```bash
step_analyse() {
  check_gate "analyse" || return 0   # skip if already completed

  step_start "analyse"
  log "▶ Analysing input..."

  # ... step logic ...
  local output_file="$STATE_DIR/01-analysis.md"
  call_api "$system" "$user" > "$output_file"

  # Complete with artifact path and custom fields
  step_complete "analyse" "01-analysis.md" \
    '{"lines_processed": 142, "issues_found": 3}'

  log "  ✓ analyse complete"
}

# For gated steps:
step_review() {
  check_gate "review" || return 0

  step_start "review"
  log "▶ Reviewing output..."

  local output_file="$STATE_DIR/02-review.md"
  call_api "$system" "$user" > "$output_file"

  # Halt for human approval
  step_await_approval "review" "02-review.md"
  log ""
  log "⏸  Step 'review' is awaiting approval."
  log "   Check output: $output_file"
  log "   To approve:   agentfile $WORKFLOW_NAME approve review"
  log "   To view status: agentfile $WORKFLOW_NAME status"
  exit 0   # halt — resume will continue after approval
}
```

---

## PowerShell Implementation Pattern

```powershell
function Initialize-State([string]$Input) {
  $script:RunId = (Get-Date -Format 'yyyy-MM-ddTHH-mm-ss')
  $script:StateDir = Join-Path $WorkflowDir "outputs/$RunId"
  $script:StateFile = Join-Path $StateDir "execution-state.json"
  New-Item -ItemType Directory -Force -Path $StateDir | Out-Null

  $state = @{
    workflow     = $WorkflowName
    run_id       = $RunId
    started_at   = (Get-Date -Format 'o')
    updated_at   = (Get-Date -Format 'o')
    status       = "running"
    input        = $Input
    current_step = $null
    steps        = @(
      # workflow-specific steps here
      @{id="step-one";name="Step One";status="pending";started_at=$null;completed_at=$null;artifact=$null;error=$null;custom=@{}}
    )
    errors = @()
  }
  $state | ConvertTo-Json -Depth 10 | Set-Content $StateFile
  Write-Log "Run ID: $RunId"
}

function Update-StepStart([string]$StepId) {
  $state = Get-Content $StateFile | ConvertFrom-Json
  $step = $state.steps | Where-Object { $_.id -eq $StepId }
  $step.status = "in_progress"; $step.started_at = (Get-Date -Format 'o')
  $state.current_step = $StepId; $state.updated_at = (Get-Date -Format 'o')
  $state | ConvertTo-Json -Depth 10 | Set-Content $StateFile
}

function Update-StepComplete([string]$StepId, [string]$Artifact="", [hashtable]$Custom=@{}) {
  $state = Get-Content $StateFile | ConvertFrom-Json
  $step = $state.steps | Where-Object { $_.id -eq $StepId }
  $step.status = "completed"; $step.completed_at = (Get-Date -Format 'o')
  $step.artifact = $Artifact; $step.custom = $Custom
  $state.updated_at = (Get-Date -Format 'o')
  $state | ConvertTo-Json -Depth 10 | Set-Content $StateFile
}

function Update-StepFail([string]$StepId, [string]$ErrorMsg) {
  $state = Get-Content $StateFile | ConvertFrom-Json
  $step = $state.steps | Where-Object { $_.id -eq $StepId }
  $step.status = "failed"; $step.completed_at = (Get-Date -Format 'o'); $step.error = $ErrorMsg
  $state.status = "failed"; $state.updated_at = (Get-Date -Format 'o')
  $state.errors += @{step=$StepId; error=$ErrorMsg; at=(Get-Date -Format 'o')}
  $state | ConvertTo-Json -Depth 10 | Set-Content $StateFile
}

function Update-StepAwaitApproval([string]$StepId, [string]$Artifact="") {
  $state = Get-Content $StateFile | ConvertFrom-Json
  $step = $state.steps | Where-Object { $_.id -eq $StepId }
  $step.status = "awaiting_approval"; $step.completed_at = (Get-Date -Format 'o'); $step.artifact = $Artifact
  $state.status = "awaiting_approval"; $state.current_step = $StepId; $state.updated_at = (Get-Date -Format 'o')
  $state | ConvertTo-Json -Depth 10 | Set-Content $StateFile
}

function Test-Gate([string]$StepId) {
  $state = Get-Content $StateFile | ConvertFrom-Json
  $step = $state.steps | Where-Object { $_.id -eq $StepId }
  switch ($step.status) {
    "pending"            { return $true }
    "completed"          { Write-Log "  ↩ Skipping $StepId (already completed)"; return $false }
    "in_progress"        { Write-Log "  ⚠ $StepId was in_progress — re-running"; return $true }
    "failed"             { throw "Step $StepId previously failed. Run: agentfile $WorkflowName retry $StepId" }
    "awaiting_approval"  { throw "Step $StepId awaiting approval. Run: agentfile $WorkflowName approve $StepId" }
    default              { throw "Unknown status for ${StepId}: $($step.status)" }
  }
}
```

---

## Resume Pattern in main()

```bash
main() {
  local input="${1:?Usage: $(basename "$0") <input>}"
  local resume="${2:-}"

  if [[ "$resume" == "--resume" ]]; then
    # Find most recent incomplete run
    STATE_FILE=$(find "$WORKFLOW_DIR/outputs" -name "execution-state.json" \
      -not -path "*/completed/*" 2>/dev/null | sort -r | head -1)
    [[ -n "$STATE_FILE" ]] || fail "No incomplete run found to resume."
    STATE_DIR="$(dirname "$STATE_FILE")"
    RUN_ID="$(basename "$STATE_DIR")"
    log "Resuming run: $RUN_ID"
  else
    init_state "$input"
  fi

  # Each step uses check_gate — completed steps are skipped automatically
  step_one
  step_two
  step_three

  workflow_complete
  log "✅ Complete. Run ID: $RUN_ID"
}
```

---

## Quality Checklist

When generating a workflow's run.sh and run.ps1, verify:

- [ ] `init_state()` is called at the top of `main()` before any steps
- [ ] Every step function calls `check_gate "<step-id>" || return 0` as its first line
- [ ] Every step calls `step_start` before doing work
- [ ] Every step calls `step_complete` with an artifact path and meaningful custom fields
- [ ] Every step has error handling that calls `step_fail` on exception
- [ ] Every `gate: human-approval` step calls `step_await_approval` and exits (does not continue)
- [ ] `main()` supports `--resume` flag and locates existing state file
- [ ] `workflow_complete()` is called after the last step
- [ ] State file path follows: `workflows/<n>/outputs/<run-id>/execution-state.json`
- [ ] The `custom` fields are meaningful for each step — not empty `{}`
