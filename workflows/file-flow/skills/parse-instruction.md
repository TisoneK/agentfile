# Skill: Parse Instruction

## Purpose
Teach an agent how to parse JSON/YAML instruction configuration files to extract file lists, processing rules, and output configuration.

## Instructions

### Step 1 — Detect file format
- Check file extension to determine format: `.json` → JSON, `.yaml` or `.yml` → YAML
- Load file contents as text first

### Step 2 — Parse the file
- For JSON: use `JSON.parse()` or equivalent
- For YAML: use a YAML parser library
- Handle parsing errors with specific line numbers

### Step 3 — Validate structure
Check for required top-level fields:
- `input_files`: array of file paths to process
- `processing`: object containing transformation rules
- `output`: object with `directory` and `format`

### Step 4 — Extract configuration
- Extract `input_files` array
- Extract `processing.transformations` array (may be empty)
- Extract `processing.validation_rules` array (may be empty)
- Extract `output.directory` and `output.format`

### Step 5 — Handle errors
- Report missing required fields with field path
- Report invalid field types with expected vs actual
- Provide remediation suggestions

## Examples

### Good: Complete instruction
```json
{
  "input_files": ["data/users.json", "data/settings.yaml"],
  "processing": {
    "transformations": [{"type": "filter", "field": "active", "value": true}],
    "validation_rules": [{"type": "required", "fields": ["email"]}]
  },
  "output": {"directory": "output/", "format": "json"}
}
```

### Bad: Missing required field
```json
{
  "input_files": ["data.json"]
  // Missing: processing, output
}
```

Error: "Missing required field 'processing' at root level"
