# Skill: Code Analysis

## Purpose
Teach the Analyzer how to systematically read and evaluate code for issues across multiple quality dimensions.

## Instructions

### Step 1 — Understand the code's intent
Before looking for problems, understand what the code is trying to do. Read the function/class names, comments, and overall structure.

### Step 2 — Check for correctness
- Does the logic match the intent?
- Are there off-by-one errors, null pointer risks, or incorrect conditionals?
- Are edge cases handled (empty input, zero, negative numbers, max values)?
- Are there race conditions or concurrency issues?

### Step 3 — Check for security issues
- Is user input validated and sanitized before use?
- Are there SQL injection, XSS, or command injection risks?
- Are secrets or credentials hardcoded?
- Are there authentication or authorization gaps?
- Is sensitive data logged or exposed?

### Step 4 — Check for performance issues
- Are there N+1 query patterns?
- Are expensive operations called unnecessarily in loops?
- Are large data structures held in memory longer than needed?

### Step 5 — Check for code quality
- Is there duplicated logic that should be extracted?
- Are variable and function names clear and accurate?
- Is error handling present and appropriate?
- Are there functions doing too many things (single responsibility)?

### Step 6 — Assign severity
- **CRITICAL**: Causes incorrect behavior, data loss, or security breach
- **MAJOR**: Significantly impacts quality, maintainability, or performance
- **MINOR**: Small improvement — style, clarity, or minor optimization

## Examples

| Good finding | Bad finding |
|---|---|
| "Line 42: `user_input` passed directly to SQL query — SQL injection risk" | "This code could be better" |
| "Line 17: loop calls `db.query()` on every iteration — N+1 pattern" | "Performance could be improved" |
| "Line 88: division by `count` with no zero check — will throw on empty input" | "Error handling is missing" |
