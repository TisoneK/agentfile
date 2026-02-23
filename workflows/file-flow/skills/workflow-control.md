# Skill: Workflow Control

## Purpose
Teach an agent how to validate execution readiness and ensure safe workflow execution by checking configuration completeness and establishing workflow state.

## Instructions

### Step 1 — Validate input files configuration
- Check that `input_files` array exists and is not empty
- Verify each entry is a non-empty string
- Report if no input files are specified

### Step 2 — Validate output configuration
- Check that `output.directory` exists and is a valid path
- Check that `output.format` exists and is a supported format (json, yaml, csv)
- Verify output directory can be created (check parent exists)

### Step 3 — Validate processing rules
- Check that `processing` object exists
- Both `transformations` and `validation_rules` can be empty arrays
- But the object must be present

### Step 4 — Establish workflow state
- Record workflow start timestamp
- Initialize execution context with all validated config
- Prepare for step-by-step execution

### Step 5 — Determine readiness
- If all validations pass: status = "ready"
- If any validation fails: status = "blocked" with specific issues
- Never proceed to execution if blocked

## Examples

### Ready configuration
```json
{
  "input_files": ["data.json"],
  "processing": {"transformations": [], "validation_rules": []},
  "output": {"directory": "output/", "format": "json"}
}
```
Result: `{"status": "ready", "blocking_issues": []}`

### Blocked: Empty input files
```json
{
  "input_files": [],
  "processing": {},
  "output": {"directory": "output/", "format": "json"}
}
```
Result: `{"status": "blocked", "blocking_issues": ["input_files array is empty"]}`

### Blocked: Missing output
```json
{
  "input_files": ["data.json"],
  "processing": {}
}
```
Result: `{"status": "blocked", "blocking_issues": ["output configuration missing"]}`
