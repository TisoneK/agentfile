#!/usr/bin/env pwsh
$ErrorActionPreference = "Stop"

$WorkflowDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$SharedDir   = Join-Path $WorkflowDir "../../../shared"
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
  Write-Host ""; Write-Host "══ GATE: $Name ══"
  Get-Content $File -Raw | Write-Host; Write-Host ""
  $c = Read-Host "Approve? [y/N]"
  if ($c -ne "y") { Write-Host "Aborted."; exit 1 }
}

function Write-Log { param([string]$M) Write-Host "[$(Get-Date -Format 'HH:mm:ss')] $M" }

# Step 1
Write-Log "▶ Step 1: First Step"
$system = (Read-F "$SharedDir/project.md") + "`n`n" + (Read-F "$SharedDir/AGENTS.md") + "`n`n" + (Read-F "$WorkflowDir/../agents/agent.md")
$user   = (Read-F "$WorkflowDir/../skills/skill.md") + "`n`n---`n`n" + $env:AGENT_INPUT
Invoke-Api $system $user | Set-Content "$OutputsDir/01-result.md" -Encoding UTF8
Invoke-Gate "First Step" "$OutputsDir/01-result.md"

Write-Log "✅ Done."
