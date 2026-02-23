# IDE Slash Command Processing Guide

## Command Format

Agentfile uses a single namespace `/agentfile:` with subcommands:

```
/agentfile:run <workflow-name> <args>
/agentfile:create <new-workflow-name> <description>
/agentfile:list
```

---

## Commands

### `/agentfile:run <workflow-name> <args>`

Runs an existing workflow. Everything after the workflow name is passed as the input.

```
/agentfile:run code-reviewer src/auth.js
/agentfile:run pr-summarizer https://github.com/user/repo/pull/42
/agentfile:run hello-world recursion
```

File references using `@` are also supported:
```
/agentfile:run code-reviewer @src/components/Button.js
```

---

### `/agentfile:create <new-workflow-name> <description>`

Creates a new workflow by invoking `workflow-creator` with the given name and description. The workflow name becomes the slug for the generated workflow folder.

```
/agentfile:create security-scanner Scan code for OWASP vulnerabilities and produce a risk report
/agentfile:create daily-standup Summarize yesterday's commits and open PRs into a standup update
```

This invokes the `workflow-creator` pipeline (init → clarify → design → generate → review → promote) in IDE mode — no API key required. All generation artifacts are staged in `artifacts/<workflow-name>/<run-id>/` before being promoted to `workflows/<workflow-name>/`.

---

### `/agentfile:list`

Lists all available workflows in the project by scanning `workflows/*/workflow.yaml`.

```
/agentfile:list
```

Output format:
```
Available workflows:
  • code-reviewer     — Reviews code for bugs, security issues, and improvements
  • pr-summarizer     — Summarizes pull request diffs into structured reports
  • hello-world       — The simplest possible workflow
  • workflow-creator  — Generates new workflows from a description
```

---

## Processing Rules (for IDE agents)

### STEP 1: PARSE COMMAND

Split on the first space after `/agentfile:`:
- **Subcommand**: `run` | `create` | `list`
- **Argument 1**: workflow name (for `run` and `create`)
- **Remaining**: everything after the workflow name = input / description / args

| Command | Subcommand | Arg 1 | Remaining |
|---------|-----------|-------|-----------|
| `/agentfile:run code-reviewer src/auth.js` | `run` | `code-reviewer` | `src/auth.js` |
| `/agentfile:create my-workflow Analyze logs for errors` | `create` | `my-workflow` | `Analyze logs for errors` |
| `/agentfile:list` | `list` | — | — |

---

### STEP 2: DISPATCH

**`list`** → Scan `workflows/*/workflow.yaml`, read each `name` and `description` field, format and return the list. No LLM call needed.

**`create`** →
1. Set `WORKFLOW_NAME` = arg 1
2. Set `WORKFLOW_REQUEST` = `"Create a workflow named {arg1}. {remaining}"`
3. Generate `RUN_ID` = current UTC timestamp `YYYY-MM-DDTHH-MM-SS`
4. Set `ARTIFACT_DIR` = `artifacts/{WORKFLOW_NAME}/{RUN_ID}/`
5. Run `workflows/workflow-creator` in IDE mode — pipeline writes all artifacts to `ARTIFACT_DIR`
6. The workflow-creator pipeline handles: init → clarify → design → generate → review → promote

**`run`** → Continue to STEP 3.

---

### STEP 3: CHECK EXECUTION MODE (for `run`)

- Read `workflows/<workflow-name>/workflow.yaml`
- Check `execution.preferred`:
  - `preferred: ide` → **use IDE mode**
  - `preferred: cli` → **use CLI mode**
  - missing → **default to IDE mode**

---

### STEP 4A: IDE MODE EXECUTION

- Load `scripts/ide/instructions.md` for the workflow if it exists
- Load agents from `agents/*.md` as system prompts
- Load skills from `skills/*.md` as context
- Execute steps sequentially using your LLM
- For shell steps (`action: shell`): only run `scripts/ide/` scripts — **never** `scripts/cli/`
- Process `@file` references by reading the specified files

---

### STEP 4B: CLI MODE EXECUTION

- Execute `workflows/<workflow-name>/scripts/cli/run.sh` (Unix) or `run.ps1` (Windows)
- Pass remaining args as input
- Return the script's output

---

## Examples

### Run a workflow
```
/agentfile:run hello-world recursion
```
1. Subcommand: `run`, workflow: `hello-world`, input: `recursion`
2. Read `workflows/hello-world/workflow.yaml` → no execution field → IDE mode
3. Load agent, execute step, return response

### Create a new workflow
```
/agentfile:create log-analyzer Parse application logs and surface error patterns with frequency counts
```
1. Subcommand: `create`, name: `log-analyzer`
2. Description: `Parse application logs and surface error patterns with frequency counts`
3. Run `workflow-creator` in IDE mode with that as the request

### List workflows
```
/agentfile:list
```
Scan and return all `workflows/*/workflow.yaml` names and descriptions.

---

## Common Mistakes to Avoid

❌ **WRONG:** Running `scripts/cli/run.sh` when in IDE mode
❌ **WRONG:** Ignoring `execution.preferred` and always defaulting one way
❌ **WRONG:** Running `scripts/cli/register.sh` during `create` — use `scripts/ide/register.sh`
❌ **WRONG:** Treating `/agentfile:create` as just a `run` — it invokes `workflow-creator` with the name pre-bound

✅ **CORRECT:** Check `execution.preferred` before every `run`
✅ **CORRECT:** In IDE mode, only execute `scripts/ide/` shell scripts
✅ **CORRECT:** `create` → workflow-creator pipeline → `scripts/ide/register.sh`
✅ **CORRECT:** `list` → scan filesystem, no LLM needed

---

## Troubleshooting

| Problem | Fix |
|---------|-----|
| Workflow not found | Check `workflows/<name>/workflow.yaml` exists |
| `create` gets stuck asking for API key | You ran `scripts/cli/` — switch to `scripts/ide/register.sh` |
| `create` writes to `outputs/` instead of `artifacts/` | Your `AGENTS.md` or `scripts/ide/instructions.md` is outdated — pull latest |
| `artifacts/` directory not found | Run `agentfile init` or create `artifacts/.gitkeep` manually |
| `list` returns nothing | No `workflows/` directory or no `workflow.yaml` files found |
| Missing execution field | Default to IDE mode |
| Agent files missing | Continue with available agents, log a warning |

---

## How IDE Agents Discover This Protocol

The slash command protocol is loaded via root-level files that each IDE auto-reads when opening a project:

| File | IDE |
|------|-----|
| `AGENTS.md` | All IDEs (primary — contains the full protocol) |
| `.cursorrules` | Cursor |
| `.windsurfrules` | Windsurf |
| `.clinerules` | Cline, Roo |
| `CLAUDE.md` | Claude Code |

The IDE-specific files are one-liners that point to `AGENTS.md`. `AGENTS.md` is the single source of truth — it contains the full slash command dispatch table, the step-by-step `workflow-creator` pipeline, and the hard rules.

`agentfile init` generates all of these files automatically for new projects.
