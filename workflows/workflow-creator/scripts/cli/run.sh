#!/usr/bin/env bash
set -euo pipefail

# ── Configuration ──────────────────────────────────────────────────────────────
WORKFLOW_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
SHARED_DIR="$WORKFLOW_DIR/../../../shared"
OUTPUTS_DIR="$WORKFLOW_DIR/outputs"
API_KEY="${ANTHROPIC_API_KEY:?ANTHROPIC_API_KEY is not set}"
MODEL="claude-sonnet-4-6"
mkdir -p "$OUTPUTS_DIR"

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

  call_api "$system" "$user" > "$OUTPUTS_DIR/01-clarification.md"
  human_gate "Clarify Request" "$OUTPUTS_DIR/01-clarification.md"
}

step_design() {
  log "▶ Step 2/8: Design Workflow"
  local system
  system="$(load_file "$SHARED_DIR/project.md")"$'\n\n'"$(load_file "$SHARED_DIR/AGENTS.md")"$'\n\n'"$(load_file "$WORKFLOW_DIR/agents/architect.md")"
  local user
  user="$(load_file "$WORKFLOW_DIR/skills/design-workflow.md")"$'\n\n'"---"$'\n\n'"Clarification summary:"$'\n'"$(load_file "$OUTPUTS_DIR/01-clarification.md")"

  call_api "$system" "$user" > "$OUTPUTS_DIR/02-design.md"
  human_gate "Design Workflow" "$OUTPUTS_DIR/02-design.md"
}

step_generate_config() {
  log "▶ Step 3/8: Generate workflow.yaml"
  local system
  system="$(load_file "$SHARED_DIR/project.md")"$'\n\n'"$(load_file "$SHARED_DIR/AGENTS.md")"$'\n\n'"$(load_file "$WORKFLOW_DIR/agents/generator.md")"
  local user
  user="$(load_file "$WORKFLOW_DIR/skills/generate-yaml.md")"$'\n\n'"---"$'\n\n'"Design document:"$'\n'"$(load_file "$OUTPUTS_DIR/02-design.md")"$'\n\n'"Task: Generate ONLY the workflow.yaml file. Output the raw YAML with no surrounding prose or code fences."

  call_api "$system" "$user" > "$OUTPUTS_DIR/03-workflow.yaml"
  log "  ✓ Generated: outputs/03-workflow.yaml"
}

step_generate_agents() {
  log "▶ Step 4/8: Generate Agent Files"
  mkdir -p "$OUTPUTS_DIR/04-agents"
  local system
  system="$(load_file "$SHARED_DIR/project.md")"$'\n\n'"$(load_file "$SHARED_DIR/AGENTS.md")"$'\n\n'"$(load_file "$WORKFLOW_DIR/agents/generator.md")"
  local user
  user="$(load_file "$WORKFLOW_DIR/skills/generate-agent.md")"$'\n\n'"---"$'\n\n'"Design document:"$'\n'"$(load_file "$OUTPUTS_DIR/02-design.md")"$'\n\n'"Task: Generate ALL agent .md files. Delimit each file with:"$'\n'"=##FILE: agents/<n>.md##"$'\n'"<contents>"$'\n'"##END##"

  call_api "$system" "$user" > "$OUTPUTS_DIR/04-agents/_all.md"
  log "  ✓ Generated: outputs/04-agents/_all.md"
}

step_generate_skills() {
  log "▶ Step 5/8: Generate Skill Files"
  mkdir -p "$OUTPUTS_DIR/05-skills"
  local system
  system="$(load_file "$SHARED_DIR/project.md")"$'\n\n'"$(load_file "$SHARED_DIR/AGENTS.md")"$'\n\n'"$(load_file "$WORKFLOW_DIR/agents/generator.md")"
  local user
  user="$(load_file "$WORKFLOW_DIR/skills/generate-skill.md")"$'\n\n'"---"$'\n\n'"Design document:"$'\n'"$(load_file "$OUTPUTS_DIR/02-design.md")"$'\n\n'"Task: Generate ALL skill .md files. Delimit each file with:"$'\n'"##FILE: skills/<n>.md##="$'\n'"<contents>"$'\n'"##END##"

  call_api "$system" "$user" > "$OUTPUTS_DIR/05-skills/_all.md"
  log "  ✓ Generated: outputs/05-skills/_all.md"
}

step_generate_scripts() {
  log "▶ Step 6/8: Generate Scripts"
  mkdir -p "$OUTPUTS_DIR/06-scripts"
  local system
  system="$(load_file "$SHARED_DIR/project.md")"$'\n\n'"$(load_file "$SHARED_DIR/AGENTS.md")"$'\n\n'"$(load_file "$WORKFLOW_DIR/agents/generator.md")"
  local user
  user="$(load_file "$WORKFLOW_DIR/skills/generate-script.md")"$'\n\n'"---"$'\n\n'"Design document:"$'\n'"$(load_file "$OUTPUTS_DIR/02-design.md")"$'\n\n'"Task: Generate run.sh AND run.ps1. Delimit each file with:"$'\n'"##FILE: scripts/run.sh##"$'\n'"<contents>"$'\n'"##END##"

  call_api "$system" "$user" > "$OUTPUTS_DIR/06-scripts/_all.md"
  log "  ✓ Generated: outputs/06-scripts/_all.md"
}

step_review() {
  log "▶ Step 7/8: Review All Outputs"
  local system
  system="$(load_file "$SHARED_DIR/project.md")"$'\n\n'"$(load_file "$SHARED_DIR/AGENTS.md")"$'\n\n'"$(load_file "$WORKFLOW_DIR/agents/reviewer.md")"
  local user
  user="$(load_file "$WORKFLOW_DIR/skills/review-workflow.md")"$'\n\n'"---"$'\n\n'
  user+="Design document:"$'\n'"$(load_file "$OUTPUTS_DIR/02-design.md")"$'\n\n'
  user+="workflow.yaml:"$'\n'"$(load_file "$OUTPUTS_DIR/03-workflow.yaml")"$'\n\n'
  user+="Agents:"$'\n'"$(load_file "$OUTPUTS_DIR/04-agents/_all.md")"$'\n\n'
  user+="Skills:"$'\n'"$(load_file "$OUTPUTS_DIR/05-skills/_all.md")"$'\n\n'
  user+="Scripts:"$'\n'"$(load_file "$OUTPUTS_DIR/06-scripts/_all.md")"

  call_api "$system" "$user" 1024 0 > "$OUTPUTS_DIR/07-review.md"
  human_gate "Review" "$OUTPUTS_DIR/07-review.md"
}

step_register() {
  log "▶ Step 8/8: Register Workflow"
  bash "$WORKFLOW_DIR/scripts/register.sh"
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
  step_generate_scripts
  step_review
  step_register

  echo ""
  log "✅ Done! New workflow registered successfully."
}

main "$@"
