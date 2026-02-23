#!/usr/bin/env bash
set -euo pipefail

# ── scripts/cli/resume.sh ──────────────────────────────────────────────────────
# Resume an interrupted workflow CREATION run.
# Finds the pending artifact run, reads its manifest to determine the last
# completed step, and continues from where it left off.
#
# Usage:
#   bash scripts/cli/resume.sh [workflow-name]
#
# Maps to IDE command: /agentfile:continue [workflow-name]
# ──────────────────────────────────────────────────────────────────────────────

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
WORKFLOW_DIR="$(cd "$SCRIPT_DIR/../.." && pwd)"
PROJECT_ROOT="$(cd "$WORKFLOW_DIR/../.." && pwd)"
SHARED_DIR="$PROJECT_ROOT/shared"
API_KEY="${ANTHROPIC_API_KEY:?ANTHROPIC_API_KEY is not set}"
MODEL="claude-sonnet-4-6"

WORKFLOW_FILTER="${1:-}"

# ── Helpers ───────────────────────────────────────────────────────────────────
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
  [[ "$confirm" == "y" || "$confirm" == "Y" ]] || { log "Aborted."; exit 1; }
}

log() { echo "[$(date '+%H:%M:%S')] $*"; }

step_is_done() {
  local step_id="$1"
  if command -v jq &>/dev/null; then
    local status
    status=$(jq -r --arg id "$step_id" '.steps[] | select(.id==$id) | .status' "$MANIFEST" 2>/dev/null || echo "")
    [[ "$status" == "completed" ]]
  else
    grep -q "\"$step_id\"" "$MANIFEST" && grep -A2 "\"$step_id\"" "$MANIFEST" | grep -q '"completed"'
  fi
}

# ── Find pending run ──────────────────────────────────────────────────────────
log "Looking for pending workflow creation run${WORKFLOW_FILTER:+ ($WORKFLOW_FILTER)}..."

ARTIFACT_DIR=$(bash "$WORKFLOW_DIR/scripts/utils/find-pending-run.sh" $WORKFLOW_FILTER) \
  || { echo "No pending runs found. Start a new workflow: /agentfile:create <name> \"<description>\""; exit 0; }

MANIFEST="$ARTIFACT_DIR/manifest.json"

if command -v jq &>/dev/null; then
  WF_NAME=$(jq -r '.workflow' "$MANIFEST")
  RUN_ID=$(jq -r '.run_id' "$MANIFEST")
else
  WF_NAME=$(grep '"workflow"' "$MANIFEST" | head -1 | sed 's/.*: *"\(.*\)".*/\1/')
  RUN_ID=$(grep '"run_id"' "$MANIFEST" | head -1 | sed 's/.*: *"\(.*\)".*/\1/')
fi

# ── Show resume state ─────────────────────────────────────────────────────────
echo ""
echo "╔══════════════════════════════════════════════════════╗"
echo "║  📋 Resume: Workflow Creation                        ║"
echo "╚══════════════════════════════════════════════════════╝"
echo ""
echo "  Workflow: $WF_NAME"
echo "  Run ID:   $RUN_ID"
echo "  Location: $ARTIFACT_DIR"
echo ""

STEPS=("clarify" "design" "generate-config" "generate-agents" "generate-skills" "generate-utils" "generate-scripts" "review" "promote")
FIRST_PENDING=""

echo "  Step status:"
for step in "${STEPS[@]}"; do
  if step_is_done "$step"; then
    echo "    ✓ $step"
  else
    echo "    ○ $step"
    [[ -z "$FIRST_PENDING" ]] && FIRST_PENDING="$step"
  fi
done
echo ""

[[ -n "$FIRST_PENDING" ]] || { log "All steps completed. Run register to promote."; bash "$WORKFLOW_DIR/scripts/ide/register.sh" "$ARTIFACT_DIR"; exit 0; }

log "Resuming from: $FIRST_PENDING"
read -rp "Continue? [y/N] " confirm
[[ "$confirm" == "y" || "$confirm" == "Y" ]] || { echo "Cancelled."; exit 0; }

# ── Re-source run.sh step functions and execute remaining steps ───────────────
# Source the step functions from run.sh (they reference ARTIFACT_DIR which we've set)
export ARTIFACT_DIR
source "$SCRIPT_DIR/run.sh" --source-only 2>/dev/null || true

# Execute only pending steps
STARTED=false
for step in "${STEPS[@]}"; do
  if [[ "$step" == "$FIRST_PENDING" ]]; then
    STARTED=true
  fi
  [[ "$STARTED" == true ]] || continue

  case "$step" in
    clarify)          step_clarify ;;
    design)           step_design ;;
    generate-config)  step_generate_config ;;
    generate-agents)  step_generate_agents ;;
    generate-skills)  step_generate_skills ;;
    generate-utils)   step_generate_utils ;;
    generate-scripts) step_generate_scripts ;;
    review)           step_review ;;
    promote)          step_register ;;
  esac
done

log "✅ Resume complete."
