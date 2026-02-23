#!/usr/bin/env bash
set -euo pipefail

# ── Usage ───────────────────────────────────────────────────────────────────────
# Usage: scripts/utils/generate-artifacts.sh <outputs-dir> <artifact-type>
# Description: Generate review artifacts and metadata for archiving
# Called by: scripts/cli/run.sh, scripts/ide/register.sh

# ── Arguments ───────────────────────────────────────────────────────────────────
OUTPUTS_DIR="${1:?Usage: $(basename "$0") <outputs-dir> <artifact-type>}"
ARTIFACT_TYPE="${2:-review}"

# ── Helper ───────────────────────────────────────────────────────────────────────
log() { echo "[$(date '+%H:%M:%S')] [$(basename "$0")] $*" >&2; }

# ── Main Logic ───────────────────────────────────────────────────────────────────
main() {
  log "Generating artifacts in: $OUTPUTS_DIR"
  
  # Validate outputs directory
  if [[ ! -d "$OUTPUTS_DIR" ]]; then
    log "ERROR: Outputs directory does not exist: $OUTPUTS_DIR"
    exit 1
  fi
  
  # Create artifacts directory
  local artifacts_dir
  artifacts_dir="$OUTPUTS_DIR/artifacts"
  mkdir -p "$artifacts_dir"
  
  # Generate artifact manifest
  local manifest_file="$artifacts_dir/manifest.json"
  
  # Collect all output files
  local output_files
  output_files=$(find "$OUTPUTS_DIR" -name "*.md" -o -name "*.json" -o -name "*.html" | sort)
  
  # Calculate total size
  local total_size=0
  while IFS= read -r file; do
    if [[ -f "$file" ]]; then
      local size
      size=$(stat -f%z "$file" 2>/dev/null || stat -c%s "$file" 2>/dev/null || echo 0)
      total_size=$((total_size + size))
    fi
  done <<< "$output_files"
  
  # Generate manifest
  cat > "$manifest_file" << EOF
{
  "artifact_type": "$ARTIFACT_TYPE",
  "generated_at": "$(date -u +%Y-%m-%dT%H:%M:%SZ)",
  "outputs_directory": "$OUTPUTS_DIR",
  "total_files": $(echo "$output_files" | grep -c .),
  "total_size_bytes": $total_size,
  "files": [
$(echo "$output_files" | while IFS= read -r file; do
  if [[ -f "$file" ]]; then
    local rel_path="${file#$OUTPUTS_DIR/}"
    local size
    size=$(stat -f%z "$file" 2>/dev/null || stat -c%s "$file" 2>/dev/null || echo 0)
    local mtime
    mtime=$(stat -f%Sm -t%Y "$file" 2>/dev/null || stat -c%Y "$file" 2>/dev/null || echo 0)
    echo "    {"
    echo "      \"path\": \"$rel_path\","
    echo "      \"size_bytes\": $size,"
    echo "      \"modified_timestamp\": $mtime,"
    echo "      \"type\": \"$(basename "$file" | sed 's/.*\.//')\""
    echo "    },"
  fi
done | sed '$ s/,$//')
  ],
  "metadata": {
    "generator": "code-reviewer",
    "version": "1.0.0",
    "hostname": "$(hostname)",
    "user": "$(whoami)"
  }
}
EOF
  
  # Generate summary report
  local summary_file="$artifacts_dir/summary.txt"
  cat > "$summary_file" << EOF
Code Review Artifact Summary
==========================
Generated: $(date -u +%Y-%m-%dT%H:%M:%SZ)
Type: $ARTIFACT_TYPE
Directory: $OUTPUTS_DIR

Files Generated: $(echo "$output_files" | grep -c .)
Total Size: $((total_size / 1024)) KB

File List:
$(echo "$output_files" | while IFS= read -r file; do
  if [[ -f "$file" ]]; then
    local rel_path="${file#$OUTPUTS_DIR/}"
    local size
    size=$(stat -f%z "$file" 2>/dev/null || stat -c%s "$file" 2>/dev/null || echo 0)
    printf "  %-40s %8s bytes\n" "$rel_path" "$size"
  fi
done)

Metadata:
- Generator: code-reviewer v1.0.0
- Host: $(hostname)
- User: $(whoami)
EOF
  
  log "✓ Artifacts generated successfully"
  log "  Manifest: $manifest_file"
  log "  Summary: $summary_file"
  log "  Total files: $(echo "$output_files" | grep -c .)"
  log "  Total size: $((total_size / 1024)) KB"
  
  # Output manifest content
  cat "$manifest_file"
}

main "$@"
