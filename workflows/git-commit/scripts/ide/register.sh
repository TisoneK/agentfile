#!/usr/bin/env bash
set -euo pipefail

# IDE-safe registration — NO API KEY REQUIRED
# Reads this workflow's outputs/ and assembles the final deliverable.
# This script is for RUNTIME output assembly, not for workflow generation.

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
WORKFLOW_DIR="$(cd "$SCRIPT_DIR/../.." && pwd)"
OUTPUTS_DIR="$WORKFLOW_DIR/outputs"

log() { echo "[$(date '+%H:%M:%S')] $*"; }

[[ -d "$OUTPUTS_DIR" ]] || { echo "ERROR: outputs/ not found. Run the workflow first."; exit 1; }

# Create a summary of the git commit workflow execution
SUMMARY_FILE="$OUTPUTS_DIR/commit-summary.md"
cat > "$SUMMARY_FILE" << 'EOF'
# Git Commit Workflow Summary

## Execution Results
EOF

# Append each step's result to the summary
for step_file in "$OUTPUTS_DIR"/*.md; do
    if [[ -f "$step_file" && "$step_file" != *"commit-summary.md" ]]; then
        echo "" >> "$SUMMARY_FILE"
        echo "## $(basename "$step_file" .md | tr '-' ' ' | awk '{for(i=1;i<=NF;i++) $i=toupper(substr($i,1,1)) tolower(substr($i,2))}1')" >> "$SUMMARY_FILE"
        cat "$step_file" >> "$SUMMARY_FILE"
    fi
done

echo ""
echo "✅ Registration complete"
echo "  See outputs/ for generated artifacts"
echo "  Summary available at: $SUMMARY_FILE"
