# IDE-Only Workflow

A minimal workflow designed specifically for IDE environments that demonstrates Agentfile's core concepts without requiring CLI scripts.

## Purpose
This workflow showcases how to create IDE-only workflows that run entirely within the IDE agent's LLM capabilities, without any external script dependencies.

## Structure
- **1 Agent**: analyzer.md
- **1 Skill**: analyze.md
- **1 Step**: analyze

## Usage

### IDE Execution (Only Mode)
```
/agentfile-run:ide-only
Input: Your text to analyze
```

**IDE Processing Instructions:**
1. This workflow defaults to IDE mode (no execution.preferred field)
2. Load agent from `agents/analyzer.md` as system prompt
3. Load skill from `skills/analyze.md` as context
4. Execute step sequentially using your LLM
5. **NEVER** execute scripts - this workflow has no scripts directory
6. Process input directly as text

### CLI Execution
Not supported - this is an IDE-only workflow.

## Input
Any text content you want to analyze.

## Output
Direct response from the agent with analysis results.

## Example
Input: "The quick brown fox jumps over the lazy dog."
Output: Linguistic analysis of the sentence structure, word patterns, and semantic content.

## Key Features
- **IDE-Only**: No script dependencies, runs entirely in IDE
- **Minimal**: Simple structure for easy understanding
- **Educational**: Demonstrates core Agentfile concepts
- **Portable**: Works across any IDE that supports Agentfile
