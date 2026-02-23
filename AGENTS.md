# Agentfile Project — IDE Agent Instructions

This is an **Agentfile project**. When working in this repo, you must follow the slash command protocol below for all workflow operations. Do not improvise — the protocol is exact.

---

## Before You Start

**No gitignore workaround needed.** Generation files are now written to `artifacts/` (not `outputs/`), which is a normal tracked directory. You do not need to enable any gitignore bypass settings.

- `artifacts/` — generation staging workspace. Writable, not gitignored. Run directories live here during creation.
- `outputs/` — runtime artifacts only (created after a workflow runs). Gitignored as before.

If your IDE still shows a gitignore warning, you are running an outdated version of the `workflow-creator` pipeline. Ensure you have the latest `AGENTS.md` and `workflows/workflow-creator/scripts/ide/instructions.md`.

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
4. Generate a `run_id` = current UTC timestamp in format `YYYY-MM-DDTHH-MM-SS` (e.g. `2026-02-23T10-41-22`).
5. Set `ARTIFACT_DIR` = `artifacts/{workflow_name}/{run_id}/`
6. Execute the full workflow-creator pipeline:
   - **Step 0 (Init):** Create `ARTIFACT_DIR`. Write initial `manifest.json` using `skills/generate-manifest.md`. Status: `generating`, all steps `pending`.
   - **Step 1 (Clarify):** Load `agents/analyst.md` + `skills/ask-clarifying.md`. Produce `{ARTIFACT_DIR}/01-clarification.md`. Update manifest. Wait for human approval.
   - **Step 2 (Design):** Load `agents/architect.md` + `skills/design-workflow.md`. Input: `{ARTIFACT_DIR}/01-clarification.md`. Produce `{ARTIFACT_DIR}/02-design.md`. Update manifest. Wait for human approval.
   - **Step 3 (Generate YAML):** Load `agents/generator.md` + `skills/generate-yaml.md`. Input: `{ARTIFACT_DIR}/02-design.md`. Produce `{ARTIFACT_DIR}/03-workflow.yaml`. Register in manifest.
   - **Step 4 (Generate Agents):** Load generator + `skills/generate-agent.md`. Produce `{ARTIFACT_DIR}/04-agents/`. Register each file in manifest.
   - **Step 5 (Generate Skills):** Load generator + `skills/generate-skill.md`. Produce `{ARTIFACT_DIR}/05-skills/`. Register each file in manifest.
   - **Step 6 (Generate Scripts):** Load generator + `skills/generate-dual-scripts.md`. Produce `{ARTIFACT_DIR}/06-scripts/`. Register each file in manifest.
   - **Step 7 (Review):** Load `agents/reviewer.md` + `skills/review-workflow.md`. Input: all previous artifacts. Produce `{ARTIFACT_DIR}/07-review.md`. Set manifest status `validated`. Wait for human approval.
   - **Step 8 (Promote):** Load generator + `skills/promote-workflow.md`. Validate artifact set, assemble `workflows/{workflow_name}/`, archive run to `outputs/{workflow_name}/{run_id}/build/`, write `workflow_status.json`, update manifest to `registered`. Run `bash workflows/workflow-creator/scripts/ide/register.sh {ARTIFACT_DIR}` (Unix) or the `.ps1` equivalent (Windows). No API key needed.

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
  artifacts/                 ← generation staging workspace (writable)
    <workflow-name>/
      <run-id>/              ← e.g. 2026-02-23T10-41-22
        manifest.json        ← lifecycle control plane
        01-clarification.md
        02-design.md
        ...
  shared/
    project.md               ← global conventions (injected in CLI calls)
    AGENTS.md                ← global agent rules (injected in CLI calls)
  workflows/
    <workflow-name>/         ← canonical, version-controlled workflow
      workflow.yaml          ← step definitions
      workflow_status.json   ← pointer back to originating build
      agents/
      skills/
      scripts/
        ide/                 ← IDE instructions + API-key-free scripts
        cli/                 ← API-calling scripts (CLI mode only)
      outputs/               ← runtime artifacts (gitignored)
  outputs/
    <workflow-name>/
      <run-id>/build/        ← archived generation run (provenance)
  docs/
    ide-slash-commands.md    ← full slash command reference
```
