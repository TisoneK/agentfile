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
```bash
#!/usr/bin/env bash
set -euo pipefail

# IDE-safe registration — NO API KEY REQUIRED
# Pure file I/O: reads outputs/, assembles workflows/{name}/

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
WORKFLOW_DIR="$(cd "$SCRIPT_DIR/../.." && pwd)"
OUTPUTS_DIR="$WORKFLOW_DIR/outputs"
WORKFLOWS_ROOT="$(cd "$WORKFLOW_DIR/../.." && pwd)"

log() { echo "[$(date '+%H:%M:%S')] $*"; }

# Validate required outputs exist
for f in "$OUTPUTS_DIR/03-workflow.yaml"; do
  [[ -f "$f" ]] || { echo "ERROR: Missing $f"; exit 1; }
done

# Read workflow name
WORKFLOW_NAME=$(grep '^name:' "$OUTPUTS_DIR/03-workflow.yaml" | head -1 | awk '{print $2}' | tr -d '"'"'")
[[ -n "$WORKFLOW_NAME" ]] || { echo "ERROR: Could not read workflow name"; exit 1; }

TARGET_DIR="$WORKFLOWS_ROOT/$WORKFLOW_NAME"
mkdir -p "$TARGET_DIR"/{agents,skills,scripts/ide,scripts/cli,outputs}

cp "$OUTPUTS_DIR/03-workflow.yaml" "$TARGET_DIR/workflow.yaml"
log "  ✓ workflow.yaml"

# Parse ##FILE: === delimiters
parse_files() {
  local src="$1" base="$2"
  local cur="" buf="" in=false
  while IFS= read -r line; do
    if [[ "$line" =~ ^##FILE:\ (.+)##$ ]]; then
      [[ -n "$cur" && -n "$buf" ]] && { mkdir -p "$(dirname "$base/$cur")"; printf '%s\n' "$buf" > "$base/$cur"; log "  ✓ $cur"; }
      cur="${BASH_REMATCH[1]}"; buf=""; in=true
    elif [[ "$line" == "##END##" ]]; then
      [[ -n "$cur" && -n "$buf" ]] && { mkdir -p "$(dirname "$base/$cur")"; printf '%s\n' "$buf" > "$base/$cur"; log "  ✓ $cur"; }
      cur=""; buf=""; in=false
    elif [[ "$in" == true ]]; then
      buf="${buf:+$buf$'\n'}$line"
    fi
  done < "$src"
}

[[ -f "$OUTPUTS_DIR/04-agents/_all.md" ]]  && { log "Extracting agents...";  parse_files "$OUTPUTS_DIR/04-agents/_all.md"  "$TARGET_DIR"; }
[[ -f "$OUTPUTS_DIR/05-skills/_all.md" ]]  && { log "Extracting skills...";  parse_files "$OUTPUTS_DIR/05-skills/_all.md"  "$TARGET_DIR"; }
[[ -f "$OUTPUTS_DIR/06-scripts/_all.md" ]] && { log "Extracting scripts..."; parse_files "$OUTPUTS_DIR/06-scripts/_all.md" "$TARGET_DIR"; }

find "$TARGET_DIR/scripts" -name "*.sh" -exec chmod +x {} \; 2>/dev/null || true
echo "outputs/" > "$TARGET_DIR/.gitignore"
[[ -f "$OUTPUTS_DIR/07-review.md" ]] && cp "$OUTPUTS_DIR/07-review.md" "$TARGET_DIR/REVIEW.md"

echo ""
echo "✅ Workflow '$WORKFLOW_NAME' registered at: $TARGET_DIR"
echo "  IDE: /agentfile:run $WORKFLOW_NAME <args>"
echo "  CLI: export ANTHROPIC_API_KEY=... && bash $TARGET_DIR/scripts/cli/run.sh"
```

**`scripts/ide/register.ps1`**:
```powershell
#!/usr/bin/env pwsh
$ErrorActionPreference = "Stop"

# IDE-safe registration — NO API KEY REQUIRED
# Pure file I/O: reads outputs/, assembles workflows/{name}/

$ScriptDir     = Split-Path -Parent $MyInvocation.MyCommand.Path
$WorkflowDir   = Split-Path -Parent (Split-Path -Parent $ScriptDir)
$OutputsDir    = Join-Path $WorkflowDir "outputs"
$WorkflowsRoot = Split-Path -Parent (Split-Path -Parent $WorkflowDir)

function Write-Log { param([string]$m) Write-Host "[$(Get-Date -Format 'HH:mm:ss')] $m" }

if (-not (Test-Path "$OutputsDir/03-workflow.yaml")) { throw "ERROR: Missing outputs/03-workflow.yaml" }

$nameLine     = (Get-Content "$OutputsDir/03-workflow.yaml") | Where-Object { $_ -match '^name:' } | Select-Object -First 1
$WorkflowName = ($nameLine -replace '^name:\s*','').Trim().Trim('"').Trim("'")
if (-not $WorkflowName) { throw "ERROR: Could not read workflow name" }

$TargetDir = Join-Path $WorkflowsRoot $WorkflowName
foreach ($d in @("agents","skills","scripts/ide","scripts/cli","outputs")) {
  New-Item -ItemType Directory -Force -Path (Join-Path $TargetDir $d) | Out-Null
}

Copy-Item "$OutputsDir/03-workflow.yaml" "$TargetDir/workflow.yaml"
Write-Log "  ✓ workflow.yaml"

function Expand-DelimitedFiles {
  param([string]$Src, [string]$Base)
  $lines = Get-Content $Src -Encoding UTF8
  $cur = $null; $buf = [System.Collections.Generic.List[string]]::new()
  foreach ($line in $lines) {
    if ($line -match '^##FILE: (.+)##$') {
      if ($cur -and $buf.Count) { $t = Join-Path $Base $cur; New-Item -ItemType Directory -Force -Path (Split-Path $t) | Out-Null; $buf | Set-Content $t -Encoding UTF8; Write-Log "  ✓ $cur" }
      $cur = $Matches[1].Trim(); $buf.Clear()
    } elseif ($line -eq '##END##') {
      if ($cur -and $buf.Count) { $t = Join-Path $Base $cur; New-Item -ItemType Directory -Force -Path (Split-Path $t) | Out-Null; $buf | Set-Content $t -Encoding UTF8; Write-Log "  ✓ $cur" }
      $cur = $null; $buf.Clear()
    } elseif ($cur) { $buf.Add($line) }
  }
}

if (Test-Path "$OutputsDir/04-agents/_all.md")  { Write-Log "Extracting agents...";  Expand-DelimitedFiles "$OutputsDir/04-agents/_all.md"  $TargetDir }
if (Test-Path "$OutputsDir/05-skills/_all.md")  { Write-Log "Extracting skills...";  Expand-DelimitedFiles "$OutputsDir/05-skills/_all.md"  $TargetDir }
if (Test-Path "$OutputsDir/06-scripts/_all.md") { Write-Log "Extracting scripts..."; Expand-DelimitedFiles "$OutputsDir/06-scripts/_all.md" $TargetDir }

"outputs/" | Set-Content "$TargetDir/.gitignore" -Encoding UTF8
if (Test-Path "$OutputsDir/07-review.md") { Copy-Item "$OutputsDir/07-review.md" "$TargetDir/REVIEW.md" }

Write-Host ""
Write-Host "✅ Workflow '$WorkflowName' registered at: $TargetDir"
Write-Host "  IDE: /agentfile:run $WorkflowName <args>"
Write-Host "  CLI: `$env:ANTHROPIC_API_KEY='...'; pwsh $TargetDir/scripts/cli/run.ps1"
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
