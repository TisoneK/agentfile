#!/usr/bin/env pwsh
$ErrorActionPreference = "Stop"

# ── Configuration ───────────────────────────────────────────────────────────────
$ScriptDir   = Split-Path -Parent $MyInvocation.MyCommand.Path
$WorkflowDir = Split-Path -Parent (Split-Path -Parent $ScriptDir)
$ProjectRoot = Split-Path -Parent (Split-Path -Parent $WorkflowDir)
$SharedDir   = Join-Path $ProjectRoot "shared"
$OutputsDir  = Join-Path $WorkflowDir "outputs"
$ApiKey      = $env:ANTHROPIC_API_KEY ?? $(throw "ANTHROPIC_API_KEY is not set")
$Model       = "claude-sonnet-4-6"

param(
  [Parameter(Mandatory=$true)][string]$Input,
  [Parameter(Mandatory=$false)][string]$ConfigFile = ".review-config.json"
)

New-Item -ItemType Directory -Force -Path $OutputsDir | Out-Null

# ── Helpers ─────────────────────────────────────────────────────────────────────
function Invoke-Api {
  param([string]$System, [string]$User, [int]$MaxTokens=4096, [float]$Temp=0.3)
  $body = @{
    model=$Model
    max_tokens=$MaxTokens
    temperature=$Temp
    system=$System
    messages=@(@{role="user";content=$User})
  } | ConvertTo-Json -Depth 10
  
  $r = Invoke-RestMethod -Uri "https://api.anthropic.com/v1/messages" -Method POST `
    -Headers @{
      "x-api-key"=$ApiKey
      "anthropic-version"="2023-06-01"
      "content-type"="application/json"
    } -Body $body
  
  return $r.content[0].text
}

function Get-FC([string]$Path) { Get-Content $Path -Raw }
function Write-Log([string]$m) { Write-Host "[$(Get-Date -Format 'HH:mm:ss')] $m" }

function Invoke-Gate([string]$Name, [string]$File) {
  Write-Host "`n══════════════════════════════════════════"
  Write-Host "  GATE: $Name  |  $File"
  Get-Content $File | Write-Host
  $c = Read-Host "Approve? [y/N]"
  if ($c -ne "y") { throw "Aborted at gate: $Name" }
}

# ── Steps ────────────────────────────────────────────────────────────────────────
function Step-Init {
  Write-Log "▶ Step 1/8: Initialize Review Context"
  $sys = (Get-FC "$SharedDir/project.md") + "`n`n" + (Get-FC "$WorkflowDir/agents/coordinator.md")
  $usr = (Get-FC "$WorkflowDir/skills/setup-review-context.md") + "`n`nInput path: $Input"
  Invoke-Api $sys $usr | Set-Content "$OutputsDir/01-context.md"
  Write-Log "  ✓ 01-context.md"
}

function Step-Static {
  Write-Log "▶ Step 2/8: Static Code Analysis"
  $sys = (Get-FC "$SharedDir/project.md") + "`n`n" + (Get-FC "$WorkflowDir/agents/static-analyzer.md")
  $usr = (Get-FC "$WorkflowDir/skills/code-quality-analysis.md") + "`n`n" + (Get-FC "$OutputsDir/01-context.md")
  Invoke-Api $sys $usr | Set-Content "$OutputsDir/02-static-analysis.md"
  Write-Log "  ✓ 02-static-analysis.md"
}

function Step-Security {
  Write-Log "▶ Step 3/8: Security Vulnerability Scan"
  $sys = (Get-FC "$SharedDir/project.md") + "`n`n" + (Get-FC "$WorkflowDir/agents/security-scanner.md")
  $usr = (Get-FC "$WorkflowDir/skills/vulnerability-detection.md") + "`n`n" + (Get-FC "$OutputsDir/01-context.md")
  Invoke-Api $sys $usr | Set-Content "$OutputsDir/03-security-scan.md"
  Write-Log "  ✓ 03-security-scan.md"
}

