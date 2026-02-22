# Code Reviewer Workflow

A comprehensive code review workflow that analyzes code for bugs, security issues, performance problems, and style violations.

## Usage

### IDE Agent (Recommended)
```
/agentfile-run:code-reviewer
Input: src/components/Button.js
```

**IDE Processing Instructions:**
1. **CRITICAL**: Check `execution.preferred` field in workflow.yaml
2. If `preferred: ide` → **MUST** use IDE mode
3. If `preferred: cli` → **MUST** use CLI mode
4. If no execution field → **DEFAULT** to IDE mode
5. **NEVER** ignore execution preference - this is mandatory
6. Load agents from `agents/*.md` as system prompts
7. Load skills from `skills/*.md` as context  
8. Execute steps sequentially using your LLM
9. **NEVER** execute scripts - this is IDE-only workflow
10. Process file references by reading the specified files

### CLI
```bash
agentfile run code-reviewer --input "src/components/Button.js"
```

## Workflow Steps

1. **Analyze Code** - Deep technical analysis for bugs, security vulnerabilities, and performance issues
2. **Write Review** - Transform analysis into clear, actionable feedback
3. **Create Summary** - Distill findings into a quick-scannable summary with prioritized action items

## Outputs

- `outputs/01-analysis.md` - Detailed technical analysis
- `outputs/02-review.md` - Comprehensive code review report
- `outputs/03-summary.md` - Prioritized summary with action items

## Features

- **Security-focused**: Identifies vulnerabilities and best practice violations
- **Performance-aware**: Detects bottlenecks and scalability issues
- **Constructive**: Balanced feedback with educational insights
- **Actionable**: Clear priorities and specific improvement suggestions
- **IDE-friendly**: Works seamlessly with Cursor, Windsurf, Claude Code, and other IDE agents

## Example Input

```
src/components/UserProfile.js
```

## Example Output Summary

🚨 **Critical**: SQL injection vulnerability in database query
⚠️ **Important**: Performance issue with N+1 query pattern  
💡 **Suggestions**: Add input validation and error handling
✅ **Highlights**: Clean component structure and good naming
📋 **Action Items**: Fix security issue, optimize queries, add validation
