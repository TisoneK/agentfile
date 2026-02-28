# Run: workflow-creator

This document explains how to run the workflow-creator in IDE mode.

## How to Start

Tell the LLM to run the workflow-creator:

```
Create a new workflow using the workflow-creator. The request is: "A workflow that does X"
```

Or use the agentfile CLI (if available):
```
/agentfile:create <workflow-name> "<description>"
```

## How It Works (LLM-Driven)

The workflow-creator runs entirely in IDE mode - the LLM reads the files and executes steps directly.

### Step-by-Step Execution

1. **Read workflow.yaml** - Understand the workflow structure
2. **Read run.md** - Get instructions (this file)
3. **Execute each step** - The LLM reads each skill and agent, then performs the task

### What the LLM Does

1. **Clarify** - Load `agents/analyst.md` + `skills/ask-clarifying.md`, then ask user clarifying questions

2. **Design** - Load `agents/architect.md` + `skills/design-workflow.md`, produce a design document

3. **Generate** - For each step:
   - Load `agents/generator.md` + relevant skill (generate-yaml.md, generate-agent.md, etc.)
   - Generate the file content
   - Write to `artifacts/<workflow-name>/<run-id>/`

4. **Review** - Load `agents/reviewer.md` + `skills/review-workflow.md`, review all outputs

5. **Promote** - Move files from `artifacts/<workflow-name>/` to `workflows/<workflow-name>/`

## Key Files

| File | Purpose |
|------|---------|
| `workflow.yaml` | Defines all steps |
| `run.md` | This file - how to run |
| `agents/*.md` | Agent definitions |
| `skills/*.md` | Skill instructions |

## Output

Generated workflow goes to: `workflows/<workflow-name>/`
