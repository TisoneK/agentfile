#!/usr/bin/env pwsh
$ErrorActionPreference = "Stop"

# ── Usage ───────────────────────────────────────────────────────────────────────
# Usage: scripts/utils/load-config.ps1 [-ConfigPath <path>]
# Description: Load and validate review configuration from JSON file
# Called by: scripts/cli/run.ps1, scripts/ide/register.ps1

param(
  [Parameter(Mandatory=$false)][string]$ConfigPath = ".review-config.json"
)

function Write-Log([string]$m) {
  Write-Host "[$(Get-Date -Format 'HH:mm:ss')] [$($MyInvocation.MyCommand.Name)] $m" -ForegroundColor Gray
}

# ── Main Logic ───────────────────────────────────────────────────────────────────
Write-Log "Loading configuration from: $ConfigPath"

# Check if config file exists
if (-not (Test-Path $ConfigPath)) {
  Write-Log "Configuration file not found: $ConfigPath"
  Write-Log "Using default configuration"
  @'
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
'@
  return
}

# Validate JSON format
try {
  $null = Get-Content $ConfigPath | ConvertFrom-Json
} catch {
  Write-Log "ERROR: Invalid JSON in configuration file: $ConfigPath"
  Write-Log $_.Exception.Message
  exit 1
}

# Validate required fields
try {
  $config = Get-Content $ConfigPath | ConvertFrom-Json
  if (-not $config.languages) {
    throw "Missing 'languages' field in configuration"
  }
  if (-not $config.thresholds) {
    throw "Missing 'thresholds' field in configuration"
  }
} catch {
  Write-Log "ERROR: $_.Exception.Message"
  exit 1
}

# Output validated configuration
Get-Content $ConfigPath
Write-Log "Configuration loaded and validated successfully"
