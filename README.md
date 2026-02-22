# Agentfile

**Agentfile is workflow-as-files for AI agents.**

Agentfile is an open specification for describing AI-powered workflows as plain files — agents, skills, steps, and rules — that any IDE agent (Cursor, Windsurf, GitHub Copilot, Claude Code, Cline, Roo) can read and execute.

---

## Why Agentfile?

Most AI workflows are locked inside proprietary tools, chat UIs, or framework-specific code. Agentfile makes workflows **portable, versionable, and agent-agnostic** — define once, run anywhere.

| Without Agentfile | With Agentfile |
|-------------------|----------------|
| Workflow logic lives in the tool | Workflow logic lives in your repo |
| Tied to one AI provider | Works with any IDE agent |
| No version control | Git-native — diff, branch, PR your workflows |
| Hard to share or reuse | Clone, fork, compose |

---

## How It Works

An Agentfile workflow is a folder of plain text files your IDE agent reads and follows:

```
my-workflow/
  workflow.yaml       # Steps, goals, and routing logic
  agents/             # Agent personas and rules (.md files)
  skills/             # Reusable instruction sets (.md files)
  scripts/            # Runtime scripts for CLI execution (optional)
  outputs/            # Artifacts produced at each step (gitignored)
```

Your IDE agent loads these files and executes each step — no SDK, no framework, no lock-in. For CLI execution, `scripts/run.sh` and `scripts/run.ps1` provide the orchestration layer.

---

## Quick Start

### 1. Install the CLI

```bash
npm install -g agentfile
```

### 2. Scaffold a project

```bash
mkdir my-project && cd my-project
agentfile init
agentfile create code-reviewer
```

### 3. Open in your IDE agent

**Cursor / Windsurf** — paste into composer or your rules file:

```
Load workflow.yaml and follow its steps.
Load agent definitions from agents/ and skills from skills/.
Input: <describe what you want reviewed>
```

**Claude Code:**

```bash
claude "Follow workflow.yaml in this folder. Input: src/auth.js"
```

**Cline / Roo / GitHub Copilot** — reference `workflow.yaml` in your system prompt or workspace instructions.

That's it. Your IDE agent handles the rest.

---

## Workflow Format

```yaml
name: code-reviewer
version: 1.0.0
description: Reviews code for bugs, style, and improvements.

trigger:
  type: natural-language
  input_var: AGENT_INPUT

steps:
  - id: analyze
    name: Analyze Code
    agent: agents/analyzer.md
    skill: skills/code-analysis.md
    input: $AGENT_INPUT
    goal: Identify bugs, security issues, and code smells.
    produces: outputs/01-analysis.md

  - id: review
    name: Write Review
    agent: agents/reviewer.md
    skill: skills/write-review.md
    input: outputs/01-analysis.md
    goal: Turn the analysis into a clear, actionable review report.
    produces: outputs/02-review.md
    gate: human-approval
```

→ Full spec: [SPEC.md](./SPEC.md)
→ JSON Schema: [schema/workflow.schema.json](./schema/workflow.schema.json)

---

## CLI Commands

| Command | Description |
|---------|-------------|
| `agentfile init` | Scaffold a new Agentfile project in the current directory |
| `agentfile create <name>` | Create a new workflow |
| `agentfile list` | List all workflows in the current project |
| `agentfile validate [name]` | Validate workflow(s) against the spec |

---

## Included Examples

| Workflow | Description |
|----------|-------------|
| `examples/hello-world` | **Start here** — the simplest possible workflow. One agent, one skill, no config needed |
| `examples/code-reviewer` | Reviews code for bugs, security issues, and improvements |
| `examples/pr-summarizer` | Summarizes pull request diffs into structured reports |
| `workflows/workflow-creator` | Meta-workflow — generates new workflows from a natural language description |

Clone and point your IDE agent at `examples/hello-world` to get started in under a minute:

```bash
git clone https://github.com/TisoneK/agentfile
```

Then in your IDE agent:

```
Follow workflow.yaml in examples/hello-world. Input: recursion
```

---

## Project Structure

```
agentfile/
  SPEC.md                          # Formal specification
  schema/
    workflow.schema.json           # JSON Schema (IDE autocomplete + validation)
  examples/
    code-reviewer/                 # Example: code review workflow
    pr-summarizer/                 # Example: PR summary workflow
  workflows/
    workflow-creator/              # Meta-workflow: generates new workflows
  shared/
    AGENTS.md                      # Global agent rules
    project.md                     # Project-level conventions
  cli/                             # Node.js CLI source
  docs/
    concepts.md                    # Deep dive: how everything works
```

---

## IDE Agent Compatibility

| Agent | How to use |
|-------|------------|
| Cursor | Paste workflow instructions into composer or `.cursor/rules` |
| Windsurf | Use cascade or add to rules file |
| GitHub Copilot | Add to workspace instructions |
| Claude Code | Pass `workflow.yaml` as task context |
| Cline | Reference in system prompt |
| Roo | Reference in system prompt |

---

## Contributing

New examples, IDE adapter guides, and spec improvements are all welcome. See [CONTRIBUTING.md](./CONTRIBUTING.md).

```bash
git checkout -b my-feature
# make your changes
git commit -m "add: my-workflow example"
# open a pull request
```

---

## License

MIT — see [LICENSE](./LICENSE)
