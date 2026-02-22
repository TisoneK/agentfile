# Skill: Generate Skill

## Purpose
Teach the Generator how to write complete, reusable skill `.md` files that effectively instruct agents.

## Instructions

### Required Sections (in order)
1. `# Skill: <n>` — title
2. `## Purpose` — one sentence: what capability does this skill give an agent?
3. `## Instructions` — step-by-step instructions the agent should follow
4. `## Examples` — at least one concrete example (good vs bad, before vs after, etc.)

### What Makes a Good Skill

**Focused** — each skill teaches one thing. If it covers two things, split it.

**Actionable** — instructions should be steps the agent can follow, not abstract principles.

**Complete** — the agent should be able to do the task using only this skill + its agent file. No assumed knowledge.

**Transferable** — skills should be generic enough to be used in more than one workflow.

### Instruction Writing Tips
- Use numbered steps for sequential processes
- Use bullet points for checklists or options
- Use tables for comparisons (good vs bad, correct vs incorrect)
- Use code fences for any output format templates
- Anticipate common mistakes and address them explicitly

### Validation Checklist
- [ ] Purpose is one sentence
- [ ] Instructions are numbered steps, not vague advice
- [ ] At least one example is included
- [ ] The skill is focused on one capability
- [ ] No references to specific workflow names (keep it generic)
