# Agentfile Project — IDE Agent Instructions

This is an **Agentfile project**. When working in this repo, you must follow the slash command protocol below for all workflow operations. Do not improvise — the protocol is exact.

---

## Before You Start

**Enable gitignore file access** in your IDE settings before running any workflow. The `outputs/` directory is gitignored (runtime artifacts shouldn't be committed), but you need to read and write files there during workflow execution.

- **Windsurf**: Settings → search "gitignore" → enable "Allow Cascade Access to Gitignore Files"
- **Cursor**: Settings → search "gitignore" → enable gitignored file access
- **Cline/Roo**: This is enabled by default

Each `outputs/` directory also contains a `.gitignore` with `!*` to signal intent, but the IDE setting is still required.

---

## Slash Command Protocol

You understand and respond to three slash commands:

### `/agentfile:run <workflow-name> <args>`
Run an existing workflow in IDE mode.

1. Read `workflows/<workflow-name>/workflow.yaml`
2. Read `workflows/<workflow-name>/scripts/ide/instructions.md` if it exists
3. Load each step's agent file as your persona, load the skill file as context
4. Execute steps sequentially using your LLM — **do not run any scripts in `scripts/cli/`**
5. The only scripts you may execute are in `scripts/ide/` (e.g. `register.sh`) — these are API-key-free file operations

### `/agentfile:create <workflow-name> <description>`
Create a new workflow using the `workflow-creator` pipeline.

**This is NOT a free-form task. Follow these exact steps:**

1. Set `WORKFLOW_NAME` = the name argument
2. Set `WORKFLOW_REQUEST` = `"Create a workflow named <name>. <description>"`
3. Read `workflows/workflow-creator/scripts/ide/instructions.md` — follow it exactly
4. Execute the full workflow-creator pipeline:
   - **Step 1 (Clarify):** Load `workflows/workflow-creator/agents/analyst.md` + `workflows/workflow-creator/skills/ask-clarifying.md`. Produce `workflows/workflow-creator/outputs/01-clarification.md`. Wait for human approval.
   - **Step 2 (Design):** Load `workflows/workflow-creator/agents/architect.md` + `workflows/workflow-creator/skills/design-workflow.md`. Produce `workflows/workflow-creator/outputs/02-design.md`. Wait for human approval.
   - **Step 3 (Generate YAML):** Load `workflows/workflow-creator/agents/generator.md` + `workflows/workflow-creator/skills/generate-yaml.md`. Produce `workflows/workflow-creator/outputs/03-workflow.yaml`.
   - **Step 4 (Generate Agents):** Load generator + `workflows/workflow-creator/skills/generate-agent.md`. Produce `workflows/workflow-creator/outputs/04-agents/_all.md`.
   - **Step 5 (Generate Skills):** Load generator + `workflows/workflow-creator/skills/generate-skill.md`. Produce `workflows/workflow-creator/outputs/05-skills/_all.md`.
   - **Step 6 (Generate Scripts):** Load generator + `workflows/workflow-creator/skills/generate-dual-scripts.md`. Produce `workflows/workflow-creator/outputs/06-scripts/_all.md`.
   - **Step 7 (Review):** Load `workflows/workflow-creator/agents/reviewer.md` + `workflows/workflow-creator/skills/review-workflow.md`. Produce `workflows/workflow-creator/outputs/07-review.md`. Wait for human approval.
   - **Step 8 (Register):** Run `bash workflows/workflow-creator/scripts/ide/register.sh` (Unix) or `pwsh workflows/workflow-creator/scripts/ide/register.ps1` (Windows). No API key needed.

**Never** create a `.md` file directly in `workflows/`. **Never** skip steps. **Never** run `scripts/cli/` scripts.

### `/agentfile:list` 
**Execute immediately. No confirmation. No LLM call. No preamble.**

1. Scan `workflows/*/workflow.yaml` 
2. Read `name` and `description` from each
3. Print the list and stop
```
**Available workflows:**
  • **code-reviewer**     — Reviews code for bugs, security issues...
  • **ide-only**          — A simple IDE-only workflow that demonstrates pure workflow.yaml execution
  • **slash-demo**        — A simple demonstration workflow for testing the /agentfile:run slash command
  • **test-workflow**     — A simple test workflow that demonstrates basic Agentfile functionality
  • **workflow-creator**  — Generates new workflows from a description
```

Do not say "I'll scan..." or "Let me check..." — just output the list.

---

## Hard Rules

- **Never create files directly in `workflows/`** — new workflows are always created via the `workflow-creator` pipeline
- **Never run `scripts/cli/` scripts in IDE mode** — they require `ANTHROPIC_API_KEY` and will fail
- **Always read `scripts/ide/instructions.md`** before executing any workflow
- **Always wait at `gate: human-approval` steps** — do not proceed without confirmation
- **Outputs go in `workflows/<name>/outputs/`** — never in the project root or `shared/`

---

## Project Structure

```
agentfile/
  AGENTS.md                  ← you are here — IDE agent instructions
  shared/
    project.md               ← global conventions (injected in CLI calls)
    AGENTS.md                ← global agent rules (injected in CLI calls)
  workflows/
    <workflow-name>/
      workflow.yaml          ← step definitions
      agents/                ← agent persona files
      skills/                ← skill instruction files
      scripts/
        ide/                 ← IDE instructions + API-key-free scripts
        cli/                 ← API-calling scripts (CLI mode only)
      outputs/               ← runtime artifacts (gitignored)
  docs/
    ide-slash-commands.md    ← full slash command reference
```
