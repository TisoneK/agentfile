# Skill: Generate Dual Execution Scripts

## Purpose
Teach agents how to generate both IDE and CLI execution scripts based on workflow execution preferences.

## Instructions

### 1. Analyze Execution Preference
Read the workflow design to determine execution mode:
- If `execution.preferred: "ide"` → Prioritize IDE scripts
- If `execution.preferred: "cli"` → Prioritize CLI scripts  
- If no execution field → Generate both for flexibility

### 2. Generate IDE Scripts (`scripts/ide/`)

Create IDE agent instruction files and an **API-key-free** register script.

**Critical principle**: IDE scripts must NEVER call the Anthropic API or require any env vars. The LLM (the IDE agent) does the reasoning in steps 1–N; the `scripts/ide/` shell scripts only do file I/O for registration/assembly.

**`scripts/ide/instructions.md`**:
```markdown
# IDE Execution Instructions

## Workflow: [workflow-name]
Execution Mode: IDE

## ⚠️ Execution Mode Warning

| Script path | Purpose | API key? | Use in IDE? |
|-------------|---------|----------|-------------|
| `scripts/ide/register.sh` / `.ps1` | Assemble final workflow folder | ❌ Not needed | ✅ Yes |
| `scripts/cli/run.sh` / `.ps1` | Full pipeline via Anthropic API | ✅ Required | ❌ Never |

## Step-by-Step Instructions
[Generate step-by-step instructions for IDE agents]

## Agent Loading Instructions
- Load agents from agents/*.md as system prompts
- Load skills from skills/*.md as context
- Execute steps sequentially using IDE agent's LLM
- Never run scripts/cli/ scripts — those require ANTHROPIC_API_KEY
- Only run scripts/ide/register.sh (or .ps1) at the final step

## Output Format
[Specify expected output format for each step]
```

**`scripts/ide/steps.md`**:
```markdown
## IDE Execution Steps

1. [Step 1 instructions for IDE agent]
2. [Step 2 instructions for IDE agent]
...
N. Register Workflow
   - Run `scripts/ide/register.sh` (Unix) or `scripts/ide/register.ps1` (Windows)
   - No API key required — pure file assembly
   - Do NOT run scripts/cli/ scripts in IDE mode

## Notes
- Use IDE agent's built-in LLM capabilities for reasoning steps
- scripts/ide/register.sh/.ps1 are the only shell scripts to run in IDE mode
```

**`scripts/ide/register.sh`**:

> **Note to generator**: Runtime workflows (not the workflow-creator itself) use a simpler register script that reads from their own `outputs/` directory. Generate the following template for the new workflow's registration script:

```bash
#!/usr/bin/env bash
set -euo pipefail

# IDE-safe registration — NO API KEY REQUIRED
# Reads this workflow's outputs/ and assembles the final deliverable.
# This script is for RUNTIME output assembly, not for workflow generation.

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
WORKFLOW_DIR="$(cd "$SCRIPT_DIR/../.." && pwd)"
OUTPUTS_DIR="$WORKFLOW_DIR/outputs"

log() { echo "[$(date '+%H:%M:%S')] $*"; }

[[ -d "$OUTPUTS_DIR" ]] || { echo "ERROR: outputs/ not found. Run the workflow first."; exit 1; }

# Add workflow-specific assembly logic here
# Example: copy outputs to a deliverable location, generate a report, etc.

echo ""
echo "✅ Registration complete"
echo "  See outputs/ for generated artifacts"
```

**`scripts/ide/register.ps1`**:

> **Note to generator**: Generate a simple runtime output assembly script for the new workflow.

