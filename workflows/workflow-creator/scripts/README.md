# Execution Scripts

## IDE Mode (Preferred)
- Use `scripts/ide/instructions.md` for IDE agent setup
- Follow `scripts/ide/steps.md` for step-by-step execution
- No external dependencies required
- Best for interactive development and testing

## CLI Mode (Fallback)
- Use `scripts/cli/run.sh` (Unix) or `scripts/cli/run.ps1` (Windows)
- Requires external API access (anthropic-api or similar)
- For automation and CI/CD pipelines
- Best for production workflows

## Execution Mode Configuration
Edit `workflow.yaml`:
```yaml
execution:
  preferred: "ide"    # or "cli"
```

## IDE Processing Instructions
When IDE agents see `/agentfile-run:workflow-creator`:
1. Parse command to extract workflow name and input
2. Check execution.preferred field in workflow.yaml
3. Execute in IDE mode (default) or CLI mode as specified
4. Load agents and skills in IDE mode:
   - Load agents from `agents/*.md` as system prompts
   - Load skills from `skills/*.md` as context
   - Execute steps sequentially using your LLM
   - **NEVER** execute external scripts unless explicitly required
5. Process file references by reading the specified files

## Script Structure

### IDE Scripts (`scripts/ide/`)
- `instructions.md` - Complete IDE execution guide
- `steps.md` - Step-by-step instructions for IDE agents

### CLI Scripts (`scripts/cli/`)
- `run.sh` - Unix/Linux runtime script
- `run.ps1` - Windows PowerShell script
- `register.sh` - Unix registration script
- `register.ps1` - Windows registration script

## Usage Examples

### IDE Execution
```
/agentfile-run:workflow-creator
Input: Create a workflow that analyzes code for security vulnerabilities
```

### CLI Execution
```bash
# Unix/Linux
./scripts/cli/run.sh "Create a workflow that analyzes code for security vulnerabilities"

# Windows
./scripts/cli/run.ps1 -Input "Create a workflow that analyzes code for security vulnerabilities"
```

## Registration
After workflow generation:
```bash
# Unix/Linux
./scripts/cli/register.sh

# Windows
./scripts/cli/register.ps1
```

This moves generated files from `outputs/` to the proper workflow directory structure.
