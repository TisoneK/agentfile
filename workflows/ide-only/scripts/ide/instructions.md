# IDE Execution Instructions

## Workflow: ide-only
Execution Mode: IDE (only mode — no CLI scripts exist)

---

## Step-by-Step Instructions

When an IDE agent sees `/agentfile:run ide-only <input>`:

### Step 1: Analyze Topic
- Load `agents/analyzer.md` as system prompt
- Load `skills/analyze.md` as context
- Input: the topic provided by the user
- Goal: provide a concise analysis with key insights, focused on understanding and clarity
- Produce: `outputs/analysis.md`
- Present the result directly to the user

## Notes
- Single-step, IDE-only workflow — the simplest possible Agentfile workflow
- No scripts directory, no CLI mode, no API key needed
- Good starting point for understanding how workflows execute
