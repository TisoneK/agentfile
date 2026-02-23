## IDE Execution Steps — code-reviewer

> Run these steps in your IDE agent session. Each step produces a file in `outputs/`.

### Step 1 — Initialize Review Context
**Agent**: Load `agents/coordinator.md` as system prompt
**Skill**: Paste contents of `skills/setup-review-context.md` into your message
**Input**: Input path provided when starting the workflow
**Output**: `outputs/01-context.md`
**Instruction**: "Initialize the code review context by loading configuration, identifying target files, and setting up the analysis environment."

### Step 2 — Static Code Analysis
**Agent**: Load `agents/static-analyzer.md` as system prompt
**Skill**: Paste contents of `skills/code-quality-analysis.md` into your message
**Input**: `outputs/01-context.md`
**Output**: `outputs/02-static-analysis.md`
**Instruction**: "Perform comprehensive static code analysis including quality metrics, pattern detection, and maintainability assessment."

### Step 3 — Security Vulnerability Scan
**Agent**: Load `agents/security-scanner.md` as system prompt
**Skill**: Paste contents of `skills/vulnerability-detection.md` into your message
**Input**: `outputs/01-context.md`
**Output**: `outputs/03-security-scan.md`
**Instruction**: "Scan source code for security vulnerabilities, weaknesses, and compliance gaps using established security frameworks."

### Step 4 — Style & Standards Check
**Agent**: Load `agents/style-checker.md` as system prompt
**Skill**: Paste contents of `skills/coding-standards-validation.md` into your message
**Input**: `outputs/01-context.md`
**Output**: `outputs/04-style-check.md`
**Instruction**: "Validate source code compliance with coding standards, style guides, and formatting conventions."

### Step 5 — Complexity Analysis
**Agent**: Load `agents/static-analyzer.md` as system prompt
**Skill**: Paste contents of `skills/complexity-metrics.md` into your message
**Input**: `outputs/01-context.md`
**Output**: `outputs/05-complexity-analysis.md`
**Instruction**: "Calculate and analyze code complexity metrics to assess maintainability, testability, and cognitive load."

### Step 6 — Generate Review Report
**Agent**: Load `agents/reporter.md` as system prompt
**Skill**: Paste contents of `skills/report-compilation.md` into your message
**Input**: `outputs/02-static-analysis.md`, `outputs/03-security-scan.md`, `outputs/04-style-check.md`, `outputs/05-complexity-analysis.md`
**Output**: `outputs/06-review-report.md`
**Instruction**: "Compile and synthesize analysis results from all previous steps into comprehensive, actionable reports for different audiences."

### Step 7 — Evaluate Results
**Agent**: Load `agents/coordinator.md` as system prompt
**Skill**: Paste contents of `skills/result-evaluation.md` into your message
**Input**: `outputs/01-context.md`, `outputs/06-review-report.md`
**Output**: `outputs/07-evaluation.md`
**Instruction**: "Apply configurable pass/fail criteria to review results and make final approval or rejection decisions."

### Step 8 — Publish Findings
**Agent**: Load `agents/reporter.md` as system prompt
**Skill**: Paste contents of `skills/output-formatting.md` into your message
**Input**: `outputs/06-review-report.md`, `outputs/07-evaluation.md`
**Output**: `outputs/08-final-report.md`
**Instruction**: "Format and publish final review outputs in multiple formats including Markdown, JSON, and pull request annotations."

### Final Step — Register
Run register script (no API key needed):
```bash
bash scripts/ide/register.sh
# or on Windows:
pwsh scripts/ide/register.ps1
```

This will:
- Generate artifact manifests and summaries
- Validate all outputs were created
- Provide final completion status
