# Workflow Design

## Name
code-reviewer

## Description
An automated code review pipeline that systematically inspects, analyzes, and evaluates source code changes before merging to main branch or deployment. The workflow maintains code quality, ensures consistency, and catches issues early in the development lifecycle through multi-faceted analysis including static analysis, security scanning, style checking, and complexity assessment.

## Steps
| id | name | agent | skill | produces |
|----|------|-------|-------|----------|
| 01-init | Initialize Review Context | coordinator | setup-review-context | artifacts/code-reviewer/{run-id}/01-context.md |
| 02-static | Static Code Analysis | static-analyzer | code-quality-analysis | artifacts/code-reviewer/{run-id}/02-static-analysis.md |
| 03-security | Security Vulnerability Scan | security-scanner | vulnerability-detection | artifacts/code-reviewer/{run-id}/03-security-scan.md |
| 04-style | Style & Standards Check | style-checker | coding-standards-validation | artifacts/code-reviewer/{run-id}/04-style-check.md |
| 05-complexity | Complexity Analysis | static-analyzer | complexity-metrics | artifacts/code-reviewer/{run-id}/05-complexity-analysis.md |
| 06-report | Generate Review Report | reporter | report-compilation | artifacts/code-reviewer/{run-id}/06-review-report.md |
| 07-evaluate | Evaluate Results | coordinator | result-evaluation | artifacts/code-reviewer/{run-id}/07-evaluation.md |
| 08-publish | Publish Findings | reporter | output-formatting | artifacts/code-reviewer/{run-id}/08-final-report.md |

## Agents

### coordinator
- **Role**: Orchestrates the entire review pipeline, manages workflow state, and makes final pass/fail decisions
- **Input**: Review configuration, target code paths, evaluation criteria
- **Output**: Initialized context, final evaluation, workflow orchestration
- **Tone/Style**: Systematic, decisive, process-oriented

### static-analyzer
- **Role**: Performs code quality analysis and complexity assessment
- **Input**: Source code files, analysis rules, quality thresholds
- **Output**: Quality metrics, complexity scores, pattern violations
- **Tone/Style**: Technical, precise, metrics-focused

### security-scanner
- **Role**: Identifies security vulnerabilities and anti-patterns
- **Input**: Source code, security rules, vulnerability databases
- **Output**: Security findings, severity ratings, remediation suggestions
- **Tone/Style**: Security-conscious, risk-averse, detailed

### style-checker
- **Role**: Validates coding standards and formatting compliance
- **Input**: Source code, style guides, formatting rules
- **Output**: Style violations, formatting issues, consistency reports
- **Tone/Style**: Detail-oriented, standards-focused, consistent

### reporter
- **Role**: Compiles analysis results and formats final review reports
- **Input**: All analysis artifacts, report templates, output formats
- **Output**: Structured review reports, summaries, recommendations
- **Tone/Style**: Clear, organized, user-friendly

## Skills

### setup-review-context
- **Purpose**: Initialize review environment and load configuration
- **Used by**: coordinator
- **Key instructions**: 
  - Load review configuration from config files
  - Identify target code files/directories
  - Set up analysis environment and tools
  - Initialize git context and diff information
  - Create review workspace and logging

### code-quality-analysis
- **Purpose**: Perform comprehensive static code analysis
- **Used by**: static-analyzer
- **Key instructions**:
  - Parse source code and build AST
  - Apply quality rules and patterns
  - Detect code smells and anti-patterns
  - Generate quality metrics and scores
  - Identify maintainability issues

### vulnerability-detection
- **Purpose**: Scan for security vulnerabilities and risks
- **Used by**: security-scanner
- **Key instructions**:
  - Apply security scanning rules
  - Check for common vulnerability patterns
  - Analyze dependencies for known issues
  - Assess security best practices compliance
  - Categorize findings by severity

### coding-standards-validation
- **Purpose**: Verify compliance with coding standards and style guides
- **Used by**: style-checker
- **Key instructions**:
  - Apply formatting and style rules
  - Check naming conventions and patterns
  - Validate documentation standards
  - Assess code organization and structure
  - Generate style violation reports

### complexity-metrics
- **Purpose**: Calculate code complexity and maintainability metrics
- **Used by**: static-analyzer
- **Key instructions**:
  - Calculate cyclomatic complexity
  - Assess cognitive complexity
  - Measure code duplication
  - Evaluate test coverage implications
  - Generate complexity reports

### report-compilation
- **Purpose**: Compile all analysis results into comprehensive report
- **Used by**: reporter
- **Key instructions**:
  - Aggregate findings from all analysis steps
  - Categorize issues by severity and type
  - Generate executive summary
  - Create detailed technical findings
  - Structure report for different audiences

