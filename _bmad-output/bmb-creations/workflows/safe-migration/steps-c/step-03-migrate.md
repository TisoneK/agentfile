---
name: 'step-03-migrate'
description: 'File migration - move files to new structure'
nextStepFile: './step-04-config.md'
---

# Step 3: File Migration

## STEP GOAL

Move files from v0.1.0 structure to new .agentfile/ structure.

## MANDATORY EXECUTION RULES

1. **Migrate agents** - Copy agent files to new location
2. **Migrate workflows** - Move workflow definitions
3. **Migrate data** - Transfer customizations and data

## EXECUTION PROTOCOLS

### 1. Migrate Agents

Copy from:
- Old agent locations

To:
- `.agentfile/agents/`

### 2. Migrate Workflows

Copy from:
- Old workflow locations

To:
- `.agentfile/workflows/`

### 3. Migrate Data

Transfer:
- Customizations
- Memory files
- Configuration overrides

## OUTPUT

Files migrated to new structure.

## MENU OPTIONS

**[C] Continue** - Proceed to configuration update

---

_Next: Step 4 - Configuration Update_
