# Skill: Data Validation

## Purpose
Teach an agent how to validate processed data against schemas and validation rules, ensuring data quality before output.

## Instructions

### Step 1 — Load validation rules
- Read validation rules from instruction configuration
- Each rule specifies: type, target field, parameters
- Support: required, type, format, custom validators

### Step 2 — Validate required fields
- For each required field, check it exists and is not null/undefined
- Report missing fields with field path (e.g., "users[0].email")

### Step 3 — Validate data types
- Check field values match expected type: string, number, boolean, array, object
- Report type mismatches with expected vs actual type

### Step 4 — Validate formats
- Validate string formats: email, url, date, uuid
- Validate numeric ranges: min, max
- Validate array lengths

### Step 5 — Compile validation results
- Collect all errors with field path and message
- Determine overall status: valid if no errors, invalid otherwise
- Provide actionable error messages

## Examples

### Required field validation
```json
{"type": "required", "field": "email"}
```
Input: `{"name": "Alice"}`
Error: "Field 'email' is required"

### Type validation
```json
{"type": "type", "field": "age", "expected": "number"}
```
Input: `{"age": "30"}` (string)
Error: "Field 'age' expected type 'number', got 'string'"

### Format validation
```json
{"type": "format", "field": "email", "format": "email"}
```
Input: `{"email": "invalid-email"}`
Error: "Field 'email' must be valid email format"

### Range validation
```json
{"type": "range", "field": "age", "min": 0, "max": 150}
```
Input: `{"age": -5}`
Error: "Field 'age' must be between 0 and 150"

### Validation result format
```json
{
  "status": "invalid",
  "errors": [
    {"field": "email", "message": "Field 'email' is required"},
    {"field": "age", "message": "Field 'age' must be between 0 and 150"}
  ]
}
```
