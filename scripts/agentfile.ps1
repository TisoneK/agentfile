#!/usr/bin/env pwsh
$ErrorActionPreference = "Stop"

# ── agentfile — Universal workflow CLI (PowerShell) ───────────────────────────
# Usage:
#   agentfile <workflow> status [run-id]
#   agentfile <workflow> approve <step> [run-id]
#   agentfile <workflow> run <input>
#   agentfile <workflow> resume [run-id]
#   agentfile <workflow> retry <step> [run-id]
# ─────────────────────────────────────────────────────────────────────────────

param(
  [Parameter(Mandatory=$true)][string]$Workflow,
  [Parameter(Mandatory=$true)][string]$Command,
  [Parameter(ValueFromRemainingArguments=$true)][string[]]$Args
)

$ScriptDir   = Split-Path -Parent $MyInvocation.MyCommand.Path
$ProjectRoot = Split-Path -Parent $ScriptDir

function Write-Log([string]$m) { Write-Host "[$(Get-Date -Format 'HH:mm:ss')] $m" }
function Fail([string]$m) { Write-Error "ERROR: $m"; exit 1 }

# ── Helpers ───────────────────────────────────────────────────────────────────

function Find-StateFile([string]$wf, [string]$runId="") {
  $outputsDir = Join-Path $ProjectRoot "workflows/$wf/outputs"
  if (-not (Test-Path $outputsDir)) { Fail "No outputs directory for workflow '$wf'" }

  if ($runId) {
    $f = Join-Path $outputsDir "$runId/execution-state.json"
    if (-not (Test-Path $f)) { Fail "No state file for run: $runId" }
    return $f
  }

  $f = Get-ChildItem -Path $outputsDir -Filter "execution-state.json" -Recurse |
       Sort-Object FullName -Descending | Select-Object -First 1
  if (-not $f) { Fail "No execution state found for '$wf'. Has it been run?" }
  return $f.FullName
}

function Read-State([string]$stateFile, [string]$field) {
  return (Get-Content $stateFile | ConvertFrom-Json) | Select-Object -ExpandProperty ($field -replace '^\.')
}

function Get-State([string]$stateFile) {
  return Get-Content $stateFile | ConvertFrom-Json
}

function Save-State($state, [string]$stateFile) {
  $state.updated_at = (Get-Date -Format 'o')
  $state | ConvertTo-Json -Depth 10 | Set-Content $stateFile
}

# ── status ────────────────────────────────────────────────────────────────────

function Invoke-Status([string]$wf, [string]$runId="") {
  $stateFile = Find-StateFile $wf $runId
  $state = Get-State $stateFile

  Write-Host ""
  Write-Host "╔══════════════════════════════════════════════════════╗"
  Write-Host ("║  Workflow: {0,-44}║" -f $wf)
  Write-Host "╚══════════════════════════════════════════════════════╝"
  Write-Host ""
  Write-Host "  Run ID:       $($state.run_id)"
  Write-Host "  Status:       $($state.status)"
  Write-Host "  Started:      $($state.started_at)"
  Write-Host "  Input:        $($state.input)"
  Write-Host "  Current step: $($state.current_step ?? '—')"
  Write-Host ""
  Write-Host "  Steps:"

  foreach ($step in $state.steps) {
    $icon = switch ($step.status) {
      "completed"           { "✓" }
      "in_progress"         { "▶" }
      "awaiting_approval"   { "⏸" }
      "failed"              { "✗" }
      default               { "○" }
    }
    $artifact = if ($step.artifact) { " → $($step.artifact)" } else { "" }
    Write-Host "    $icon $($step.id) [$($step.status)]$artifact"
    if ($step.error) { Write-Host "      ↳ ERROR: $($step.error)" -ForegroundColor Red }
  }

  Write-Host ""
  switch ($state.status) {
    "awaiting_approval" {
      $gateStep = ($state.steps | Where-Object { $_.status -eq "awaiting_approval" } | Select-Object -First 1).id
      Write-Host "  ⏸  Awaiting approval for: $gateStep"
      Write-Host "     Run: agentfile $wf approve $gateStep"
    }
    "failed" {
      $failedStep = ($state.steps | Where-Object { $_.status -eq "failed" } | Select-Object -First 1).id
      Write-Host "  ✗  Failed at: $failedStep"
      Write-Host "     Run: agentfile $wf retry $failedStep"
    }
    "running"   { Write-Host "  ▶  In progress..." }
    "completed" {
      Write-Host "  ✓  Completed successfully."
      Write-Host "     Outputs: workflows/$wf/outputs/$($state.run_id)/"
    }
  }
  Write-Host ""
}

