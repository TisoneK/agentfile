# Clarification Summary

## Workflow Purpose
An automated code review pipeline that systematically inspects, analyzes, and evaluates source code changes before merging to main branch or deployment. The workflow maintains code quality, ensures consistency, and catches issues early in the development lifecycle.

## Trigger
Manual command invocation via `/agentfile:run code-reviewer` or automatic trigger on pull requests/merge requests (configurable)

## Inputs
- Source code files/directories to review
- Configuration files (review rules, severity thresholds)
- Git context (branch, commit, diff information)
- Optional: Previous review history for comparison

## Outputs
- Detailed review report with findings categorized by severity
- Code quality metrics and scores
- Recommendations for improvements
- Pass/fail determination based on configurable criteria
- Annotated code snippets with issue locations

## Steps (high level)
1. **Initialize Review Context** - Load configuration and target code
2. **Static Analysis** - Run automated code analysis tools
3. **Security Scan** - Check for security vulnerabilities
4. **Style & Standards Check** - Verify coding standards compliance
5. **Complexity Analysis** - Assess code complexity and maintainability
6. **Generate Report** - Compile all findings into structured output
7. **Evaluate Results** - Apply pass/fail criteria
8. **Publish Findings** - Output final review report

## Agents Needed
- **Coordinator** - Orchestrates the review pipeline and manages workflow state
- **Static Analyzer** - Performs code quality and pattern analysis
- **Security Scanner** - Identifies security vulnerabilities and anti-patterns
- **Style Checker** - Validates coding standards and formatting
- **Reporter** - Compiles and formats the final review report

## Skills Needed
- Code parsing and AST analysis
- Pattern matching and rule evaluation
- Security vulnerability detection
- Code complexity metrics calculation
- Report generation and formatting
- Git integration and diff analysis
- Configuration management

## Edge Cases & Rules
- Handle multiple programming languages (configurable per project)
- Graceful degradation when analysis tools are unavailable
- Configurable severity thresholds for pass/fail determination
- Support for incremental reviews (diff-only) vs full repository scans
- Timeout handling for long-running analysis
- Exclusion patterns for specific files/directories

## Open Questions
None - the request provides sufficient detail for workflow design.
