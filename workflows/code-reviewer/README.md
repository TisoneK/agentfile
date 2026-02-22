# Code Reviewer Workflow

A comprehensive code review workflow that analyzes code for bugs, security issues, performance problems, and style violations.

## Usage

### IDE Agent (Recommended)
```
/agentfile-run:code-reviewer
Input: src/components/Button.js
```

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
