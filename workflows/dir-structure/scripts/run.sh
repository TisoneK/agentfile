#!/usr/bin/env bash
set -euo pipefail

WORKFLOW_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
SHARED_DIR="$WORKFLOW_DIR/../../../shared"
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

# Step 1
log "▶ Step 1: First Step"
SYSTEM="$(load "$SHARED_DIR/project.md")"$'\n\n'"$(load "$SHARED_DIR/AGENTS.md")"$'\n\n'"$(load "$WORKFLOW_DIR/../agents/agent.md")"
USER="$(load "$WORKFLOW_DIR/../skills/skill.md")"$'\n\n---\n\n'"$AGENT_INPUT"
call_api "$SYSTEM" "$USER" > "$OUTPUTS_DIR/01-result.md"
gate "First Step" "$OUTPUTS_DIR/01-result.md"

log "✅ Done."
