#!/usr/bin/env bash
set -euo pipefail

# register.sh
# Reads the generated outputs and assembles the new workflow folder.
# Parses ##FILE: === delimiters to extract individual files.

WORKFLOW_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
OUTPUTS_DIR="$WORKFLOW_DIR/outputs"
WORKFLOWS_ROOT="$WORKFLOW_DIR/../../.."

# ── Read workflow name from generated YAML ─────────────────────────────────────
WORKFLOW_NAME=$(grep '^name:' "$OUTPUTS_DIR/03-workflow.yaml" | head -1 | awk '{print $2}' | tr -d '"'"'")
if [[ -z "$WORKFLOW_NAME" ]]; then
  echo "ERROR: Could not determine workflow name from outputs/03-workflow.yaml"
  exit 1
fi

TARGET_DIR="$WORKFLOWS_ROOT/$WORKFLOW_NAME"
echo "Registering workflow: $WORKFLOW_NAME"
echo "Target directory: $TARGET_DIR"

# ── Create directory structure ─────────────────────────────────────────────────
mkdir -p "$TARGET_DIR"/{agents,skills,scripts,outputs}

# ── Copy workflow.yaml ─────────────────────────────────────────────────────────
cp "$OUTPUTS_DIR/03-workflow.yaml" "$TARGET_DIR/workflow.yaml"
echo "  ✓ workflow.yaml"

# ── Parse and extract delimited files ─────────────────────────────────────────
parse_files() {
  local source_file="$1"
  local base_dir="$2"

  local current_file=""
  local in_file=false
  local buffer=""

  while IFS= read -r line; do
    if [[ "$line" =~ ^##FILE:\ (.+)##$ ]]; then
      # Save previous file if any
      if [[ -n "$current_file" && -n "$buffer" ]]; then
        local target="$base_dir/$current_file"
        mkdir -p "$(dirname "$target")"
        echo "$buffer" > "$target"
        echo "  ✓ $current_file"
      fi
      current_file="${BASH_REMATCH[1]}"
      buffer=""
      in_file=true
    elif [[ "$line" == "##END##" ]]; then
      if [[ -n "$current_file" && -n "$buffer" ]]; then
        local target="$base_dir/$current_file"
        mkdir -p "$(dirname "$target")"
        echo "$buffer" > "$target"
        echo "  ✓ $current_file"
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

echo "Extracting agents..."
parse_files "$OUTPUTS_DIR/04-agents/_all.md" "$TARGET_DIR"

echo "Extracting skills..."
parse_files "$OUTPUTS_DIR/05-skills/_all.md" "$TARGET_DIR"

echo "Extracting scripts..."
parse_files "$OUTPUTS_DIR/06-scripts/_all.md" "$TARGET_DIR"

# ── Make scripts executable ────────────────────────────────────────────────────
chmod +x "$TARGET_DIR"/scripts/*.sh 2>/dev/null || true

# ── Create .gitignore for outputs ──────────────────────────────────────────────
echo "outputs/" > "$TARGET_DIR/.gitignore"

# ── Copy review report ─────────────────────────────────────────────────────────
cp "$OUTPUTS_DIR/07-review.md" "$TARGET_DIR/REVIEW.md"

echo ""
echo "✅ Workflow '$WORKFLOW_NAME' registered at: $TARGET_DIR"
echo ""
echo "To run it:"
echo "  export ANTHROPIC_API_KEY=your-key"
echo "  export WORKFLOW_REQUEST='your request'"
echo "  bash $TARGET_DIR/scripts/run.sh"
