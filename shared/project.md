# Project Convention

## Purpose
This file is injected into every agent call as part of the system prompt.
It defines the project's conventions, stack, and global rules.
It is agent-agnostic — it does not reference any specific LLM provider or IDE.

## Stack
- **Workflow format**: Agentfile (YAML + Markdown)
- **Runtime scripts**: Bash + PowerShell
- **Config format**: YAML
- **Agent/Skill format**: Markdown (.md)
- **No external frameworks or SDKs required**

## Conventions

### File Naming
- Workflow configs: `workflow.yaml`
- Agents: `agents/<role>.md`
- Skills: `skills/<skill-name>.md`
- Bash scripts: `scripts/<name>.sh`
- PowerShell scripts: `scripts/<name>.ps1`
- Step outputs: `outputs/<step-id>-<artifact>.<ext>`

### Workflow Steps
- Generation steps produce artifacts in `artifacts/<workflow-name>/<run-id>/`
- Runtime steps produce artifacts in `outputs/` (local to each workflow)
- Steps with `gate: human-approval` pause for user confirmation
- Steps with `action: shell` run a script without an LLM call

### Agent Behavior
- Be concise and structured in outputs
- Produce valid YAML or Markdown — never prose when a structured format is expected
- If something is unclear, say so explicitly rather than guessing
- Never invent file paths — use only paths defined in workflow.yaml

## Directory Layout
```
<project-root>/
  artifacts/                    # Generation staging workspace
    <workflow-name>/
      <run-id>/                 # e.g. 2026-02-23T10-41-22
        manifest.json           # Lifecycle control plane
        01-clarification.md
        02-design.md
        ...
  workflows/
    <workflow-name>/            # Canonical workflow (version-controlled)
      workflow.yaml             # Workflow config (entry point)
      workflow_status.json      # Pointer to originating build
      agents/                   # Agent .md files
      skills/                   # Skill .md files
      scripts/
        ide/                    # IDE instructions + API-key-free scripts
        cli/                    # API-calling scripts (CLI mode only)
      outputs/                  # Runtime artifacts (gitignored)
  outputs/
    <workflow-name>/
      <run-id>/build/           # Archived generation run
```
