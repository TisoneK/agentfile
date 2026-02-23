# IDE Execution Instructions — code-reviewer

## Overview
This workflow runs inside your IDE agent (Cursor, Windsurf, Cline, etc.).
The IDE agent provides the LLM reasoning. No API key is needed to run steps.

## Execution Mode Warning

| Script | API key? | When to use |
|--------|----------|-------------|
| `scripts/ide/register.sh` / `.ps1` | ❌ No | After IDE execution — assembles outputs |
| `scripts/cli/run.sh` / `.ps1` | ✅ Yes | CLI / CI/CD / automation |

Never run `scripts/cli/` scripts inside your IDE agent session.

## Setup
1. Open project root in your IDE
2. Load `agents/coordinator.md` as your system prompt (or paste it into context)
3. Follow `scripts/ide/steps.md`

## Agent Loading Instructions

For each step, you'll need to load the appropriate agent:

- **Steps 1 & 8**: Load `agents/coordinator.md`
- **Step 2 & 5**: Load `agents/static-analyzer.md`
- **Step 3**: Load `agents/security-scanner.md`
- **Step 4**: Load `agents/style-checker.md`
- **Step 6 & 7**: Load `agents/reporter.md`

## Output
All outputs land in `outputs/` (gitignored). Run `scripts/ide/register.sh` to assemble.

## Tips for IDE Execution
- Always load the complete agent file content as your system prompt
- Paste the full skill content into your message
- Include the required input files as context
- Let the agent work through the skill instructions naturally
- Save each step's output to the specified filename in `outputs/`
