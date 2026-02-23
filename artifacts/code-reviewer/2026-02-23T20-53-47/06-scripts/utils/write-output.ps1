#!/usr/bin/env pwsh
$ErrorActionPreference = "Stop"

# ── Usage ───────────────────────────────────────────────────────────────────────
# Usage: scripts/utils/write-output.ps1 -ContentFile <path> -OutputPath <path>
# Description: Write content to output path, creating parent directories as needed
# Called by: scripts/cli/run.ps1, scripts/ide/register.ps1

param(
  [Parameter(Mandatory=$true)][string]$ContentFile,
  [Parameter(Mandatory=$true)][string]$OutputPath
)

function Write-Log([string]$m) {
  Write-Host "[$(Get-Date -Format 'HH:mm:ss')] [$($MyInvocation.MyCommand.Name)] $m" -ForegroundColor Gray
}

# ── Main Logic ───────────────────────────────────────────────────────────────────
Write-Log "Writing output: $ContentFile -> $OutputPath"

# Validate input file
if (-not (Test-Path $ContentFile)) {
  Write-Log "ERROR: Content file does not exist: $ContentFile"
  exit 1
}

# Create parent directories if they don't exist
$parentDir = Split-Path $OutputPath -Parent
if (-not (Test-Path $parentDir)) {
  Write-Log "Creating parent directory: $parentDir"
  New-Item -ItemType Directory -Force -Path $parentDir | Out-Null
}

# Copy content to output path
Copy-Item $ContentFile $OutputPath -Force

# Verify the write was successful
if (-not (Test-Path $OutputPath)) {
  Write-Log "ERROR: Failed to write output file: $OutputPath"
  exit 1
}

# Output metadata
$fileSize = (Get-Item $OutputPath).Length

Write-Log "✓ Output written successfully: $OutputPath ($fileSize bytes)"

# Output result as JSON
$result = @{
  content_file = $ContentFile
  output_path = $OutputPath
  file_size = $fileSize
  timestamp = (Get-Date).ToString("yyyy-MM-ddTHH:mm:ssZ")
  success = $true
}

$result | ConvertTo-Json -Depth 10
