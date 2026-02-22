

/agentfile-run:slash-demo
Input: artificial intelligence

I'll run the slash-demo workflow with the input "artificial intelligence". Let me first check the workflow structure and then execute it.

Now I'll run the workflow using the CLI command:

Command cd, node in …\Dev\agentfile

cd c:\Users\tison\Dev\agentfile && node cli/src/index.js run workflows/slash-demo "artificial intelligence"
  Agentfile v1.0.0
  ✗ Workflow "workflows/slash-demo" not found.IDE
  ℹ Run `agentfile list` to see available workflows.

Let me check the available workflows and the correct path:

Command cd, node in …\Dev\agentfile

cd c:\Users\tison\Dev\agentfile && node cli/src/index.js list
flows/slash-demo "artificial intelligence"
  Agentfile v1.0.0
  Define LLM workflows as files. Run with any IDE  dir-structure                 v1.0.0    1 step
  slash-demo                    v1.0.0    1 step
    A simple demonstration workflow for testing t  workflow-creator              v1.0.0    8 steps
    A meta-workflow that takes a natural language  Run a workflow:nd.es a 
    agentfile run <workflow-name> --input "your i

I can see the workflow is available as "slash-demo". Let me run it with the correct syntax:

Command cd, node in …\Dev\agentfile

cd c:\Users\tison\Dev\agentfile && node cli/src/index.js run slash-demo --input "artificial intelligence"
h-demo --input "artificial intelligence"

  Agentfile v1.0.0
  Define LLM workflows as files. Run with any IDE agent.

  ✗ Runtime script not found: C:\Users\tison\Dev\agentfile\workflows\slash-demo\scripts\run.ps1
  ℹ Expected: workflows/slash-demo/scripts/run.ps1

  ℹ Why this happened:
  ℹ   This workflow was designed for IDE agents (Cursor, Windsurf, Claude Code, etc.)
  ℹ   but the CLI runtime requires execution scripts.

  ℹ Options:
  ℹ   1. Use with an IDE agent by loading workflow.yaml and following its steps
  ℹ   2. Add scripts/run.sh and scripts/run.ps1 to enable CLI execution
  ℹ   3. Use "agentfile create" to generate a workflow with scripts included

  ℹ Learn more:
  ℹ   https://github.com/TisoneK/agentfile#ide-agent-compatibility

The workflow requires scripts for CLI execution. Let me create the necessary PowerShell script to run this workflow:

run.ps1
new
+47
$SummaryContent | Out-File -FilePath $OutputPath -Encoding UTF8
 
Write-Host "✓ Workflow completed successfully"
Write-Host "✓ Output written to: $OutputPath"
 



Now let me run the workflow again:

Command cd, node in …\Dev\agentfile# Agentfile

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

### 2. Configure (optional)

```bash
# Save your API key once
agentfile config set api-key your-anthropic-api-key

# Set default shell (optional - auto-detected by OS)
agentfile config set shell pwsh  # or bash

# View current configuration
agentfile config
```

### 3. Scaffold a project

```bash
mkdir my-project && cd my-project
agentfile init
agentfile create code-reviewer
```

### 4. Open in your IDE agent

**Simple Slash Command (Recommended)**

```
/agentfile-run:code-reviewer
Input: src/auth.js
```

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

### 5. Run with CLI (optional)

```bash
agentfile run code-reviewer --input "path/to/code.js"
# API key automatically loaded from config
```

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
| `agentfile run <name>` | Run a workflow by name |
| `agentfile list` | List all workflows in the current project |
| `agentfile validate [name]` | Validate workflow(s) against the spec |
| `agentfile config` | Manage configuration (API keys, default model, shell) |
| `agentfile setup-ide <ide>` | Generate IDE integration instructions for slash commands |

### Configuration Management

```bash
# Show current configuration
agentfile config

# Set API key (saved for future use)
agentfile config set api-key your-anthropic-api-key

# Set default model
agentfile config set model claude-sonnet-4-6

# Set default shell (overrides OS auto-detection)
agentfile config set shell pwsh  # or bash

# Remove configuration
agentfile config unset api-key
```

### IDE Setup

```bash
# Generate IDE-specific instructions for slash commands
agentfile setup-ide cursor    # For Cursor
agentfile setup-ide windsurf   # For Windsurf
agentfile setup-ide copilot    # For GitHub Copilot
agentfile setup-ide claude     # For Claude Code
agentfile setup-ide cline      # For Cline
agentfile setup-ide roo        # For Roo
```

---

## Included Examples

| Workflow | Description |
|----------|-------------|
| `examples/hello-world` | **Start here** — the simplest possible workflow. One agent, one skill, no config needed |
| `examples/code-reviewer` | Reviews code for bugs, security issues, and improvements |
| `examples/pr-summarizer` | Summarizes pull request diffs into structured reports |
| `workflows/slash-demo` | **Slash command demo** — perfect for testing `/agentfile-run:slash-demo` |
| `workflows/workflow-creator` | Meta-workflow — generates new workflows from a natural language description |

Clone and point your IDE agent at `examples/hello-world` to get started in under a minute:

```bash
git clone https://github.com/TisoneK/agentfile
```

Then in your IDE agent:

```
/agentfile-run:hello-world
Input: recursion
```

---

## IDE Agent Execution

### Slash Command Format

The simplest way to run workflows in any IDE agent:

```
/agentfile-run:<workflow-name>
Input: <your-input-here>
```

**Examples:**
```
/agentfile-run:hello-world
Input: recursion

/agentfile-run:slash-demo
Input: artificial intelligence

/agentfile-run:code-reviewer
Input: src/components/Button.js

/agentfile-run:pr-summarizer
Input: https://github.com/user/repo/pull/123
```

### How It Works

When an IDE agent sees `/agentfile-run:<workflow-name>`, it:

1. **Locates** `workflows/<workflow-name>/workflow.yaml`
2. **Loads** all agent definitions from `agents/*.md`
3. **Injects** skills from `skills/*.md` 
4. **Executes** each step sequentially
5. **Uses** the provided input for the workflow

### IDE-Specific Instructions

| IDE | How to Use |
|-----|------------|
| **Cursor** | Type `/agentfile-run:name` in composer |
| **Windsurf** | Use slash command in cascade or rules |
| **Claude Code** | `claude "/agentfile-run:name"` |
| **GitHub Copilot** | Add to workspace instructions |
| **Cline/Roo** | Include in system prompt |

---

## Project Structure

```
agentfile/
  SPEC.md                          # Formal specification
  schema/
    workflow.schema.json           # JSON Schema (IDE autocomplete + validation)
  examples/
    hello-world/                 # Example: minimal workflow
    code-reviewer/               # Example: code review workflow
    pr-summarizer/               # Example: PR summary workflow
  workflows/
    workflow-creator/            # Meta-workflow: generates new workflows
  shared/
    AGENTS.md                    # Global agent rules
    project.md                   # Project-level conventions
  cli/                          # Node.js CLI source
  docs/
    concepts.md                  # Deep dive: how everything works
  ~/.agentfile/
    config.json                 # User configuration (API keys, defaults)
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

### Cross-Platform Execution

- **Windows**: Auto-detects PowerShell with execution policy bypass
- **macOS/Linux**: Uses bash by default
- **CLI Runtime**: Requires `scripts/run.sh` and `scripts/run.ps1` 
- **IDE Agents**: Execute steps directly (no scripts needed)

Configure default shell with `agentfile config set shell <bash|pwsh>`

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
