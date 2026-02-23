#!/usr/bin/env pwsh
$ErrorActionPreference = "Stop"

# IDE-safe registration — NO API KEY REQUIRED
# Reads this workflow's outputs/ and assembles the final deliverable.

$ScriptDir   = Split-Path -Parent $MyInvocation.MyCommand.Path
$WorkflowDir = Split-Path -Parent (Split-Path -Parent $ScriptDir)
$OutputsDir  = Join-Path $WorkflowDir "outputs"

function Write-Log { param([string]$m) Write-Host "[$(Get-Date -Format 'HH:mm:ss')] $m" }

if (-not (Test-Path $OutputsDir)) { throw "ERROR: outputs/ not found. Run the workflow first." }

# Create a summary of the git commit workflow execution
$SummaryFile = Join-Path $OutputsDir "commit-summary.md"
@"
# Git Commit Workflow Summary

## Execution Results
"@ | Out-File -FilePath $SummaryFile -Encoding utf8

# Append each step's result to the summary
Get-ChildItem -Path $OutputsDir -Filter "*.md" | Where-Object { $_.Name -ne "commit-summary.md" } | ForEach-Object {
    $StepName = $_.BaseName -replace '-', ' ' | ForEach-Object { 
        $_.Split(' ') | ForEach-Object { 
            $_.Substring(0,1).ToUpper() + $_.Substring(1).ToLower() 
        }
    } | Join-String -Separator ' '
    
    "`n## $StepName`n" | Out-File -FilePath $SummaryFile -Encoding utf8 -Append
    Get-Content $_.FullName | Out-File -FilePath $SummaryFile -Encoding utf8 -Append
}

Write-Host ""
Write-Host "Registration complete"
Write-Host "  See outputs/ for generated artifacts"
Write-Host "  Summary available at: $SummaryFile"
