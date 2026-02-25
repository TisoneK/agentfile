---
name: 'step-01-backup'
description: 'Pre-migration backup - create complete backup of existing installation'
nextStepFile: './step-02-prepare.md'
---

# Step 1: Pre-Migration Backup

## STEP GOAL

Create a complete backup of the existing v0.1.0 installation before migration.

## MANDATORY EXECUTION RULES

1. **Create backup** - Copy all files to backup location
2. **Verify backup** - Ensure backup is complete
3. **Document manifest** - List all backed up files

## EXECUTION PROTOCOLS

### 1. Create Backup

Copy to backup location:
- All agentfile files
- Configuration files
- Customizations
- Memory/data files

### 2. Verify Backup

Confirm:
- All files copied
- No errors during backup
- Backup size matches source

### 3. Document Manifest

Create backup manifest:
- List all backed up files
- Record file hashes
- Note backup location

## OUTPUT

Backup manifest and confirmation.

## MENU OPTIONS

**[C] Continue** - Proceed to migration preparation

---

_Next: Step 2 - Migration Preparation_
