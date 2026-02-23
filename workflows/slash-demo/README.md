# Slash Demo Workflow

A demonstration workflow that shows how slash commands work in IDE environments.

## Purpose
This workflow demonstrates the slash command processing workflow and serves as a test case for IDE integration.

## Structure
- **1 Agent**: summarizer.md
- **1 Skill**: summarize.md
- **1 Step**: summarize

## Usage

### IDE Execution
```
/agentfile:run slash-demo Text to summarize
```

**IDE Processing Instructions:**
1. This workflow defaults to IDE mode (no execution.preferred field)
2. Load agent from `agents/summarizer.md` as system prompt
3. Load skill from `skills/summarize.md` as context
4. Execute step sequentially using your LLM
5. **NEVER** execute scripts - this is IDE-only workflow
6. Process input directly as text

### CLI Execution
```bash
agentfile run slash-demo --input "Text to summarize"
```

## Input
Any text content you want to summarize.

## Output
- `outputs/summary.md`: Concise summary of the input text

## Example
Input: "Agentfile is a workflow orchestration system that enables AI agents to execute complex, multi-step tasks with defined roles, skills, and coordination patterns."
Output: Brief summary highlighting the key concepts of workflow orchestration and AI agent coordination.

## Key Features
- **Slash Command Demo**: Shows how IDE slash commands work
- **Simple Structure**: Minimal workflow for easy testing
- **Cross-Platform**: Works in both IDE and CLI environments
- **Educational**: Demonstrates Agentfile slash command processing
