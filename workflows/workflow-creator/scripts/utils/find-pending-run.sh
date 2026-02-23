#!/usr/bin/env bash
set -euo pipefail

# ── scripts/utils/find-pending-run.sh ─────────────────────────────────────────
# Finds an interrupted workflow creation run in artifacts/.
# Outputs the artifact run directory path to stdout.
#
# Usage:
#   bash scripts/utils/find-pending-run.sh [workflow-name]
#
# If workflow-name is given, searches artifacts/<workflow-name>/
# If not given, finds the most recently modified pending run across all workflows.
# ──────────────────────────────────────────────────────────────────────────────

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/../../../.." && pwd)"
ARTIFACTS_DIR="$PROJECT_ROOT/artifacts"

WORKFLOW_FILTER="${1:-}"

[[ -d "$ARTIFACTS_DIR" ]] || { echo "ERROR: artifacts/ directory not found" >&2; exit 1; }

# Find manifest files not yet registered
FOUND=""
if [[ -n "$WORKFLOW_FILTER" ]]; then
  SEARCH_ROOT="$ARTIFACTS_DIR/$WORKFLOW_FILTER"
  [[ -d "$SEARCH_ROOT" ]] || { echo "ERROR: No artifacts found for workflow: $WORKFLOW_FILTER" >&2; exit 1; }
else
  SEARCH_ROOT="$ARTIFACTS_DIR"
fi

while IFS= read -r manifest; do
  STATUS=""
  if command -v jq &>/dev/null; then
    STATUS=$(jq -r '.status // "unknown"' "$manifest" 2>/dev/null || echo "unknown")
  else
    STATUS=$(grep '"status"' "$manifest" | head -1 | sed 's/.*: *"\(.*\)".*/\1/' || echo "unknown")
  fi

  if [[ "$STATUS" != "registered" ]]; then
    FOUND="$(dirname "$manifest")"
    break
  fi
done < <(find "$SEARCH_ROOT" -name "manifest.json" -not -path "*/build/*" 2>/dev/null | sort -r)

if [[ -z "$FOUND" ]]; then
  echo "ERROR: No pending runs found${WORKFLOW_FILTER:+ for '$WORKFLOW_FILTER'}" >&2
  exit 1
fi

echo "$FOUND"
