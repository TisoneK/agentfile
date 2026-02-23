# Skill: Data Transformation

## Purpose
Teach an agent how to apply rule-based transformations (restructuring, filtering, normalization) to parsed data.

## Instructions

### Step 1 — Understand transformation rules
- Read transformation rules from instruction configuration
- Each rule has: `type`, parameters, and target
- Apply rules in order they appear in the array

### Step 2 — Apply field mapping/renaming
- For each mapping rule, create new field with target name
- Copy value from source field to target field
- Optionally remove original field after mapping

### Step 3 — Apply filtering
- For filter rules, evaluate condition on each record
- Keep only records where condition is true
- Support: equals, not equals, contains, greater than, less than

### Step 4 — Apply data normalization
- Convert data types (string to number, etc.)
- Trim whitespace from strings
- Standardize formats (dates, phone numbers, etc.)

### Step 5 — Apply aggregation
- Group records by key field
- Calculate aggregates: count, sum, average, min, max
- Create summary records

## Examples

### Field mapping
```json
{"type": "map", "from": "user_name", "to": "name"}
```
Input: `{"user_name": "Alice"}` → Output: `{"name": "Alice"}`

### Filtering
```json
{"type": "filter", "field": "age", "operator": "gte", "value": 18}
```
Input records with ages: `[{"name": "Alice", "age": 30}, {"name": "Bob", "age": 15}]`
→ Output: `[{"name": "Alice", "age": 30}]`

### Normalization
```json
{"type": "normalize", "field": "email", "to": "lowercase"}
```
Input: `{"email": "ALICE@EXAMPLE.COM"}` → Output: `{"email": "alice@example.com"}`

### Aggregation
```json
{"type": "group_by", "field": "category", "aggregate": "sum", "target": "amount"}
```
Input: `[{"category": "A", "amount": 10}, {"category": "A", "amount": 20}, {"category": "B", "amount": 5}]`
→ Output: `[{"category": "A", "amount": 30}, {"category": "B", "amount": 5}]`
