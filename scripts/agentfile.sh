#!/usr/bin/env bash
set -euo pipefail

# ── agentfile — Universal workflow CLI ────────────────────────────────────────
# Usage:
#   agentfile <workflow> status [run-id]
#   agentfile <workflow> approve <step> [run-id]
#   agentfile <workflow> run <input>
#   agentfile <workflow> resume [run-id]
#   agentfile <workflow> retry <step> [run-id]
# ─────────────────────────────────────────────────────────────────────────────

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"

fail() { echo "ERROR: $*" >&2; exit 1; }
log()  { echo "[$(date '+%H:%M:%S')] $*"; }

# ── Helpers ───────────────────────────────────────────────────────────────────

find_state_file() {
  local workflow="$1" run_id="${2:-}"
  local outputs_dir="$PROJECT_ROOT/workflows/$workflow/outputs"

  [[ -d "$outputs_dir" ]] || fail "No outputs directory for workflow '$workflow'"

  if [[ -n "$run_id" ]]; then
    local f="$outputs_dir/$run_id/execution-state.json"
    [[ -f "$f" ]] || fail "No state file found for run: $run_id"
    echo "$f"
  else
    local f
    f=$(find "$outputs_dir" -name "execution-state.json" 2>/dev/null | sort -r | head -1)
    [[ -n "$f" ]] || fail "No execution state found for workflow '$workflow'. Has it been run yet?"
    echo "$f"
  fi
}

read_state() {
  local state_file="$1" field="$2"
  command -v jq &>/dev/null || fail "jq is required for agentfile commands"
  jq -r "$field" "$state_file"
}

# ── status ────────────────────────────────────────────────────────────────────

cmd_status() {
  local workflow="$1" run_id="${2:-}"
  local state_file
  state_file=$(find_state_file "$workflow" "$run_id")

  local overall_status run started input current
  overall_status=$(read_state "$state_file" '.status')
  run=$(read_state "$state_file" '.run_id')
  started=$(read_state "$state_file" '.started_at')
  input=$(read_state "$state_file" '.input')
  current=$(read_state "$state_file" '.current_step // "—"')

  echo ""
  echo "╔══════════════════════════════════════════════════════╗"
  printf  "║  %-52s║\n" "Workflow: $workflow"
  echo "╚══════════════════════════════════════════════════════╝"
  echo ""
  echo "  Run ID:       $run"
  echo "  Status:       $overall_status"
  echo "  Started:      $started"
  echo "  Input:        $input"
  echo "  Current step: $current"
  echo ""
  echo "  Steps:"

  jq -r '.steps[] | "    \(
    if .status == "completed"           then "✓"
    elif .status == "in_progress"       then "▶"
    elif .status == "awaiting_approval" then "⏸"
    elif .status == "failed"            then "✗"
    else "○"
    end
  ) \(.id) [\(.status)]\(
    if .artifact != null and .artifact != "" then " → \(.artifact)" else "" end
  )\(
    if .error != null and .error != "" then "\n      ↳ ERROR: \(.error)" else "" end
  )"' "$state_file"

  echo ""

  case "$overall_status" in
    awaiting_approval)
      local gate_step
      gate_step=$(jq -r '.steps[] | select(.status=="awaiting_approval") | .id' "$state_file" | head -1)
      echo "  ⏸  Awaiting approval for: $gate_step"
      echo "     Run: agentfile $workflow approve $gate_step"
      ;;
    failed)
      local failed_step
      failed_step=$(jq -r '.steps[] | select(.status=="failed") | .id' "$state_file" | head -1)
      echo "  ✗  Failed at: $failed_step"
      echo "     Run: agentfile $workflow retry $failed_step"
      ;;
    running)
      echo "  ▶  In progress..."
      ;;
    completed)
      echo "  ✓  Completed successfully."
      echo "     Outputs: workflows/$workflow/outputs/$run/"
      ;;
  esac
  echo ""
}

# ── approve ───────────────────────────────────────────────────────────────────

