#!/usr/bin/env pwsh
$ErrorActionPreference = "Stop"

# ── Usage ───────────────────────────────────────────────────────────────────────
# Usage: scripts/utils/generate-artifacts.ps1 -OutputsDir <path> [-ArtifactType <type>]
# Description: Generate review artifacts and metadata for archiving
# Called by: scripts/cli/run.ps1, scripts/ide/register.ps1

param(
  [Parameter(Mandatory=$true)][string]$OutputsDir,
  [Parameter(Mandatory=$false)][string]$ArtifactType = "review"
)

function Write-Log([string]$m) {
  Write-Host "[$(Get-Date -Format 'HH:mm:ss')] [$($MyInvocation.MyCommand.Name)] $m" -ForegroundColor Gray
}

# ── Main Logic ───────────────────────────────────────────────────────────────────
Write-Log "Generating artifacts in: $OutputsDir"

# Validate outputs directory
if (-not (Test-Path $OutputsDir -PathType Container)) {
  Write-Log "ERROR: Outputs directory does not exist: $OutputsDir"
  exit 1
}

# Create artifacts directory
$artifactsDir = Join-Path $OutputsDir "artifacts"
if (-not (Test-Path $artifactsDir)) {
  New-Item -ItemType Directory -Path $artifactsDir -Force | Out-Null
}

# Generate artifact manifest
$manifestFile = Join-Path $artifactsDir "manifest.json"

# Collect all output files
$outputFiles = Get-ChildItem -Path $OutputsDir -File | Where-Object {
  $_.Extension -match '\.(md|json|html)$'
} | Sort-Object Name

# Calculate total size
$totalSize = ($outputFiles | Measure-Object -Property Length -Sum).Sum

# Generate file objects for manifest
$fileObjects = @()
foreach ($file in $outputFiles) {
  $relPath = $file.FullName.Replace($OutputsDir, "").TrimStart("\", "/")
  $fileObj = @{
    path = $relPath
    size_bytes = $file.Length
    modified_timestamp = [int][double]::Parse((Get-Date $file.LastWriteTime -UFormat %s))
    type = $file.Extension.TrimStart(".")
  }
  $fileObjects += $fileObj
}

# Create manifest object
$manifest = @{
  artifact_type = $ArtifactType
  generated_at = (Get-Date).ToString("yyyy-MM-ddTHH:mm:ssZ")
  outputs_directory = $OutputsDir
  total_files = $outputFiles.Count
  total_size_bytes = $totalSize
  files = $fileObjects
  metadata = @{
    generator = "code-reviewer"
    version = "1.0.0"
    hostname = $env:COMPUTERNAME
    user = $env:USERNAME
  }
}

# Write manifest file
$manifest | ConvertTo-Json -Depth 10 | Set-Content $manifestFile

# Generate summary report
$summaryFile = Join-Path $artifactsDir "summary.txt"
$summaryContent = @"
Code Review Artifact Summary
==========================
Generated: $(Get-Date -Format 'yyyy-MM-ddTHH:mm:ssZ')
Type: $ArtifactType
Directory: $OutputsDir

Files Generated: $($outputFiles.Count)
Total Size: $([math]::Round($totalSize / 1KB, 2)) KB

File List:
"@

foreach ($file in $outputFiles) {
  $relPath = $file.FullName.Replace($OutputsDir, "").TrimStart("\", "/")
  $summaryContent += "`n  {0,-40} {1,8} bytes" -f $relPath, $file.Length
}

$summaryContent += @"

Metadata:
- Generator: code-reviewer v1.0.0
- Host: $env:COMPUTERNAME
- User: $env:USERNAME
"@

$summaryContent | Set-Content $summaryFile

Write-Log "✓ Artifacts generated successfully"
Write-Log "  Manifest: $manifestFile"
Write-Log "  Summary: $summaryFile"
Write-Log "  Total files: $($outputFiles.Count)"
Write-Log "  Total size: $([math]::Round($totalSize / 1KB, 2)) KB"

# Output manifest content
$manifest | ConvertTo-Json -Depth 10
