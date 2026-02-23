#!/usr/bin/env bash
set -euo pipefail

# ── Usage ───────────────────────────────────────────────────────────────────────
# Usage: scripts/utils/find-source-files.sh <target-path> [config-json]
# Description: Discover source files in target path, applying exclusion patterns
# Called by: scripts/cli/run.sh, scripts/ide/register.sh

# ── Arguments ───────────────────────────────────────────────────────────────────
TARGET_PATH="${1:?Usage: $(basename "$0") <target-path> [config-json]}"
CONFIG_JSON="${2:-}"

# ── Helper ───────────────────────────────────────────────────────────────────────
log() { echo "[$(date '+%H:%M:%S')] [$(basename "$0")] $*" >&2; }

# ── Main Logic ───────────────────────────────────────────────────────────────────
main() {
  log "Discovering source files in: $TARGET_PATH"
  
  # Validate target path
  if [[ ! -e "$TARGET_PATH" ]]; then
    log "ERROR: Target path does not exist: $TARGET_PATH"
    exit 1
  fi
  
  # Default exclusion patterns
  local exclude_patterns=(
    "node_modules/"
    ".git/"
    "build/"
    "dist/"
    "__pycache__/"
    "*.min.js"
    "*.min.css"
    ".DS_Store"
    "Thumbs.db"
    "*.log"
    "*.tmp"
  )
  
  # Load additional exclusions from config if provided
  if [[ -n "$CONFIG_JSON" ]]; then
    local config_excludes
    config_excludes=$(echo "$CONFIG_JSON" | jq -r '.exclude[]? // empty' 2>/dev/null || true)
    while IFS= read -r pattern; do
      if [[ -n "$pattern" ]]; then
        exclude_patterns+=("$pattern")
      fi
    done <<< "$config_excludes"
  fi
  
  # Build find command with exclusions
  local find_cmd=("find" "$TARGET_PATH" "-type" "f")
  
  # Add exclusion patterns
  for pattern in "${exclude_patterns[@]}"; do
    find_cmd+=("-not" "-path" "*/$pattern")
  done
  
  # Language-specific file extensions
  local extensions=(
    "*.py" "*.js" "*.ts" "*.jsx" "*.tsx" "*.java" "*.c" "*.cpp" "*.h"
    "*.hpp" "*.cs" "*.go" "*.rb" "*.php" "*.swift" "*.kt" "*.rs" "*.scala"
  )
  
  # Add file extension filters
  local ext_conditions=()
  for ext in "${extensions[@]}"; do
    ext_conditions+=("-name" "$ext")
  done
  
  # Combine conditions with -o (OR)
  for ((i=0; i<${#ext_conditions[@]}; i+=2)); do
    if [[ $i -gt 0 ]]; then
      find_cmd+=("-o")
    fi
    find_cmd+=("${ext_conditions[i]}" "${ext_conditions[i+1]}")
  done
  
  # Execute find command and output JSON
  local files_json
  files_json=$("${find_cmd[@]}" | sort | jq -R -s 'split("\n") | map(select(length > 0)) | {
    files: .,
    count: length,
    target_path: $TARGET_PATH,
    discovered_at: (now | strftime("%Y-%m-%dT%H:%M:%S%z"))
  }')
  
  # Add language detection
  files_json=$(echo "$files_json" | jq '
    .files |= map(
      . as $file |
      {
        path: $file,
        language: (
          if endswith(".py") then "python"
          elif endswith(".js") or endswith(".jsx") then "javascript"
          elif endswith(".ts") or endswith(".tsx") then "typescript"
          elif endswith(".java") then "java"
          elif endswith(".c") or endswith(".h") then "c"
          elif endswith(".cpp") or endswith(".hpp") then "cpp"
          elif endswith(".cs") then "csharp"
          elif endswith(".go") then "go"
          elif endswith(".rb") then "ruby"
          elif endswith(".php") then "php"
          elif endswith(".swift") then "swift"
          elif endswith(".kt") then "kotlin"
          elif endswith(".rs") then "rust"
          elif endswith(".scala") then "scala"
          else "unknown"
          end
        ),
        size: (try ($file | test("r") and ($file | test("f")) | ($file | test("r") and ($file | test("f"))) catch null)
      }
    )
  ')
  
  echo "$files_json"
  log "Found $(echo "$files_json" | jq '.count') source files"
}

main "$@"
