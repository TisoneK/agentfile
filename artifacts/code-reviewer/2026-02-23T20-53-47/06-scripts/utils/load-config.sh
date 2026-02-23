#!/usr/bin/env bash
set -euo pipefail

# ── Usage ───────────────────────────────────────────────────────────────────────
# Usage: scripts/utils/load-config.sh [config-path]
# Description: Load and validate review configuration from JSON file
# Called by: scripts/cli/run.sh, scripts/ide/register.sh

# ── Arguments ───────────────────────────────────────────────────────────────────
CONFIG_PATH="${1:-.review-config.json}"

# ── Helper ───────────────────────────────────────────────────────────────────────
log() { echo "[$(date '+%H:%M:%S')] [$(basename "$0")] $*" >&2; }

# ── Main Logic ───────────────────────────────────────────────────────────────────
main() {
  log "Loading configuration from: $CONFIG_PATH"
  
  # Check if config file exists
  if [[ ! -f "$CONFIG_PATH" ]]; then
    log "Configuration file not found: $CONFIG_PATH"
    log "Using default configuration"
    cat << 'EOF'
{
  "languages": ["python", "javascript", "typescript"],
  "thresholds": {
    "complexity_max": 10,
    "duplication_max": 5,
    "security_critical": true,
    "style_compliance_min": 85
  },
  "exclude": ["node_modules/", ".git/", "build/", "dist/", "__pycache__/"],
  "tools": {
    "static_analyzer": "auto",
    "security_scanner": "auto",
    "style_checker": "auto"
  },
  "output": {
    "formats": ["markdown", "json"],
    "include_code_snippets": true,
    "severity_levels": ["critical", "high", "medium", "low"]
  }
}
EOF
    return 0
  fi
  
  # Validate JSON format
  if ! jq empty "$CONFIG_PATH" 2>/dev/null; then
    log "ERROR: Invalid JSON in configuration file: $CONFIG_PATH"
    exit 1
  fi
  
  # Validate required fields
  if ! jq -e '.languages' "$CONFIG_PATH" >/dev/null; then
    log "ERROR: Missing 'languages' field in configuration"
    exit 1
  fi
  
  if ! jq -e '.thresholds' "$CONFIG_PATH" >/dev/null; then
    log "ERROR: Missing 'thresholds' field in configuration"
    exit 1
  fi
  
  # Output validated configuration
  jq '.' "$CONFIG_PATH"
  log "Configuration loaded and validated successfully"
}

main "$@"
