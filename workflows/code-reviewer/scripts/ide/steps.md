## IDE Execution Steps: code-reviewer

**Trigger:** `/agentfile:run code-reviewer <input>`

Where `<input>` is either:
- A file path: `src/auth.js` or `@src/auth.js` → read and use the file contents
- A paste of raw code inline
- A description of what to review

---

### Step 1: Analyze Code
**Agent:** `agents/analyzer.md` | **Skill:** `skills/code-analysis.md`

1. If input is a file path, read the file contents first
2. Load `agents/analyzer.md` as your system prompt persona
3. Load `skills/code-analysis.md` for the analysis framework
4. Perform deep technical analysis covering:
   - Bugs and logic errors
   - Security vulnerabilities (injection, auth, secrets exposure)
   - Performance issues (N+1, memory leaks, blocking calls)
   - Code smells and maintainability concerns
5. Write structured findings to `outputs/01-analysis.md`

**Good output:** Detailed, specific, cites exact line numbers or patterns. Not vague.
**Bad output:** "There might be some security issues." → redo with specifics.

---

### Step 2: Write Review
**Agent:** `agents/reviewer.md` | **Skill:** `skills/write-review.md`

1. Load `agents/reviewer.md` as your system prompt persona
2. Load `skills/write-review.md` for the review format
3. Read `outputs/01-analysis.md` as input
4. Transform raw analysis into an actionable review:
   - Group by severity: 🚨 Critical / ⚠️ Important / 💡 Suggestion
   - For each issue: what it is, why it matters, how to fix it
   - Keep tone constructive, not critical
5. Write to `outputs/02-review.md`

**Good output:** Each issue has a clear fix, prioritized. A developer knows exactly what to do next.

---

### Step 3: Create Summary
**Agent:** `agents/summarizer.md` | **Skill:** `skills/summarize.md`

1. Load `agents/summarizer.md` as your system prompt persona
2. Load `skills/summarize.md` for the summary format
3. Read `outputs/02-review.md` as input
4. Distill into a quick-scannable summary:
   - Top 3 critical issues (if any)
   - Overall assessment (one line)
   - Prioritized action items list
5. Write to `outputs/03-summary.md`
6. Present `outputs/03-summary.md` to the user

**Target length:** Under 200 words. If it's longer, trim.

---

## Notes
- Never run `scripts/cli/` in IDE mode — those require `ANTHROPIC_API_KEY`
- If the file to review is large (>500 lines), tell the user and ask if they want to focus on a specific area
- Each step's output feeds the next — don't skip ahead
