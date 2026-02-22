# Skill: Classify Diff

## Purpose
Teach the Classifier how to read a git diff and systematically categorize every change by type, scope, and risk.

## Instructions

### Step 1 — Parse the diff structure
Identify all changed files from the diff headers (`--- a/file`, `+++ b/file`).
For each file, note whether it was added, modified, or deleted.

### Step 2 — Classify each file's changes
Assign each changed file to one or more categories:

| Category | Signal |
|----------|--------|
| Feature | New functions, new endpoints, new UI components |
| Bug Fix | Changes to conditional logic, null checks, error handling |
| Refactor | Same behavior, restructured code — no new functionality |
| Tests | Files in `test/`, `spec/`, `__tests__/`, `*.test.*`, `*.spec.*` |
| Config | `.env`, `yaml`, `json`, `toml`, `Dockerfile`, CI files |
| Docs | `README`, `*.md`, comments, docstrings |
| Chore | Dependency updates, formatting, linting |

### Step 3 — Assess risk
Consider:
- Does this change authentication, authorization, or session handling? → HIGH
- Does this introduce new public API endpoints? → HIGH
- Does this change data models or run migrations? → HIGH
- Does this modify core business logic? → MEDIUM
- Is it isolated to one module with tests? → LOW
- Is it docs/tests/config only? → LOW

### Step 4 — Identify review focus areas
What are the 2-3 things a reviewer absolutely must check? Be specific — name the file and function, not just the concept.

## Example

Given a diff that adds a `/reset-password` endpoint:
- **Category**: Feature + Security-sensitive
- **Risk**: HIGH — touches auth flow, sends emails, modifies user records
- **Review focus**: Token expiry logic in `auth.js:resetPassword()`, email template injection risk
