# Reference Runtime

The Agentfile reference runtime provides Bash and PowerShell scripts for executing workflows without an IDE agent.

## Requirements

| Tool | Purpose |
|------|---------|
| `curl` | HTTP calls to your LLM API |
| `jq` | JSON parsing |
| `bash` | Bash scripts |
| `pwsh` | PowerShell (optional, cross-platform) |

## Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `AGENT_API_KEY` | ✅ | Your LLM API key |
| `AGENT_INPUT` | ✅ | Input to the workflow (text or file path) |
| `AGENT_MODEL` | ❌ | Model to use (default: `claude-sonnet-4-6`) |

## Running a Workflow

```bash
# Bash
export AGENT_API_KEY=your-key
export AGENT_INPUT="path/to/input or inline text"
bash examples/code-reviewer/scripts/run.sh

# PowerShell
$env:AGENT_API_KEY = "your-key"
$env:AGENT_INPUT   = "path/to/input or inline text"
pwsh examples/code-reviewer/scripts/run.ps1
```

## Adapting to Other LLM Providers

The runtime uses a simple `call_api` / `Invoke-Api` function. To use a different provider, replace the `curl` call in `run.sh` (or `Invoke-RestMethod` in `run.ps1`) with your provider's API endpoint and auth format. Everything else stays the same.
