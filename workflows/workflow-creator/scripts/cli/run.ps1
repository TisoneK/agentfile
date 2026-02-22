#!/usr/bin/env pwsh
$ErrorActionPreference = "Stop"

# ── Configuration ──────────────────────────────────────────────────────
$WorkflowDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$SharedDir   = Join-Path $WorkflowDir "../../../shared"
$OutputsDir  = Join-Path $WorkflowDir "outputs"

# Load configuration like CLI does
$ConfigFile = Join-Path $env:USERPROFILE ".agentfile/config.json"
if (Test-Path $ConfigFile) {
    $Config = Get-Content $ConfigFile -Raw | ConvertFrom-Json
    $ApiKey = if ($Config.apiKey) { $Config.apiKey } else { $null }
    $Model = if ($Config.model) { $Config.model } else { "claude-sonnet-4-6" }
} else {
    $ApiKey = $env:ANTHROPIC_API_KEY
    $Model = "claude-sonnet-4-6"
}

if (-not $ApiKey) {
    Write-Host "✗ No API key found. Use one of these options:"
    Write-Host "  1. Set ANTHROPIC_API_KEY environment variable"
    Write-Host "  2. Run 'agentfile config set api-key <key>' to save it"
    Write-Host "  3. Use --key option when running workflow"
    exit 1
}

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
  } | ConvertTo-Json -Depth 10 -Compress

  $response = Invoke-RestMethod `
    -Uri "https://api.anthropic.com/v1/messages" `
    -Method POST `
    -Headers @{
      "x-api-key"         = $ApiKey
      "anthropic-version" = "2023-06-01"
      "content-type"      = "application/json"
    } `
    -Body ([System.Text.Encoding]::UTF8.GetBytes($body))

  return $response.content[0].text
}

function Read-File { param([string]$Path) Get-Content $Path -Raw -Encoding UTF8 }

function Invoke-HumanGate {
  param([string]$StepName, [string]$OutputFile)
  Write-Host ""
  Write-Host "══════════════════════════════════════════════════════"
  Write-Host "  ⏸  GATE: $StepName"
  Write-Host "  📄 Output: $OutputFile"
  Write-Host "══════════════════════════════════════════════════════"
  Write-Host ""
  Get-Content $OutputFile -Raw | Write-Host
  Write-Host ""
  Write-Host "══════════════════════════════════════════════════════"
  $confirm = Read-Host "  Approve and continue? [y/N]"
  if ($confirm -ne "y") {
    Write-Log "Aborted at gate: $StepName"
    exit 1
  }
}

function Write-Log { param([string]$Message) Write-Host "[$(Get-Date -Format 'HH:mm:ss')] $Message" }

# ── Steps ───────────────────────────────────────────────────────────────────────
function Step-Clarify {
  Write-Log "▶ Step 1/8: Clarify Request"
  $system = (Read-File "$SharedDir/project.md") + "`n`n" + (Read-File "$SharedDir/AGENTS.md") + "`n`n" + (Read-File "$WorkflowDir/agents/analyst.md")
  $user   = (Read-File "$WorkflowDir/skills/ask-clarifying.md") + "`n`n---`n`nUser's workflow request:`n" + $env:WORKFLOW_REQUEST
  Invoke-Api $system $user | Set-Content "$OutputsDir/01-clarification.md" -Encoding UTF8
  Invoke-HumanGate "Clarify Request" "$OutputsDir/01-clarification.md"
}

function Step-Design {
  Write-Log "▶ Step 2/8: Design Workflow"
  $system = (Read-File "$SharedDir/project.md") + "`n`n" + (Read-File "$SharedDir/AGENTS.md") + "`n`n" + (Read-File "$WorkflowDir/agents/architect.md")
  $user   = (Read-File "$WorkflowDir/skills/design-workflow.md") + "`n`n---`n`nClarification summary:`n" + (Read-File "$OutputsDir/01-clarification.md")
  Invoke-Api $system $user | Set-Content "$OutputsDir/02-design.md" -Encoding UTF8
  Invoke-HumanGate "Design Workflow" "$OutputsDir/02-design.md"
}

function Step-GenerateConfig {
  Write-Log "▶ Step 3/8: Generate workflow.yaml"
  $system = (Read-File "$SharedDir/project.md") + "`n`n" + (Read-File "$SharedDir/AGENTS.md") + "`n`n" + (Read-File "$WorkflowDir/agents/generator.md")
  $user   = (Read-File "$WorkflowDir/skills/generate-yaml.md") + "`n`n---`n`nDesign document:`n" + (Read-File "$OutputsDir/02-design.md") + "`n`nTask: Generate ONLY the workflow.yaml file. Output raw YAML with no prose or code fences."
  Invoke-Api $system $user | Set-Content "$OutputsDir/03-workflow.yaml" -Encoding UTF8
  Write-Log "  ✓ Generated: outputs/03-workflow.yaml"
}

