# Skill: Generate YAML

## Purpose
Teach the Generator how to produce valid, well-structured `workflow.yaml` files that conform to project conventions.

---

## CRITICAL: Path Conventions — Factory vs Shipped

Understand the two-phase model before writing any paths:

```
artifacts/<workflow>/<run-id>/   ← FACTORY paths — used ONLY by workflow-creator
                                    during generation. Never appear in a generated
                                    workflow's own workflow.yaml.

workflows/<workflow>/            ← SHIPPED paths — used by the workflow once
                                    it is registered and running.

workflows/<workflow>/outputs/    ← Where a RUNNING workflow writes its results.
                                    NOT artifacts/. NOT the project root artifacts/.
```

**When generating a `workflow.yaml` for a NEW workflow:**
- The `produces:` field for each step should reference `outputs/<artifact>` — relative to the workflow's own directory
- Never write `artifacts/<workflow-name>/...` in a generated workflow's yaml — that path belongs to the factory, not to the running workflow
- The running workflow has no knowledge of or relationship to the `artifacts/` directory

---

## Required Top-Level Fields

```yaml
name: <slug>
version: 1.0.0
specVersion: "1.0"
description: >
  <multi-line description>

execution:
  preferred: "ide"    # or "cli" — determines default entry point

trigger:
  type: <natural-language | file | schedule | command>
  input_var: <env var name for the trigger input>

output:
  directory: outputs/   # relative to workflows/<name>/ — NOT artifacts/

# js-utils integration for JavaScript workflows
js_utils:
  enabled: true         # Automatically import js-utils modules
  modules:              # Auto-import these modules in generated scripts
    - state-manager
    - file-ops
    - cli-parser
    - template-processor
    - env-validator
    - progress-tracker

steps:
  - id: <step-id>
    ...
```

---

## Step Fields

```yaml
- id: <lowercase-hyphenated>         # required
  name: <Human Readable Name>        # required
  agent: agents/<n>.md               # required for LLM steps
  skill: skills/<n>.md               # optional but recommended
  input: <file path or $VAR>         # required
  goal: >                            # required — what this step achieves
    <description>
  produces: outputs/<artifact>       # relative to workflow dir — NOT artifacts/
  gate: human-approval               # optional — pauses for human review
```

### Shell Step Fields

```yaml
- id: <id>
  name: <n>
  action: shell
  script:
    bash: scripts/utils/<n>.sh       # or scripts/cli/<n>.sh
    pwsh: scripts/utils/<n>.ps1
  goal: >
    <description>
  produces: outputs/<artifact>
```

### JavaScript Step Fields (Required Standard)

```yaml
- id: <id>
  name: <n>
  action: shell
  script:
    node: scripts/cli/<n>.js        # JavaScript using js-utils (required)
  goal: >
    <description>
  produces: outputs/<artifact>
  js_utils:                         # Optional step-specific js-utils config
    modules:                         # Additional modules for this step
      - template-processor
```

**Rule:** All JavaScript steps MUST use js-utils. The `js_utils.enabled: true` at workflow level ensures automatic imports.

---

## Path Reference Guide

| What you're writing | Correct path | Wrong path |
|--------------------|-------------|-----------|
| Step output during runtime | `outputs/result.md` | `artifacts/my-workflow/result.md` |
| Agent file reference | `agents/analyst.md` | `workflows/my-workflow/agents/analyst.md` |
| Skill file reference | `skills/my-skill.md` | `artifacts/.../skills/my-skill.md` |
| Script reference | `scripts/cli/run.sh` | `scripts/run.sh` |
| JavaScript script reference | `scripts/cli/run.js` | `scripts/run.js` |
| Utils script reference | `scripts/utils/validate.sh` | `utils/validate.sh` |
| js-utils import | `src/js-utils/file-ops` | manual `fs` operations |

All paths in a workflow's `workflow.yaml` are **relative to the workflow's own directory** (`workflows/<name>/`).

---

## YAML Rules

- Use 2-space indentation
- Use `>` for multi-line strings (folded scalar)
- Use `|` only for literal block content
- Quote strings that contain `:`, `{`, `}`, `[`, `]`, `#`, `&`, `*`
- No trailing whitespace
- End file with a newline

---

## Validation Checklist

- [ ] All step ids are unique
- [ ] All agent references match files in `agents/`
- [ ] All skill references match files in `skills/`
- [ ] All script references match files in `scripts/`
- [ ] All `produces:` paths start with `outputs/` — not `artifacts/`
- [ ] `trigger.input_var` is defined
- [ ] `output.directory` is `outputs/`
- [ ] `execution.preferred` is set to `"ide"` or `"cli"`

---

## Generate run.md

Every workflow MUST include a `run.md` file in the workflow root directory. This file provides natural language instructions that help LLMs understand how to run the workflow without needing to parse shell scripts.

### run.md Template

```markdown
# Run: {workflow_name}

This document explains how to run this workflow in natural language for LLMs.

## Quick Start

To run this workflow, use:

```
{command}
```

Example:
```
{command} "{example_input}"
```

## Commands

### Primary Command
Describe the main command and its usage.

### Additional Commands (if any)
Describe any other available commands.

## How It Works

1. **Step 1** - Description of what happens in step 1
2. **Step 2** - Description of what happens in step 2
...

## Requirements

- Node.js 18+
- {other requirement 1}
- {other requirement 2}

## Output

Describe what the workflow produces.
```

**Important:** Always generate a `run.md` file alongside `workflow.yaml`. This is required for LLM accessibility.
