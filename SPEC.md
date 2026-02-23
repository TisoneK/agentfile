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
<project-root>/
  agentfile.yaml                  # Optional. Project manifest.
  artifacts/                      # Generation staging workspace.
    <workflow-name>/
      <run-id>/                   # e.g. 2026-02-23T10-41-22
        manifest.json             # Control plane for this run.
        01-clarification.md
        02-design.md
        03-workflow.yaml
        04-agents/
        05-skills/
        06-scripts/
        07-review.md
  workflows/
    <workflow-name>/              # Canonical, version-controlled workflow.
      workflow.yaml               # Required. Workflow configuration.
      workflow_status.json        # Optional. Pointer to originating build.
      agents/                     # Required. One or more agent definition files.
        <role>.md
      skills/                     # Optional. Reusable skill instruction files.
        <skill-name>.md
      scripts/                    # Optional. Execution scripts.
        ide/
          instructions.md
          steps.md
        cli/
          run.sh
          run.ps1
        README.md
      outputs/                    # Runtime artifacts. Should be gitignored.
  outputs/
    <workflow-name>/
      <run-id>/
        build/                    # Archived generation run (provenance).
        execution/                # Runtime step artifacts.
```

**Note:** The `scripts/` directory supports dual execution modes:
- **IDE agents** use `scripts/ide/` instructions for guidance (no external dependencies)
- **CLI runtime** uses `scripts/cli/` shell scripts for automation
- Workflows can support both modes for maximum flexibility

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
| `execution` | object | ❌ | Execution mode preferences for IDE vs CLI runtime. |
| `output` | object | ❌ | Where the workflow's final output is written. |
| `steps` | array | ✅ | Ordered list of steps to execute. |

### trigger

```yaml
trigger:
  type: natural-language | file | schedule | command
  input_var: AGENT_INPUT   # Environment variable that holds the trigger input
```

### execution

Optional field that specifies execution mode preferences for different runtime environments.

```yaml
execution:
  preferred: "ide" | "cli"    # Preferred execution mode (default: "ide")
