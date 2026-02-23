## IDE Execution Steps: slash-demo

**Trigger:** `/agentfile:run slash-demo <topic>`

Where `<topic>` is any subject, text, or concept to summarize.

---

### Step 1: Summarize
**Agent:** `agents/summarizer.md` | **Skill:** `skills/summarize.md`

1. Load `agents/summarizer.md` as your system prompt persona
2. Load `skills/summarize.md` for the summary format
3. Use the user's topic/text as input
4. Produce a summary with:
   - 3–5 bullet points covering the key ideas
   - Under 150 words total
   - Clear, plain language — no jargon unless it was in the input
5. Write to `outputs/summary.md`
6. Present the summary directly to the user

**Good output:** A person who knows nothing about the topic walks away understanding the core ideas.
**Bad output:** A bullet list that just repeats phrases from the input without explaining them.

---

## Notes
- This is a single-step, IDE-only workflow — one pass, done
- No scripts to run at any point
- If the input is very long text, focus on the 3–5 most important ideas rather than trying to cover everything
