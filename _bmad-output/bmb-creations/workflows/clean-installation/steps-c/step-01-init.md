---
name: 'step-01-init'
description: 'Initialize clean setup - create .agentfile/ directory structure'
nextStepFile: './step-02-configure.md'
---

# Step 1: Initialize Clean Setup

## STEP GOAL

Create the .agentfile/ directory structure for zero-clutter project organization.

## MANDATORY EXECUTION RULES

1. **Determine project root** - Where should .agentfile/ be created?
2. **Create directory structure** - Set up the clean installation folders
3. **Verify creation** - Confirm directories were created successfully

## EXECUTION PROTOCOLS

### 1. Determine Project Root

Ask user: "Where should I install agentfile? (Enter project path or press Enter for current directory)"

### 2. Create Directory Structure

Create the following directories:
- `.agentfile/` (root directory)
- `.agentfile/agents/`
- `.agentfile/workflows/`
- `.agentfile/skills/`
- `.agentfile/config/`
- `.agentfile/memory/`

### 3. Verify Creation

Confirm each directory was created successfully.

## OUTPUT

Record created directories to installation log.

## MENU OPTIONS

**[C] Continue** - Proceed to configuration step

---

_Next: Step 2 - Configure Installation_
