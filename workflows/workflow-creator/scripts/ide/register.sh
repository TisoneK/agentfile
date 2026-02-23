#!/usr/bin/env bash
set -euo pipefail

# ── scripts/ide/register.sh ────────────────────────────────────────────────────
# IDE-safe promotion script.
# Validates the artifact staging directory, assembles the canonical workflow
# folder, archives the artifact run, and writes workflow_status.json.
#
# Usage:
#   bash scripts/ide/register.sh <artifact-run-dir>
#   bash scripts/ide/register.sh artifacts/dir-structure/2026-02-23T10-41-22
#
# If no argument is given, auto-detects the most recent artifact run.
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
    if [[ "$line" =~ ^##FILE:\ (.+)##$ ]]; then
      if [[ -n "$current_file" && -n "$buffer" ]]; then
        local target="$base_dir/$current_file"
        mkdir -p "$(dirname "$target")"
        printf '%s\n' "$buffer" > "$target"
        log "    + $current_file"
      fi
      current_file="${BASH_REMATCH[1]}"
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
  [[ -n "$ARTIFACT_RUN_DIR" ]] || fail "No artifact run found. Pass path as argument: bash register.sh artifacts/<workflow>/<run-id>"
  log "Auto-detected: $ARTIFACT_RUN_DIR"
fi

MANIFEST="$ARTIFACT_RUN_DIR/manifest.json"
[[ -f "$MANIFEST" ]] || fail "manifest.json not found in $ARTIFACT_RUN_DIR"

# ── Read manifest ──────────────────────────────────────────────────────────────
if command -v jq &>/dev/null; then
  WORKFLOW_NAME=$(jq -r '.workflow' "$MANIFEST")
  RUN_ID=$(jq -r '.run_id' "$MANIFEST")
else
  WORKFLOW_NAME=$(grep '"workflow"' "$MANIFEST" | head -1 | sed 's/.*: *"\(.*\)".*/\1/')
  RUN_ID=$(grep '"run_id"' "$MANIFEST" | head -1 | sed 's/.*: *"\(.*\)".*/\1/')
fi

[[ -n "$WORKFLOW_NAME" ]] || fail "Could not read 'workflow' from manifest.json"
[[ -n "$RUN_ID"        ]] || fail "Could not read 'run_id' from manifest.json"

log "Workflow: $WORKFLOW_NAME | Run: $RUN_ID"

# ── Validate required artifacts ───────────────────────────────────────────────
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
log "  All required artifacts present"

# ── Check for name collision ───────────────────────────────────────────────────
TARGET_DIR="$PROJECT_ROOT/workflows/$WORKFLOW_NAME"
if [[ -d "$TARGET_DIR" ]]; then
  warn "workflows/$WORKFLOW_NAME already exists."
  read -r -p "Overwrite? [y/N] " confirm
  [[ "$confirm" =~ ^[Yy]$ ]] || { echo "Promotion cancelled."; exit 0; }
fi

ARCHIVE_DIR="$PROJECT_ROOT/outputs/$WORKFLOW_NAME/$RUN_ID/build"

# ── Assemble canonical workflow folder ────────────────────────────────────────
log "Assembling workflows/$WORKFLOW_NAME ..."
mkdir -p "$TARGET_DIR"/{agents,skills,scripts/ide,scripts/cli,outputs}

cp "$ARTIFACT_RUN_DIR/03-workflow.yaml" "$TARGET_DIR/workflow.yaml"
log "  + workflow.yaml"

# Agents — support both individual files and _all.md bundle
if find "$ARTIFACT_RUN_DIR/04-agents" -name "*.md" -not -name "_all.md" 2>/dev/null | grep -q .; then
  cp "$ARTIFACT_RUN_DIR/04-agents/"*.md "$TARGET_DIR/agents/"
  log "  + agents/ ($(ls "$TARGET_DIR/agents/"*.md 2>/dev/null | wc -l | tr -d ' ') files)"
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

# Scripts
if [[ -d "$ARTIFACT_RUN_DIR/06-scripts/ide" ]]; then
  cp -r "$ARTIFACT_RUN_DIR/06-scripts/ide/." "$TARGET_DIR/scripts/ide/"
  log "  + scripts/ide/"
fi
if [[ -d "$ARTIFACT_RUN_DIR/06-scripts/cli" ]]; then
  cp -r "$ARTIFACT_RUN_DIR/06-scripts/cli/." "$TARGET_DIR/scripts/cli/"
  log "  + scripts/cli/"
fi
if [[ -f "$ARTIFACT_RUN_DIR/06-scripts/_all.md" ]]; then
  parse_delimited "$ARTIFACT_RUN_DIR/06-scripts/_all.md" "$TARGET_DIR"
fi
find "$TARGET_DIR/scripts" -name "*.sh" -exec chmod +x {} \; 2>/dev/null || true

cp "$ARTIFACT_RUN_DIR/07-review.md" "$TARGET_DIR/REVIEW.md"
log "  + REVIEW.md"

echo "outputs/" > "$TARGET_DIR/.gitignore"
log "  + .gitignore"

# ── Write workflow_status.json ────────────────────────────────────────────────
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

# ── Archive artifact run ──────────────────────────────────────────────────────
log "Archiving to outputs/$WORKFLOW_NAME/$RUN_ID/build/ ..."
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
  log "  + manifest.json (status: registered)"
else
  warn "jq not available — update manifest.json in archive manually."
fi

# Remove staging directory
rm -rf "$ARTIFACT_RUN_DIR"
PARENT="$(dirname "$ARTIFACT_RUN_DIR")"
[[ -d "$PARENT" ]] && [[ -z "$(ls -A "$PARENT")" ]] && rmdir "$PARENT" || true

echo ""
echo "  Workflow '$WORKFLOW_NAME' registered at:  workflows/$WORKFLOW_NAME"
echo "  Artifact archived at:  outputs/$WORKFLOW_NAME/$RUN_ID/build"
echo ""
echo "Next steps:"
echo "  IDE:  /agentfile:run $WORKFLOW_NAME <input>"
echo "  CLI:  bash workflows/$WORKFLOW_NAME/scripts/cli/run.sh"
