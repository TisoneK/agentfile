# IDE Execution Instructions

## Workflow: workflow-creator
Version: 1.1.0 | Execution Mode: IDE

## Overview

This workflow stages all generation artifacts in `artifacts/<workflow-name>/<run-id>/`
before promoting them to `workflows/<workflow-name>/`. You do **not** need to enable
gitignore bypass settings — `artifacts/` is a normal tracked directory.

| Script path | Purpose | API key? | Use in IDE? |
|-------------|---------|----------|-------------|
| `scripts/ide/register.sh` / `.ps1` | Promote artifact run to canonical workflow | ❌ Not needed | ✅ Yes — final step only |
| `scripts/cli/run.sh` / `.ps1` | Full pipeline via Anthropic API | ✅ Required | ❌ Never — will fail |

---

## Step-by-Step Instructions

When an IDE agent sees `/agentfile:create <workflow-name> <description>`, follow these exact steps:

### 1. Parse Command
- Extract `WORKFLOW_NAME` from the command argument
- Extract `WORKFLOW_REQUEST` = `"Create a workflow named <name>. <description>"`

### 2. Check Execution Mode
- Read `workflows/workflow-creator/workflow.yaml`
- Check `execution.preferred` — if `"ide"`, use IDE mode (default)

### 3. Initialize Artifact Run
- Generate `RUN_ID` = current UTC timestamp: `YYYY-MM-DDTHH-MM-SS` (e.g. `2026-02-23T10-41-22`)
- Set `ARTIFACT_DIR` = `artifacts/{WORKFLOW_NAME}/{RUN_ID}/`
- Create the directory
- Load `skills/generate-manifest.md` and write initial `manifest.json` to `ARTIFACT_DIR`

### 4. Execute Steps Sequentially

**Step 1: Clarify Request**
- Load agent: `agents/analyst.md`
- Load skill: `skills/ask-clarifying.md`
- Input: `$WORKFLOW_REQUEST`
- Produce: `{ARTIFACT_DIR}/01-clarification.md`
- Update manifest: set `clarify` step to `completed`
- Gate: Wait for human approval

**Step 2: Design Workflow**
- Load agent: `agents/architect.md`
- Load skill: `skills/design-workflow.md`
- Input: `{ARTIFACT_DIR}/01-clarification.md`
- Produce: `{ARTIFACT_DIR}/02-design.md`
- Update manifest: set `design` step to `completed`
- Gate: Wait for human approval

**Step 3: Generate workflow.yaml**
- Load agent: `agents/generator.md`
- Load skill: `skills/generate-yaml.md`
- Input: `{ARTIFACT_DIR}/02-design.md`
- Produce: `{ARTIFACT_DIR}/03-workflow.yaml`
- Register in manifest with role `workflow_config`

**Step 4: Generate Agent Files**
- Load agent: `agents/generator.md`
- Load skill: `skills/generate-agent.md`
- Input: `{ARTIFACT_DIR}/02-design.md`
- Produce: `{ARTIFACT_DIR}/04-agents/` (individual `.md` files or `_all.md` bundle)
- Register each file in manifest with role `agent`

**Step 5: Generate Skill Files**
- Load agent: `agents/generator.md`
- Load skill: `skills/generate-skill.md`
- Input: `{ARTIFACT_DIR}/02-design.md`
- Produce: `{ARTIFACT_DIR}/05-skills/`
- Register each file in manifest with role `skill`

**Step 6: Generate Scripts**
- Load agent: `agents/generator.md`
- Load skill: `skills/generate-dual-scripts.md`
- Input: `{ARTIFACT_DIR}/02-design.md`
- Produce: `{ARTIFACT_DIR}/06-scripts/ide/` and `06-scripts/cli/`
- Register each file in manifest with role `script_ide` or `script_cli`

**Step 7: Review All Outputs**
- Load agent: `agents/reviewer.md`
- Load skill: `skills/review-workflow.md`
- Input: all previous artifacts in `ARTIFACT_DIR`
- Produce: `{ARTIFACT_DIR}/07-review.md`
- Update manifest: set `phases.generation.status = completed`, `phases.validation.status = completed`, `status = validated`
- Gate: Wait for human approval

**Step 8: Promote to Workflow**
- Load skill: `skills/promote-workflow.md` for validation checklist
- Run `bash workflows/workflow-creator/scripts/ide/register.sh {ARTIFACT_DIR}` (Unix)
- Or: `pwsh -ExecutionPolicy Bypass workflows/workflow-creator/scripts/ide/register.ps1 {ARTIFACT_DIR}` (Windows)
- This script: validates artifact set → assembles `workflows/{WORKFLOW_NAME}/` → archives run to `outputs/{WORKFLOW_NAME}/{RUN_ID}/build/` → writes `workflow_status.json` → updates manifest to `registered`
- No API key required — pure file I/O

## Agent Loading Instructions
- Load agents from `agents/*.md` as system prompts
- Load skills from `skills/*.md` as context
- Execute steps sequentially using your LLM
- Never execute `scripts/cli/` scripts in IDE mode — they require `ANTHROPIC_API_KEY`
- Only `scripts/ide/register.sh` (or `.ps1`) is executed as a shell script

## Output Format
Each step produces its artifact in `artifacts/{WORKFLOW_NAME}/{RUN_ID}/` — never in `outputs/` or directly in `workflows/`.
