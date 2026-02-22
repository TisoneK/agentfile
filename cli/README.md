# Agentfile CLI

The official CLI for the [Agentfile](https://github.com/TisoneK/agentfile) workflow specification.

## Installation

```bash
npm install -g agentfile
```

## Commands

### `agentfile init`
Scaffold a new Agentfile project in the current directory.

```bash
mkdir my-project && cd my-project
agentfile init --name my-project
```

Creates:
```
my-project/
  agentfile.yaml       # Project manifest
  shared/
    project.md         # Global conventions
    AGENTS.md          # Global agent rules
  workflows/           # Your workflows go here
  examples/
  .gitignore
  README.md
```

---

### `agentfile create <workflow-name>`
Create a new workflow. If the `workflow-creator` meta-workflow exists and `AGENT_API_KEY` is set, it uses AI to generate the full workflow. Otherwise it scaffolds a blank structure.

```bash
agentfile create code-reviewer
agentfile create pr-summarizer --request "Summarize pull request diffs into structured reports"
```

---

### `agentfile run <workflow-name>`
Run a workflow using its reference runtime scripts.

```bash
agentfile run code-reviewer --input "path/to/my-file.py"
agentfile run pr-summarizer --input "$(git diff main)"
agentfile run code-reviewer --input "src/auth.js" --shell pwsh
```

**Options:**
| Flag | Description | Default |
|------|-------------|---------|
| `--input <text>` | Input text or file path | `$AGENT_INPUT` env var |
| `--key <key>` | LLM API key | `$AGENT_API_KEY` env var |
| `--model <model>` | Model to use | `$AGENT_MODEL` or `claude-sonnet-4-6` |
| `--shell <shell>` | Runtime: `bash` or `pwsh` | `bash` |

---

### `agentfile list`
List all workflows in the current project.

```bash
agentfile list
agentfile list --examples   # include examples/ folder
```

---

### `agentfile validate [workflow-name]`
Validate a workflow against the Agentfile spec. Checks YAML schema, agent/skill file references, script presence, and gitignore.

```bash
agentfile validate              # validate all workflows
agentfile validate code-reviewer
```

---

## Environment Variables

| Variable | Description |
|----------|-------------|
| `AGENT_API_KEY` | Your LLM API key |
| `AGENT_INPUT` | Default input for `agentfile run` |
| `AGENT_MODEL` | Model override (default: `claude-sonnet-4-6`) |

---

## IDE Agent Usage (no CLI needed)

If you're using an IDE agent (Cursor, Windsurf, Claude Code, Cline, etc.), you don't need the CLI — just point your agent at the `workflow.yaml` directly:

```
Load workflow.yaml and follow its steps.
Load the agent from agents/ and skills from skills/.
Input: <your input here>
```
