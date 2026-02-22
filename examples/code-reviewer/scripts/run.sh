#!/usr/bin/env bash
set -euo pipefail

# Agentfile reference runtime — code-reviewer
# Usage: AGENT_API_KEY=sk-... AGENT_INPUT="path/to/code.py" bash scripts/run.sh

WORKFLOW_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
SHARED_DIR="$WORKFLOW_DIR/../../../../shared"
OUTPUTS_DIR="$WORKFLOW_DIR/../outputs"
API_KEY="${AGENT_API_KEY:?AGENT_API_KEY is not set}"
MODEL="${AGENT_MODEL:-claude-sonnet-4-6}"
mkdir -p "$OUTPUTS_DIR"

call_api() {
  local system="$1" user="$2" max_tokens="${3:-4096}" temperature="${4:-0.3}"
  curl -s https://api.anthropic.com/v1/messages \
    -H "x-api-key: $API_KEY" \
    -H "anthropic-version: 2023-06-01" \
    -H "content-type: application/json" \
    -d "$(jq -n \
      --arg model "$MODEL" --arg system "$system" --arg user "$user" \
      --argjson max_tokens "$max_tokens" --argjson temperature "$temperature" \
      '{model:$model,max_tokens:$max_tokens,temperature:$temperature,system:$system,messages:[{role:"user",content:$user}]}')" \
  | jq -r '.content[0].text'
}

load() { cat "$1"; }

gate() {
  local name="$1" file="$2"
  echo ""; echo "══ GATE: $name ══"; cat "$file"; echo ""
  read -rp "Approve? [y/N] " c
  [[ "$c" == "y" || "$c" == "Y" ]] || { echo "Aborted."; exit 1; }
}

log() { echo "[$(date '+%H:%M:%S')] $*"; }

# Read input — supports file path or inline code
read_input() {
  if [[ -f "$AGENT_INPUT" ]]; then
    cat "$AGENT_INPUT"
  else
    echo "$AGENT_INPUT"
  fi
}

# Step 1: Analyze
log "▶ Step 1/2: Analyze Code"
SYSTEM="$(load "$SHARED_DIR/project.md")"$'\n\n'"$(load "$SHARED_DIR/AGENTS.md")"$'\n\n'"$(load "$WORKFLOW_DIR/../agents/analyzer.md")"
USER="$(load "$WORKFLOW_DIR/../skills/code-analysis.md")"$'\n\n---\n\nCode to analyze:\n\n```\n'"$(read_input)"$'\n```'
call_api "$SYSTEM" "$USER" > "$OUTPUTS_DIR/01-analysis.md"
log "  ✓ outputs/01-analysis.md"

# Step 2: Review
log "▶ Step 2/2: Write Review"
SYSTEM="$(load "$SHARED_DIR/project.md")"$'\n\n'"$(load "$SHARED_DIR/AGENTS.md")"$'\n\n'"$(load "$WORKFLOW_DIR/../agents/reviewer.md")"
USER="$(load "$WORKFLOW_DIR/../skills/write-review.md")"$'\n\n---\n\nAnalysis:\n\n'"$(load "$OUTPUTS_DIR/01-analysis.md")"
call_api "$SYSTEM" "$USER" > "$OUTPUTS_DIR/02-review.md"
gate "Review" "$OUTPUTS_DIR/02-review.md"

log "✅ Done. Review saved to outputs/02-review.md"
