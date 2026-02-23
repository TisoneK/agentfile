# Skill: File Parsing

## Purpose
Teach an agent how to parse different file formats (JSON, YAML, CSV) into structured data, handling format detection and syntax errors.

## Instructions

### Step 1 — Detect file format
- Check file extension: `.json` → JSON, `.yaml`/`.yml` → YAML, `.csv` → CSV
- Default to JSON if extension is unknown but content looks like JSON

### Step 2 — Parse JSON files
- Use `JSON.parse()` or equivalent
- Catch SyntaxError with line/column information
- Validate structure after parsing

### Step 3 — Parse YAML files
- Use a YAML parser library
- Catch parsing errors with line numbers
- Convert to JavaScript object structure

### Step 4 — Parse CSV files
- Read first line as headers
- Parse each subsequent line as a row
- Handle quoted fields and escapes
- Return array of objects with header keys

### Step 5 — Handle errors
- Report file format if detection fails
- Report syntax errors with line number and position
- Provide context around error location

## Examples

### JSON parsing
```json
{"users": [{"name": "Alice", "age": 30}]}
```
Result: `{users: [{name: "Alice", age: 30}]}`

### YAML parsing
```yaml
users:
  - name: Alice
    age: 30
```
Result: `{users: [{name: "Alice", age: 30}]}`

### CSV parsing
```csv
name,age,email
Alice,30,alice@example.com
Bob,25,bob@example.com
```
Result:
```json
[
  {"name": "Alice", "age": "30", "email": "alice@example.com"},
  {"name": "Bob", "age": "25", "email": "bob@example.com"}
]
```

### Error handling
| Error | Message |
|-------|---------|
| Invalid JSON | "SyntaxError at line 5, column 10: unexpected token" |
| Invalid YAML | "YAMLError: mapping values are not allowed here at line 3" |
| Malformed CSV | "ParseError at row 10: not enough fields (expected 3, got 2)" |
