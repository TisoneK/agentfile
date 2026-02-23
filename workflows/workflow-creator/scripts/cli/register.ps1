#!/usr/bin/env pwsh
$ErrorActionPreference = "Stop"

# ── scripts/cli/register.ps1 ─────────────────────────────────────────────────
# CLI-mode promotion script.
# Delegates to scripts/ide/register.ps1 — single source of truth.
#
# Usage:
#   pwsh scripts/cli/register.ps1 <artifact-run-dir>
# ─────────────────────────────────────────────────────────────────────────────

$ScriptDir   = Split-Path -Parent $MyInvocation.MyCommand.Path
$IdeRegister = Join-Path $ScriptDir "../ide/register.ps1"

if (-not (Test-Path $IdeRegister)) {
    throw "ERROR: Cannot find scripts/ide/register.ps1"
}

& $IdeRegister @args
