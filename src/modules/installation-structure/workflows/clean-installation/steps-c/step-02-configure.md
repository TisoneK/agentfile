---
name: 'step-02-configure'
description: 'Configure installation - set up module.yaml and preferences'
nextStepFile: './step-03-install.md'
---

# Step 2: Configure Installation

## STEP GOAL

Set up module.yaml and user preferences for the clean installation.

## MANDATORY EXECUTION RULES

1. **Load module config** - Read installation-structure module.yaml
2. **Set preferences** - Apply user configuration choices
3. **Create config files** - Generate necessary configuration

## EXECUTION PROTOCOLS

### 1. Load Module Configuration

Read module.yaml from installation-structure to get default settings.

### 2. User Preferences

Ask user for preferences:
- Installation structure preference (clean vs traditional)
- Auto-validation preference
- Backup preferences

### 3. Create Configuration Files

Generate:
- `.agentfile/config/module.yaml`
- `.agentfile/config/user-preferences.yaml`

## OUTPUT

Configuration files created in .agentfile/config/

## MENU OPTIONS

**[C] Continue** - Proceed to install core files step

---

_Next: Step 3 - Install Core Files_
