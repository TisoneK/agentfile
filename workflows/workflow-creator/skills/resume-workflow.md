# Skill: Resume Workflow

## Purpose
Teach agents how to resume an interrupted workflow creation run or an interrupted workflow execution — picking up from the last completed step rather than starting over.

---

## Two Resume Contexts

### Context A — Resume workflow CREATION
Used when `/agentfile:create` was interrupted mid-generation (e.g. after clarification was approved but before design was completed).

Command: `/agentfile:continue` or `/agentfile:continue <workflow-name>`

### Context B — Resume workflow EXECUTION
Used when a registered workflow (e.g. `file-flow`) was running and failed or was interrupted mid-pipeline.

Command: `/agentfile:continue <workflow-name>`

---

## Context A — Resuming Workflow Creation

### Step 1 — Find the interrupted run

Look for artifact runs that are not yet promoted:
```
artifacts/
  <workflow-name>/
    <run-id>/
      manifest.json    ← check status field
```

If a workflow name was given: look in `artifacts/<workflow-name>/`
If no name given: scan all `artifacts/*/` directories for a manifest with `status` that is NOT `registered`

### Step 2 — Read the manifest

Parse `manifest.json` to determine:
- `workflow` — the workflow name
- `run_id` — the run identifier
- `status` — overall status (`generating`, `validated`, `failed`, etc.)
- `steps[]` — find the last step with `status: completed`
- The next step to run is the first step with `status: pending` or `status: failed`

### Step 3 — Report state to user

Before resuming, show the user what was completed and what remains:

```
📋 Resuming workflow creation: <workflow-name>
   Run ID: <run-id>

   Completed steps:
     ✓ clarify     — 01-clarification.md
     ✓ design      — 02-design.md

   Remaining steps:
     ○ generate-config
     ○ generate-agents
     ○ generate-skills
     ○ generate-utils
     ○ generate-scripts
     ○ review
     ○ promote

   Resuming from: generate-config
```

Ask the user to confirm before continuing.

### Step 4 — Load completed artifacts as context

Before running the next step, load the outputs of all completed steps as context:
- Read `01-clarification.md` if clarify was completed
- Read `02-design.md` if design was completed
- Reference any other completed artifacts the next step needs as input

### Step 5 — Continue from the next pending step

Execute only the remaining steps in sequence, starting from the first pending/failed step. Skip all completed steps — do not re-run them.

---

## Context B — Resuming Workflow Execution

### Step 1 — Find the interrupted execution

Look in `workflows/<workflow-name>/outputs/` for a partial run:
```
workflows/<workflow-name>/
  outputs/
    execution-state.json    ← written by run.sh at each step checkpoint
    01-<artifact>           ← completed step outputs
    02-<artifact>
    ...                     ← missing: interrupted here
```

If no `execution-state.json` exists, check which output files are present to infer the last completed step.

### Step 2 — Read execution state

If `execution-state.json` exists, parse it:
```json
{
  "workflow": "<n>",
  "started_at": "<ISO-8601>",
  "last_completed_step": "<step-id>",
  "completed_steps": ["step-1", "step-2"],
  "pending_steps": ["step-3", "step-4"],
  "input": "<original input value>"
}
```

### Step 3 — Report and confirm

Show the user what was completed and where it stopped. Confirm before resuming.

### Step 4 — Resume execution

Pass `--resume` flag to `run.sh`, or run `scripts/cli/resume.sh` if it exists. The script skips steps whose outputs already exist in `outputs/` and continues from the first missing output.

---

## Execution State Checkpointing

For workflows that should support resume, `run.sh` should write an `execution-state.json` checkpoint after each step:

```bash
write_checkpoint() {
  local completed_step="$1"
  local state_file="$OUTPUTS_DIR/execution-state.json"
  # Append completed step, update last_completed_step
  cat > "$state_file" << JSON
{
  "workflow": "$WORKFLOW_NAME",
  "started_at": "$START_TIME",
  "last_completed_step": "$completed_step",
  "input": "$INPUT"
}
JSON
}

step_analyse() {
  # ... step logic ...
  write_checkpoint "analyse"
}
```

### Resume logic in run.sh

```bash
# At the start of each step function, check if output already exists
step_analyse() {
  if [[ -f "$OUTPUTS_DIR/01-analysis.md" ]] && [[ "${RESUME:-false}" == "true" ]]; then
    log "  ↩ Skipping analyse (output exists)"
    return 0
  fi
  # ... step logic ...
}

# In main(), support --resume flag
RESUME=false
[[ "${1:-}" == "--resume" ]] && RESUME=true
```

---

## IDE Resume Instructions

For IDE mode, the agent should:

1. Check `outputs/` for existing step outputs
2. Skip steps whose outputs already exist
3. Load existing outputs as context before continuing
4. Only prompt the user to re-run steps with missing outputs

---

## Rules

- Never re-run a step that already has a valid output — always check first
- Always show the user the resume state before continuing — never silently skip steps
- If a step's output exists but the step is marked `failed` in the manifest, ask the user whether to use the existing output or re-run
- On resume, load all prior completed outputs as context for the next step
- If no interrupted run is found, tell the user clearly rather than starting a new run
