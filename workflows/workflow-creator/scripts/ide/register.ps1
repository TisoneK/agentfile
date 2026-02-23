#!/usr/bin/env pwsh
$ErrorActionPreference = "Stop"

# ── scripts/ide/register.ps1 ──────────────────────────────────────────────────
# IDE-safe registration script.
# Assembles the generated outputs into a proper workflow folder.
# NO API KEY REQUIRED — pure file I/O only.
# ──────────────────────────────────────────────────────────────────────────────

$ScriptDir     = Split-Path -Parent $MyInvocation.MyCommand.Path
$WorkflowDir   = Split-Path -Parent (Split-Path -Parent $ScriptDir)
$OutputsDir    = Join-Path $WorkflowDir "outputs"
$WorkflowsRoot = Split-Path -Parent (Split-Path -Parent $WorkflowDir)

function Write-Log { param([string]$Message) Write-Host "[$(Get-Date -Format 'HH:mm:ss')] $Message" }

# ── Validate outputs exist ─────────────────────────────────────────────────────
$required = @(
  "$OutputsDir/03-workflow.yaml",
  "$OutputsDir/04-agents/_all.md",
  "$OutputsDir/05-skills/_all.md",
  "$OutputsDir/06-scripts/_all.md"
)
foreach ($path in $required) {
  if (-not (Test-Path $path)) {
    throw "ERROR: Missing required output: $path`nMake sure all generation steps completed before registering."
  }
}

# ── Read workflow name from generated YAML ─────────────────────────────────────
$yamlLines    = Get-Content "$OutputsDir/03-workflow.yaml"
$nameLine     = $yamlLines | Where-Object { $_ -match '^name:' } | Select-Object -First 1
$WorkflowName = ($nameLine -replace '^name:\s*', '').Trim().Trim('"').Trim("'")

if (-not $WorkflowName) {
  throw "ERROR: Could not determine workflow name from outputs/03-workflow.yaml"
}

$TargetDir = Join-Path $WorkflowsRoot $WorkflowName
Write-Log "Registering workflow: $WorkflowName"
Write-Log "Target directory: $TargetDir"

# ── Create directory structure ─────────────────────────────────────────────────
foreach ($subdir in @("agents", "skills", "scripts/ide", "scripts/cli", "outputs")) {
  New-Item -ItemType Directory -Force -Path (Join-Path $TargetDir $subdir) | Out-Null
}

# ── Copy workflow.yaml ─────────────────────────────────────────────────────────
Copy-Item "$OutputsDir/03-workflow.yaml" "$TargetDir/workflow.yaml"
Write-Log "  ✓ workflow.yaml"

# ── Parse ##FILE: === delimiters and extract files ───────────────────────────
function Expand-DelimitedFiles {
  param([string]$SourceFile, [string]$BaseDir)

  $lines       = Get-Content $SourceFile -Encoding UTF8
  $currentFile = $null
  $buffer      = [System.Collections.Generic.List[string]]::new()

  foreach ($line in $lines) {
    if ($line -match '^##FILE: (.+)##$') {
      # Flush previous file
      if ($currentFile -and $buffer.Count -gt 0) {
        $target = Join-Path $BaseDir $currentFile
        $dir    = Split-Path $target -Parent
        New-Item -ItemType Directory -Force -Path $dir | Out-Null
        $buffer | Set-Content $target -Encoding UTF8
        Write-Log "  ✓ $currentFile"
      }
      $currentFile = $Matches[1].Trim()
      $buffer.Clear()
    }
    elseif ($line -eq '##END##') {
      if ($currentFile -and $buffer.Count -gt 0) {
        $target = Join-Path $BaseDir $currentFile
        $dir    = Split-Path $target -Parent
        New-Item -ItemType Directory -Force -Path $dir | Out-Null
        $buffer | Set-Content $target -Encoding UTF8
        Write-Log "  ✓ $currentFile"
      }
      $currentFile = $null
      $buffer.Clear()
    }
    elseif ($currentFile) {
      $buffer.Add($line)
    }
  }
}

Write-Log "Extracting agents..."
Expand-DelimitedFiles "$OutputsDir/04-agents/_all.md" $TargetDir

Write-Log "Extracting skills..."
Expand-DelimitedFiles "$OutputsDir/05-skills/_all.md" $TargetDir

Write-Log "Extracting scripts..."
Expand-DelimitedFiles "$OutputsDir/06-scripts/_all.md" $TargetDir

# ── Create .gitignore ──────────────────────────────────────────────────────────
"outputs/" | Set-Content "$TargetDir/.gitignore" -Encoding UTF8

# ── Copy review report ────────────────────────────────────────────────────────
if (Test-Path "$OutputsDir/07-review.md") {
  Copy-Item "$OutputsDir/07-review.md" "$TargetDir/REVIEW.md"
  Write-Log "  ✓ REVIEW.md"
}

Write-Host ""
Write-Host "✅ Workflow '$WorkflowName' registered at: $TargetDir"
Write-Host ""
Write-Host "Next steps:"
Write-Host "  IDE:  /agentfile-run:$WorkflowName"
Write-Host "  CLI:  `$env:ANTHROPIC_API_KEY = 'your-key'"
Write-Host "        pwsh $TargetDir/scripts/cli/run.ps1"
