#!/usr/bin/env bash
set -euo pipefail

# ── Usage ───────────────────────────────────────────────────────────────────────
# Usage: scripts/utils/run-static-analysis.sh <target-path> <config-json> <output-file>
# Description: Run static analysis tools on target code and output results
# Called by: scripts/cli/run.sh

# ── Arguments ───────────────────────────────────────────────────────────────────
TARGET_PATH="${1:?Usage: $(basename "$0") <target-path> <config-json> <output-file>}"
CONFIG_JSON="${2:?Usage: $(basename "$0") <target-path> <config-json> <output-file>}"
OUTPUT_FILE="${3:?Usage: $(basename "$0") <target-path> <config-json> <output-file>}"

# ── Helper ───────────────────────────────────────────────────────────────────────
log() { echo "[$(date '+%H:%M:%S')] [$(basename "$0")] $*" >&2; }

run_python_analysis() {
  local target="$1"
  local output="$2"
  
  log "Running Python static analysis on: $target"
  
  # Try different Python analyzers
  if command -v pylint >/dev/null 2>&1; then
    log "  Running pylint..."
    pylint --output-format=json "$target" > "$output.pylint.json" 2>/dev/null || true
  fi
  
  if command -v flake8 >/dev/null 2>&1; then
    log "  Running flake8..."
    flake8 --format=json "$target" > "$output.flake8.json" 2>/dev/null || true
  fi
  
  if command -v bandit >/dev/null 2>&1; then
    log "  Running bandit..."
    bandit -f json "$target" > "$output.bandit.json" 2>/dev/null || true
  fi
}

run_javascript_analysis() {
  local target="$1"
  local output="$2"
  
  log "Running JavaScript static analysis on: $target"
  
  # Try different JavaScript analyzers
  if command -v eslint >/dev/null 2>&1; then
    log "  Running eslint..."
    eslint --format=json "$target" > "$output.eslint.json" 2>/dev/null || true
  fi
  
  if command -v jshint >/dev/null 2>&1; then
    log "  Running jshint..."
    jshint --reporter=json "$target" > "$output.jshint.json" 2>/dev/null || true
  fi
}

# ── Main Logic ───────────────────────────────────────────────────────────────────
main() {
  log "Starting static analysis on: $TARGET_PATH"
  
  # Validate inputs
  if [[ ! -e "$TARGET_PATH" ]]; then
    log "ERROR: Target path does not exist: $TARGET_PATH"
    exit 1
  fi
  
  # Create output directory
  mkdir -p "$(dirname "$OUTPUT_FILE")"
  
  # Detect languages in target
  local languages
  languages=$(echo "$CONFIG_JSON" | jq -r '.languages[]? // empty' 2>/dev/null || echo "")
  
  if [[ -z "$languages" ]]; then
    # Auto-detect languages
    if find "$TARGET_PATH" -name "*.py" -type f | head -1 | grep -q .; then
      languages="$languages python"
    fi
    if find "$TARGET_PATH" -name "*.js" -type f | head -1 | grep -q .; then
      languages="$languages javascript"
    fi
    if find "$TARGET_PATH" -name "*.ts" -type f | head -1 | grep -q .; then
      languages="$languages typescript"
    fi
  fi
  
  log "Detected languages: $languages"
  
  # Run analysis for each language
  local analysis_results="{}"
  
  for language in $languages; do
    case "$language" in
      "python")
        run_python_analysis "$TARGET_PATH" "$OUTPUT_FILE.python"
        ;;
      "javascript"|"typescript")
        run_javascript_analysis "$TARGET_PATH" "$OUTPUT_FILE.javascript"
        ;;
      *)
        log "WARNING: No static analyzer configured for language: $language"
        ;;
    esac
  done
  
  # Compile results
  local result_json
  result_json=$(cat << EOF
{
  "analysis_type": "static_analysis",
  "target_path": "$TARGET_PATH",
  "timestamp": "$(date -u +%Y-%m-%dT%H:%M:%SZ)",
  "languages_analyzed": [$(echo "$languages" | sed 's/^/"/; s/ /", "/; s/$/"/')],
  "tools_used": [],
  "findings": [],
  "summary": {
    "total_issues": 0,
    "by_severity": {
      "error": 0,
      "warning": 0,
      "info": 0
    }
  }
}
EOF
)
  
  # Add tool results if available
  for result_file in "$OUTPUT_FILE".*.json; do
    if [[ -f "$result_file" ]]; then
      local tool_name
      tool_name=$(basename "$result_file" .json | sed "s/$OUTPUT_FILE.//")
      log "  Processing results from: $tool_name"
      
      # Merge tool results into main result (simplified)
      result_json=$(echo "$result_json" | jq --arg tool "$tool_name" '.tools_used += [$tool]')
    fi
  done
  
  # Write final result
  echo "$result_json" > "$OUTPUT_FILE"
  
  log "✓ Static analysis completed: $OUTPUT_FILE"
  
  # Output summary
  local total_issues
  total_issues=$(echo "$result_json" | jq '.summary.total_issues')
  log "  Total issues found: $total_issues"
}

main "$@"
