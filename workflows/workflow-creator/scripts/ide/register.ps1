#!/usr/bin/env pwsh
$ErrorActionPreference = "Stop"

# ── scripts/ide/register.ps1 ──────────────────────────────────────────────────
# IDE-safe promotion script.
# Validates the artifact staging directory, assembles the canonical workflow
# folder, archives the artifact run, and writes workflow_status.json.
#
# Usage:
#   pwsh -ExecutionPolicy Bypass scripts/ide/register.ps1 artifacts/<workflow>/<run-id>
#
# NO API KEY REQUIRED — pure file I/O only.
# ──────────────────────────────────────────────────────────────────────────────

$ScriptDir     = Split-Path -Parent $MyInvocation.MyCommand.Path
$ProjectRoot   = (Get-Item $ScriptDir).Parent.Parent.Parent.Parent.FullName

function Write-Log { param([string]$Message) Write-Host "[$(Get-Date -Format 'HH:mm:ss')] $Message" }

# ── Resolve artifact run directory ───────────────────────────────────────────
if ($args.Count -ge 1) {
    $ArtifactRunDir = (Resolve-Path $args[0]).Path
} else {
    # Auto-detect most recent artifact run
    $manifests = Get-ChildItem -Path "$ProjectRoot/artifacts" -Filter "manifest.json" -Recurse -ErrorAction SilentlyContinue
    $ArtifactRunDir = $manifests | Where-Object { $_.FullName -notmatch "/build/" } | Sort-Object LastWriteTime -Descending | Select-Object -First 1 | ForEach-Object { $_.DirectoryName }
    if (-not $ArtifactRunDir) {
        throw "ERROR: No artifact run found. Pass path as argument: pwsh register.ps1 artifacts/<workflow>/<run-id>"
    }
    Write-Log "Auto-detected: $ArtifactRunDir"
}

$Manifest = Join-Path $ArtifactRunDir "manifest.json"
if (-not (Test-Path $Manifest)) {
    throw "ERROR: manifest.json not found in $ArtifactRunDir"
}

# ── Read manifest ──────────────────────────────────────────────────────────────
$manifestContent = Get-Content $Manifest -Raw | ConvertFrom-Json
$WorkflowName = $manifestContent.workflow
$RunId = $manifestContent.run_id

if (-not $WorkflowName) { throw "ERROR: Could not read 'workflow' from manifest.json" }
if (-not $RunId) { throw "ERROR: Could not read 'run_id' from manifest.json" }

Write-Log "Workflow: $WorkflowName | Run: $RunId"

# ── Validate required artifacts ─────────────────────────────────────────────
Write-Log "Validating artifact set..."
$missing = @()
$required = @("01-clarification.md", "02-design.md", "03-workflow.yaml", "07-review.md")
foreach ($f in $required) {
    if (-not (Test-Path (Join-Path $ArtifactRunDir $f))) {
        $missing += $f
    }
}
$agentCount = (Get-ChildItem (Join-Path $ArtifactRunDir "04-agents") -Filter "*.md" -ErrorAction SilentlyContinue).Count
if ($agentCount -eq 0) { $missing += "04-agents/<role>.md" }

if ($missing.Count -gt 0) {
    Write-Host ""
    Write-Host "Missing required artifacts:" -ForegroundColor Red
    foreach ($f in $missing) { Write-Host "  - $f" }
    Write-Host ""
    throw "ERROR: Resolve missing artifacts before promoting."
}
Write-Log "  All required artifacts present"

# ── Check for name collision ─────────────────────────────────────────────────
$TargetDir = Join-Path $ProjectRoot "workflows\$WorkflowName"
if (Test-Path $TargetDir) {
    Write-Host ""
    Write-Host "WARNING: workflows/$WorkflowName already exists." -ForegroundColor Yellow
    $confirm = Read-Host "Overwrite? [y/N]"
    if ($confirm -notmatch "^[Yy]$") {
        Write-Host "Promotion cancelled." -ForegroundColor Yellow
        exit 0
    }
}

