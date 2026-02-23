# Skill: Analyze Staged Changes

## Purpose
Teaches agents how to analyze git staged changes and extract meaningful context for commit message generation.

## Instructions

1. **Check repository state**
   - Run `git status` to verify we're in a git repository
   - Confirm there are staged changes (`git diff --cached --name-only`)
   - Handle the case of no staged changes gracefully

2. **Get staged changes details**
   - Execute `git diff --cached` to get the full diff
   - Parse the output to identify files, additions, deletions
   - Note the file types and directory structure

3. **Analyze change patterns**
   - Identify what types of changes occurred (code, docs, config, tests)
   - Look for patterns that suggest specific commit types
   - Check for breaking changes (API modifications, schema changes, etc.)

4. **Extract key information**
   - List all modified files with their types
   - Summarize the overall purpose of the changes
   - Note any dependencies or related changes

5. **Provide recommendations**
   - Suggest appropriate commit type based on changes
   - Identify logical scope for the commit
   - Flag anything that needs special attention

## Examples

**Good Analysis:**
```
## Files Changed
- src/api/user.js (JavaScript - API endpoint)
- tests/user.test.js (JavaScript - tests)
- docs/api.md (Documentation)

## Change Summary
Added new user authentication endpoint with corresponding tests and documentation.

## Recommended Commit Type
feat(api) - new functionality added
```

**Bad Analysis:**
```
Some files were changed. Looks like code stuff.
Probably a fix or something.
```

## Validation Checklist
- [ ] Repository state is verified
- [ ] All staged files are listed
- [ ] Change patterns are identified
- [ ] Breaking changes are flagged
- [ ] Commit type recommendation is justified
