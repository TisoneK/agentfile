# IDE Execution Instructions

## Workflow: slash-demo
Execution Mode: IDE

## ⚠️ Execution Mode Warning

This is an IDE-only workflow. There are no valid CLI scripts to run — `scripts/cli/run.ps1` is a legacy stub and should not be executed.

---

## Step-by-Step Instructions

When an IDE agent sees `/agentfile:run slash-demo <input>`:

### Step 1: Summarize
- Load `agents/summarizer.md` as system prompt
- Load `skills/summarize.md` as context
- Input: the topic or text provided by the user
- Goal: create a concise summary with 3–5 key points, under 150 words, with clear bullet points
- Produce: `outputs/summary.md`

## Notes
- Single-step workflow — fast and simple
- No shell execution needed at any point
