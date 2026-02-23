# Execution Scripts — code-reviewer

## Quick Start

### IDE Mode (interactive, no API key in shell)
1. Open project in your IDE agent (Cursor, Windsurf, Cline…)
2. Follow `scripts/ide/instructions.md`
3. Execute steps per `scripts/ide/steps.md`
4. Assemble output: `bash scripts/ide/register.sh`

### CLI Mode (automated, requires ANTHROPIC_API_KEY)
```bash
export ANTHROPIC_API_KEY=sk-...
bash scripts/cli/run.sh "[your input here]"
```

## Script Reference

| Script | API Key? | Purpose |
|--------|----------|---------|
| `scripts/cli/run.sh` | ✅ | Full pipeline (Bash) |
| `scripts/cli/run.ps1` | ✅ | Full pipeline (PowerShell) |
| `scripts/ide/register.sh` | ❌ | Output assembly (Bash) |
| `scripts/ide/register.ps1` | ❌ | Output assembly (PowerShell) |
| `scripts/ide/instructions.md` | ❌ | IDE setup guide |
| `scripts/ide/steps.md` | ❌ | IDE step-by-step guide |

### Utility Scripts (scripts/utils/)
| Script | Purpose |
|--------|---------|
| `load-config.sh/.ps1` | Load and validate review configuration |
| `find-source-files.sh/.ps1` | Discover source files with exclusion patterns |
| `validate-inputs.sh/.ps1` | Validate input files and directories |
| `write-output.sh/.ps1` | Write content with directory creation |
| `generate-artifacts.sh/.ps1` | Create artifact manifests and summaries |
| `run-static-analysis.sh/.ps1` | Execute static analysis tools |

## Switch Modes
Edit `execution.preferred` in `workflow.yaml`:
```yaml
execution:
  preferred: "ide"   # or "cli"
```

## Output Structure
```
outputs/
├── 01-context.md              # Review initialization
├── 02-static-analysis.md      # Code quality results
├── 03-security-scan.md        # Security findings
├── 04-style-check.md          # Style violations
├── 05-complexity-analysis.md  # Complexity metrics
├── 06-review-report.md        # Compiled report
├── 07-evaluation.md          # Pass/fail decision
├── 08-final-report.md        # Formatted output
├── artifacts/                 # Metadata and manifests
│   ├── manifest.json
│   └── summary.txt
└── index.html                # HTML summary view
```

## Environment Variables
- `ANTHROPIC_API_KEY` - Required for CLI mode
- `INPUT_PATH` - Target code path to review

## Configuration
Create `.review-config.json` in your project root:
```json
{
  "languages": ["python", "javascript"],
  "thresholds": {
    "complexity_max": 10,
    "duplication_max": 5,
    "security_critical": true,
    "style_compliance_min": 85
  },
  "exclude": ["node_modules/", ".git/", "build/"],
  "tools": {
    "static_analyzer": "auto",
    "security_scanner": "auto",
    "style_checker": "auto"
  }
}
```

## Troubleshooting
- **Missing outputs**: Ensure all steps completed successfully before running register script
- **API errors**: Verify ANTHROPIC_API_KEY is set and valid
- **Permission errors**: Check read access to target code and write access to outputs/
