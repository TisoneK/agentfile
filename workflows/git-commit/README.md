# Git Commit Workflow

Automates the git commit process by analyzing staged changes, generating conventional commit messages, getting user approval, and executing the commit with optional push to remote repository.

## Features

- **Staged Changes Analysis**: Analyzes git repository state and staged changes
- **Conventional Commits**: Generates commit messages following the Conventional Commits specification
- **User Approval**: Interactive approval and editing of commit messages
- **Safe Git Operations**: Executes git commits and optional pushes with proper error handling
- **Dual Execution Modes**: Supports both IDE and CLI execution

## Usage

### IDE Mode (Recommended)
```bash
/agentfile:run git-commit
```

### CLI Mode
```bash
agentfile run git-commit "input"
```

## Workflow Steps

1. **Check Staged Changes**: Analyzes git repository state and staged changes
2. **Generate Commit Message**: Creates a conventional commit message based on changes
3. **Approve Message**: Presents message for user approval or editing
4. **Execute Commit**: Commits changes with the approved message
5. **Optional Push**: Optionally pushes committed changes to remote repository

## Requirements

- Git must be installed and configured
- User must be in a git repository
- Git user.name and user.email must be configured
- Staged changes must be present

## Output

The workflow generates artifacts in the `outputs/` directory:
- `01-staged-analysis.md` - Analysis of staged changes
- `02-commit-message.md` - Generated commit message
- `03-approved-message.md` - User-approved message
- `04-commit-result.md` - Commit execution result
- `05-push-result.md` - Push operation result (if performed)

## Configuration

The workflow follows the Conventional Commits specification:
- Types: `feat`, `fix`, `docs`, `style`, `refactor`, `test`, `chore`
- Format: `type(scope): description`
- Breaking changes marked with `!` or footer

## Error Handling

The workflow handles common git issues:
- No staged changes
- Empty commits
- Merge conflicts
- Authentication failures for push operations
- Network errors