$ArchiveDir = Join-Path $ProjectRoot "outputs\$WorkflowName\$RunId\build"

# ── Assemble canonical workflow folder ───────────────────────────────────────
Write-Log "Assembling workflows/$WorkflowName ..."
New-Item -ItemType Directory -Force -Path "$TargetDir\agents" | Out-Null
New-Item -ItemType Directory -Force -Path "$TargetDir\skills" | Out-Null
New-Item -ItemType Directory -Force -Path "$TargetDir\scripts\ide" | Out-Null
New-Item -ItemType Directory -Force -Path "$TargetDir\scripts\cli" | Out-Null
New-Item -ItemType Directory -Force -Path "$TargetDir\outputs" | Out-Null

Copy-Item (Join-Path $ArtifactRunDir "03-workflow.yaml") "$TargetDir\workflow.yaml"
Write-Log "  + workflow.yaml"

# ── Parse ##FILE: === delimiters and extract files ───────────────────────────
function Expand-DelimitedFiles {
    param([string]$SourceFile, [string]$BaseDir)

    if (-not (Test-Path $SourceFile)) { return }

    $lines = Get-Content $SourceFile -Encoding UTF8
    $currentFile = $null
    $buffer = [System.Collections.Generic.List[string]]::new()

    foreach ($line in $lines) {
        if ($line -match '^##FILE:\ (.+)##$') {
            if ($currentFile -and $buffer.Count -gt 0) {
                $target = Join-Path $BaseDir $currentFile
                $dir = Split-Path $target -Parent
                New-Item -ItemType Directory -Force -Path $dir | Out-Null
                $buffer | Set-Content $target -Encoding UTF8
                Write-Log "  + $currentFile"
            }
            $currentFile = $Matches[1].Trim()
            $buffer.Clear()
        }
        elseif ($line -eq '##END##') {
            if ($currentFile -and $buffer.Count -gt 0) {
                $target = Join-Path $BaseDir $currentFile
                $dir = Split-Path $target -Parent
                New-Item -ItemType Directory -Force -Path $dir | Out-Null
                $buffer | Set-Content $target -Encoding UTF8
                Write-Log "  + $currentFile"
            }
            $currentFile = $null
            $buffer.Clear()
        }
        elseif ($currentFile) {
            $buffer.Add($line)
        }
    }
}

# Agents — support both individual files and _all.md bundle
$agentsAll = Join-Path $ArtifactRunDir "04-agents\_all.md"
$agentsDir = Join-Path $ArtifactRunDir "04-agents"
if (Test-Path $agentsAll) {
    Write-Log "Extracting agents..."
    Expand-DelimitedFiles $agentsAll $TargetDir
} else {
    $agentFiles = Get-ChildItem $agentsDir -Filter "*.md" -ErrorAction SilentlyContinue
    foreach ($f in $agentFiles) {
        Copy-Item $f.FullName "$TargetDir\agents\"
        Write-Log "  + agents\$($f.Name)"
    }
}

# Skills
$skillsAll = Join-Path $ArtifactRunDir "05-skills\_all.md"
$skillsDir = Join-Path $ArtifactRunDir "05-skills"
if (Test-Path $skillsAll) {
    Write-Log "Extracting skills..."
    Expand-DelimitedFiles $skillsAll $TargetDir
} else {
    $skillFiles = Get-ChildItem $skillsDir -Filter "*.md" -ErrorAction SilentlyContinue
    foreach ($f in $skillFiles) {
        Copy-Item $f.FullName "$TargetDir\skills\"
        Write-Log "  + skills\$($f.Name)"
    }
}

