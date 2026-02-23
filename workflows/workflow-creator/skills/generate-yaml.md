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

---

## Path Reference Guide

| What you're writing | Correct path | Wrong path |
|--------------------|-------------|-----------|
| Step output during runtime | `outputs/result.md` | `artifacts/my-workflow/result.md` |
| Agent file reference | `agents/analyst.md` | `workflows/my-workflow/agents/analyst.md` |
| Skill file reference | `skills/my-skill.md` | `artifacts/.../skills/my-skill.md` |
| Script reference | `scripts/cli/run.sh` | `scripts/run.sh` |
| Utils script reference | `scripts/utils/validate.sh` | `utils/validate.sh` |

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
