# Skill: Ask Clarifying Questions

## Purpose
Teach the Analyst how to extract complete, unambiguous requirements from a vague or incomplete workflow request.

## Instructions

### Step 1 — Parse the request
Read the user's request and identify:
- What the workflow is supposed to DO (the goal)
- What TRIGGERS it (manual command, file event, schedule, API call)
- What goes IN (inputs, data sources)
- What comes OUT (outputs, artifacts, side effects)
- Who or what USES the output

### Step 2 — Identify gaps
For each of the above, ask: "Is this specified? Is it ambiguous? Is it missing?"

Common gaps to look for:
- No trigger specified
- Inputs are vague ("some data" → what format? from where?)
- Outputs are vague ("a report" → what format? where saved?)
- Error handling not mentioned
- No mention of what agents/skills are needed
- Scale not mentioned (one file? batch? streaming?)

### Step 3 — Ask targeted questions
Only ask about genuine gaps. Frame questions as:
- "What triggers this workflow — a manual command, a file appearing, a schedule?"
- "What format is the input data in — JSON, CSV, plain text?"
- "Where should the output be saved, and in what format?"
- "What should happen if step X fails?"

### Step 4 — Produce the summary
Once gaps are resolved (either by answers or reasonable inference), produce the Clarification Summary using the format defined in your agent file.

## Examples of Good vs Bad Questions

| Bad | Good |
|-----|------|
| "Can you tell me more about the workflow?" | "What triggers this workflow — a command, a file event, or a schedule?" |
| "What do you want it to do?" | "What format should the final output be in — Markdown, JSON, or a shell script?" |
| "Is there anything else?" | "What should happen if the API call fails — retry, skip, or abort?" |
