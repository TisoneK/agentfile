#!/usr/bin/env pwsh
$ErrorActionPreference = "Stop"

# ── scripts/cli/run.ps1 ────────────────────────────────────────────────────────
# CLI runtime for code-reviewer. Requires ANTHROPIC_API_KEY.
# Usage: pwsh scripts/cli/run.ps1 "src/auth.js"
# ──────────────────────────────────────────────────────────────────────────────

param([Parameter(Mandatory=$true)][string]$Input)

$WorkflowDir = Split-Path -Parent (Split-Path -Parent $MyInvocation.MyCommand.Path)
$SharedDir   = Join-Path $WorkflowDir "../../shared"
$OutputsDir  = Join-Path $WorkflowDir "outputs"
$ApiKey      = $env:ANTHROPIC_API_KEY ?? $(throw "ANTHROPIC_API_KEY is not set")
$Model       = "claude-sonnet-4-6"
New-Item -ItemType Directory -Force -Path $OutputsDir | Out-Null

function Write-Log { param([string]$m) Write-Host "[$(Get-Date -Format 'HH:mm:ss')] $m" }
function Get-File  { param([string]$p) Get-Content $p -Raw }

function Invoke-Api {
  param([string]$System, [string]$User, [int]$MaxTokens = 4096)
  $body = @{ model=$Model; max_tokens=$MaxTokens; system=$System
             messages=@(@{role="user";content=$User}) } | ConvertTo-Json -Depth 10
  (Invoke-RestMethod -Uri "https://api.anthropic.com/v1/messages" -Method POST `
    -Headers @{"x-api-key"=$ApiKey;"anthropic-version"="2023-06-01";"content-type"="application/json"} `
    -Body $body).content[0].text
}

# ── Step 1: Analyze Code ───────────────────────────────────────────────────────
Write-Log "Step 1: Analyze Code"
$sys = (Get-File "$SharedDir/project.md") + "`n" + (Get-File "$SharedDir/AGENTS.md") + "`n" + (Get-File "$WorkflowDir/agents/analyzer.md")
$usr = (Get-File "$WorkflowDir/skills/code-analysis.md") + "`n`nInput: $Input"
Invoke-Api $sys $usr 4096 | Set-Content "$OutputsDir/01-analysis.md"
Write-Log "  ✓ outputs/01-analysis.md"

# ── Step 2: Write Review ───────────────────────────────────────────────────────
Write-Log "Step 2: Write Review"
$sys = (Get-File "$SharedDir/project.md") + "`n" + (Get-File "$SharedDir/AGENTS.md") + "`n" + (Get-File "$WorkflowDir/agents/reviewer.md")
$usr = (Get-File "$WorkflowDir/skills/write-review.md") + "`n`n" + (Get-File "$OutputsDir/01-analysis.md")
Invoke-Api $sys $usr 4096 | Set-Content "$OutputsDir/02-review.md"
Write-Log "  ✓ outputs/02-review.md"

# ── Step 3: Create Summary ─────────────────────────────────────────────────────
Write-Log "Step 3: Create Summary"
$sys = (Get-File "$SharedDir/project.md") + "`n" + (Get-File "$SharedDir/AGENTS.md") + "`n" + (Get-File "$WorkflowDir/agents/summarizer.md")
$usr = (Get-File "$WorkflowDir/skills/summarize.md") + "`n`n" + (Get-File "$OutputsDir/02-review.md")
Invoke-Api $sys $usr 2048 | Set-Content "$OutputsDir/03-summary.md"
Write-Log "  ✓ outputs/03-summary.md"

Write-Host ""
Write-Host "✅ Code review complete."
Write-Host "   outputs/01-analysis.md  — technical analysis"
Write-Host "   outputs/02-review.md    — full review report"
Write-Host "   outputs/03-summary.md   — prioritized summary"