function Step-GenerateAgents {
  Write-Log "▶ Step 4/8: Generate Agent Files"
  New-Item -ItemType Directory -Force -Path "$OutputsDir/04-agents" | Out-Null
  $system = (Read-File "$SharedDir/project.md") + "`n`n" + (Read-File "$SharedDir/AGENTS.md") + "`n`n" + (Read-File "$WorkflowDir/agents/generator.md")
  $user   = (Read-File "$WorkflowDir/skills/generate-agent.md") + "`n`n---`n`nDesign document:`n" + (Read-File "$OutputsDir/02-design.md") + "`n`nTask: Generate ALL agent .md files. Delimit each with:`n=== FILE: agents/<n>.md ===`n<contents>`n=== END FILE ==="
  Invoke-Api $system $user | Set-Content "$OutputsDir/04-agents/_all.md" -Encoding UTF8
  Write-Log "  ✓ Generated: outputs/04-agents/_all.md"
}

function Step-GenerateSkills {
  Write-Log "▶ Step 5/8: Generate Skill Files"
  New-Item -ItemType Directory -Force -Path "$OutputsDir/05-skills" | Out-Null
  $system = (Read-File "$SharedDir/project.md") + "`n`n" + (Read-File "$SharedDir/AGENTS.md") + "`n`n" + (Read-File "$WorkflowDir/agents/generator.md")
  $user   = (Read-File "$WorkflowDir/skills/generate-skill.md") + "`n`n---`n`nDesign document:`n" + (Read-File "$OutputsDir/02-design.md") + "`n`nTask: Generate ALL skill .md files. Delimit each with:`n=== FILE: skills/<n>.md ===`n<contents>`n=== END FILE ==="
  Invoke-Api $system $user | Set-Content "$OutputsDir/05-skills/_all.md" -Encoding UTF8
  Write-Log "  ✓ Generated: outputs/05-skills/_all.md"
}

function Step-GenerateScripts {
  Write-Log "▶ Step 6/8: Generate Scripts"
  New-Item -ItemType Directory -Force -Path "$OutputsDir/06-scripts" | Out-Null
  $system = (Read-File "$SharedDir/project.md") + "`n`n" + (Read-File "$SharedDir/AGENTS.md") + "`n`n" + (Read-File "$WorkflowDir/agents/generator.md")
  $user   = (Read-File "$WorkflowDir/skills/generate-script.md") + "`n`n---`n`nDesign document:`n" + (Read-File "$OutputsDir/02-design.md") + "`n`nTask: Generate run.sh AND run.ps1. Delimit each with === FILE: === markers."
  Invoke-Api $system $user | Set-Content "$OutputsDir/06-scripts/_all.md" -Encoding UTF8
  Write-Log "  ✓ Generated: outputs/06-scripts/_all.md"
}

function Step-Review {
  Write-Log "▶ Step 7/8: Review All Outputs"
  $system = (Read-File "$SharedDir/project.md") + "`n`n" + (Read-File "$SharedDir/AGENTS.md") + "`n`n" + (Read-File "$WorkflowDir/agents/reviewer.md")
  $user   = (Read-File "$WorkflowDir/skills/review-workflow.md") + "`n`n---`n`n" +
            "Design document:`n" + (Read-File "$OutputsDir/02-design.md") + "`n`n" +
            "workflow.yaml:`n" + (Read-File "$OutputsDir/03-workflow.yaml") + "`n`n" +
            "Agents:`n" + (Read-File "$OutputsDir/04-agents/_all.md") + "`n`n" +
            "Skills:`n" + (Read-File "$OutputsDir/05-skills/_all.md") + "`n`n" +
            "Scripts:`n" + (Read-File "$OutputsDir/06-scripts/_all.md")
  Invoke-Api $system $user 1024 0 | Set-Content "$OutputsDir/07-review.md" -Encoding UTF8
  Invoke-HumanGate "Review" "$OutputsDir/07-review.md"
}

function Step-Register {
  Write-Log "▶ Step 8/8: Register Workflow"
  & "$WorkflowDir/scripts/register.ps1"
}

# ── Main ────────────────────────────────────────────────────────────────────────
if (-not $env:WORKFLOW_REQUEST) { throw "Error: WORKFLOW_REQUEST env var is required" }

Write-Host ""
Write-Host "╔══════════════════════════════════════════════════════╗"
Write-Host "║          LLM Workflow Creator                        ║"
Write-Host "╚══════════════════════════════════════════════════════╝"
Write-Log "Request: $env:WORKFLOW_REQUEST"
Write-Host ""

Step-Clarify
Step-Design
Step-GenerateConfig
Step-GenerateAgents
Step-GenerateSkills
Step-GenerateScripts
Step-Review
Step-Register

Write-Host ""
Write-Log "✅ Done! New workflow registered successfully."
