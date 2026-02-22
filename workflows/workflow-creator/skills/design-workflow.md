# Skill: Design Workflow

## Purpose
Teach the Architect how to translate a clarification summary into a complete, implementable workflow design.

## Instructions

### Step 1 — Derive the workflow name
- Use the workflow's purpose to create a slug: lowercase, hyphenated, descriptive
- Examples: `invoice-processor`, `code-reviewer`, `daily-report-generator`

### Step 2 — Define the steps
- Each step should do ONE thing
- Steps should be ordered so each builds on the previous
- Every step needs: id, name, agent, skill, input, produces
- Steps that write files to disk should use `action: shell`
- Steps that need human review should have `gate: human-approval`

### Step 3 — Define agents
For each distinct role in the workflow, define an agent:
- Give it a clear single responsibility
- Name it by role, not by task (Analyst, not "QuestionAsker")
- Agents can be reused across steps if the role fits

### Step 4 — Define skills
Skills are reusable instruction sets. Define a skill for:
- Any non-obvious technique an agent needs to do its job
- Any structured output format an agent must follow
- Any multi-step reasoning process

### Step 5 — Define scripts
At minimum, every workflow needs:
- `run.sh` — full orchestration in Bash
- `run.ps1` — full orchestration in PowerShell

Additional scripts for: file registration, cleanup, validation.

### Step 6 — Build the file manifest
List every file that will be generated, with its path relative to the workflow root.

## Design Principles
- Prefer more smaller steps over fewer large steps
- Each agent should be replaceable (clear input/output contract)
- Skills should be generic enough to reuse across workflows
- Scripts should be readable — prioritize clarity over cleverness
- Always include error handling in the design
