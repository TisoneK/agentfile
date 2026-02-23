# Execution Scripts

## IDE Mode (Preferred)

- Use `scripts/ide/instructions.md` for IDE agent setup
- Follow `scripts/ide/steps.md` for step-by-step execution
- No external dependencies required

## CLI Mode

- Use `scripts/cli/run.sh` (Unix) or `scripts/cli/run.ps1` (Windows)
- Requires external API access (anthropic-api or similar)
- For automation and CI/CD pipelines

## Usage

### IDE Mode

1. Set `FILE_FLOW_INPUT` environment variable to your instruction file path
2. Follow steps in `scripts/ide/steps.md`
3. Run `scripts/ide/register.sh` to complete

### CLI Mode

```bash
# Unix
./scripts/cli/run.sh "/path/to/instruction.json"

# Windows
.\scripts\cli\run.ps1 -Input "C:\path\to\instruction.json"
```

## Switching Modes

Edit `workflow.yaml`:
```yaml
execution:
  preferred: "ide"  # or "cli"
```
