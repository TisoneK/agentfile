#!/usr/bin/env bash
set -euo pipefail

# ── Usage ───────────────────────────────────────────────────────────────────────
# Usage: scripts/utils/validate-inputs.sh <input-path> [file-type]
# Description: Validate input files exist, are readable, and match expected format
# Called by: scripts/cli/run.sh, scripts/ide/register.sh

# ── Arguments ───────────────────────────────────────────────────────────────────
INPUT_PATH="${1:?Usage: $(basename "$0") <input-path> [file-type]}"
FILE_TYPE="${2:-auto}"

# ── Helper ───────────────────────────────────────────────────────────────────────
log() { echo "[$(date '+%H:%M:%S')] [$(basename "$0")] $*" >&2; }

validate_file() {
  local file="$1"
  local expected_type="$2"
  
  # Check if file exists
  if [[ ! -f "$file" ]]; then
    log "ERROR: File does not exist: $file"
    return 1
  fi
  
  # Check if file is readable
  if [[ ! -r "$file" ]]; then
    log "ERROR: File is not readable: $file"
    return 1
  fi
  
  # Check if file is empty
  if [[ ! -s "$file" ]]; then
    log "ERROR: File is empty: $file"
    return 1
  fi
  
  # Type-specific validation
  case "$expected_type" in
    "json")
      if ! jq empty "$file" 2>/dev/null; then
        log "ERROR: Invalid JSON format: $file"
        return 1
      fi
      ;;
    "markdown"|"md")
      # Basic markdown validation - check for common markdown patterns
      if ! grep -q "^#" "$file" && ! grep -q "^##" "$file"; then
        log "WARNING: No markdown headers found in: $file"
      fi
      ;;
    "yaml"|"yml")
      if ! python3 -c "import yaml; yaml.safe_load(open('$file'))" 2>/dev/null; then
        log "ERROR: Invalid YAML format: $file"
        return 1
      fi
      ;;
    "auto")
      # Auto-detect file type
      if [[ "$file" == *.json ]]; then
        validate_file "$file" "json"
      elif [[ "$file" == *.md ]] || [[ "$file" == *.markdown ]]; then
        validate_file "$file" "markdown"
      elif [[ "$file" == *.yaml ]] || [[ "$file" == *.yml ]]; then
        validate_file "$file" "yaml"
      fi
      ;;
  esac
  
  log "✓ Validated: $file"
  return 0
}

validate_directory() {
  local dir="$1"
  
  if [[ ! -d "$dir" ]]; then
    log "ERROR: Directory does not exist: $dir"
    return 1
  fi
  
  if [[ ! -r "$dir" ]]; then
    log "ERROR: Directory is not readable: $dir"
    return 1
  fi
  
  # Check if directory contains source files
  local file_count
  file_count=$(find "$dir" -type f \( -name "*.py" -o -name "*.js" -o -name "*.ts" -o -name "*.java" -o -name "*.c" -o -name "*.cpp" \) | wc -l)
  
  if [[ "$file_count" -eq 0 ]]; then
    log "WARNING: No source files found in directory: $dir"
  fi
  
  log "✓ Validated directory: $dir ($file_count source files)"
  return 0
}

# ── Main Logic ───────────────────────────────────────────────────────────────────
main() {
  log "Validating input: $INPUT_PATH"
  
  if [[ -f "$INPUT_PATH" ]]; then
    validate_file "$INPUT_PATH" "$FILE_TYPE"
  elif [[ -d "$INPUT_PATH" ]]; then
    validate_directory "$INPUT_PATH"
  else
    log "ERROR: Input path is neither a file nor a directory: $INPUT_PATH"
    exit 1
  fi
  
  log "Input validation completed successfully"
  
  # Output validation result as JSON
  cat << EOF
{
  "input_path": "$INPUT_PATH",
  "type": "$([[ -f "$INPUT_PATH" ]] && echo "file" || echo "directory")",
  "validated": true,
  "timestamp": "$(date -u +%Y-%m-%dT%H:%M:%SZ)"
}
EOF
}

main "$@"