### result-evaluation
- **Purpose**: Apply pass/fail criteria and make final determination
- **Used by**: coordinator
- **Key instructions**:
  - Apply configurable pass/fail thresholds
  - Consider severity distribution
  - Evaluate overall code quality score
  - Make final approval/rejection decision
  - Document evaluation rationale

### output-formatting
- **Purpose**: Format final review output in multiple formats
- **Used by**: reporter
- **Key instructions**:
  - Generate Markdown report
  - Create JSON summary for automation
  - Format console output
  - Create annotation files for PR/MR comments
  - Archive all artifacts

## Scripts

### Utils Scripts (`scripts/utils/`) — Design These First

| Operation | Script |
|-----------|--------|
| Load review configuration | `utils/load-config.sh` / `.ps1` |
| Discover source files | `utils/find-source-files.sh` / `.ps1` |
| Validate file formats | `utils/validate-inputs.sh` / `.ps1` |
| Run static analysis tools | `utils/run-static-analysis.sh` / `.ps1` |
| Run security scanner | `utils/run-security-scan.sh` / `.ps1` |
| Run style checker | `utils/run-style-check.sh` / `.ps1` |
| Calculate complexity metrics | `utils/calculate-complexity.sh` / `.ps1` |
| Generate report artifacts | `utils/generate-artifacts.sh` / `.ps1` |
| Write final output | `utils/write-output.sh` / `.ps1` |

### CLI Scripts (`scripts/cli/`)

#### `run.sh` / `run.ps1`
- **Purpose**: Main orchestration — runs all steps in sequence via Anthropic API, calls utils/ scripts for tool execution
- **Logic**: 
  1. Parse command line arguments (target path, config file, output format)
  2. Load configuration using `utils/load-config.sh`
  3. Initialize review context via coordinator agent
  4. Execute analysis steps sequentially, calling appropriate utils/ scripts
  5. Compile results via reporter agent
  6. Apply evaluation criteria via coordinator agent
  7. Format and publish final output
  8. Return appropriate exit code based on pass/fail determination

#### `setup.sh` / `setup.ps1`
- **Purpose**: Install and configure required analysis tools
- **Logic**: Check for and install static analysis tools, security scanners, and style checkers

#### `run-batch.sh` / `run-batch.ps1`
- **Purpose**: Process multiple repositories or directories in batch
- **Logic**: Iterate through list of targets, run main workflow for each

#### `watch.sh` / `watch.ps1`
- **Purpose**: Monitor for code changes and trigger automatic reviews
- **Logic**: Watch file system or git events, trigger workflow on changes

### IDE Scripts (`scripts/ide/`)

#### `instructions.md`
- **Purpose**: IDE agent setup guide for code review workflow

#### `steps.md`
- **Purpose**: Step-by-step execution guide — references utils/ scripts for manual tool execution

#### `register.sh` / `register.ps1`
- **Purpose**: Post-IDE output assembly — calls utils/ scripts, no API key required

## File Manifest
```
workflows/code-reviewer/
  workflow.yaml
  agents/
    coordinator.md
    static-analyzer.md
    security-scanner.md
    style-checker.md
    reporter.md
  skills/
    setup-review-context.md
    code-quality-analysis.md
    vulnerability-detection.md
    coding-standards-validation.md
    complexity-metrics.md
    report-compilation.md
    result-evaluation.md
    output-formatting.md
  scripts/
    utils/
      load-config.sh
      load-config.ps1
      find-source-files.sh
      find-source-files.ps1
      validate-inputs.sh
      validate-inputs.ps1
      run-static-analysis.sh
      run-static-analysis.ps1
      run-security-scan.sh
      run-security-scan.ps1
      run-style-check.sh
      run-style-check.ps1
      calculate-complexity.sh
      calculate-complexity.ps1
      generate-artifacts.sh
      generate-artifacts.ps1
      write-output.sh
      write-output.ps1
    cli/
      run.sh
      run.ps1
      setup.sh
      setup.ps1
      run-batch.sh
      run-batch.ps1
      watch.sh
      watch.ps1
    ide/
      instructions.md
      steps.md
      register.sh
      register.ps1
    README.md
  outputs/         # runtime, gitignored
```

## Dependencies / Assumptions
- Git repository context available for diff analysis
- External analysis tools (static analyzers, security scanners) installed or available
- Configuration files exist defining review rules and thresholds
- Sufficient permissions to read source code and write reports
- Network access for vulnerability database updates (optional)
- Support for multiple programming languages via configuration

## Workflow Connections

### Downstream (this workflow feeds into)
- `git-commit` — When review passes, can trigger automated commit workflow
  - Trigger condition: "when 08-final-report.md contains status: PASS"
  - How to trigger: "run scripts/cli/run.sh from git-commit workflow with review report as input"
