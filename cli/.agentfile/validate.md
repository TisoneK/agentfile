# agentfile validate

Validate a workflow for correctness.

## Usage

```
agentfile validate <workflow-name>
```

## Arguments

- `workflow-name`: Name of the workflow to validate

## Description

Validates a workflow's YAML configuration, checks for required files, and ensures the workflow follows the expected structure.

## Examples

```
agentfile validate my-workflow
agentfile validate code-review
```

## Validation Checks

- YAML syntax is valid
- Required files exist (workflow.yaml, etc.)
- Agent and skill references are valid
- Step definitions are properly formatted

## Notes

- Returns exit code 0 if valid, non-zero if errors found
- Displays detailed error messages for any validation failures
