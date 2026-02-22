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

Create IDE agent instruction files:

**`scripts/ide/instructions.md`**:
```markdown
# IDE Execution Instructions

## Workflow: [workflow-name]
Execution Mode: IDE

## Step-by-Step Instructions
[Generate step-by-step instructions for IDE agents]

## Agent Loading Instructions
- Load agents from agents/*.md as system prompts
- Load skills from skills/*.md as context
- Execute steps sequentially using IDE agent's LLM
- Never execute external scripts or call APIs

## Output Format
[Specify expected output format for each step]
```

**`scripts/ide/steps.md`**:
```markdown
## IDE Execution Steps

1. [Step 1 instructions for IDE agent]
2. [Step 2 instructions for IDE agent]
3. [Step 3 instructions for IDE agent]

## Notes
- Use IDE agent's built-in LLM capabilities
- Follow agent personas and skill instructions
- Generate outputs directly in chat interface
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
  fallback: "cli"   # backup option
```
```

### 5. Examples

**IDE-Preferred Workflow**:
- Generate detailed IDE instructions
- Minimal CLI scripts (fallback)
- Focus on interactive development

**CLI-Preferred Workflow**:
- Generate robust shell scripts
- Basic IDE instructions (fallback)
- Focus on automation and production

**Dual-Mode Workflow**:
- Generate both comprehensive IDE and CLI scripts
- Maximum flexibility
- Best for shared workflows

## Template Variables
- `[workflow-name]` - Name of the workflow
- `[Step Name]` - Name from workflow steps
- `[Step description]` - Goal from workflow steps
- `[Generate API call...]` - Placeholder for LLM API calls
