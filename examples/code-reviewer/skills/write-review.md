# Skill: Write Review

## Purpose
Teach the Reviewer how to turn a raw code analysis into a clear, actionable, developer-friendly review report.

## Instructions

### Step 1 — Triage the issues
Read the full analysis and sort issues by impact:
- Critical first (blocks merge / causes bugs)
- Major second (should fix before merge)
- Minor last (nice to have)

### Step 2 — Write concrete recommendations
For every issue, answer: "What exactly should the developer do?"
- Bad: "Fix the error handling"
- Good: "Wrap the `fetchUser()` call in a try/catch and return a 404 response if the user is not found"

### Step 3 — Find what's working
Always identify at least one thing the code does well. This makes the review feel balanced and builds trust with the author.

### Step 4 — Write the overall assessment
2-3 sentences that honestly summarize:
- What the code is doing
- The biggest concern
- The general quality level

### Step 5 — End with a clear priority
Tell the developer what to focus on first. One sentence.

## Tone Guidelines

| Avoid | Prefer |
|-------|--------|
| "This is wrong" | "This will cause X when Y happens" |
| "You should know better" | "A common pattern here is..." |
| "Obviously this is a bug" | "This looks like it may be unintentional" |
| Vague: "Clean this up" | Specific: "Extract lines 40-55 into a `validateInput()` function" |
