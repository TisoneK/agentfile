# Skill: Generate Script

## Purpose
Teach the Generator how to write complete, robust Bash and PowerShell orchestration scripts for workflows.

## Instructions

### Script Structure (Both Languages)

Every orchestration script must have these sections in order:
1. Shebang + strict mode
2. Configuration variables
3. Helper functions
4. Step functions (one per workflow step)
5. Main execution block

### Bash Template
```bash
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

load_file() {
  cat "$1"
}

human_gate() {
  local step_name="$1"
  local output_file="$2"
  echo ""
  echo "══════════════════════════════════════════"
  echo "  GATE: $step_name"
  echo "  Output: $output_file"
  echo "══════════════════════════════════════════"
  cat "$output_file"
  echo ""
  read -rp "Approve and continue? [y/N] " confirm
  if [[ "$confirm" != "y" && "$confirm" != "Y" ]]; then
    echo "Aborted at gate: $step_name"
    exit 1
  fi
}

log() {
  echo "[$(date '+%H:%M:%S')] $*"
}

# ── Steps ───────────────────────────────────────────────────────────────────────
step_clarify() {
  log "Step: clarify"
  local system
  system="$(load_file "$SHARED_DIR/project.md")"$'\n'"$(load_file "$SHARED_DIR/AGENTS.md")"$'\n'"$(load_file "$WORKFLOW_DIR/agents/analyst.md")"
  local user
  user="$(load_file "$WORKFLOW_DIR/skills/ask-clarifying.md")"$'\n\n'"Request: $WORKFLOW_REQUEST"

  call_api "$system" "$user" > "$OUTPUTS_DIR/01-clarification.md"
  human_gate "Clarify Request" "$OUTPUTS_DIR/01-clarification.md"
}

step_design() {
  log "Step: design"
  local system
  system="$(load_file "$SHARED_DIR/project.md")"$'\n'"$(load_file "$SHARED_DIR/AGENTS.md")"$'\n'"$(load_file "$WORKFLOW_DIR/agents/architect.md")"
  local user
  user="$(load_file "$WORKFLOW_DIR/skills/design-workflow.md")"$'\n\n'"$(load_file "$OUTPUTS_DIR/01-clarification.md")"

  call_api "$system" "$user" > "$OUTPUTS_DIR/02-design.md"
  human_gate "Design Workflow" "$OUTPUTS_DIR/02-design.md"
}

step_generate_config() {
  log "Step: generate-config"
  local system
  system="$(load_file "$SHARED_DIR/project.md")"$'\n'"$(load_file "$SHARED_DIR/AGENTS.md")"$'\n'"$(load_file "$WORKFLOW_DIR/agents/generator.md")"
  local user
  user="$(load_file "$WORKFLOW_DIR/skills/generate-yaml.md")"$'\n\n'"$(load_file "$OUTPUTS_DIR/02-design.md")"$'\n\nGenerate only the workflow.yaml file.'

  call_api "$system" "$user" > "$OUTPUTS_DIR/03-workflow.yaml"
  log "Generated: $OUTPUTS_DIR/03-workflow.yaml"
}

step_generate_agents() {
  log "Step: generate-agents"
  local system
  system="$(load_file "$SHARED_DIR/project.md")"$'\n'"$(load_file "$SHARED_DIR/AGENTS.md")"$'\n'"$(load_file "$WORKFLOW_DIR/agents/generator.md")"
  local user
  user="$(load_file "$WORKFLOW_DIR/skills/generate-agent.md")"$'\n\n'"$(load_file "$OUTPUTS_DIR/02-design.md")"$'\n\nGenerate all agent .md files. Delimit each with === FILE: === markers.'

  mkdir -p "$OUTPUTS_DIR/04-agents"
  call_api "$system" "$user" > "$OUTPUTS_DIR/04-agents/_all.md"
  log "Generated: $OUTPUTS_DIR/04-agents/_all.md"
}

step_generate_skills() {
  log "Step: generate-skills"
  local system
  system="$(load_file "$SHARED_DIR/project.md")"$'\n'"$(load_file "$SHARED_DIR/AGENTS.md")"$'\n'"$(load_file "$WORKFLOW_DIR/agents/generator.md")"
  local user
  user="$(load_file "$WORKFLOW_DIR/skills/generate-skill.md")"$'\n\n'"$(load_file "$OUTPUTS_DIR/02-design.md")"$'\n\nGenerate all skill .md files. Delimit each with === FILE: === markers.'

  mkdir -p "$OUTPUTS_DIR/05-skills"
  call_api "$system" "$user" > "$OUTPUTS_DIR/05-skills/_all.md"
  log "Generated: $OUTPUTS_DIR/05-skills/_all.md"
}

step_generate_scripts() {
  log "Step: generate-scripts"
  local system
  system="$(load_file "$SHARED_DIR/project.md")"$'\n'"$(load_file "$SHARED_DIR/AGENTS.md")"$'\n'"$(load_file "$WORKFLOW_DIR/agents/generator.md")"
  local user
  user="$(load_file "$WORKFLOW_DIR/skills/generate-script.md")"$'\n\n'"$(load_file "$OUTPUTS_DIR/02-design.md")"$'\n\nGenerate run.sh and run.ps1. Delimit each with === FILE: === markers.'

  mkdir -p "$OUTPUTS_DIR/06-scripts"
  call_api "$system" "$user" > "$OUTPUTS_DIR/06-scripts/_all.md"
  log "Generated: $OUTPUTS_DIR/06-scripts/_all.md"
}

step_review() {
  log "Step: review"
  local system
  system="$(load_file "$SHARED_DIR/project.md")"$'\n'"$(load_file "$SHARED_DIR/AGENTS.md")"$'\n'"$(load_file "$WORKFLOW_DIR/agents/reviewer.md")"
  local user
  user="$(load_file "$WORKFLOW_DIR/skills/review-workflow.md")"$'\n\n'
  user+="Design:\n$(load_file "$OUTPUTS_DIR/02-design.md")\n\n"
  user+="workflow.yaml:\n$(load_file "$OUTPUTS_DIR/03-workflow.yaml")\n\n"
  user+="Agents:\n$(load_file "$OUTPUTS_DIR/04-agents/_all.md")\n\n"
  user+="Skills:\n$(load_file "$OUTPUTS_DIR/05-skills/_all.md")\n\n"
  user+="Scripts:\n$(load_file "$OUTPUTS_DIR/06-scripts/_all.md")"

  call_api "$system" "$user" 1024 0 > "$OUTPUTS_DIR/07-review.md"
  human_gate "Review" "$OUTPUTS_DIR/07-review.md"
}

step_register() {
  log "Step: register"
  bash "$WORKFLOW_DIR/scripts/register.sh"
}

# ── Main ────────────────────────────────────────────────────────────────────────
main() {
  : "${WORKFLOW_REQUEST:?WORKFLOW_REQUEST env var is required}"
  log "Starting workflow-creator"
  log "Request: $WORKFLOW_REQUEST"

  step_clarify
  step_design
  step_generate_config
  step_generate_agents
  step_generate_skills
  step_generate_scripts
  step_review
  step_register

  log "Done. New workflow registered."
}

main "$@"
```

