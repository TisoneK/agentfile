# Agentfile Specification

**Version:** 1.0.0  
**Status:** Draft

---

## Overview

The Agentfile specification defines a standard format for describing LLM-powered workflows as plain files. An Agentfile workflow is a directory containing a `workflow.yaml` config, agent definition files, skill files, and optionally runtime scripts.

Any IDE agent, automation tool, or runtime that can read files can execute an Agentfile workflow.

---

## Directory Structure

A conforming Agentfile workflow directory MUST contain:

```
<workflow-name>/
  workflow.yaml          # Required. Workflow configuration.
  agents/                # Required. One or more agent definition files.
    <role>.md
  skills/                # Optional. Reusable skill instruction files.
    <skill-name>.md
  scripts/               # Optional. Runtime scripts for CLI execution.
    run.sh
    run.ps1
  outputs/               # Optional. Runtime artifacts. Should be gitignored.
```

**Note:** The `scripts/` directory is optional when using IDE agents (they execute steps directly) but required when using the CLI `agentfile run` command which needs shell scripts for orchestration.

---

## workflow.yaml

The `workflow.yaml` file is the entry point for every Agentfile workflow.

### Top-Level Fields

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `specVersion` | string | ✅ | Agentfile spec version this workflow targets. Current: `"1.0"`. |
| `name` | string | ✅ | Workflow identifier. Lowercase, hyphenated. |
| `version` | string | ✅ | Semantic version of this workflow (e.g. `1.0.0`). |
| `description` | string | ✅ | Human-readable description of what this workflow does. |
| `trigger` | object | ✅ | How the workflow is started. |
| `output` | object | ❌ | Where the workflow's final output is written. |
| `steps` | array | ✅ | Ordered list of steps to execute. |

### trigger

```yaml
trigger:
  type: natural-language | file | schedule | command
  input_var: AGENT_INPUT   # Environment variable that holds the trigger input
```

### steps

Each step is one of two types: an **agent step** (LLM call) or a **shell step** (script execution).

#### Agent Step Fields

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `id` | string | ✅ | Unique step identifier. Lowercase, hyphenated. |
| `name` | string | ✅ | Human-readable step name. |
| `agent` | string | ✅ | Relative path to the agent `.md` file. |
| `skill` | string | ❌ | Relative path to a skill `.md` file to inject. |
| `input` | string | ✅ | Input to the step. A file path or `$VAR` reference. |
| `goal` | string | ✅ | What this step is trying to achieve. |
| `produces` | string | ✅ | Path to the artifact this step writes. |
| `gate` | string | ❌ | If `human-approval`, pause for user confirmation before continuing. |

```yaml
steps:
  - id: analyze
    name: Analyze Input
    agent: agents/analyzer.md
    skill: skills/analysis.md
    input: $AGENT_INPUT
    goal: Extract key information from the input.
    produces: outputs/analysis.md
    gate: human-approval   # optional
```

#### Shell Step Fields

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `id` | string | ✅ | Unique step identifier. |
| `name` | string | ✅ | Human-readable step name. |
| `action` | string | ✅ | Must be `shell`. |
| `script` | object | ✅ | Paths to bash and/or pwsh scripts. |
| `goal` | string | ✅ | What this step does. |

```yaml
steps:
  - id: register
    name: Register Output
    action: shell
    script:
      bash: scripts/register.sh
      pwsh: scripts/register.ps1
    goal: Save the generated workflow to its final location.
```

---

## Agent Files

Agent files are Markdown documents that define an LLM's identity, responsibilities, and output format for a given role.

### Required Sections

```markdown
# Agent: <Name>

## Persona
Who this agent is. Mindset, orientation, what they care about.

## Responsibilities
- What this agent does (bullet list)

## Rules
- Hard constraints this agent must follow (bullet list)

## Output Format
The exact structure the agent must produce (with a template).
```

### How Agents Are Loaded

When an IDE agent or runtime executes a step, it loads the agent file as part of the system prompt. The agent file defines who the LLM is for that step.

Recommended system prompt construction:
```
<shared/project.md contents>
<shared/AGENTS.md contents>
<agents/<role>.md contents>
```

---

## Skill Files

Skill files are Markdown documents that teach an agent HOW to perform a specific technique, produce a specific format, or follow a specific process. They are injected into the user prompt context.

### Required Sections

```markdown
# Skill: <Name>

## Purpose
One sentence: what capability does this skill give an agent?

## Instructions
Numbered steps the agent should follow.

## Examples
At least one concrete example.
```

### How Skills Are Loaded

Skills are prepended to the user prompt before the step's input data:

```
<skills/<skill-name>.md contents>

---

<step input>
```

---

## Shared Files

### shared/project.md

A "constitution" file injected into every API call. Defines the project's tech stack, conventions, and global rules. Agent-agnostic — should not reference any specific LLM provider.

### shared/AGENTS.md

Global behavioral rules that apply to all agents in all workflows. Injected into every system prompt alongside the agent file.

---

## outputs/ Directory

The `outputs/` directory is a runtime scratch space. It SHOULD be listed in `.gitignore`. Each step writes its artifact here using the naming convention `<step-id>-<artifact>`.

---

## Conventions

- Workflow names: lowercase, hyphenated (e.g. `code-reviewer`, `pr-summarizer`)
- Step ids: lowercase, hyphenated, unique within a workflow
- File paths in `workflow.yaml`: always relative to the workflow root
- Agent files: one file per role, named by role (e.g. `reviewer.md`, `analyst.md`)
- Skill files: one file per skill, named by capability (e.g. `code-analysis.md`)

---

## Discovery Convention

To avoid ecosystem fragmentation, Agentfile defines one canonical discovery convention:

**A workflow is discovered by the presence of `workflow.yaml` inside a named directory under `workflows/`:**

```
<project-root>/
  workflows/
    <workflow-name>/
      workflow.yaml      ← discovery entry point
```

Optionally, a project-level manifest at the root signals that a directory is an Agentfile project:

```
<project-root>/
  agentfile.yaml         ← optional project manifest
  workflows/
    <workflow-name>/
      workflow.yaml
```

IDE agents and tooling SHOULD scan for `workflows/*/workflow.yaml` to enumerate available workflows. They MUST NOT require `agentfile.yaml` to be present — it is optional metadata only.

---

## Compatibility

Agentfile is designed to be executed by:

- **IDE agents** (Cursor, Windsurf, Claude Code, Cline, Roo, GitHub Copilot) — by loading the workflow files as context and following the step structure. No scripts required.
- **Reference runtimes** — the Bash and PowerShell scripts in `scripts/` provide a standalone execution option via `agentfile run`
- **Custom runtimes** — any tool that can read YAML and Markdown can implement the spec

### Execution Modes

1. **IDE Agent Mode**: Load `workflow.yaml` and follow steps directly. Scripts optional.
2. **CLI Runtime Mode**: Use `agentfile run` which executes `scripts/run.sh` or `scripts/run.ps1`. Scripts required.

---

## Versioning

The spec version is declared in `workflow.yaml` under the `version` field. Breaking changes to the spec will increment the major version.

---

## Contributing to the Spec

Open an issue or pull request at [github.com/TisoneK/agentfile](https://github.com/TisoneK/agentfile).