```

**Values:**
- `"ide"` - Execute workflow steps directly in IDE agent (default)
- `"cli"` - Execute via scripts/run.sh or scripts/run.ps1

**Behavior:**
- **IDE agents**: Check `execution.preferred`, use that mode if available
- **CLI runtime**: Always uses scripts, ignores execution field
- **No execution field**: Defaults to IDE mode

**IDE Mode Processing:**
1. Load agents from `agents/*.md` as system prompts
2. Load skills from `skills/*.md` as context
3. Execute steps sequentially using your LLM
4. **NEVER** execute scripts unless explicitly required by workflow
5. Process file references by reading the specified files

**CLI Mode Processing:**
1. Execute `workflows/<workflow-name>/scripts/cli/run.sh` or `run.ps1`
2. Pass input as command line argument
3. Scripts handle API calls and orchestration

**Example:**
```yaml
execution:
  preferred: "ide"    # Run in IDE by default
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

## artifacts/ Directory

The `artifacts/` directory is the **generation staging workspace**. When a workflow is created by the `workflow-creator` (or any generative workflow), all intermediate files are written here before being promoted to their canonical location.

### Layout

```
artifacts/
  <workflow-name>/
    <run-id>/                    # e.g. 2026-02-23T10-41-22
      manifest.json              # Control plane — lifecycle tracking
      01-clarification.md
      02-design.md
      03-workflow.yaml
      04-agents/
      05-skills/
      06-scripts/
        ide/
        cli/
      07-review.md
```

The `<run-id>` is an ISO-8601 UTC timestamp with colons replaced by hyphens for filesystem safety: `YYYY-MM-DDTHH-MM-SS`. This ensures run directories are sortable, unique, and safe on all platforms.

### Lifecycle

```
artifacts/<n>/<run-id>/    ← generation workspace (writable, transient)
       ↓   (promote step)
workflows/<n>/              ← canonical workflow (stable, version-controlled)
       ↓   (archive)
outputs/<n>/<run-id>/build/ ← provenance archive (read-only record)
```

### Gitignore policy

`artifacts/` run subdirectories SHOULD be gitignored. The `artifacts/` root directory itself MAY be tracked to preserve its structure. A `.gitkeep` file can be committed at `artifacts/.gitkeep` to keep the directory in version control while ignoring all run content.

---

## manifest.json

The `manifest.json` file is the **control plane** for a generation run. It lives at `artifacts/<workflow-name>/<run-id>/manifest.json` and is written at run initialization, then updated at every phase transition and step completion.

### Purpose

- Track the lifecycle status of each step
- Register all files produced during generation
- Provide a promotion audit trail
- Enable recovery and debugging of partial runs

### Schema reference

See `schema/manifest.schema.json` for the full JSON Schema definition.

### Key fields

| Field | Description |
|---|---|
| `workflow` | Workflow name being generated |
| `run_id` | Filesystem-safe timestamp (`YYYY-MM-DDTHH-MM-SS`) |
| `status` | Overall lifecycle: `generating → generated → validated → registered → archived` |
| `phases` | Per-phase status: `generation`, `validation`, `promotion`, `archival` |
| `steps[]` | Per-step record mirroring `workflow.yaml` step ids |
| `files[]` | Registry of every artifact produced, with `role` and `produced_by` |
| `promotion` | Populated after promotion: `target`, `promoted_at`, `archive_path` |
| `errors[]` | Append-only error log |

### Step status lifecycle

```
pending → in_progress → completed
                      → failed
                      → awaiting_approval  (gate: human-approval)
                      → skipped
```

### Minimal example

```json
{
  "specVersion": "1.0",
  "workflow": "my-workflow",
  "run_id": "2026-02-23T10-41-22",
  "created_at": "2026-02-23T10:41:22Z",
  "execution_mode": "ide",
  "generator": "workflow-creator",
  "status": "generating",
  "phases": {
    "generation": { "status": "in_progress" },
    "validation": { "status": "pending" },
    "promotion":  { "status": "pending" },
    "archival":   { "status": "pending" }
  },
  "steps": [
    { "id": "clarify", "name": "Clarify Request", "status": "pending" }
  ],
  "files": [
    { "path": "manifest.json", "role": "manifest", "produced_by": "init" }
  ],
  "errors": []
}
```

---

## workflow_status.json

After a workflow is promoted to `workflows/<n>/`, a lightweight `workflow_status.json` is written alongside `workflow.yaml` as a pointer back to the originating run:

```json
{
  "workflow": "my-workflow",
  "registered_at": "2026-02-23T11:02:44Z",
  "source_run_id": "2026-02-23T10-41-22",
  "archive": "outputs/my-workflow/2026-02-23T10-41-22/build"
}
```

This file is version-controlled and provides a stable audit link from the canonical workflow to its build provenance.

---

## outputs/ Directory

The `outputs/` directory serves two purposes:

1. **Runtime scratch space** — each workflow execution writes step artifacts here using the naming convention `<step-id>-<artifact>`. SHOULD be gitignored within each workflow folder.

2. **Build archive** — after promotion, the original artifact run is archived to `outputs/<workflow-name>/<run-id>/build/`. This is a read-only record and SHOULD be gitignored at the project root.

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

1. **IDE Agent Mode**: Use `/agentfile:run`, `/agentfile:create`, or `/agentfile:list` slash commands. Load `workflow.yaml` and follow steps directly. Scripts optional (only `scripts/ide/` scripts are ever run in this mode).
2. **CLI Runtime Mode**: Use `agentfile run` which executes `scripts/cli/run.sh` or `scripts/cli/run.ps1`. Scripts required.

---

## Versioning

The spec version is declared in `workflow.yaml` under the `version` field. Breaking changes to the spec will increment the major version.

---

## Contributing to the Spec

Open an issue or pull request at [github.com/TisoneK/agentfile](https://github.com/TisoneK/agentfile).