### PowerShell Template
```powershell
#!/usr/bin/env pwsh
$ErrorActionPreference = "Stop"

# ── Configuration ──────────────────────────────────────────────────────────────
$WorkflowDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$SharedDir   = Join-Path $WorkflowDir "../../../shared"
$OutputsDir  = Join-Path $WorkflowDir "outputs"
$ApiKey      = $env:ANTHROPIC_API_KEY ?? $(throw "ANTHROPIC_API_KEY is not set")
$Model       = "claude-sonnet-4-6"
New-Item -ItemType Directory -Force -Path $OutputsDir | Out-Null

# ── Helper Functions ────────────────────────────────────────────────────────────
function Invoke-Api {
  param(
    [string]$SystemPrompt,
    [string]$UserPrompt,
    [int]$MaxTokens = 4096,
    [float]$Temperature = 0.3
  )
  $body = @{
    model       = $Model
    max_tokens  = $MaxTokens
    temperature = $Temperature
    system      = $SystemPrompt
    messages    = @(@{ role = "user"; content = $UserPrompt })
  } | ConvertTo-Json -Depth 10

  $response = Invoke-RestMethod `
    -Uri "https://api.anthropic.com/v1/messages" `
    -Method POST `
    -Headers @{
      "x-api-key"         = $ApiKey
      "anthropic-version" = "2023-06-01"
      "content-type"      = "application/json"
    } `
    -Body $body
  return $response.content[0].text
}

function Get-FileContent { param([string]$Path) Get-Content $Path -Raw }

function Invoke-HumanGate {
  param([string]$StepName, [string]$OutputFile)
  Write-Host "`n══════════════════════════════════════════"
  Write-Host "  GATE: $StepName"
  Write-Host "  Output: $OutputFile"
  Write-Host "══════════════════════════════════════════"
  Get-Content $OutputFile | Write-Host
  $confirm = Read-Host "`nApprove and continue? [y/N]"
  if ($confirm -ne "y") {
    Write-Host "Aborted at gate: $StepName"
    exit 1
  }
}

