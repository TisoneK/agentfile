# Agentfile

**Agentfile is workflow-as-files for AI agents.**

## Status
Current stable release: v0.1.0  
Development continues on main branch.

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

**Slash Commands (Recommended)**

```
/agentfile:run code-reviewer src/auth.js
/agentfile:create my-workflow Analyze logs and surface error patterns
/agentfile:list
```

**Cursor / Windsurf** — type any slash command directly in the composer.

**Claude Code:**

```bash
claude "/agentfile:run code-reviewer src/auth.js"
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
| `examples/pr-summarizer` | Summarizes pull request diffs into structured reports |
| `workflows/code-reviewer` | Reviews code for bugs, security issues, and improvements |
| `workflows/slash-demo` | **Slash command demo** — perfect for testing `/agentfile:run slash-demo hello` |
| `workflows/workflow-creator` | Meta-workflow — generates new workflows from a natural language description |

Clone and point your IDE agent at `examples/hello-world` to get started in under a minute:

```bash
git clone https://github.com/TisoneK/agentfile
```

Then in your IDE agent:

```
/agentfile:run hello-world recursion
```

---

## IDE Agent Execution

### Slash Command Format

Agentfile uses a single `/agentfile:` namespace with three subcommands:

```
/agentfile:run <workflow-name> <args>
/agentfile:create <new-workflow-name> <description>
/agentfile:list
```

**Examples:**
```
/agentfile:run hello-world recursion
/agentfile:run code-reviewer src/components/Button.js
/agentfile:run pr-summarizer https://github.com/user/repo/pull/123
/agentfile:create security-scanner Scan for OWASP vulnerabilities and produce a risk report
/agentfile:list
```

### How It Works

When an IDE agent sees an `/agentfile:` command, it:

1. **Parses** the subcommand (`run` / `create` / `list`)
2. **`list`** — scans `workflows/*/workflow.yaml` and returns names + descriptions, no LLM needed
3. **`create`** — invokes `workflow-creator` in IDE mode with the name and description pre-set
4. **`run`** — locates `workflows/<name>/workflow.yaml`, checks `execution.preferred`, loads agents and skills, executes steps sequentially

→ Full IDE processing guide: [docs/ide-slash-commands.md](./docs/ide-slash-commands.md)

### IDE-Specific Instructions

| IDE | How to Use |
|-----|------------|
| **Cursor** | Type `/agentfile:run name args` in composer |
| **Windsurf** | Use slash command in cascade or rules |
| **Claude Code** | `claude "/agentfile:run name args"` |
| **GitHub Copilot** | Add to workspace instructions |
| **Cline/Roo** | Include in system prompt |

---

## Project Structure

```
agentfile/
  AGENTS.md                        # ← IDE agents read this first — slash command protocol
  CLAUDE.md                        # Claude Code pointer → AGENTS.md
  .cursorrules                     # Cursor pointer → AGENTS.md
  .windsurfrules                   # Windsurf pointer → AGENTS.md
  .clinerules                      # Cline/Roo pointer → AGENTS.md
  SPEC.md                          # Formal specification
  schema/
    workflow.schema.json           # JSON Schema (IDE autocomplete + validation)
  examples/
    hello-world/                   # Example: minimal workflow
    pr-summarizer/                 # Example: PR summary workflow
  workflows/
    code-reviewer/                 # Example: code review workflow
    slash-demo/                    # Demo: slash command testing
    workflow-creator/              # Meta-workflow: generates new workflows
    test-workflow/                 # Test workflow for validation
    ide-only/                      # IDE-only execution demo
  shared/
    AGENTS.md                      # Global agent rules (injected in CLI calls)
    project.md                     # Project-level conventions (injected in CLI calls)
  cli/                             # Node.js CLI source
  docs/
    concepts.md                    # Deep dive: how everything works
    ide-slash-commands.md          # Full slash command reference
  ~/.agentfile/
    config.json                    # User configuration (API keys, defaults)
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

### Execution Modes

Agentfile workflows support two execution modes with dual script support:

**IDE Mode (Default)**
- Follows `workflow.yaml` steps directly
- Uses `scripts/ide/` instructions for guidance
- No external dependencies required
- Best for interactive development

**CLI Mode**
- Executes `scripts/cli/run.sh` or `scripts/cli/run.ps1`
- Scripts handle API calls and orchestration
- Required for automation/CI/CD
- Best for production workflows

**Dual Script System**
```yaml
# workflow.yaml
execution:
  preferred: "ide"    # or "cli"
```

**Generated Structure:**
```
scripts/
  ide/                  # IDE agent instructions
    instructions.md     # Step-by-step guide
    steps.md           # IDE-specific steps
  cli/                  # CLI runtime scripts
    run.sh             # Unix/Linux script
    run.ps1            # Windows PowerShell
  README.md              # Execution documentation
```

IDE agents automatically detect the preferred mode and execute accordingly.

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
