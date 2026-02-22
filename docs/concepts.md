# Concepts

Deep dive into how the LLM Workflow System works.

---

## How API Calls Are Made

Every LLM step follows this pattern:

```
system prompt = project.md + AGENTS.md + agent/<role>.md
user prompt   = skill/<skill>.md + "---" + <step input>
```

The system prompt gives the LLM its identity and global rules. The user prompt gives it the task-specific instructions (skill) and the actual input data.

---

## How Agents Work

An agent is a Markdown file with four sections:

- **Persona** — who the agent is and how it thinks
- **Responsibilities** — what it does
- **Rules** — hard constraints it must follow
- **Output Format** — the exact structure it must produce

When a step runs, the agent's `.md` file is appended to the system prompt. The LLM then "becomes" that agent for the duration of the API call.

---

## How Skills Work

A skill is a reusable Markdown file that teaches an agent HOW to do something specific — not what to do (that's the agent's job) but the technique, format, or process.

Example: The `generate-yaml.md` skill doesn't tell the Generator what to generate. It teaches it the exact YAML schema, required fields, validation checklist, and formatting rules.

Skills are injected at the top of the user prompt, before the input data.

---

## How the File Delimiter Pattern Works

When the Generator produces multiple files in one API call, it uses this format:

```
=== FILE: agents/analyst.md ===
# Agent: Analyst
...
=== END FILE ===

=== FILE: agents/architect.md ===
# Agent: Architect
...
=== END FILE ===
```

The `register.sh` / `register.ps1` scripts parse this format line by line and write each file to its correct location under the new workflow's folder.

---

## How Human Gates Work

A gate is a pause point in the workflow. When a step has `gate: human-approval`:

1. The step runs and produces its output file
2. The script prints the output to the terminal
3. The script asks: "Approve and continue? [y/N]"
4. If you type `y`, execution continues to the next step
5. If you type anything else, the workflow aborts

This gives you control at critical decision points — after clarification, after design, and after review — without requiring a UI.

---

## How the Workflow Creator Creates Workflows

The workflow creator is itself a workflow. It uses the same agent/skill/script pattern that every generated workflow uses. This means:

- You can extend the workflow creator by adding new skills
- You can improve agent prompts by editing the `.md` files
- The workflow creator can create a workflow that creates workflows (recursive, if you want)

---

## Temperature Strategy

| Task | Temperature | Why |
|------|-------------|-----|
| Reviewing, validating | `0` | Deterministic — should always reach the same conclusion |
| Generating structured files | `0.3` | Mostly deterministic but allows slight variation |
| Clarifying/designing | `0.3` | Needs some creativity for edge case discovery |

---

## Extending the System

### Adding a new skill
Create `workflows/<workflow>/skills/<new-skill>.md` with: Purpose, Instructions, Examples. Reference it in `workflow.yaml` under the relevant step's `skill:` field.

### Adding a new agent role
Create `workflows/<workflow>/agents/<new-role>.md` with: Persona, Responsibilities, Rules, Output Format. Add a new step to `workflow.yaml` that uses it.

### Adding a new workflow step
Add an entry to the `steps:` list in `workflow.yaml`, then add a corresponding function to `run.sh` and `run.ps1`.

### Sharing skills across workflows
Move commonly used skills to `shared/skills/` and reference them with a relative path. The `project.md` constitution applies globally already.
