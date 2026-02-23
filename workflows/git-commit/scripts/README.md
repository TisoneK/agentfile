# Execution Scripts

## IDE Mode (Preferred)
- Use `scripts/ide/instructions.md` for IDE agent setup
- Follow `scripts/ide/steps.md` for step-by-step execution
- No external dependencies required

## CLI Mode
- Use `agentfile run git-commit "input"`
- Requires external API access (anthropic-api or similar)
- For automation and CI/CD pipelines

## Switching Modes
Edit `workflow.yaml`:
```yaml
execution:
  preferred: "ide"  # or "cli"
```
