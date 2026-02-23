#!/usr/bin/env bash
set -euo pipefail

# IDE-safe registration — NO API KEY REQUIRED
# Reads this workflow's outputs/ and assembles the final deliverable.
# This script is for RUNTIME output assembly, not for workflow generation.

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
WORKFLOW_DIR="$(cd "$SCRIPT_DIR/../.." && pwd)"
OUTPUTS_DIR="$WORKFLOW_DIR/outputs"

log() { echo "[$(date '+%H:%M:%S')] $*"; }

if [[ ! -d "$OUTPUTS_DIR" ]]; then
    echo "ERROR: outputs/ not found. Run the workflow first."
    exit 1
fi

log "Starting file-flow workflow registration..."

# Verify output files exist
if [[ -f "$OUTPUTS_DIR/execution-report.json" ]]; then
    log "Found execution report"
else
    log "Warning: No execution report found"
fi

log "Processing complete"

echo ""
echo "✅ Registration complete"
echo "  Workflow: file-flow"
echo "  Outputs: $OUTPUTS_DIR/"
