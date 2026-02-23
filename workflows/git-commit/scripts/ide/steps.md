## IDE Execution Steps

1. Check Repository State
   - Verify git repository exists
   - Check for staged changes
   - Handle no-staged-changes case

2. Analyze Staged Changes
   - Run `git diff --cached` to get changes
   - Parse and analyze file modifications
   - Generate structured analysis report

3. Generate Commit Message
   - Based on analysis, create conventional commit message
   - Follow conventional commits specification
   - Include appropriate type, scope, and description

4. Get User Approval
   - Present generated message to user
   - Allow approval, editing, or cancellation
   - Validate final message format

5. Execute Commit
   - Run `git commit` with approved message
   - Handle any commit errors
   - Report success or failure

6. Optional Push
   - Ask user if they want to push to remote
   - Execute `git push` if requested
   - Handle push errors appropriately

7. Register Workflow
   - Run `scripts/ide/register.sh` (Unix) or `scripts/ide/register.ps1` (Windows)
   - No API key required — pure file assembly
   - Do NOT run scripts/cli/ scripts in IDE mode

## Notes
- Use IDE agent's built-in LLM capabilities for reasoning steps
- scripts/ide/register.sh/.ps1 are the only shell scripts to run in IDE mode
- All git operations should be executed with proper error handling
