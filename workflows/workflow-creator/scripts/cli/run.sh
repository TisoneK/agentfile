#!/usr/bin/env bash
set -euo pipefail

# ── Configuration ──────────────────────────────────────────────────────────────
WORKFLOW_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$WORKFLOW_DIR/../../../.." && pwd)"
SHARED_DIR="$PROJECT_ROOT/shared"
API_KEY="${ANTHROPIC_API_KEY:?ANTHROPIC_API_KEY is not set}"
MODEL="claude-sonnet-4-6"

# Artifact staging — all generation files go here, not in outputs/
RUN_ID="$(date -u '+%Y-%m-%dT%H-%M-%S')"
WORKFLOW_NAME_PLACEHOLDER="__WORKFLOW_NAME__"  # resolved after clarify step
ARTIFACT_BASE="$PROJECT_ROOT/artifacts"
# ARTIFACT_DIR is set after step 1 once workflow name is known from WORKFLOW_REQUEST
# For now, use a temp dir; it will be renamed after clarification
ARTIFACT_DIR="$ARTIFACT_BASE/.pending-$RUN_ID"
mkdir -p "$ARTIFACT_DIR"

# ── Helper Functions ────────────────────────────────────────────────────────────
call_api() {
  local system_prompt="$1"
  local user_prompt="$2"
  local max_tokens="${3:-4096}"
  local temperature="${4:-0.3}"

  curl -s https://api.anthropic.com/v1/messages \
    -H "x-api-key: $API_KEY" \
    -H "anthropic-version: 2023-06-01" \
    -H "content-type: application/json" \
    -d "$(jq -n \
      --arg model "$MODEL" \
      --arg system "$system_prompt" \
      --arg user "$user_prompt" \
      --argjson max_tokens "$max_tokens" \
      --argjson temperature "$temperature" \
      '{
        model: $model,
        max_tokens: $max_tokens,
        temperature: $temperature,
        system: $system,
        messages: [{ role: "user", content: $user }]
      }')" | jq -r '.content[0].text'
}

load_file() { cat "$1"; }

human_gate() {
  local step_name="$1"
  local output_file="$2"
  echo ""
  echo "══════════════════════════════════════════════════════"
  echo "  ⏸  GATE: $step_name"
  echo "  📄 Output: $output_file"
  echo "══════════════════════════════════════════════════════"
  echo ""
  cat "$output_file"
  echo ""
  echo "══════════════════════════════════════════════════════"
  read -rp "  Approve and continue? [y/N] " confirm
  if [[ "$confirm" != "y" && "$confirm" != "Y" ]]; then
    log "Aborted at gate: $step_name"
    exit 1
  fi
}

log() { echo "[$(date '+%H:%M:%S')] $*"; }

# ── Steps ───────────────────────────────────────────────────────────────────────
step_clarify() {
  log "▶ Step 1/8: Clarify Request"
  local system
  system="$(load_file "$SHARED_DIR/project.md")"$'\n\n'"$(load_file "$SHARED_DIR/AGENTS.md")"$'\n\n'"$(load_file "$WORKFLOW_DIR/agents/analyst.md")"
  local user
  user="$(load_file "$WORKFLOW_DIR/skills/ask-clarifying.md")"$'\n\n'"---"$'\n\n'"User's workflow request:"$'\n'"$WORKFLOW_REQUEST"

  call_api "$system" "$user" > "$ARTIFACT_DIR/01-clarification.md"
  human_gate "Clarify Request" "$ARTIFACT_DIR/01-clarification.md"

  # Now that we have clarification, extract workflow name and rename artifact dir
  local wf_name
  wf_name=$(grep -i "^## Workflow" "$ARTIFACT_DIR/01-clarification.md" | head -1 | sed 's/.*: *//' | tr '[:upper:]' '[:lower:]' | tr ' ' '-' | tr -cd 'a-z0-9-' || true)
  if [[ -z "$wf_name" ]]; then
    wf_name=$(echo "$WORKFLOW_REQUEST" | grep -oP "(?<=named )[a-z0-9-]+" | head -1 || true)
  fi
  if [[ -n "$wf_name" ]]; then
    local final_dir="$ARTIFACT_BASE/$wf_name/$RUN_ID"
    mkdir -p "$(dirname "$final_dir")"
    mv "$ARTIFACT_DIR" "$final_dir"
    ARTIFACT_DIR="$final_dir"
    log "Artifact directory: $ARTIFACT_DIR"
  fi
}

