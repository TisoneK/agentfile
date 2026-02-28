---
name: 'step-04-validate'
description: 'Validate structure - verify clean installation follows standards'
nextStepFile: './step-05-complete.md'
---

# Step 4: Validate Structure

## STEP GOAL

Verify the clean installation follows BMAD best practices and standards.

## MANDATORY EXECUTION RULES

1. **Check directory structure** - Verify all required folders exist
2. **Validate configuration** - Ensure config files are valid
3. **Verify files** - Confirm all required files are present

## EXECUTION PROTOCOLS

### 1. Directory Structure Check

Verify:
- `.agentfile/` root exists
- `.agentfile/agents/` exists
- `.agentfile/workflows/` exists
- `.agentfile/skills/` exists
- `.agentfile/config/` exists
- `.agentfile/memory/` exists

### 2. Configuration Validation

Check:
- `module.yaml` is valid YAML
- `user-preferences.yaml` is valid YAML
- All required settings are present

### 3. File Verification

Confirm core files are present:
- Agent definitions
- Workflow definitions
- Framework files

## OUTPUT

Validation report with pass/fail for each check.

## MENU OPTIONS

**[C] Continue** - Proceed to completion step

---

_Next: Step 5 - Completion_
