# Workflow Specification: rollback-system

**Module:** installation-structure
**Status:** Placeholder — To be created via create-workflow workflow
**Created:** 2026-02-24T19-25-00

---

## Workflow Overview

**Goal:** Restore project state if migration fails or issues arise

**Description:** Provides emergency restore capabilities to revert changes and recover previous installation state

**Workflow Type:** Create-only (steps-c/)

---

## Workflow Structure

### Entry Point

```yaml
---
name: rollback-system
description: Restore project state if migration fails
web_bundle: true
installed_path: '{project-root}/_bmad/installation-structure/workflows/rollback-system'
---
```

### Mode

- [x] Create-only (steps-c/)
- [ ] Tri-modal (steps-c/, steps-e/, steps-v/)

---

## Planned Steps

| Step | Name | Goal |
|------|------|------|
| 1 | Detect Rollback Need | Identify failure conditions or user rollback request |
| 2 | Validate Backup | Verify backup integrity and availability |
| 3 | Rollback Execution | Restore files from backup |
| 4 | Configuration Restore | Revert configuration changes |
| 5 | Validation | Verify rollback success |
| 6 | Cleanup | Remove failed migration artifacts |

---

## Workflow Inputs

### Required Inputs

- Backup manifest
- Rollback trigger (failure or user request)

### Optional Inputs

- Specific rollback point
- Selective restore options

---

## Workflow Outputs

### Output Format

- [x] Document-producing
- [ ] Non-document

### Output Files

- Rollback execution log
- Restoration report
- Status verification
- Post-rollback documentation

---

## Agent Integration

### Primary Agent

Sam (Migration Specialist)

### Other Agents

None

---

## Implementation Notes

**Use the create-workflow workflow to build this workflow.**

Inputs needed:
- Backup restoration utilities
- File system rollback logic
- Validation framework
- Error handling and recovery

---

_Spec created on 2026-02-24T19-25-00 via BMAD Module workflow_
