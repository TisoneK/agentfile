# Workflow Specification: migration-analysis

**Module:** installation-structure
**Status:** Placeholder — To be created via create-workflow workflow
**Created:** 2026-02-24T19-25-00

---

## Workflow Overview

**Goal:** Analyze existing v0.1.0 installations for migration readiness and create migration plan

**Description:** Examines current agentfile installations, identifies migration requirements, and generates detailed migration strategy

**Workflow Type:** Create-only (steps-c/)

---

## Workflow Structure

### Entry Point

```yaml
---
name: migration-analysis
description: Analyze existing v0.1.0 installations for migration
web_bundle: true
installed_path: '{project-root}/_bmad/installation-structure/workflows/migration-analysis'
---
```

### Mode

- [x] Create-only (steps-c/)
- [ ] Tri-modal (steps-c/, steps-e/, steps-v/)

---

## Planned Steps

| Step | Name | Goal |
|------|------|------|
| 1 | Scan Installation | Detect existing agentfile files and structure |
| 2 | Analyze Dependencies | Identify tools, workflows, and customizations |
| 3 | Assess Migration Complexity | Evaluate migration difficulty and risks |
| 4 | Create Migration Plan | Generate step-by-step migration strategy |
| 5 | Backup Strategy | Design backup and rollback procedures |

---

## Workflow Inputs

### Required Inputs

- Existing installation directory
- Current agentfile version

### Optional Inputs

- Custom configuration files
- User preferences for migration timing

---

## Workflow Outputs

### Output Format

- [x] Document-producing
- [ ] Non-document

### Output Files

- Migration analysis report
- Migration plan document
- Risk assessment
- Backup strategy document

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
- File system scanning capabilities
- Dependency analysis logic
- Risk assessment framework
- Report generation templates

---

_Spec created on 2026-02-24T19-25-00 via BMAD Module workflow_
