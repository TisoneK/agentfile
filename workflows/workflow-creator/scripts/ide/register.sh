#!/usr/bin/env bash
set -euo pipefail

# ── scripts/ide/register.sh ────────────────────────────────────────────────────
# IDE-safe registration script.
# Assembles the generated outputs into a proper workflow folder.
# NO API KEY REQUIRED — pure file I/O only.
# ──────────────────────────────────────────────────────────────────────────────

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
WORKFLOW_DIR="$(cd "$SCRIPT_DIR/../.." && pwd)"
OUTPUTS_DIR="$WORKFLOW_DIR/outputs"
WORKFLOWS_ROOT="$(cd "$WORKFLOW_DIR/../.." && pwd)"

log() { echo "[$(date '+%H:%M:%S')] $*"; }

# ── Validate outputs exist ─────────────────────────────────────────────────────
for required in \
  "$OUTPUTS_DIR/03-workflow.yaml" \
  "$OUTPUTS_DIR/04-agents/_all.md" \
  "$OUTPUTS_DIR/05-skills/_all.md" \
  "$OUTPUTS_DIR/06-scripts/_all.md"; do
  if [[ ! -f "$required" ]]; then
    echo "ERROR: Missing required output: $required"
    echo "Make sure all generation steps completed before registering."
    exit 1
  fi
done

# ── Read workflow name from generated YAML ─────────────────────────────────────
WORKFLOW_NAME=$(grep '^name:' "$OUTPUTS_DIR/03-workflow.yaml" | head -1 | awk '{print $2}' | tr -d '"'"'")
if [[ -z "$WORKFLOW_NAME" ]]; then
  echo "ERROR: Could not determine workflow name from outputs/03-workflow.yaml"
  exit 1
fi

TARGET_DIR="$WORKFLOWS_ROOT/$WORKFLOW_NAME"
log "Registering workflow: $WORKFLOW_NAME"
log "Target directory: $TARGET_DIR"

# ── Create directory structure ─────────────────────────────────────────────────
mkdir -p "$TARGET_DIR"/{agents,skills,scripts/ide,scripts/cli,outputs}

# ── Copy workflow.yaml ─────────────────────────────────────────────────────────
cp "$OUTPUTS_DIR/03-workflow.yaml" "$TARGET_DIR/workflow.yaml"
log "  ✓ workflow.yaml"

# ── Parse ##FILE: === delimiters and extract files ───────────────────────────
parse_files() {
  local source_file="$1"
  local base_dir="$2"

  local current_file=""
  local in_file=false
  local buffer=""

  while IFS= read -r line; do
    if [[ "$line" =~ ^##FILE:\ (.+)##$ ]]; then
      # Flush previous file
      if [[ -n "$current_file" && -n "$buffer" ]]; then
        local target="$base_dir/$current_file"
        mkdir -p "$(dirname "$target")"
        printf '%s\n' "$buffer" > "$target"
        log "  ✓ $current_file"
      fi
      current_file="${BASH_REMATCH[1]}"
      buffer=""
      in_file=true
    elif [[ "$line" == "##END##" ]]; then
      if [[ -n "$current_file" && -n "$buffer" ]]; then
        local target="$base_dir/$current_file"
        mkdir -p "$(dirname "$target")"
        printf '%s\n' "$buffer" > "$target"
        log "  ✓ $current_file"
      fi
      current_file=""
      buffer=""
      in_file=false
    elif [[ "$in_file" == true ]]; then
      if [[ -n "$buffer" ]]; then
        buffer+=$'\n'"$line"
      else
        buffer="$line"
      fi
    fi
  done < "$source_file"
}

log "Extracting agents..."
parse_files "$OUTPUTS_DIR/04-agents/_all.md" "$TARGET_DIR"

log "Extracting skills..."
parse_files "$OUTPUTS_DIR/05-skills/_all.md" "$TARGET_DIR"

log "Extracting scripts..."
parse_files "$OUTPUTS_DIR/06-scripts/_all.md" "$TARGET_DIR"

# ── Make shell scripts executable ─────────────────────────────────────────────
find "$TARGET_DIR/scripts" -name "*.sh" -exec chmod +x {} \; 2>/dev/null || true

# ── Create .gitignore for outputs ─────────────────────────────────────────────
echo "outputs/" > "$TARGET_DIR/.gitignore"

# ── Copy review report ────────────────────────────────────────────────────────
if [[ -f "$OUTPUTS_DIR/07-review.md" ]]; then
  cp "$OUTPUTS_DIR/07-review.md" "$TARGET_DIR/REVIEW.md"
  log "  ✓ REVIEW.md"
fi

echo ""
echo "✅ Workflow '$WORKFLOW_NAME' registered at: $TARGET_DIR"
echo ""
echo "Next steps:"
echo "  IDE:  /agentfile-run:$WORKFLOW_NAME"
echo "  CLI:  export ANTHROPIC_API_KEY=your-key"
echo "        bash $TARGET_DIR/scripts/cli/run.sh"