```powershell
#!/usr/bin/env pwsh
$ErrorActionPreference = "Stop"

# IDE-safe registration — NO API KEY REQUIRED
# Reads this workflow's outputs/ and assembles the final deliverable.

$ScriptDir   = Split-Path -Parent $MyInvocation.MyCommand.Path
$WorkflowDir = Split-Path -Parent (Split-Path -Parent $ScriptDir)
$OutputsDir  = Join-Path $WorkflowDir "outputs"

function Write-Log { param([string]$m) Write-Host "[$(Get-Date -Format 'HH:mm:ss')] $m" }

if (-not (Test-Path $OutputsDir)) { throw "ERROR: outputs/ not found. Run the workflow first." }

# Add workflow-specific assembly logic here

Write-Host ""
Write-Host "Registration complete"
Write-Host "  See outputs/ for generated artifacts"
```


### 3. Generate CLI Scripts (`scripts/cli/`)

Create runtime shell scripts:

**`scripts/cli/run.sh`**:
```bash
#!/bin/bash
# CLI Runtime Script for [workflow-name]
set -e

INPUT="$1"
if [ -z "$INPUT" ]; then
    echo "Usage: $0 \"<input>\""
    exit 1
fi

mkdir -p outputs

echo "🚀 Starting [workflow-name] Workflow"
echo "📁 Input: $INPUT"

# Step 1: [Step Name]
echo "📋 Step 1: [Step description]"
[Generate API call or processing command]
echo "✓ Step 1 complete"

# Step 2: [Step Name]
echo "📋 Step 2: [Step description]"
[Generate API call or processing command]
echo "✓ Step 2 complete"

echo "🎉 Workflow completed successfully!"
```

**`scripts/cli/run.ps1`**:
```powershell
# CLI Runtime Script for [workflow-name]
param(
    [Parameter(Mandatory=$true)]
    [string]$Input
)

mkdir -p outputs -ErrorAction SilentlyContinue

Write-Host "🚀 Starting [workflow-name] Workflow"
Write-Host "📁 Input: $Input"

# Step 1: [Step Name]
Write-Host "📋 Step 1: [Step description]"
[Generate API call or processing command]
Write-Host "✓ Step 1 complete"

# Step 2: [Step Name]
Write-Host "📋 Step 2: [Step description]"
[Generate API call or processing command]
Write-Host "✓ Step 2 complete"

Write-Host "🎉 Workflow completed successfully!"
```

### 4. Generate Execution Guide

**`scripts/README.md`**:
```markdown
# Execution Scripts

## IDE Mode (Preferred)
- Use `scripts/ide/instructions.md` for IDE agent setup
- Follow `scripts/ide/steps.md` for step-by-step execution
- No external dependencies required

## CLI Mode
- Use `scripts/cli/run.sh` (Unix) or `scripts/cli/run.ps1` (Windows)
- Requires external API access (anthropic-api or similar)
- For automation and CI/CD pipelines

## Switching Modes
Edit `workflow.yaml`:
```yaml
execution:
  preferred: "ide"  # or "cli"
```
```

### 5. Summary: What Goes Where

| File | API key needed? | Who runs it? |
|------|----------------|--------------|
| `scripts/ide/instructions.md` | ❌ | IDE agent reads it |
| `scripts/ide/steps.md` | ❌ | IDE agent reads it |
| `scripts/ide/register.sh` / `.ps1` | ❌ | Shell — pure file I/O |
| `scripts/cli/run.sh` / `.ps1` | ✅ | Shell — calls Anthropic API |

**IDE-Preferred Workflow**: LLM does all reasoning steps, `scripts/ide/register.sh` handles file assembly. `scripts/cli/` is available as a fallback for automation.

**CLI-Preferred Workflow**: `scripts/cli/run.sh` drives the whole pipeline end-to-end. IDE mode is available for interactive development.

**Dual-Mode Workflow**: Both paths fully implemented. Users choose based on context.

## Template Variables
- `[workflow-name]` - Name of the workflow
- `[Step Name]` - Name from workflow steps
- `[Step description]` - Goal from workflow steps
- `[Generate API call...]` - Placeholder for LLM API calls