step_design() {
  log "▶ Step 2/8: Design Workflow"
  local system
  system="$(load_file "$SHARED_DIR/project.md")"$'\n\n'"$(load_file "$SHARED_DIR/AGENTS.md")"$'\n\n'"$(load_file "$WORKFLOW_DIR/agents/architect.md")"
  local user
  user="$(load_file "$WORKFLOW_DIR/skills/design-workflow.md")"$'\n\n'"---"$'\n\n'"Clarification summary:"$'\n'"$(load_file "$ARTIFACT_DIR/01-clarification.md")"

  call_api "$system" "$user" > "$ARTIFACT_DIR/02-design.md"
  human_gate "Design Workflow" "$ARTIFACT_DIR/02-design.md"
}

step_generate_config() {
  log "▶ Step 3/8: Generate workflow.yaml"
  local system
  system="$(load_file "$SHARED_DIR/project.md")"$'\n\n'"$(load_file "$SHARED_DIR/AGENTS.md")"$'\n\n'"$(load_file "$WORKFLOW_DIR/agents/generator.md")"
  local user
  user="$(load_file "$WORKFLOW_DIR/skills/generate-yaml.md")"$'\n\n'"---"$'\n\n'"Design document:"$'\n'"$(load_file "$ARTIFACT_DIR/02-design.md")"$'\n\n'"Task: Generate ONLY the workflow.yaml file. Output the raw YAML with no surrounding prose or code fences."

  call_api "$system" "$user" > "$ARTIFACT_DIR/03-workflow.yaml"
  log "  ✓ Generated: $ARTIFACT_DIR/03-workflow.yaml"
}

step_generate_agents() {
  log "▶ Step 4/8: Generate Agent Files"
  mkdir -p "$ARTIFACT_DIR/04-agents"
  local system
  system="$(load_file "$SHARED_DIR/project.md")"$'\n\n'"$(load_file "$SHARED_DIR/AGENTS.md")"$'\n\n'"$(load_file "$WORKFLOW_DIR/agents/generator.md")"
  local user
  user="$(load_file "$WORKFLOW_DIR/skills/generate-agent.md")"$'\n\n'"---"$'\n\n'"Design document:"$'\n'"$(load_file "$ARTIFACT_DIR/02-design.md")"$'\n\n'"Task: Generate ALL agent .md files. Delimit each file with:"$'\n'"=##FILE: agents/<n>.md##"$'\n'"<contents>"$'\n'"##END##"

  call_api "$system" "$user" > "$ARTIFACT_DIR/04-agents/_all.md"
  log "  ✓ Generated: $ARTIFACT_DIR/04-agents/_all.md"
}

step_generate_skills() {
  log "▶ Step 5/8: Generate Skill Files"
  mkdir -p "$ARTIFACT_DIR/05-skills"
  local system
  system="$(load_file "$SHARED_DIR/project.md")"$'\n\n'"$(load_file "$SHARED_DIR/AGENTS.md")"$'\n\n'"$(load_file "$WORKFLOW_DIR/agents/generator.md")"
  local user
  user="$(load_file "$WORKFLOW_DIR/skills/generate-skill.md")"$'\n\n'"---"$'\n\n'"Design document:"$'\n'"$(load_file "$ARTIFACT_DIR/02-design.md")"$'\n\n'"Task: Generate ALL skill .md files. Delimit each file with:"$'\n'"##FILE: skills/<n>.md##="$'\n'"<contents>"$'\n'"##END##"

  call_api "$system" "$user" > "$ARTIFACT_DIR/05-skills/_all.md"
  log "  ✓ Generated: $ARTIFACT_DIR/05-skills/_all.md"
}

