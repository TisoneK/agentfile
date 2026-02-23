# IDE Execution Instructions

## Workflow: git-commit
Execution Mode: IDE

## ⚠️ Execution Mode Warning

| Script path | Purpose | API key? | Use in IDE? |
|-------------|---------|----------|-------------|
| `scripts/ide/register.sh` / `.ps1` | Assemble final workflow folder | ❌ Not needed | ✅ Yes |
| `scripts/cli/run.sh` / `.ps1` | Full pipeline via Anthropic API | ✅ Required | ❌ Never |

## Step-by-Step Instructions

When an IDE agent sees `/agentfile:run git-commit`, follow these exact steps:

### 1. Initialize
- Check if we're in a git repository
- Verify there are staged changes
- Create outputs directory if needed

### 2. Analyze Staged Changes
- Load agent: `agents/git-analyzer.md`
- Load skill: `skills/analyze-staged.md`
- Run `git status` and `git diff --cached`
- Produce: `outputs/01-staged-analysis.md`

### 3. Generate Commit Message
- Load agent: `agents/commit-generator.md`
- Load skill: `skills/conventional-commits.md`
- Input: `outputs/01-staged-analysis.md`
- Produce: `outputs/02-commit-message.md`

### 4. Get User Approval
- Load agent: `agents/interactive-approver.md`
- Load skill: `skills/get-approval.md`
- Input: `outputs/02-commit-message.md`
- Present message for approval/editing
- Produce: `outputs/03-approved-message.md`

### 5. Execute Commit
- Load agent: `agents/git-executor.md`
- Load skill: `skills/git-operations.md`
- Input: `outputs/03-approved-message.md`
- Execute `git commit` with approved message
- Produce: `outputs/04-commit-result.md`

### 6. Optional Push
- Load agent: `agents/git-executor.md`
- Load skill: `skills/git-operations.md`
- Ask user if they want to push to remote
- If yes, execute `git push`
- Produce: `outputs/05-push-result.md`

### 7. Register Workflow
- Run `scripts/ide/register.sh` (Unix) or `scripts/ide/register.ps1` (Windows)
- No API key required — pure file assembly
- Do NOT run scripts/cli/ scripts in IDE mode

## Agent Loading Instructions
- Load agents from agents/*.md as system prompts
- Load skills from skills/*.md as context
- Execute steps sequentially using IDE agent's LLM
- Never run scripts/cli/ scripts — those require ANTHROPIC_API_KEY
- Only run scripts/ide/register.sh (or .ps1) at the final step

## Output Format
Each step produces its artifact in `outputs/` directory with markdown format.
