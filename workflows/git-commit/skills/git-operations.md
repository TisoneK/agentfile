# Skill: Git Operations

## Purpose
Teaches agents how to execute git commands safely with proper error handling and validation.

## Instructions

1. **Pre-flight checks**
   - Verify git repository status
   - Check for merge conflicts or detached HEAD
   - Ensure git user.name and user.email are configured

2. **Execute commands safely**
   - Use git commands with appropriate flags
   - Capture both stdout and stderr
   - Check exit codes for success/failure

3. **Handle common errors**
   - Empty commit: suggest adding changes or using --allow-empty
   - Merge conflicts: guide user to resolve conflicts
   - Authentication failures: suggest checking credentials
   - Network errors: suggest retry or check connection

4. **Commit operations**
   - Use `git commit -m "message"` for standard commits
   - Verify commit was created successfully
   - Get commit hash for reference

5. **Push operations**
   - Check if remote exists and is reachable
   - Use `git push` with appropriate branch
   - Handle push rejections (force push guidance)
   - Report push success or failure

## Examples

**Good error handling:**
```
## Command Executed
`git commit -m "feat(auth): add OAuth2 integration"`

## Status
failed

## Error
fatal: not a git repository (or any of the parent directories): .git

## Resolution
Please run this command from within a git repository.
```

**Bad error handling:**
```
Git command failed. Try again.
```

## Validation Checklist
- [ ] Pre-flight checks are performed
- [ ] Commands are executed with proper flags
- [ ] Exit codes are checked
- [ ] Error messages are actionable
- [ ] Success is verified
