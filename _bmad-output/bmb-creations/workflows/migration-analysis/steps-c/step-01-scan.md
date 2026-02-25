---
name: 'step-01-scan'
description: 'Scan installation - detect existing agentfile files and structure'
nextStepFile: './step-02-dependencies.md'
---

# Step 1: Scan Installation

## STEP GOAL

Detect existing agentfile files and structure in the v0.1.0 installation.

## MANDATORY EXECUTION RULES

1. **Locate installation** - Find the v0.1.0 installation directory
2. **Scan files** - Detect all agentfile-related files
3. **Document structure** - Record the current directory layout

## EXECUTION PROTOCOLS

### 1. Locate Installation

Ask user: "Where is your v0.1.0 installation located?"

### 2. Scan Files

Detect:
- Agent definitions
- Workflow files
- Configuration files
- Customizations
- Memory/data files

### 3. Document Structure

Create a map of the current installation structure.

## OUTPUT

Installation scan report with file inventory.

## MENU OPTIONS

**[C] Continue** - Proceed to analyze dependencies

---

_Next: Step 2 - Analyze Dependencies_