# Scripts — IDE
$scriptsIdeSrc = Join-Path $ArtifactRunDir "06-scripts\ide"
if (Test-Path $scriptsIdeSrc) {
    Copy-Item "$scriptsIdeSrc\*" "$TargetDir\scripts\ide\" -Recurse -Force
    Write-Log "  + scripts/ide/"
}

# Scripts — CLI
$scriptsCliSrc = Join-Path $ArtifactRunDir "06-scripts\cli"
if (Test-Path $scriptsCliSrc) {
    Copy-Item "$scriptsCliSrc\*" "$TargetDir\scripts\cli\" -Recurse -Force
    Write-Log "  + scripts/cli/"
}

# Scripts — _all.md fallback
$scriptsAll = Join-Path $ArtifactRunDir "06-scripts\_all.md"
if (Test-Path $scriptsAll) {
    Write-Log "Extracting scripts..."
    Expand-DelimitedFiles $scriptsAll $TargetDir
}

# Make .sh files executable
Get-ChildItem "$TargetDir\scripts" -Filter "*.sh" -Recurse | ForEach-Object { chmod $_.FullName +x 2>$null }

# REVIEW.md
$reviewSrc = Join-Path $ArtifactRunDir "07-review.md"
if (Test-Path $reviewSrc) {
    Copy-Item $reviewSrc "$TargetDir\REVIEW.md"
    Write-Log "  + REVIEW.md"
}

# .gitignore
"outputs/" | Set-Content "$TargetDir\.gitignore" -Encoding UTF8
Write-Log "  + .gitignore"

# ── Write workflow_status.json ───────────────────────────────────────────────
$now = (Get-Date).ToUniversalTime().ToString("yyyy-MM-ddTHH:mm:ssZ")
$statusJson = @{
    workflow = $WorkflowName
    registered_at = $now
    source_run_id = $RunId
    archive = "outputs/$WorkflowName/$RunId/build"
} | ConvertTo-Json -Compress

$statusJson | Set-Content "$TargetDir\workflow_status.json" -Encoding UTF8
Write-Log "  + workflow_status.json"

# ── Archive artifact run ─────────────────────────────────────────────────────
Write-Log "Archiving to outputs/$WorkflowName/$RunId/build/ ..."
New-Item -ItemType Directory -Force -Path $ArchiveDir | Out-Null
Copy-Item "$ArtifactRunDir\*" $ArchiveDir -Recurse -Force

# Update manifest in archive
$archiveManifest = Join-Path $ArchiveDir "manifest.json"
$archiveContent = Get-Content $archiveManifest -Raw | ConvertFrom-Json
$archiveContent.status = "registered"
$archiveContent.updated_at = $now
$archiveContent.phases.promotion = @{ status = "completed"; completed_at = $now }
$archiveContent.phases.archival = @{ status = "completed"; completed_at = $now }
$archiveContent.promotion = @{
    target = "workflows/$WorkflowName"
    promoted_at = $now
    archive_path = "outputs/$WorkflowName/$RunId/build"
}
$archiveContent | ConvertTo-Json -Depth 10 | Set-Content $archiveManifest -Encoding UTF8
Write-Log "  + manifest.json (status: registered)"

# ── Remove staging directory ─────────────────────────────────────────────────
Remove-Item $ArtifactRunDir -Recurse -Force
$parent = Split-Path $ArtifactRunDir -Parent
if ((Test-Path $parent) -and -not (Get-ChildItem $parent -ErrorAction SilentlyContinue)) {
    Remove-Item $parent -ErrorAction SilentlyContinue
}

Write-Host ""
Write-Host "✅ Workflow '$WorkflowName' registered at: workflows/$WorkflowName" -ForegroundColor Green
Write-Host "   Artifact archived at: outputs/$WorkflowName/$RunId/build"
Write-Host ""
Write-Host "Next steps:"
Write-Host "  IDE:  /agentfile:run $WorkflowName"
Write-Host "  CLI:  pwsh workflows\$WorkflowName\scripts\cli\run.ps1"
