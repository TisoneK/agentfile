# Workflow Specification: migration-report

**Module:** installation-structure
**Status:** Placeholder — To be created via create-workflow workflow
**Created:** 2026-02-24T19-25-00

---

## Workflow Overview

**Goal:** Generate detailed migration documentation and reports

**Description:** Creates comprehensive documentation of migration process, outcomes, and recommendations

**Workflow Type:** Create-only (steps-c/)

---

## Workflow Structure

### Entry Point

```yaml
---
name: migration-report
description: Generate detailed migration documentation
web_bundle: true
installed_path: '{project-root}/_bmad/installation-structure/workflows/migration-report'
---
```

### Mode

- [x] Create-only (steps-c/)
- [ ] Tri-modal (steps-c/, steps-e/, steps-v/)

---

## Planned Steps

| Step | Name | Goal |
|------|------|------|
| 1 | Collect Migration Data | Gather migration logs and metrics |
| 2 | Analyze Outcomes | Evaluate migration success and issues |
| 3 | Document Changes | Record all modifications made |
| 4 | Create Summary Report | Generate executive summary |
| 5 | Archive Documentation | Store reports for future reference |

---

## Workflow Inputs

### Required Inputs

- Migration execution logs
- Before/after state comparison

### Optional Inputs

- User feedback and observations
- Performance metrics

---

## Workflow Outputs

### Output Format

- [x] Document-producing
- [ ] Non-document

### Output Files

- Migration summary report
- Detailed change log
- Lessons learned document
- Archive package

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
- Log analysis utilities
- Report generation templates
- Documentation formatting
- Archive creation tools

---

_Spec created on 2026-02-24T19-25-00 via BMAD Module workflow_
