---
name: 'step-03-install'
description: 'Install core files - copy agentfile files to .agentfile/ directory'
nextStepFile: './step-04-validate.md'
---

# Step 3: Install Core Files

## STEP GOAL

Copy agentfile core files to the .agentfile/ directory.

## MANDATORY EXECUTION RULES

1. **Identify source files** - Determine what core files to install
2. **Copy files** - Transfer files to .agentfile/ directory
3. **Verify installation** - Confirm files were copied correctly

## EXECUTION PROTOCOLS

### 1. Identify Source Files

Determine which core files to install:
- BMAD framework files
- Module-specific files (from installation-structure)
- Agent definitions (Alex, Sam)

### 2. Copy Files

Copy to appropriate subdirectories:
- `.agentfile/agents/` - Agent definitions
- `.agentfile/workflows/` - Workflow definitions
- `.agentfile/skills/` - Skill definitions

### 3. Verify Installation

List copied files and confirm success.

## OUTPUT

Core files installed in .agentfile/ directory structure.

## MENU OPTIONS

**[C] Continue** - Proceed to validate structure step

---

_Next: Step 4 - Validate Structure_