function Write-Log { param([string]$Message) Write-Host "[$(Get-Date -Format 'HH:mm:ss')] $Message" }

# ── Steps ───────────────────────────────────────────────────────────────────────
function Step-Clarify {
  Write-Log "Step: clarify"
  $system = (Get-FileContent "$SharedDir/project.md") + "`n" + (Get-FileContent "$SharedDir/AGENTS.md") + "`n" + (Get-FileContent "$WorkflowDir/agents/analyst.md")
  $user   = (Get-FileContent "$WorkflowDir/skills/ask-clarifying.md") + "`n`nRequest: $env:WORKFLOW_REQUEST"
  Invoke-Api $system $user | Set-Content "$OutputsDir/01-clarification.md"
  Invoke-HumanGate "Clarify Request" "$OutputsDir/01-clarification.md"
}

function Step-Design {
  Write-Log "Step: design"
  $system = (Get-FileContent "$SharedDir/project.md") + "`n" + (Get-FileContent "$SharedDir/AGENTS.md") + "`n" + (Get-FileContent "$WorkflowDir/agents/architect.md")
  $user   = (Get-FileContent "$WorkflowDir/skills/design-workflow.md") + "`n`n" + (Get-FileContent "$OutputsDir/01-clarification.md")
  Invoke-Api $system $user | Set-Content "$OutputsDir/02-design.md"
  Invoke-HumanGate "Design Workflow" "$OutputsDir/02-design.md"
}

function Step-GenerateConfig {
  Write-Log "Step: generate-config"
  $system = (Get-FileContent "$SharedDir/project.md") + "`n" + (Get-FileContent "$SharedDir/AGENTS.md") + "`n" + (Get-FileContent "$WorkflowDir/agents/generator.md")
  $user   = (Get-FileContent "$WorkflowDir/skills/generate-yaml.md") + "`n`n" + (Get-FileContent "$OutputsDir/02-design.md") + "`n`nGenerate only the workflow.yaml file."
  Invoke-Api $system $user | Set-Content "$OutputsDir/03-workflow.yaml"
}

function Step-GenerateAgents {
  Write-Log "Step: generate-agents"
  New-Item -ItemType Directory -Force -Path "$OutputsDir/04-agents" | Out-Null
  $system = (Get-FileContent "$SharedDir/project.md") + "`n" + (Get-FileContent "$SharedDir/AGENTS.md") + "`n" + (Get-FileContent "$WorkflowDir/agents/generator.md")
  $user   = (Get-FileContent "$WorkflowDir/skills/generate-agent.md") + "`n`n" + (Get-FileContent "$OutputsDir/02-design.md") + "`n`nGenerate all agent .md files."
  Invoke-Api $system $user | Set-Content "$OutputsDir/04-agents/_all.md"
}

