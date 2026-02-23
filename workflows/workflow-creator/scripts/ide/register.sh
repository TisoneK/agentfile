#!/usr/bin/env bash
set -euo pipefail

# ── scripts/ide/register.sh ────────────────────────────────────────────────────
# IDE-safe promotion script.
# Validates the artifact staging directory, assembles the clean canonical
# workflow folder (no factory files), archives the run, and writes
# workflow_status.json.
#
# Usage:
#   bash scripts/ide/register.sh <artifact-run-dir>
#   bash scripts/ide/register.sh artifacts/my-workflow/2026-02-23T10-41-22
#
# If no argument given, auto-detects the most recent artifact run.
# NO API KEY REQUIRED — pure file I/O only.
# ──────────────────────────────────────────────────────────────────────────────

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/../../../.." && pwd)"

log()  { echo "[$(date '+%H:%M:%S')] $*"; }
warn() { echo "[$(date '+%H:%M:%S')] WARNING: $*" >&2; }
fail() { echo "[$(date '+%H:%M:%S')] ERROR: $*" >&2; exit 1; }

# ── ##FILE:## delimiter parser ─────────────────────────────────────────────────
parse_delimited() {
  local source_file="$1"
  local base_dir="$2"
  local current_file="" buffer="" in_file=false

  while IFS= read -r line; do
    if [[ "$line" =~ ^(=?)##FILE:\ (.+)##$ ]]; then
      if [[ -n "$current_file" && -n "$buffer" ]]; then
        local target="$base_dir/$current_file"
        mkdir -p "$(dirname "$target")"
        printf '%s\n' "$buffer" > "$target"
        log "    + $current_file"
      fi
      current_file="${BASH_REMATCH[2]}"
      buffer=""
      in_file=true
    elif [[ "$line" == "##END##" ]]; then
      if [[ -n "$current_file" && -n "$buffer" ]]; then
        local target="$base_dir/$current_file"
        mkdir -p "$(dirname "$target")"
        printf '%s\n' "$buffer" > "$target"
        log "    + $current_file"
      fi
      current_file="" buffer="" in_file=false
    elif [[ "$in_file" == true ]]; then
      if [[ -n "$buffer" ]]; then buffer+=$'\n'"$line"; else buffer="$line"; fi
    fi
  done < "$source_file"
}

# ── Resolve artifact run directory ────────────────────────────────────────────
if [[ $# -ge 1 ]]; then
  ARTIFACT_RUN_DIR="$(cd "$1" && pwd)"
else
  ARTIFACT_RUN_DIR=$(find "$PROJECT_ROOT/artifacts" -name "manifest.json" \
    -not -path "*/build/*" 2>/dev/null | sort | tail -1 | xargs -I{} dirname {} 2>/dev/null || true)
  [[ -n "$ARTIFACT_RUN_DIR" ]] || fail "No artifact run found. Pass path as argument."
  log "Auto-detected: $ARTIFACT_RUN_DIR"
fi

MANIFEST="$ARTIFACT_RUN_DIR/manifest.json"
[[ -f "$MANIFEST" ]] || fail "manifest.json not found in $ARTIFACT_RUN_DIR"

# ── Read manifest ──────────────────────────────────────────────────────────────
if command -v jq &>/dev/null; then
  WORKFLOW_NAME=$(jq -r '.workflow' "$MANIFEST")
  RUN_ID=$(jq -r '.run_id' "$MANIFEST")
  MANIFEST_STATUS=$(jq -r '.status' "$MANIFEST")
else
  WORKFLOW_NAME=$(grep '"workflow"' "$MANIFEST" | head -1 | sed 's/.*: *"\(.*\)".*/\1/')
  RUN_ID=$(grep '"run_id"' "$MANIFEST" | head -1 | sed 's/.*: *"\(.*\)".*/\1/')
  MANIFEST_STATUS=$(grep '"status"' "$MANIFEST" | head -1 | sed 's/.*: *"\(.*\)".*/\1/')
fi

[[ -n "$WORKFLOW_NAME" ]] || fail "Could not read 'workflow' from manifest.json"
[[ -n "$RUN_ID"        ]] || fail "Could not read 'run_id' from manifest.json"

log "Workflow: $WORKFLOW_NAME | Run: $RUN_ID | Status: $MANIFEST_STATUS"

# ── Validate readiness ────────────────────────────────────────────────────────
log "Validating artifact set..."
MISSING=()
for f in "01-clarification.md" "02-design.md" "03-workflow.yaml" "07-review.md"; do
  [[ -f "$ARTIFACT_RUN_DIR/$f" ]] || MISSING+=("$f")
done
AGENT_COUNT=$(find "$ARTIFACT_RUN_DIR/04-agents" -name "*.md" 2>/dev/null | wc -l | tr -d ' ')
[[ "$AGENT_COUNT" -gt 0 ]] || MISSING+=("04-agents/<role>.md (none found)")

if [[ ${#MISSING[@]} -gt 0 ]]; then
  echo ""; echo "Missing required artifacts:"; for f in "${MISSING[@]}"; do echo "  - $f"; done; echo ""
  fail "Resolve missing artifacts before promoting."
fi
log "  ✓ All required artifacts present"

# ── Check for name collision ───────────────────────────────────────────────────
TARGET_DIR="$PROJECT_ROOT/workflows/$WORKFLOW_NAME"
if [[ -d "$TARGET_DIR" ]]; then
  warn "workflows/$WORKFLOW_NAME already exists."
  read -r -p "Overwrite? [y/N] " confirm
  [[ "$confirm" =~ ^[Yy]$ ]] || { echo "Promotion cancelled."; exit 0; }
  rm -rf "$TARGET_DIR"
fi

ARCHIVE_DIR="$PROJECT_ROOT/outputs/$WORKFLOW_NAME/$RUN_ID/build"

# ── Assemble CLEAN canonical workflow folder ───────────────────────────────────
# IMPORTANT: Only final deliverables cross the factory→shipped boundary.
# No manifest.json, no numbered prefixes, no _all.md bundles, no design docs.
log "Assembling workflows/$WORKFLOW_NAME (clean — no factory artifacts)..."
mkdir -p "$TARGET_DIR"/{agents,skills,scripts/utils,scripts/cli,scripts/ide,outputs}

# workflow.yaml — strip numbered prefix
cp "$ARTIFACT_RUN_DIR/03-workflow.yaml" "$TARGET_DIR/workflow.yaml"
log "  + workflow.yaml"

# Agents — individual files preferred, fall back to bundle parsing
if find "$ARTIFACT_RUN_DIR/04-agents" -name "*.md" -not -name "_all.md" 2>/dev/null | grep -q .; then
  cp "$ARTIFACT_RUN_DIR/04-agents/"*.md "$TARGET_DIR/agents/" 2>/dev/null || true
  COUNT=$(ls "$TARGET_DIR/agents/"*.md 2>/dev/null | wc -l | tr -d ' ')
  log "  + agents/ ($COUNT files)"
elif [[ -f "$ARTIFACT_RUN_DIR/04-agents/_all.md" ]]; then
  parse_delimited "$ARTIFACT_RUN_DIR/04-agents/_all.md" "$TARGET_DIR"
fi

# Skills
if find "$ARTIFACT_RUN_DIR/05-skills" -name "*.md" -not -name "_all.md" 2>/dev/null | grep -q .; then
  cp "$ARTIFACT_RUN_DIR/05-skills/"*.md "$TARGET_DIR/skills/" 2>/dev/null || true
  log "  + skills/"
elif [[ -f "$ARTIFACT_RUN_DIR/05-skills/_all.md" ]]; then
  parse_delimited "$ARTIFACT_RUN_DIR/05-skills/_all.md" "$TARGET_DIR"
fi

# Utils scripts
if [[ -d "$ARTIFACT_RUN_DIR/06-scripts/utils" ]]; then
  if find "$ARTIFACT_RUN_DIR/06-scripts/utils" -name "*.sh" -o -name "*.ps1" 2>/dev/null | grep -q .; then
    cp "$ARTIFACT_RUN_DIR/06-scripts/utils/"* "$TARGET_DIR/scripts/utils/" 2>/dev/null || true
    log "  + scripts/utils/"
  fi
elif [[ -f "$ARTIFACT_RUN_DIR/06-scripts/utils/_all.md" ]]; then
  parse_delimited "$ARTIFACT_RUN_DIR/06-scripts/utils/_all.md" "$TARGET_DIR"
fi

# CLI scripts
if [[ -d "$ARTIFACT_RUN_DIR/06-scripts/cli" ]]; then
  cp -r "$ARTIFACT_RUN_DIR/06-scripts/cli/." "$TARGET_DIR/scripts/cli/"
  log "  + scripts/cli/"
fi

# IDE scripts
if [[ -d "$ARTIFACT_RUN_DIR/06-scripts/ide" ]]; then
  cp -r "$ARTIFACT_RUN_DIR/06-scripts/ide/." "$TARGET_DIR/scripts/ide/"
  log "  + scripts/ide/"
fi

# Parse any remaining _all.md bundle for scripts (covers cli+ide together)
if [[ -f "$ARTIFACT_RUN_DIR/06-scripts/_all.md" ]]; then
  parse_delimited "$ARTIFACT_RUN_DIR/06-scripts/_all.md" "$TARGET_DIR"
fi

find "$TARGET_DIR/scripts" -name "*.sh" -exec chmod +x {} \; 2>/dev/null || true

# .gitignore — always write, keeps outputs/ clean
echo "outputs/" > "$TARGET_DIR/.gitignore"
log "  + .gitignore"

# ── Write workflow_status.json (provenance pointer — not factory content) ──────
NOW=$(date -u '+%Y-%m-%dT%H:%M:%SZ')
cat > "$TARGET_DIR/workflow_status.json" << JSON
{
  "workflow": "$WORKFLOW_NAME",
  "registered_at": "$NOW",
  "source_run_id": "$RUN_ID",
  "archive": "outputs/$WORKFLOW_NAME/$RUN_ID/build"
}
JSON
log "  + workflow_status.json"

# Verify no factory files leaked into workflows/
LEAKED=()
for forbidden in "manifest.json" "01-clarification.md" "02-design.md" "07-review.md"; do
  [[ -f "$TARGET_DIR/$forbidden" ]] && LEAKED+=("$forbidden")
done
if [[ ${#LEAKED[@]} -gt 0 ]]; then
  warn "Factory files found in workflows/$WORKFLOW_NAME — removing:"
  for f in "${LEAKED[@]}"; do
    warn "  Removing: $f"
    rm -f "$TARGET_DIR/$f"
  done
fi

# ── Archive artifact run ──────────────────────────────────────────────────────
log "Archiving artifact run to outputs/$WORKFLOW_NAME/$RUN_ID/build/ ..."
mkdir -p "$ARCHIVE_DIR"
cp -r "$ARTIFACT_RUN_DIR/." "$ARCHIVE_DIR/"

# Update manifest in archive
if command -v jq &>/dev/null; then
  jq \
    --arg now "$NOW" \
    --arg target "workflows/$WORKFLOW_NAME" \
    --arg archive "outputs/$WORKFLOW_NAME/$RUN_ID/build" \
    '.status = "registered"
     | .updated_at = $now
     | .phases.promotion.status = "completed"
     | .phases.promotion.completed_at = $now
     | .phases.archival.status = "completed"
     | .phases.archival.completed_at = $now
     | .promotion = {"target": $target, "promoted_at": $now, "archive_path": $archive}' \
    "$ARCHIVE_DIR/manifest.json" > "$ARCHIVE_DIR/manifest.json.tmp" \
  && mv "$ARCHIVE_DIR/manifest.json.tmp" "$ARCHIVE_DIR/manifest.json"
  log "  + manifest.json updated in archive (status: registered)"
else
  warn "jq not available — update manifest.json in archive manually."
fi

# Remove staging directory
rm -rf "$ARTIFACT_RUN_DIR"
PARENT="$(dirname "$ARTIFACT_RUN_DIR")"
[[ -d "$PARENT" ]] && [[ -z "$(ls -A "$PARENT" 2>/dev/null)" ]] && rmdir "$PARENT" || true

# ── Summary ───────────────────────────────────────────────────────────────────
echo ""
echo "╔══════════════════════════════════════════════════════╗"
echo "║  ✅ Promotion complete                               ║"
echo "╚══════════════════════════════════════════════════════╝"
echo ""
echo "  Workflow:  $WORKFLOW_NAME"
echo "  Run ID:    $RUN_ID"
echo ""
echo "  Registered at:   workflows/$WORKFLOW_NAME"
echo "  Archived at:     outputs/$WORKFLOW_NAME/$RUN_ID/build"
echo ""
echo "  Next steps:"
echo "    IDE:  /agentfile:run $WORKFLOW_NAME"
echo "    CLI:  bash workflows/$WORKFLOW_NAME/scripts/cli/run.sh \"<input>\""
echo "    New:  /agentfile:create <workflow-name> \"<description>\""
echo ""
