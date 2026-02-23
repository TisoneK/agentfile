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
CONFIG_FILE="${2:-.review-config.json}"
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
  echo "════════════════════════════════════════════════════"
  echo "  ⏸  GATE: $step_name"
  echo "  📄 Output: $output_file"
  echo "════════════════════════════════════════════════════"
  cat "$output_file"
  echo ""
  read -rp "  Approve and continue? [y/N] " confirm
  [[ "$confirm" == "y" || "$confirm" == "Y" ]] || { echo "Aborted."; exit 1; }
}

log() { echo "[$(date '+%H:%M:%S')] $*"; }

# ── Steps ────────────────────────────────────────────────────────────────────────
step_init() {
  log "▶ Step 1/8: Initialize Review Context"
  local system user
  system="$(load_file "$SHARED_DIR/project.md")"$'\n\n'"$(load_file "$WORKFLOW_DIR/agents/coordinator.md")"
  user="$(load_file "$WORKFLOW_DIR/skills/setup-review-context.md")"$'\n\n'"Input path: $INPUT"
  call_api "$system" "$user" > "$OUTPUTS_DIR/01-context.md"
  log "  ✓ 01-context.md"
}

step_static() {
  log "▶ Step 2/8: Static Code Analysis"
  local system user
  system="$(load_file "$SHARED_DIR/project.md")"$'\n\n'"$(load_file "$WORKFLOW_DIR/agents/static-analyzer.md")"
  user="$(load_file "$WORKFLOW_DIR/skills/code-quality-analysis.md")"$'\n\n'"$(load_file "$OUTPUTS_DIR/01-context.md")"
  call_api "$system" "$user" > "$OUTPUTS_DIR/02-static-analysis.md"
  log "  ✓ 02-static-analysis.md"
}

step_security() {
  log "▶ Step 3/8: Security Vulnerability Scan"
  local system user
  system="$(load_file "$SHARED_DIR/project.md")"$'\n\n'"$(load_file "$WORKFLOW_DIR/agents/security-scanner.md")"
  user="$(load_file "$WORKFLOW_DIR/skills/vulnerability-detection.md")"$'\n\n'"$(load_file "$OUTPUTS_DIR/01-context.md")"
  call_api "$system" "$user" > "$OUTPUTS_DIR/03-security-scan.md"
  log "  ✓ 03-security-scan.md"
}

step_style() {
  log "▶ Step 4/8: Style & Standards Check"
  local system user
  system="$(load_file "$SHARED_DIR/project.md")"$'\n\n'"$(load_file "$WORKFLOW_DIR/agents/style-checker.md")"
  user="$(load_file "$WORKFLOW_DIR/skills/coding-standards-validation.md")"$'\n\n'"$(load_file "$OUTPUTS_DIR/01-context.md")"
  call_api "$system" "$user" > "$OUTPUTS_DIR/04-style-check.md"
  log "  ✓ 04-style-check.md"
}

step_complexity() {
  log "▶ Step 5/8: Complexity Analysis"
  local system user
  system="$(load_file "$SHARED_DIR/project.md")"$'\n\n'"$(load_file "$WORKFLOW_DIR/agents/static-analyzer.md")"
  user="$(load_file "$WORKFLOW_DIR/skills/complexity-metrics.md")"$'\n\n'"$(load_file "$OUTPUTS_DIR/01-context.md")"
  call_api "$system" "$user" > "$OUTPUTS_DIR/05-complexity-analysis.md"
  log "  ✓ 05-complexity-analysis.md"
}

step_report() {
  log "▶ Step 6/8: Generate Review Report"
  local system user
  system="$(load_file "$SHARED_DIR/project.md")"$'\n\n'"$(load_file "$WORKFLOW_DIR/agents/reporter.md")"
  user="$(load_file "$WORKFLOW_DIR/skills/report-compilation.md")"$'\n\n'"$(load_file "$OUTPUTS_DIR/02-static-analysis.md")"$'\n\n'"$(load_file "$OUTPUTS_DIR/03-security-scan.md")"$'\n\n'"$(load_file "$OUTPUTS_DIR/04-style-check.md")"$'\n\n'"$(load_file "$OUTPUTS_DIR/05-complexity-analysis.md")"
  call_api "$system" "$user" > "$OUTPUTS_DIR/06-review-report.md"
  log "  ✓ 06-review-report.md"
}

step_evaluate() {
  log "▶ Step 7/8: Evaluate Results"
  local system user
  system="$(load_file "$SHARED_DIR/project.md")"$'\n\n'"$(load_file "$WORKFLOW_DIR/agents/coordinator.md")"
  user="$(load_file "$WORKFLOW_DIR/skills/result-evaluation.md")"$'\n\n'"$(load_file "$OUTPUTS_DIR/01-context.md")"$'\n\n'"$(load_file "$OUTPUTS_DIR/06-review-report.md")"
  call_api "$system" "$user" > "$OUTPUTS_DIR/07-evaluation.md"
  log "  ✓ 07-evaluation.md"
}

step_publish() {
  log "▶ Step 8/8: Publish Findings"
  local system user
  system="$(load_file "$SHARED_DIR/project.md")"$'\n\n'"$(load_file "$WORKFLOW_DIR/agents/reporter.md")"
  user="$(load_file "$WORKFLOW_DIR/skills/output-formatting.md")"$'\n\n'"$(load_file "$OUTPUTS_DIR/06-review-report.md")"$'\n\n'"$(load_file "$OUTPUTS_DIR/07-evaluation.md")"
  call_api "$system" "$user" > "$OUTPUTS_DIR/08-final-report.md"
  log "  ✓ 08-final-report.md"
}

# ── Main ─────────────────────────────────────────────────────────────────────────
main() {
  log "🚀 Starting Code Review Workflow"
  log "   Input: $INPUT"
  log "   Config: $CONFIG_FILE"
  
  # Load configuration
  local config
  config=$(bash "$WORKFLOW_DIR/scripts/utils/load-config.sh" "$CONFIG_FILE")
  
  step_init
  step_static
  step_security
  step_style
  step_complexity
  step_report
  step_evaluate
  step_publish
  
  # Generate artifacts
  bash "$WORKFLOW_DIR/scripts/utils/generate-artifacts.sh" "$OUTPUTS_DIR" "review"
  
  log "✅ Code Review Complete. See outputs/ for results."
  log "   Final report: $OUTPUTS_DIR/08-final-report.md"
}

main "$@"
