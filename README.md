# Agentfile

**Treat AI Behavior as a First-Class Project Artifact**

---

## What is this?

Agentfile lets you define AI workflows using files that live in your project. Each workflow is expressed as a folder of YAML and Markdown describing what happens, who performs it, and how execution should proceed.

Execution is handled by your IDE agent using the workflow definition as the source of truth.

```
workflows/
  code-reviewer/
    workflow.yaml          ← step definitions
    agents/
      reviewer.md          ← LLM persona + rules for this step
      security-scanner.md
    skills/
      vulnerability-detection.md   ← how to do the analysis
      report-compilation.md
    scripts/
      ide/                 ← file-ops for IDE execution
      cli/                 ← run.sh / run.ps1 for headless
```

Run it from Cursor, Windsurf, Claude Code, Cline — or from a terminal. Same files, same results.

---

## The mental model

Each workflow step loads three things into the LLM:

```
system prompt  =  shared/project.md  +  AGENTS.md  +  agents/<role>.md
user prompt    =  skills/<skill>.md  +  "---"  +  <step input>
```

**Agents** define *who* the LLM is — persona, responsibilities, hard rules, exact output format.  
**Skills** define *how* to do something — a technique, a checklist, a format.  
**workflow.yaml** defines *what* happens — the step order, inputs, outputs, approval gates.

---

## Quick start

```bash
npm install -g @tisonek/agentfile
cd my-project
agentfile init
```

`agentfile init` prompts you to pick your IDE(s), then writes `.cursorrules`, `.windsurfrules`, `CLAUDE.md`, etc. — whichever your IDE reads. From that point, slash commands are live.

---

## Slash commands

Once initialized, your IDE understands:

```
/agentfile:create code-reviewer Review code for bugs, security issues, and style problems
/agentfile:run code-reviewer src/auth.js
/agentfile:list
```

**`/agentfile:create`** kicks off the built-in `workflow-creator` pipeline: it clarifies your requirements, designs the workflow structure, generates all the files (agents, skills, scripts, YAML), runs a review pass, then promotes the result to `workflows/`. Every stage has a human approval gate — you sign off before anything moves forward.

**`/agentfile:run`** loads your workflow and executes it step by step using your IDE's own LLM. No external calls. No API key. The IDE is the runtime.

**`/agentfile:list`** scans `workflows/*/workflow.yaml` and returns names and descriptions. Pure filesystem — no LLM call needed.

---

## Two execution modes

**IDE mode** (default) — The IDE agent reads `workflow.yaml` and executes steps directly. Only `scripts/ide/` helper scripts may run (file operations only — no API calls). This is the default and works out of the box.

**CLI mode** — `agentfile run` executes via `scripts/cli/run.sh` or `run.ps1`. Use this for headless environments, CI pipelines, or when you want scripted automation.

Set the preference in `workflow.yaml`:

```yaml
execution:
  preferred: "ide"   # or "cli"
```

---

## How a workflow is built

When you run `/agentfile:create`, the `workflow-creator` pipeline stages everything in `artifacts/` before it ever touches `workflows/`:

```
artifacts/<workflow-name>/<run-id>/
  manifest.json          ← control plane — tracks every step's status
  01-clarification.md
  02-design.md
  03-workflow.yaml
  04-agents/
  05-skills/
  06-scripts/
    ide/
    cli/
  07-review.md
         ↓  agentfile promote
workflows/<workflow-name>/
```

The `manifest.json` tracks lifecycle status for each step (`pending → in_progress → completed → awaiting_approval`). Nothing lands in `workflows/` until you explicitly promote it.

---

## workflow.yaml

```yaml
specVersion: "1.0"
name: code-reviewer
version: 1.0.0
description: Systematic code review — static analysis, security scan, style check, report.
trigger:
  type: natural-language
  input_var: AGENT_INPUT
execution:
  preferred: "ide"
steps:
  - id: analyze
    name: Static Analysis
    agent: agents/static-analyzer.md
    skill: skills/code-quality-analysis.md
    input: $AGENT_INPUT
    goal: Identify code quality issues, anti-patterns, and complexity violations.
    produces: outputs/static-analysis.md

  - id: security
    name: Security Scan
    agent: agents/security-scanner.md
    skill: skills/vulnerability-detection.md
    input: outputs/static-analysis.md
    goal: Detect security vulnerabilities and rate their severity.
    produces: outputs/security-scan.md
    gate: human-approval

  - id: report
    name: Compile Report
    agent: agents/reporter.md
    skill: skills/report-compilation.md
    input:
      - outputs/static-analysis.md
      - outputs/security-scan.md
    goal: Produce a structured, actionable review report.
    produces: outputs/final-report.md
```

---

## Supported IDEs

| IDE | Rules file written by `agentfile init` |
|-----|----------------------------------------|
| Cursor | `.cursorrules` |
| Windsurf | `.windsurfrules` |
| Claude Code | `CLAUDE.md` |
| Cline / Roo | `.clinerules` |
| GitHub Copilot | `.github/copilot-instructions.md` |
| Kilo | `.kilocode/rules/agentfile.md` |

`AGENTS.md` at the project root is the single source of truth. IDE-specific files are one-liners that point to it.

---

## CLI reference

```bash
agentfile init                           # Set up a new project + configure IDEs
agentfile create <name>                  # Create a workflow via workflow-creator
agentfile run <name> --input <input>     # Run a workflow
agentfile list                           # List all workflows
agentfile validate <name>                # Validate workflow.yaml against schema
agentfile status <name>                  # Check a run's step-by-step status
agentfile promote <artifact-dir>         # Promote generated workflow to workflows/
agentfile approve <run-id>               # Approve a human-gate checkpoint
agentfile retry <run-id> <step-id>       # Retry a failed step
agentfile config                         # View / update CLI config
```

---

## Project structure

```
<project-root>/
  agentfile.yaml          # Project manifest (optional)
  AGENTS.md               # Slash command protocol + hard rules
  CLAUDE.md               # → points to AGENTS.md (Claude Code)
  .cursorrules            # → points to AGENTS.md (Cursor)
  .windsurfrules          # → points to AGENTS.md (Windsurf)
  shared/
    project.md            # Stack, conventions, global rules — injected into every call
  workflows/
    <workflow-name>/
      workflow.yaml
      agents/
      skills/
      scripts/
        ide/
        cli/
  artifacts/              # Generation staging workspace (gitignored per run)
  outputs/                # Runtime step outputs (gitignored)
```

---

## Requirements

- Node.js 18+
- An IDE with an AI agent (Cursor, Windsurf, Claude Code, Cline, etc.)

---

## License

MIT — see [LICENSE](LICENSE).

---

**Spec:** [SPEC.md](SPEC.md) · **Concepts:** [docs/concepts.md](docs/concepts.md) · **Slash commands:** [docs/ide-slash-commands.md](docs/ide-slash-commands.md) · **GitHub:** [github.com/TisoneK/agentfile](https://github.com/TisoneK/agentfile)
