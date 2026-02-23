#!/usr/bin/env bash
set -euo pipefail

# ── Usage ───────────────────────────────────────────────────────────────────────
# Usage: scripts/utils/write-output.sh <content-file> <output-path>
# Description: Write content to output path, creating parent directories as needed
# Called by: scripts/cli/run.sh, scripts/ide/register.sh

# ── Arguments ───────────────────────────────────────────────────────────────────
CONTENT_FILE="${1:?Usage: $(basename "$0") <content-file> <output-path>}"
OUTPUT_PATH="${2:?Usage: $(basename "$0") <content-file> <output-path>}"

# ── Helper ───────────────────────────────────────────────────────────────────────
log() { echo "[$(date '+%H:%M:%S')] [$(basename "$0")] $*" >&2; }

# ── Main Logic ───────────────────────────────────────────────────────────────────
main() {
  log "Writing output: $CONTENT_FILE -> $OUTPUT_PATH"
  
  # Validate input file
  if [[ ! -f "$CONTENT_FILE" ]]; then
    log "ERROR: Content file does not exist: $CONTENT_FILE"
    exit 1
  fi
  
  if [[ ! -r "$CONTENT_FILE" ]]; then
    log "ERROR: Content file is not readable: $CONTENT_FILE"
    exit 1
  fi
  
  # Create parent directories if they don't exist
  local parent_dir
  parent_dir="$(dirname "$OUTPUT_PATH")"
  if [[ ! -d "$parent_dir" ]]; then
    log "Creating parent directory: $parent_dir"
    mkdir -p "$parent_dir"
  fi
  
  # Copy content to output path
  cp "$CONTENT_FILE" "$OUTPUT_PATH"
  
  # Verify the write was successful
  if [[ ! -f "$OUTPUT_PATH" ]]; then
    log "ERROR: Failed to write output file: $OUTPUT_PATH"
    exit 1
  fi
  
  # Output metadata
  local file_size
  file_size=$(stat -f%z "$OUTPUT_PATH" 2>/dev/null || stat -c%s "$OUTPUT_PATH" 2>/dev/null || echo "unknown")
  
  log "✓ Output written successfully: $OUTPUT_PATH ($file_size bytes)"
  
  # Output result as JSON
  cat << EOF
{
  "content_file": "$CONTENT_FILE",
  "output_path": "$OUTPUT_PATH",
  "file_size": $file_size,
  "timestamp": "$(date -u +%Y-%m-%dT%H:%M:%SZ)",
  "success": true
}
EOF
}

main "$@"
