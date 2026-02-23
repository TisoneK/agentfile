#!/usr/bin/env bash
set -euo pipefail

# ── scripts/cli/run.sh ─────────────────────────────────────────────────────────
# CLI runtime for code-reviewer. Requires ANTHROPIC_API_KEY.
# Usage: bash scripts/cli/run.sh "src/auth.js"
# ──────────────────────────────────────────────────────────────────────────────

WORKFLOW_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
SHARED_DIR="$(cd "$WORKFLOW_DIR/../../shared" && pwd)"
OUTPUTS_DIR="$WORKFLOW_DIR/outputs"
API_KEY="${ANTHROPIC_API_KEY:?ANTHROPIC_API_KEY is not set}"
MODEL="claude-sonnet-4-6"
mkdir -p "$OUTPUTS_DIR"

INPUT="${1:?Usage: $0 \"<file-or-description>\"}"

log() { echo "[$(date '+%H:%M:%S')] $*"; }

call_api() {
  local system_prompt="$1"
  local user_prompt="$2"
  local max_tokens="${3:-4096}"

  curl -s https://api.anthropic.com/v1/messages \
    -H "x-api-key: $API_KEY" \
    -H "anthropic-version: 2023-06-01" \
    -H "content-type: application/json" \
    -d "$(jq -n \
      --arg model "$MODEL" \
      --arg system "$system_prompt" \
      --arg user "$user_prompt" \
      --argjson max_tokens "$max_tokens" \
      '{
        model: $model,
        max_tokens: $max_tokens,
        system: $system,
        messages: [{ role: "user", content: $user }]
      }')" | jq -r '.content[0].text'
}

load_file() { cat "$1"; }

# ── Step 1: Analyze Code ───────────────────────────────────────────────────────
log "Step 1: Analyze Code"
SYSTEM="$(load_file "$SHARED_DIR/project.md")"$'\n'"$(load_file "$SHARED_DIR/AGENTS.md")"$'\n'"$(load_file "$WORKFLOW_DIR/agents/analyzer.md")"
USER="$(load_file "$WORKFLOW_DIR/skills/code-analysis.md")"$'\n\n'"Input: $INPUT"
call_api "$SYSTEM" "$USER" 4096 > "$OUTPUTS_DIR/01-analysis.md"
log "  ✓ outputs/01-analysis.md"

# ── Step 2: Write Review ───────────────────────────────────────────────────────
log "Step 2: Write Review"
SYSTEM="$(load_file "$SHARED_DIR/project.md")"$'\n'"$(load_file "$SHARED_DIR/AGENTS.md")"$'\n'"$(load_file "$WORKFLOW_DIR/agents/reviewer.md")"
USER="$(load_file "$WORKFLOW_DIR/skills/write-review.md")"$'\n\n'"$(load_file "$OUTPUTS_DIR/01-analysis.md")"
call_api "$SYSTEM" "$USER" 4096 > "$OUTPUTS_DIR/02-review.md"
log "  ✓ outputs/02-review.md"

# ── Step 3: Create Summary ─────────────────────────────────────────────────────
log "Step 3: Create Summary"
SYSTEM="$(load_file "$SHARED_DIR/project.md")"$'\n'"$(load_file "$SHARED_DIR/AGENTS.md")"$'\n'"$(load_file "$WORKFLOW_DIR/agents/summarizer.md")"
USER="$(load_file "$WORKFLOW_DIR/skills/summarize.md")"$'\n\n'"$(load_file "$OUTPUTS_DIR/02-review.md")"
call_api "$SYSTEM" "$USER" 2048 > "$OUTPUTS_DIR/03-summary.md"
log "  ✓ outputs/03-summary.md"

echo ""
echo "✅ Code review complete."
echo "   outputs/01-analysis.md  — technical analysis"
echo "   outputs/02-review.md    — full review report"
echo "   outputs/03-summary.md   — prioritized summary"
