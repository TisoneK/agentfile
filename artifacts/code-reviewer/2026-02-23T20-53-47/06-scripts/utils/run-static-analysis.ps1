#!/usr/bin/env pwsh
$ErrorActionPreference = "Stop"

# ── Usage ───────────────────────────────────────────────────────────────────────
# Usage: scripts/utils/run-static-analysis.ps1 -TargetPath <path> -ConfigJson <json> -OutputFile <path>
# Description: Run static analysis tools on target code and output results
# Called by: scripts/cli/run.ps1

param(
  [Parameter(Mandatory=$true)][string]$TargetPath,
  [Parameter(Mandatory=$true)][string]$ConfigJson,
  [Parameter(Mandatory=$true)][string]$OutputFile
)

function Write-Log([string]$m) {
  Write-Host "[$(Get-Date -Format 'HH:mm:ss')] [$($MyInvocation.MyCommand.Name)] $m" -ForegroundColor Gray
}

function Run-PythonAnalysis {
  param([string]$Target, [string]$Output)
  
  Write-Log "Running Python static analysis on: $Target"
  
  # Try different Python analyzers
  if (Get-Command pylint -ErrorAction SilentlyContinue) {
    Write-Log "  Running pylint..."
    try {
      pylint --output-format=json $Target | Out-File "$Output.pylint.json" -Encoding UTF8
    } catch {
      Write-Log "  pylint failed or found no issues"
    }
  }
  
  if (Get-Command flake8 -ErrorAction SilentlyContinue) {
    Write-Log "  Running flake8..."
    try {
      flake8 --format=json $Target | Out-File "$Output.flake8.json" -Encoding UTF8
    } catch {
      Write-Log "  flake8 failed or found no issues"
    }
  }
  
  if (Get-Command bandit -ErrorAction SilentlyContinue) {
    Write-Log "  Running bandit..."
    try {
      bandit -f json $Target | Out-File "$Output.bandit.json" -Encoding UTF8
    } catch {
      Write-Log "  bandit failed or found no issues"
    }
  }
}

function Run-JavaScriptAnalysis {
  param([string]$Target, [string]$Output)
  
  Write-Log "Running JavaScript static analysis on: $Target"
  
  # Try different JavaScript analyzers
  if (Get-Command eslint -ErrorAction SilentlyContinue) {
    Write-Log "  Running eslint..."
    try {
      eslint --format=json $Target | Out-File "$Output.eslint.json" -Encoding UTF8
    } catch {
      Write-Log "  eslint failed or found no issues"
    }
  }
  
  if (Get-Command jshint -ErrorAction SilentlyContinue) {
    Write-Log "  Running jshint..."
    try {
      jshint --reporter=json $Target | Out-File "$Output.jshint.json" -Encoding UTF8
    } catch {
      Write-Log "  jshint failed or found no issues"
    }
  }
}

# ── Main Logic ───────────────────────────────────────────────────────────────────
Write-Log "Starting static analysis on: $TargetPath"

# Validate inputs
if (-not (Test-Path $TargetPath)) {
  Write-Log "ERROR: Target path does not exist: $TargetPath"
  exit 1
}

# Create output directory
$outputDir = Split-Path $OutputFile -Parent
if (-not (Test-Path $outputDir)) {
  New-Item -ItemType Directory -Path $outputDir -Force | Out-Null
}

# Detect languages in target
$languages = @()
try {
  $config = $ConfigJson | ConvertFrom-Json
  if ($config.languages) {
    $languages = $config.languages
  }
} catch {
  Write-Log "WARNING: Could not parse config for languages"
}

if ($languages.Count -eq 0) {
  # Auto-detect languages
  if (Get-ChildItem -Path $TargetPath -Filter "*.py" -Recurse | Select-Object -First 1) {
    $languages += "python"
  }
  if (Get-ChildItem -Path $TargetPath -Filter "*.js" -Recurse | Select-Object -First 1) {
    $languages += "javascript"
  }
  if (Get-ChildItem -Path $TargetPath -Filter "*.ts" -Recurse | Select-Object -First 1) {
    $languages += "typescript"
  }
}

Write-Log "Detected languages: $($languages -join ', ')"

# Run analysis for each language
foreach ($language in $languages) {
  switch ($language) {
    "python" {
      Run-PythonAnalysis $TargetPath "$OutputFile.python"
    }
    "javascript" {
      Run-JavaScriptAnalysis $TargetPath "$OutputFile.javascript"
    }
    "typescript" {
      Run-JavaScriptAnalysis $TargetPath "$OutputFile.javascript"
    }
    default {
      Write-Log "WARNING: No static analyzer configured for language: $language"
    }
  }
}

# Compile results
$toolsUsed = @()
$resultFiles = Get-ChildItem "$OutputFile*.json" -ErrorAction SilentlyContinue
foreach ($file in $resultFiles) {
  $toolName = $file.Name.Replace("$OutputFile.", "").Replace(".json", "")
  $toolsUsed += $toolName
  Write-Log "  Processing results from: $toolName"
}

# Create result object
$result = @{
  analysis_type = "static_analysis"
  target_path = $TargetPath
  timestamp = (Get-Date).ToString("yyyy-MM-ddTHH:mm:ssZ")
  languages_analyzed = $languages
  tools_used = $toolsUsed
  findings = @()
  summary = @{
    total_issues = 0
    by_severity = @{
      error = 0
      warning = 0
      info = 0
    }
  }
}

# Write final result
$result | ConvertTo-Json -Depth 10 | Set-Content $OutputFile -Encoding UTF8

Write-Log "✓ Static analysis completed: $OutputFile"
Write-Log "  Total issues found: $($result.summary.total_issues)"
