---
name: Test Skill
description: A test skill for backward compatibility validation
version: 1.0.0
author: Test Author
category: testing
---

# Test Skill

This is a test skill used for backward compatibility validation.

## Task

Process the input and generate appropriate output for testing.

## Input

- User input from the workflow
- Context variables

## Output

- Processed test output
- Status information

## Steps

1. Read the input
2. Process the data
3. Generate output
4. Return results

## Templates

### Output Template
```markdown
# Test Output

Input: {{input}}
Processed: {{timestamp}}
Result: {{result}}
```

## Functions

### processInput(input)
Processes the input and returns the result.

### validateOutput(output)
Validates the output format and content.

### generateReport(data)
Generates a test report.
