#!/usr/bin/env pwsh
$ErrorActionPreference = "Stop"

# Agentfile reference runtime — code-reviewer (PowerShell)
# Usage: $env:AGENT_API_KEY="sk-..."; $env:AGENT_INPUT="path/to/code.py"; pwsh scripts/run.ps1

$WorkflowDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$SharedDir   = Join-Path $WorkflowDir "../../../../shared"
$OutputsDir  = Join-Path $WorkflowDir "../outputs"
$ApiKey      = if ($env:AGENT_API_KEY) { $env:AGENT_API_KEY } else { throw "AGENT_API_KEY is not set" }
$Model       = if ($env:AGENT_MODEL) { $env:AGENT_MODEL } else { "claude-sonnet-4-6" }
New-Item -ItemType Directory -Force -Path $OutputsDir | Out-Null

function Invoke-Api {
  param([string]$System, [string]$User, [int]$MaxTokens=4096, [float]$Temperature=0.3)
  $body = @{model=$Model;max_tokens=$MaxTokens;temperature=$Temperature;system=$System;messages=@(@{role="user";content=$User})} | ConvertTo-Json -Depth 10 -Compress
  (Invoke-RestMethod -Uri "https://api.anthropic.com/v1/messages" -Method POST `
    -Headers @{"x-api-key"=$ApiKey;"anthropic-version"="2023-06-01";"content-type"="application/json"} `
    -Body ([System.Text.Encoding]::UTF8.GetBytes($body))).content[0].text
}

function Read-F { param([string]$P) Get-Content $P -Raw -Encoding UTF8 }

function Invoke-Gate {
  param([string]$Name, [string]$File)
  Write-Host ""; Write-Host "══ GATE: $Name ══"; Get-Content $File -Raw | Write-Host; Write-Host ""
  $c = Read-Host "Approve? [y/N]"
  if ($c -ne "y") { Write-Host "Aborted."; exit 1 }
}

function Write-Log { param([string]$M) Write-Host "[$(Get-Date -Format 'HH:mm:ss')] $M" }

function Get-Input {
  if (Test-Path $env:AGENT_INPUT) { Get-Content $env:AGENT_INPUT -Raw }
  else { $env:AGENT_INPUT }
}

# Step 1: Analyze
Write-Log "▶ Step 1/2: Analyze Code"
$system = (Read-F "$SharedDir/project.md") + "`n`n" + (Read-F "$SharedDir/AGENTS.md") + "`n`n" + (Read-F "$WorkflowDir/../agents/analyzer.md")
$user   = (Read-F "$WorkflowDir/../skills/code-analysis.md") + "`n`n---`n`nCode to analyze:`n`n``````n" + (Get-Input) + "`n``````"
Invoke-Api $system $user | Set-Content "$OutputsDir/01-analysis.md" -Encoding UTF8
Write-Log "  ✓ outputs/01-analysis.md"

# Step 2: Review
Write-Log "▶ Step 2/2: Write Review"
$system = (Read-F "$SharedDir/project.md") + "`n`n" + (Read-F "$SharedDir/AGENTS.md") + "`n`n" + (Read-F "$WorkflowDir/../agents/reviewer.md")
$user   = (Read-F "$WorkflowDir/../skills/write-review.md") + "`n`n---`n`nAnalysis:`n`n" + (Read-F "$OutputsDir/01-analysis.md")
Invoke-Api $system $user | Set-Content "$OutputsDir/02-review.md" -Encoding UTF8
Invoke-Gate "Review" "$OutputsDir/02-review.md"

Write-Log "✅ Done. Review saved to outputs/02-review.md"