# ── approve ───────────────────────────────────────────────────────────────────

function Invoke-Approve([string]$wf, [string]$stepId, [string]$runId="") {
  $stateFile = Find-StateFile $wf $runId
  $state = Get-State $stateFile

  $step = $state.steps | Where-Object { $_.id -eq $stepId } | Select-Object -First 1
  if (-not $step) { Fail "Step '$stepId' not found in workflow '$wf'" }
  if ($step.status -ne "awaiting_approval") { Fail "Step '$stepId' is not awaiting approval (status: $($step.status))" }

  $step.status = "approved"
  $step | Add-Member -NotePropertyName "approved_at" -NotePropertyValue (Get-Date -Format 'o') -Force
  $state.status = "running"
  Save-State $state $stateFile

  Write-Log "✓ Step '$stepId' approved."
  Write-Host ""

  $runScript = Join-Path $ProjectRoot "workflows/$wf/scripts/cli/run.ps1"
  if (Test-Path $runScript) {
    $confirm = Read-Host "Resume execution now? [y/N]"
    if ($confirm -eq "y") {
      $runIdVal = Split-Path (Split-Path $stateFile -Parent) -Leaf
      & $runScript --resume $runIdVal
    } else {
      Write-Host "Resume later with: agentfile $wf resume"
    }
  }
}

# ── resume ────────────────────────────────────────────────────────────────────

function Invoke-Resume([string]$wf, [string]$runId="") {
  $stateFile = Find-StateFile $wf $runId
  $state = Get-State $stateFile

  if ($state.status -eq "completed") { Write-Host "Run is already completed."; return }

  $runScript = Join-Path $ProjectRoot "workflows/$wf/scripts/cli/run.ps1"
  if (-not (Test-Path $runScript)) { Fail "No run.ps1 found for workflow '$wf'" }

  $runIdVal = Split-Path (Split-Path $stateFile -Parent) -Leaf
  Write-Log "Resuming $wf / $runIdVal ..."
  & $runScript --resume $runIdVal
}

# ── retry ─────────────────────────────────────────────────────────────────────

function Invoke-Retry([string]$wf, [string]$stepId, [string]$runId="") {
  $stateFile = Find-StateFile $wf $runId
  $state = Get-State $stateFile

  $step = $state.steps | Where-Object { $_.id -eq $stepId } | Select-Object -First 1
  if (-not $step) { Fail "Step '$stepId' not found" }

  $step.status = "pending"; $step.error = $null
  $step.started_at = $null; $step.completed_at = $null
  $state.status = "running"
  Save-State $state $stateFile

  Write-Log "Step '$stepId' reset to pending."
  Invoke-Resume $wf $runId
}

# ── run ───────────────────────────────────────────────────────────────────────

function Invoke-Run([string]$wf, [string]$input) {
  $runScript = Join-Path $ProjectRoot "workflows/$wf/scripts/cli/run.ps1"
  if (-not (Test-Path $runScript)) { Fail "No run.ps1 found for workflow '$wf'" }
  & $runScript $input
}

# ── dispatch ──────────────────────────────────────────────────────────────────

switch ($Command) {
  "status"  { Invoke-Status  $Workflow ($Args[0] ?? "") }
  "approve" {
    if (-not $Args[0]) { Fail "approve requires <step-id>" }
    Invoke-Approve $Workflow $Args[0] ($Args[1] ?? "")
  }
  "resume"  { Invoke-Resume  $Workflow ($Args[0] ?? "") }
  "retry"   {
    if (-not $Args[0]) { Fail "retry requires <step-id>" }
    Invoke-Retry $Workflow $Args[0] ($Args[1] ?? "")
  }
  "run"     {
    if (-not $Args[0]) { Fail "run requires <input>" }
    Invoke-Run $Workflow $Args[0]
  }
  default   { Fail "Unknown command: $Command. Use: status|approve|run|resume|retry" }
}
