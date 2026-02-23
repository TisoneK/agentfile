#!/usr/bin/env pwsh
$ErrorActionPreference = "Stop"

# ── Usage ───────────────────────────────────────────────────────────────────────
# Usage: scripts/utils/validate-inputs.ps1 -InputPath <path> [-FileType <type>]
# Description: Validate input files exist, are readable, and match expected format
# Called by: scripts/cli/run.ps1, scripts/ide/register.ps1

param(
  [Parameter(Mandatory=$true)][string]$InputPath,
  [Parameter(Mandatory=$false)][string]$FileType = "auto"
)

function Write-Log([string]$m) {
  Write-Host "[$(Get-Date -Format 'HH:mm:ss')] [$($MyInvocation.MyCommand.Name)] $m" -ForegroundColor Gray
}

function Test-File {
  param([string]$File, [string]$ExpectedType)
  
  # Check if file exists
  if (-not (Test-Path $File)) {
    Write-Log "ERROR: File does not exist: $File"
    return $false
  }
  
  # Check if file is readable
  try {
    $null = Get-Content $File -ErrorAction Stop
  } catch {
    Write-Log "ERROR: File is not readable: $File"
    return $false
  }
  
  # Check if file is empty
  if ((Get-Item $File).Length -eq 0) {
    Write-Log "ERROR: File is empty: $File"
    return $false
  }
  
  # Type-specific validation
  switch ($ExpectedType) {
    "json" {
      try {
        $null = Get-Content $File | ConvertFrom-Json
      } catch {
        Write-Log "ERROR: Invalid JSON format: $File"
        Write-Log $_.Exception.Message
        return $false
      }
    }
    "markdown" {
      if (-not (Select-String -Path $File -Pattern "^#" -Quiet)) {
        Write-Log "WARNING: No markdown headers found in: $File"
      }
    }
    "yaml" {
      try {
        # Try to validate YAML using PowerShell (basic check)
        $content = Get-Content $File -Raw
        if ($content -notmatch "^[a-zA-Z_][a-zA-Z0-9_]*\s*:" -and $content -notmatch "^\s*-\s+") {
          Write-Log "WARNING: May not be valid YAML format: $File"
        }
      } catch {
        Write-Log "ERROR: Invalid YAML format: $File"
        return $false
      }
    }
    "auto" {
      $ext = [System.IO.Path]::GetExtension($File).ToLower()
      switch ($ext) {
        ".json" { return Test-File $File "json" }
        ".md" { return Test-File $File "markdown" }
        ".yaml" { return Test-File $File "yaml" }
        ".yml" { return Test-File $File "yaml" }
      }
    }
  }
  
  Write-Log "✓ Validated: $File"
  return $true
}

function Test-Directory {
  param([string]$Dir)
  
  if (-not (Test-Path $Dir -PathType Container)) {
    Write-Log "ERROR: Directory does not exist: $Dir"
    return $false
  }
  
  # Check if directory is readable
  try {
    $null = Get-ChildItem $Dir -ErrorAction Stop
  } catch {
    Write-Log "ERROR: Directory is not readable: $Dir"
    return $false
  }
  
  # Check if directory contains source files
  $sourceFiles = Get-ChildItem -Path $Dir -Recurse -File | Where-Object {
    $_.Extension -match '\.(py|js|ts|java|c|cpp|cs|go|rb|php|swift|kt|rs|scala)$'
  }
  
  if ($sourceFiles.Count -eq 0) {
    Write-Log "WARNING: No source files found in directory: $Dir"
  }
  
  Write-Log "✓ Validated directory: $Dir ($($sourceFiles.Count) source files)"
  return $true
}

# ── Main Logic ───────────────────────────────────────────────────────────────────
Write-Log "Validating input: $InputPath"

$isValid = $false
$inputType = ""

if (Test-Path $InputPath -PathType Leaf) {
  $isValid = Test-File $InputPath $FileType
  $inputType = "file"
} elseif (Test-Path $InputPath -PathType Container) {
  $isValid = Test-Directory $InputPath
  $inputType = "directory"
} else {
  Write-Log "ERROR: Input path is neither a file nor a directory: $InputPath"
  exit 1
}

if (-not $isValid) {
  Write-Log "Input validation failed"
  exit 1
}

Write-Log "Input validation completed successfully"

# Output validation result as JSON
$result = @{
  input_path = $InputPath
  type = $inputType
  validated = $true
  timestamp = (Get-Date).ToString("yyyy-MM-ddTHH:mm:ssZ")
}

$result | ConvertTo-Json -Depth 10