cmd_approve() {
  local workflow="$1" step_id="$2" run_id="${3:-}"
  local state_file
  state_file=$(find_state_file "$workflow" "$run_id")

  local current_status
  current_status=$(jq -r --arg id "$step_id" \
    '.steps[] | select(.id==$id) | .status' "$state_file")

  [[ -n "$current_status" ]] || fail "Step '$step_id' not found in workflow '$workflow'"
  [[ "$current_status" == "awaiting_approval" ]] || \
    fail "Step '$step_id' is not awaiting approval (status: $current_status)"

  local now; now="$(date -u '+%Y-%m-%dT%H:%M:%SZ')"
  jq --arg id "$step_id" --arg now "$now" \
    '(.steps[] | select(.id==$id)) |= (.status="approved" | .approved_at=$now)
     | .status = "running"
     | .updated_at = $now' \
    "$state_file" > "$state_file.tmp" && mv "$state_file.tmp" "$state_file"

  log "✓ Step '$step_id' approved."
  echo ""

  local run_script="$PROJECT_ROOT/workflows/$workflow/scripts/cli/run.sh"
  if [[ -f "$run_script" ]]; then
    read -rp "Resume execution now? [y/N] " confirm
    if [[ "$confirm" == "y" || "$confirm" == "Y" ]]; then
      local run_id_val; run_id_val="$(basename "$(dirname "$state_file")")"
      bash "$run_script" --resume "$run_id_val"
    else
      echo "Resume later with: agentfile $workflow resume"
    fi
  fi
}

# ── resume ────────────────────────────────────────────────────────────────────

cmd_resume() {
  local workflow="$1" run_id="${2:-}"
  local state_file
  state_file=$(find_state_file "$workflow" "$run_id")

  local status
  status=$(read_state "$state_file" '.status')
  [[ "$status" == "completed" ]] && { echo "Run is already completed."; exit 0; }

  local run_script="$PROJECT_ROOT/workflows/$workflow/scripts/cli/run.sh"
  [[ -f "$run_script" ]] || fail "No run.sh found for workflow '$workflow'"

  local run_id_val; run_id_val="$(basename "$(dirname "$state_file")")"
  log "Resuming $workflow / $run_id_val ..."
  bash "$run_script" --resume "$run_id_val"
}

# ── retry ─────────────────────────────────────────────────────────────────────

cmd_retry() {
  local workflow="$1" step_id="$2" run_id="${3:-}"
  local state_file
  state_file=$(find_state_file "$workflow" "$run_id")

  local current_status
  current_status=$(jq -r --arg id "$step_id" \
    '.steps[] | select(.id==$id) | .status' "$state_file")
  [[ -n "$current_status" ]] || fail "Step '$step_id' not found"

  local now; now="$(date -u '+%Y-%m-%dT%H:%M:%SZ')"
  jq --arg id "$step_id" --arg now "$now" \
    '(.steps[] | select(.id==$id)) |= (.status="pending" | .error=null | .started_at=null | .completed_at=null)
     | .status = "running"
     | .updated_at = $now' \
    "$state_file" > "$state_file.tmp" && mv "$state_file.tmp" "$state_file"

  log "Step '$step_id' reset to pending."
  cmd_resume "$workflow" "${run_id:-}"
}

# ── run ───────────────────────────────────────────────────────────────────────

cmd_run() {
  local workflow="$1" input="$2"
  local run_script="$PROJECT_ROOT/workflows/$workflow/scripts/cli/run.sh"
  [[ -f "$run_script" ]] || fail "No run.sh found for workflow '$workflow'"
  bash "$run_script" "$input"
}

# ── dispatch ──────────────────────────────────────────────────────────────────

WORKFLOW="${1:?Usage: agentfile <workflow> <command> [args]}"
COMMAND="${2:?Usage: agentfile $WORKFLOW <status|approve|run|resume|retry> [args]}"
shift 2

case "$COMMAND" in
  status)  cmd_status  "$WORKFLOW" "${1:-}" ;;
  approve) cmd_approve "$WORKFLOW" "${1:?approve requires <step-id>}" "${2:-}" ;;
  resume)  cmd_resume  "$WORKFLOW" "${1:-}" ;;
  retry)   cmd_retry   "$WORKFLOW" "${1:?retry requires <step-id>}" "${2:-}" ;;
  run)     cmd_run     "$WORKFLOW" "${1:?run requires <input>}" ;;
  *)       fail "Unknown command: $COMMAND. Use: status|approve|run|resume|retry" ;;
esac
