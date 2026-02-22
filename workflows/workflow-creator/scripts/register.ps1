#!/usr/bin/env pwsh
$ErrorActionPreference = "Stop"

# register.ps1
# Reads generated outputs and assembles the new workflow folder.
# Parses === FILE: === delimiters to extract individual files.

$WorkflowDir   = Split-Path -Parent $MyInvocation.MyCommand.Path
$OutputsDir    = Join-Path $WorkflowDir "outputs"
$WorkflowsRoot = Join-Path $WorkflowDir "../../.."

# ── Read workflow name from generated YAML ─────────────────────────────────────
$yamlContent  = Get-Content "$OutputsDir/03-workflow.yaml" -Raw
$nameLine     = ($yamlContent -split "`n") | Where-Object { $_ -match '^name:' } | Select-Object -First 1
$WorkflowName = ($nameLine -replace '^name:\s*', '').Trim().Trim('"').Trim("'")

if (-not $WorkflowName) {
  throw "ERROR: Could not determine workflow name from outputs/03-workflow.yaml"
}

$TargetDir = Join-Path $WorkflowsRoot $WorkflowName
Write-Host "Registering workflow: $WorkflowName"
Write-Host "Target directory: $TargetDir"

# ── Create directory structure ─────────────────────────────────────────────────
foreach ($subdir in @("agents", "skills", "scripts", "outputs")) {
  New-Item -ItemType Directory -Force -Path (Join-Path $TargetDir $subdir) | Out-Null
}

# ── Copy workflow.yaml ─────────────────────────────────────────────────────────
Copy-Item "$OutputsDir/03-workflow.yaml" "$TargetDir/workflow.yaml"
Write-Host "  ✓ workflow.yaml"

# ── Parse and extract delimited files ─────────────────────────────────────────
function Expand-DelimitedFiles {
  param([string]$SourceFile, [string]$BaseDir)

  $lines       = Get-Content $SourceFile -Encoding UTF8
  $currentFile = $null
  $buffer      = [System.Collections.Generic.List[string]]::new()

  foreach ($line in $lines) {
    if ($line -match '^\=\=\= FILE: (.+) \=\=\=$') {
      # Save previous file
      if ($currentFile -and $buffer.Count -gt 0) {
        $target = Join-Path $BaseDir $currentFile
        $dir    = Split-Path $target -Parent
        New-Item -ItemType Directory -Force -Path $dir | Out-Null
        $buffer | Set-Content $target -Encoding UTF8
        Write-Host "  ✓ $currentFile"
      }
      $currentFile = $Matches[1].Trim()
      $buffer.Clear()
    }
    elseif ($line -eq '=== END FILE ===') {
      if ($currentFile -and $buffer.Count -gt 0) {
        $target = Join-Path $BaseDir $currentFile
        $dir    = Split-Path $target -Parent
        New-Item -ItemType Directory -Force -Path $dir | Out-Null
        $buffer | Set-Content $target -Encoding UTF8
        Write-Host "  ✓ $currentFile"
      }
      $currentFile = $null
      $buffer.Clear()
    }
    elseif ($currentFile) {
      $buffer.Add($line)
    }
  }
}

Write-Host "Extracting agents..."
Expand-DelimitedFiles "$OutputsDir/04-agents/_all.md" $TargetDir

Write-Host "Extracting skills..."
Expand-DelimitedFiles "$OutputsDir/05-skills/_all.md" $TargetDir

Write-Host "Extracting scripts..."
Expand-DelimitedFiles "$OutputsDir/06-scripts/_all.md" $TargetDir

# ── Create .gitignore ──────────────────────────────────────────────────────────
"outputs/" | Set-Content "$TargetDir/.gitignore" -Encoding UTF8

# ── Copy review report ─────────────────────────────────────────────────────────
Copy-Item "$OutputsDir/07-review.md" "$TargetDir/REVIEW.md"

Write-Host ""
Write-Host "✅ Workflow '$WorkflowName' registered at: $TargetDir"
Write-Host ""
Write-Host "To run it:"
Write-Host "  `$env:ANTHROPIC_API_KEY = 'your-key'"
Write-Host "  `$env:WORKFLOW_REQUEST = 'your request'"
Write-Host "  pwsh $TargetDir/scripts/run.ps1"
