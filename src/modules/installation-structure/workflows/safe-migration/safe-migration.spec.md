# Workflow Specification: safe-migration

**Module:** installation-structure
**Status:** Placeholder — To be created via create-workflow workflow
**Created:** 2026-02-24T19-25-00

---

## Workflow Overview

**Goal:** Execute migration from v0.1.0 to new clean structure with safety checks

**Description:** Performs step-by-step migration with backup creation, validation, and rollback capabilities

**Workflow Type:** Create-only (steps-c/)

---

## Workflow Structure

### Entry Point

```yaml
---
name: safe-migration
description: Execute migration from v0.1.0 to new structure
web_bundle: true
installed_path: '{project-root}/_bmad/installation-structure/workflows/safe-migration'
---
```

### Mode

- [x] Create-only (steps-c/)
- [ ] Tri-modal (steps-c/, steps-e/, steps-v/)

---

## Planned Steps

| Step | Name | Goal |
|------|------|------|
| 1 | Pre-Migration Backup | Create complete backup of existing installation |
| 2 | Migration Preparation | Set up target .agentfile/ structure |
| 3 | File Migration | Move files to new structure |
| 4 | Configuration Update | Update configurations for new structure |
| 5 | Validation | Verify migration success and functionality |
| 6 | Cleanup | Remove old files after successful validation |

---

## Workflow Inputs

### Required Inputs

- Migration analysis report
- User confirmation for migration

### Optional Inputs

- Custom migration timing
- Specific backup location

---

## Workflow Outputs

### Output Format

- [x] Document-producing
- [ ] Non-document

### Output Files

- Migration execution log
- Backup manifest
- Validation report
- Rollback instructions

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
- Backup creation utilities
- File migration logic
- Validation framework
- Rollback system integration

---

_Spec created on 2026-02-24T19-25-00 via BMAD Module workflow_
