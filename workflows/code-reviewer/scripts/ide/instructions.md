# IDE Execution Instructions

## Workflow: code-reviewer
Execution Mode: IDE

## ⚠️ Execution Mode Warning

| Script path | Purpose | API key? | Use in IDE? |
|-------------|---------|----------|-------------|
| `scripts/cli/run.sh` / `.ps1` | Full pipeline via Anthropic API | ✅ Required | ❌ Never — will fail |

In IDE mode, **your LLM executes all three steps directly** — no scripts are run.

---

## Step-by-Step Instructions

When an IDE agent sees `/agentfile:run code-reviewer <input>`, follow these steps:

### Step 1: Analyze Code
- Load `agents/analyzer.md` as system prompt
- Load `skills/code-analysis.md` as context
- Input: the file path or code provided by the user
- Goal: identify bugs, security vulnerabilities, performance issues, code smells
- Produce: `outputs/01-analysis.md`

### Step 2: Write Review
- Load `agents/reviewer.md` as system prompt
- Load `skills/write-review.md` as context
- Input: `outputs/01-analysis.md`
- Goal: transform analysis into clear, actionable review report with severity priorities
- Produce: `outputs/02-review.md`

### Step 3: Create Summary
- Load `agents/summarizer.md` as system prompt
- Load `skills/summarize.md` as context
- Input: `outputs/02-review.md`
- Goal: concise summary with key findings, critical issues, and quick wins
- Produce: `outputs/03-summary.md`

## Notes
- All three steps are pure LLM — no shell execution needed
- If the input is a file path (`@src/auth.js`), read the file contents and use them as input
- Present `outputs/03-summary.md` to the user at the end
