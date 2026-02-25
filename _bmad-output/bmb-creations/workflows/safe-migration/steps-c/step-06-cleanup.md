---
name: 'step-06-cleanup'
description: 'Cleanup - remove old files after successful validation'
---

# Step 6: Cleanup

## STEP GOAL

Remove old v0.1.0 files after successful migration validation.

## MANDATORY EXECUTION RULES

1. **Confirm validation** - Ensure migration passed
2. **Remove old files** - Delete v0.1.0 files
3. **Document completion** - Record migration success

## EXECUTION PROTOCOLS

### 1. Confirm Validation

Verify:
- Validation passed
- No issues remaining
- User confirms cleanup

### 2. Remove Old Files

Delete:
- Old agentfile files (not in .agentfile/)
- Old configuration files
- Legacy directories

### 3. Document Completion

Record:
- Migration complete
- Backup location
- Rollback instructions (keep!)

## OUTPUT

Migration complete, old files removed.

---

## 🎉 Safe Migration Complete!

**Summary:**
- Pre-migration backup created
- Target structure prepared
- Files migrated to .agentfile/
- Configurations updated
- Validation passed
- Old files cleaned up

**Your project now uses the clean .agentfile/ structure!**

**Backup Location:** `{backup-path}`
**Rollback Instructions:** Keep the backup - use rollback-system workflow if needed

**Safety First, Progress Always!**
