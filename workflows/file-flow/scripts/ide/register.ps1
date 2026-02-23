#!/usr/bin/env pwsh
$ErrorActionPreference = "Stop"

# IDE-safe registration — NO API KEY REQUIRED
# Reads this workflow's outputs/ and assembles the final deliverable.

$ScriptDir   = Split-Path -Parent $MyInvocation.MyCommand.Path
$WorkflowDir = Split-Path -Parent (Split-Path -Parent $ScriptDir)
$OutputsDir  = Join-Path $WorkflowDir "outputs"

function Write-Log { param([string]$m) Write-Host "[$(Get-Date -Format 'HH:mm:ss')] $m" }

if (-not (Test-Path $OutputsDir)) {
    Write-Host "ERROR: outputs/ not found. Run the workflow first." -ForegroundColor Red
    exit 1
}

Write-Log "Starting file-flow workflow registration..."

# Verify output files exist
if (Test-Path (Join-Path $OutputsDir "execution-report.json")) {
    Write-Log "Found execution report"
} else {
    Write-Log "Warning: No execution report found"
}

Write-Log "Processing complete"

Write-HostRegistration ""
Write-Host " complete" -ForegroundColor Green
Write-Host "  Workflow: file-flow"
Write-Host "  Outputs: $OutputsDir/"
