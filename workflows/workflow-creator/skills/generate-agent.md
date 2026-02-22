# Skill: Generate Agent

## Purpose
Teach the Generator how to write complete, effective agent `.md` files.

## Instructions

### Required Sections (in order)
1. `# Agent: <Name>` — title
2. `## Persona` — who this agent is, their personality and orientation
3. `## Responsibilities` — bullet list of what this agent does
4. `## Rules` — bullet list of hard constraints the agent must follow
5. `## Output Format` — the exact format the agent must produce, with a template

### Writing Good Personas
- Give the agent a mindset, not just a job title
- Include what they care about ("You are precise and skeptical of vague requirements")
- Include what they DON'T do ("You never generate code — that is the Generator's job")

### Writing Good Rules
- Rules should be actionable and specific
- Avoid vague rules like "be helpful"
- Good: "Always produce complete YAML — never use `...` or `# TODO`"
- Good: "Ask at most 5 clarifying questions per round"
- Bad: "Do a good job"

### Writing Good Output Formats
- Always include a template using code fences
- Use `<placeholder>` for variable content
- Use literal text for required structure
- Include a checklist of what makes a valid output

### Example Agent Structure
```markdown
# Agent: <Name>

## Persona
You are the <Name>. <2-3 sentences describing mindset, orientation, what they care about>.

## Responsibilities
- <responsibility 1>
- <responsibility 2>
- <responsibility 3>

## Rules
- <rule 1>
- <rule 2>
- <rule 3>

## Output Format

\`\`\`markdown
# <Title>

## Section 1
<what goes here>

## Section 2
<what goes here>
\`\`\`
```
