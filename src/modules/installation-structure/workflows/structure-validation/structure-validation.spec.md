# Workflow Specification: structure-validation

**Module:** installation-structure
**Status:** Placeholder — To be created via create-workflow workflow
**Created:** 2026-02-24T19-25-00

---

## Workflow Overview

**Goal:** Verify agentfile installation follows best practices and standards

**Description:** Validates installation structure, checks for compliance, and generates validation reports

**Workflow Type:** Create-only (steps-c/)

---

## Workflow Structure

### Entry Point

```yaml
---
name: structure-validation
description: Verify agentfile installation follows best practices
web_bundle: true
installed_path: '{project-root}/_bmad/installation-structure/workflows/structure-validation'
---
```

### Mode

- [x] Create-only (steps-c/)
- [ ] Tri-modal (steps-c/, steps-e/, steps-v/)

---

## Planned Steps

| Step | Name | Goal |
|------|------|------|
| 1 | Scan Installation | Analyze current agentfile structure |
| 2 | Check Standards Compliance | Verify against installation standards |
| 3 | Validate Configuration | Check module.yaml and settings |
| 4 | Test Functionality | Verify agentfile operations work correctly |
| 5 | Generate Report | Create detailed validation report |

---

## Workflow Inputs

### Required Inputs

- Installation directory path
- Validation criteria

### Optional Inputs

- Custom validation rules
- Reporting preferences

---

## Workflow Outputs

### Output Format

- [x] Document-producing
- [ ] Non-document

### Output Files

- Validation report
- Compliance checklist
- Recommendations for fixes
- Status badge (if valid)

---

## Agent Integration

### Primary Agent

Both Alex and Sam (shared workflow)

### Other Agents

None

---

## Implementation Notes

**Use the create-workflow workflow to build this workflow.**

Inputs needed:
- Structure analysis utilities
- Compliance checking framework
- Functionality testing
- Report generation templates

---

_Spec created on 2026-02-24T19-25-00 via BMAD Module workflow_