function Step-Style {
  Write-Log "▶ Step 4/8: Style & Standards Check"
  $sys = (Get-FC "$SharedDir/project.md") + "`n`n" + (Get-FC "$WorkflowDir/agents/style-checker.md")
  $usr = (Get-FC "$WorkflowDir/skills/coding-standards-validation.md") + "`n`n" + (Get-FC "$OutputsDir/01-context.md")
  Invoke-Api $sys $usr | Set-Content "$OutputsDir/04-style-check.md"
  Write-Log "  ✓ 04-style-check.md"
}

function Step-Complexity {
  Write-Log "▶ Step 5/8: Complexity Analysis"
  $sys = (Get-FC "$SharedDir/project.md") + "`n`n" + (Get-FC "$WorkflowDir/agents/static-analyzer.md")
  $usr = (Get-FC "$WorkflowDir/skills/complexity-metrics.md") + "`n`n" + (Get-FC "$OutputsDir/01-context.md")
  Invoke-Api $sys $usr | Set-Content "$OutputsDir/05-complexity-analysis.md"
  Write-Log "  ✓ 05-complexity-analysis.md"
}

function Step-Report {
  Write-Log "▶ Step 6/8: Generate Review Report"
  $sys = (Get-FC "$SharedDir/project.md") + "`n`n" + (Get-FC "$WorkflowDir/agents/reporter.md")
  $usr = (Get-FC "$WorkflowDir/skills/report-compilation.md") + "`n`n" + `
         (Get-FC "$OutputsDir/02-static-analysis.md") + "`n`n" + `
         (Get-FC "$OutputsDir/03-security-scan.md") + "`n`n" + `
         (Get-FC "$OutputsDir/04-style-check.md") + "`n`n" + `
         (Get-FC "$OutputsDir/05-complexity-analysis.md")
  Invoke-Api $sys $usr | Set-Content "$OutputsDir/06-review-report.md"
  Write-Log "  ✓ 06-review-report.md"
}

function Step-Evaluate {
  Write-Log "▶ Step 7/8: Evaluate Results"
  $sys = (Get-FC "$SharedDir/project.md") + "`n`n" + (Get-FC "$WorkflowDir/agents/coordinator.md")
  $usr = (Get-FC "$WorkflowDir/skills/result-evaluation.md") + "`n`n" + `
         (Get-FC "$OutputsDir/01-context.md") + "`n`n" + `
         (Get-FC "$OutputsDir/06-review-report.md")
  Invoke-Api $sys $usr | Set-Content "$OutputsDir/07-evaluation.md"
  Write-Log "  ✓ 07-evaluation.md"
}

function Step-Publish {
  Write-Log "▶ Step 8/8: Publish Findings"
  $sys = (Get-FC "$SharedDir/project.md") + "`n`n" + (Get-FC "$WorkflowDir/agents/reporter.md")
  $usr = (Get-FC "$WorkflowDir/skills/output-formatting.md") + "`n`n" + `
         (Get-FC "$OutputsDir/06-review-report.md") + "`n`n" + `
         (Get-FC "$OutputsDir/07-evaluation.md")
  Invoke-Api $sys $usr | Set-Content "$OutputsDir/08-final-report.md"
  Write-Log "  ✓ 08-final-report.md"
}

# ── Main ─────────────────────────────────────────────────────────────────────────
Write-Log "🚀 Starting Code Review Workflow"
Write-Log "   Input: $Input"
Write-Log "   Config: $ConfigFile"

# Load configuration
$config = & "$WorkflowDir/scripts/utils/load-config.ps1" -ConfigPath $ConfigFile

Step-Init
Step-Static
Step-Security
Step-Style
Step-Complexity
Step-Report
Step-Evaluate
Step-Publish

# Generate artifacts
& "$WorkflowDir/scripts/utils/generate-artifacts.ps1" -OutputsDir $OutputsDir -ArtifactType "review"

Write-Log "✅ Code Review Complete. See outputs/ for results."
Write-Log "   Final report: $OutputsDir/08-final-report.md"
