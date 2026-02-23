# Skill: Design Workflow

## Purpose
Teach the Architect how to translate a clarification summary into a complete, implementable workflow design.

## Instructions

### Step 1 — Derive the workflow name
- Use the workflow's purpose to create a slug: lowercase, hyphenated, descriptive
- Examples: `invoice-processor`, `code-reviewer`, `daily-report-generator`

### Step 2 — Define the steps
- Each step should do ONE thing
- Steps should be ordered so each builds on the previous
- Every step needs: id, name, agent, skill, input, produces
- Steps that write files to disk should use `action: shell`
- Steps that need human review should have `gate: human-approval`

### Step 3 — Define agents
For each distinct role in the workflow, define an agent:
- Give it a clear single responsibility
- Name it by role, not by task (Analyst, not "QuestionAsker")
- Agents can be reused across steps if the role fits

### Step 4 — Define skills
Skills are reusable instruction sets. Define a skill for:
- Any non-obvious technique an agent needs to do its job
- Any structured output format an agent must follow
- Any multi-step reasoning process

### Step 5 — Define scripts
At minimum, every workflow needs:
- `run.sh` — full orchestration in Bash
- `run.ps1` — full orchestration in PowerShell

Additional scripts for: file registration, cleanup, validation.

### Step 6 — Build the file manifest
List every file that will be generated, with its path relative to the workflow root.

## Design Principles
- Prefer more smaller steps over fewer large steps
- Each agent should be replaceable (clear input/output contract)
- Skills should be generic enough to reuse across workflows
- Scripts should be readable — prioritize clarity over cleverness
- Always include error handling in the design

---

## Workflow Triggering and Orchestration

When a new workflow naturally feeds into or depends on another workflow in the project, the design should document and implement those connections explicitly.

### When to Connect Workflows

Consider inter-workflow triggers when:
- This workflow's **output** is the expected **input** of another workflow
  - Example: `code-reviewer` output → triggers `git-commit`
- This workflow is a **pre-condition** for another (e.g. always run before deploy)
- This workflow produces artifacts that another workflow monitors
- This workflow should be run on a schedule and its output used downstream

### How to Document It

In the `## Dependencies / Assumptions` section of the design, add a **Workflow Connections** sub-section:

```markdown
## Workflow Connections

### Upstream (this workflow consumes output from)
- `[workflow-name]` — [description of what output this workflow reads]

### Downstream (this workflow feeds into)
- `[workflow-name]` — [description of what triggers the downstream workflow]
  - Trigger condition: [e.g., "when outputs/review.md contains PASS"]
  - How to trigger: [e.g., "run scripts/cli/run.sh from downstream workflow"]
```

### How to Implement It in Scripts

When a downstream workflow should be automatically triggered, implement it at the end of `run.sh`:

```bash
# After all steps complete, optionally trigger downstream workflow
if [[ "${TRIGGER_DOWNSTREAM:-false}" == "true" ]]; then
  log "▶ Triggering downstream: [workflow-name]"
  export DOWNSTREAM_INPUT="$OUTPUTS_DIR/[output-artifact]"
  bash "$PROJECT_ROOT/workflows/[workflow-name]/scripts/cli/run.sh" "$DOWNSTREAM_INPUT"
fi
```

Protect it with an env var (`TRIGGER_DOWNSTREAM=true`) so the default is to NOT chain — chaining must be explicitly opted into.

### Trigger Types

| Trigger | When to Use | Implementation |
|---------|-------------|----------------|
| Manual hand-off | Default — user runs next workflow themselves | Document in `README.md` and `scripts/README.md` |
| Opt-in auto-chain | Workflows that often run in sequence | `TRIGGER_DOWNSTREAM=true` env var guard |
| Event-based | Workflow writes to a watched directory | `watch.sh` in the downstream workflow |
| Git hook | After a commit workflow completes | `install-hook.sh` in the downstream workflow |
| Scheduled | Periodic pipelines | `cron-example.sh` or `scripts/cli/schedule.sh` |

### In workflow.yaml

If this workflow is designed to be triggered by another, document it:

```yaml
trigger:
  type: command         # or: file | schedule | natural-language
  input_var: INPUT_FILE # env var the upstream workflow populates
  upstream: workflow-name   # optional: name of the upstream workflow
```

If this workflow triggers a downstream workflow, note it in the description:

```yaml
description: >
  [Description]. On successful completion, outputs can be passed to
  the [downstream-workflow] workflow for [next step].
```