function Step-GenerateSkills {
  Write-Log "Step: generate-skills"
  New-Item -ItemType Directory -Force -Path "$OutputsDir/05-skills" | Out-Null
  $system = (Get-FileContent "$SharedDir/project.md") + "`n" + (Get-FileContent "$SharedDir/AGENTS.md") + "`n" + (Get-FileContent "$WorkflowDir/agents/generator.md")
  $user   = (Get-FileContent "$WorkflowDir/skills/generate-skill.md") + "`n`n" + (Get-FileContent "$OutputsDir/02-design.md") + "`n`nGenerate all skill .md files."
  Invoke-Api $system $user | Set-Content "$OutputsDir/05-skills/_all.md"
}

function Step-GenerateScripts {
  Write-Log "Step: generate-scripts"
  New-Item -ItemType Directory -Force -Path "$OutputsDir/06-scripts" | Out-Null
  $system = (Get-FileContent "$SharedDir/project.md") + "`n" + (Get-FileContent "$SharedDir/AGENTS.md") + "`n" + (Get-FileContent "$WorkflowDir/agents/generator.md")
  $user   = (Get-FileContent "$WorkflowDir/skills/generate-script.md") + "`n`n" + (Get-FileContent "$OutputsDir/02-design.md") + "`n`nGenerate run.sh and run.ps1."
  Invoke-Api $system $user | Set-Content "$OutputsDir/06-scripts/_all.md"
}

function Step-Review {
  Write-Log "Step: review"
  $system = (Get-FileContent "$SharedDir/project.md") + "`n" + (Get-FileContent "$SharedDir/AGENTS.md") + "`n" + (Get-FileContent "$WorkflowDir/agents/reviewer.md")
  $user   = (Get-FileContent "$WorkflowDir/skills/review-workflow.md") + "`n`n" +
            "Design:`n" + (Get-FileContent "$OutputsDir/02-design.md") + "`n`n" +
            "workflow.yaml:`n" + (Get-FileContent "$OutputsDir/03-workflow.yaml") + "`n`n" +
            "Agents:`n" + (Get-FileContent "$OutputsDir/04-agents/_all.md") + "`n`n" +
            "Skills:`n" + (Get-FileContent "$OutputsDir/05-skills/_all.md") + "`n`n" +
            "Scripts:`n" + (Get-FileContent "$OutputsDir/06-scripts/_all.md")
  Invoke-Api $system $user 1024 0 | Set-Content "$OutputsDir/07-review.md"
  Invoke-HumanGate "Review" "$OutputsDir/07-review.md"
}

function Step-Register {
  Write-Log "Step: register"
  & "$WorkflowDir/scripts/register.ps1"
}

# ── Main ────────────────────────────────────────────────────────────────────────
if (-not $env:WORKFLOW_REQUEST) { throw "WORKFLOW_REQUEST env var is required" }
Write-Log "Starting workflow-creator"
Write-Log "Request: $env:WORKFLOW_REQUEST"

Step-Clarify
Step-Design
Step-GenerateConfig
Step-GenerateAgents
Step-GenerateSkills
Step-GenerateScripts
Step-Review
Step-Register

Write-Log "Done. New workflow registered."
```

### Key Patterns to Always Follow
- Always validate required env vars at the top
- Always use `set -euo pipefail` (Bash) or `$ErrorActionPreference = "Stop"` (PS)
- Always use `log` / `Write-Log` for progress messages
- Always load system prompt from: `project.md` + `AGENTS.md` + agent file
- Always load skill into user prompt
- Human gates must show the output content before asking for approval