step_generate_utils() {
  log "▶ Step 6/9: Generate Utility Scripts"
  mkdir -p "$ARTIFACT_DIR/06-scripts/utils"
  local system
  system="$(load_file "$SHARED_DIR/project.md")"$'\n\n'"$(load_file "$SHARED_DIR/AGENTS.md")"$'\n\n'"$(load_file "$WORKFLOW_DIR/agents/generator.md")"
  local user
  user="$(load_file "$WORKFLOW_DIR/skills/generate-utils.md")"$'\n\n'"---"$'\n\n'"Design document:"$'\n'"$(load_file "$ARTIFACT_DIR/02-design.md")"$'\n\n'"Task: Identify every non-LLM operation in this workflow (file reads, writes, validation, transformation, etc.) and generate a dedicated utility script (.sh and .ps1) for each. These will be called by both cli/ and ide/ scripts. Delimit each file with:"$'\n'"##FILE: scripts/utils/<name>.sh##"$'\n'"<contents>"$'\n'"##END##"

  call_api "$system" "$user" > "$ARTIFACT_DIR/06-scripts/utils/_all.md"
  log "  ✓ Generated: $ARTIFACT_DIR/06-scripts/utils/_all.md"
}

step_generate_scripts() {
  log "▶ Step 7/9: Generate CLI and IDE Scripts"
  mkdir -p "$ARTIFACT_DIR/06-scripts/cli" "$ARTIFACT_DIR/06-scripts/ide"
  local system
  system="$(load_file "$SHARED_DIR/project.md")"$'\n\n'"$(load_file "$SHARED_DIR/AGENTS.md")"$'\n\n'"$(load_file "$WORKFLOW_DIR/agents/generator.md")"
  local user
  user="$(load_file "$WORKFLOW_DIR/skills/generate-dual-scripts.md")"$'\n\n'"---"$'\n\n'"Design document:"$'\n'"$(load_file "$ARTIFACT_DIR/02-design.md")"$'\n\n'"Utility scripts already generated:"$'\n'"$(load_file "$ARTIFACT_DIR/06-scripts/utils/_all.md")"$'\n\n'"Task: Generate ALL CLI scripts (run.sh, run.ps1) AND IDE scripts (instructions.md, steps.md, register.sh, register.ps1). CLI and IDE scripts have equal priority — run.ps1 must be as complete as run.sh. Both must call into utils/ scripts for non-LLM work, not inline that logic. Delimit each file with:"$'\n'"##FILE: scripts/cli/run.sh##"$'\n'"<contents>"$'\n'"##END##"

  call_api "$system" "$user" > "$ARTIFACT_DIR/06-scripts/_all.md"
  log "  ✓ Generated: $ARTIFACT_DIR/06-scripts/_all.md"
}

step_review() {
  log "▶ Step 7/8: Review All Outputs"
  local system
  system="$(load_file "$SHARED_DIR/project.md")"$'\n\n'"$(load_file "$SHARED_DIR/AGENTS.md")"$'\n\n'"$(load_file "$WORKFLOW_DIR/agents/reviewer.md")"
  local user
  user="$(load_file "$WORKFLOW_DIR/skills/review-workflow.md")"$'\n\n'"---"$'\n\n'
  user+="Design document:"$'\n'"$(load_file "$ARTIFACT_DIR/02-design.md")"$'\n\n'
  user+="workflow.yaml:"$'\n'"$(load_file "$ARTIFACT_DIR/03-workflow.yaml")"$'\n\n'
  user+="Agents:"$'\n'"$(load_file "$ARTIFACT_DIR/04-agents/_all.md")"$'\n\n'
  user+="Skills:"$'\n'"$(load_file "$ARTIFACT_DIR/05-skills/_all.md")"$'\n\n'
  user+="Scripts:"$'\n'"$(load_file "$ARTIFACT_DIR/06-scripts/_all.md")"

  call_api "$system" "$user" 1024 0 > "$ARTIFACT_DIR/07-review.md"
  human_gate "Review" "$ARTIFACT_DIR/07-review.md"
}

step_register() {
  log "▶ Step 8/8: Register Workflow"
  bash "$WORKFLOW_DIR/../ide/register.sh" "$ARTIFACT_DIR"
}

# ── Main ────────────────────────────────────────────────────────────────────────
main() {
  : "${WORKFLOW_REQUEST:?Error: WORKFLOW_REQUEST env var is required}"

  echo ""
  echo "╔══════════════════════════════════════════════════════╗"
  echo "║          LLM Workflow Creator                        ║"
  echo "╚══════════════════════════════════════════════════════╝"
  log "Request: $WORKFLOW_REQUEST"
  echo ""

  step_clarify
  step_design
  step_generate_config
  step_generate_agents
  step_generate_skills
  step_generate_utils
  step_generate_scripts
  step_review
  step_register

  echo ""
  log "✅ Done! New workflow registered successfully."
}

main "$@"
