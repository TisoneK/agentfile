# Skill: Execution Logging

## Purpose
Teach an agent how to log execution progress and generate comprehensive execution reports with timing and status information.

## Instructions

### Step 1 — Track step execution
- Record start time when each step begins
- Record end time when each step completes
- Calculate duration for each step

### Step 2 — Capture step status
- Track whether each step: succeeded, failed, or was skipped
- Record error messages for failed steps
- Note any warnings during execution

### Step 3 — Aggregate results
- Count total steps
- Count successful, failed, and skipped steps
- Calculate total execution time

### Step 4 — Generate summary
- Create human-readable summary
- Create machine-parseable JSON output
- Include all relevant metadata

### Step 5 — Format report
- Use markdown for human-readable sections
- Use JSON for structured data
- Include actionable information for debugging

## Examples

### Step timing
| Step | Start | End | Duration | Status |
|------|-------|-----|----------|--------|
| load-instruction | 10:00:00 | 10:00:00.3 | 0.3s | success |
| guard-execution | 10:00:00.3 | 10:00:00.4 | 0.1s | success |
| validate-inputs | 10:00:00.4 | 10:00:00.8 | 0.4s | success |

### Summary generation
```markdown
## Summary
- **Status**: success
- **Total Steps**: 8
- **Completed**: 8
- **Failed**: 0
- **Duration**: 5.2s

## Step Results
| Step | Status | Duration | Errors |
|------|--------|----------|--------|
| load-instruction | success | 0.3s | 0 |
| guard-execution | success | 0.1s | 0 |
| validate-inputs | success | 0.4s | 0 |
| parse-files | success | 1.2s | 0 |
| transform-data | success | 2.1s | 0 |
| validate-output | success | 0.5s | 0 |
| save-results | success | 0.4s | 0 |
| report-status | success | 0.2s | 0 |

## Errors
None
```

### JSON output
```json
{
  "status": "success",
  "summary": {
    "total_steps": 8,
    "completed": 8,
    "failed": 0,
    "duration_seconds": 5.2
  },
  "steps": [
    {"id": "load-instruction", "status": "success", "duration_ms": 300},
    {"id": "guard-execution", "status": "success", "duration_ms": 100}
  ],
  "errors": []
}
```
