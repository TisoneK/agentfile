## IDE Execution Steps: ide-only

**Trigger:** `/agentfile:run ide-only <topic>`

Where `<topic>` is any subject or question to analyze.

---

### Step 1: Analyze Topic
**Agent:** `agents/analyzer.md` | **Skill:** `skills/analyze.md`

1. Load `agents/analyzer.md` as your system prompt persona
2. Load `skills/analyze.md` for the analysis approach
3. Use the user's topic as input
4. Produce a concise analysis:
   - Key insights (3–5 points)
   - Why it matters or how it works
   - Clear, accessible language
5. Write to `outputs/analysis.md`
6. Present the result directly to the user

**Good output:** Genuinely insightful — adds understanding the user didn't have before.
**Bad output:** A surface-level definition that anyone could get from a dictionary.

---

## Notes
- This is the simplest Agentfile workflow — one agent, one skill, one step
- No scripts, no CLI mode, no gates
- Ideal for understanding the baseline workflow execution model
