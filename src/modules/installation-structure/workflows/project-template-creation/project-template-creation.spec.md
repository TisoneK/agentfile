# Workflow Specification: project-template-creation

**Module:** installation-structure
**Status:** Placeholder — To be created via create-workflow workflow
**Created:** 2026-02-24T19-25-00

---

## Workflow Overview

**Goal:** Create reusable project templates with agentfile integration

**Description:** Generates project templates that include clean agentfile installation for consistent project setup

**Workflow Type:** Create-only (steps-c/)

---

## Workflow Structure

### Entry Point

```yaml
---
name: project-template-creation
description: Create reusable project templates with agentfile
web_bundle: true
installed_path: '{project-root}/_bmad/installation-structure/workflows/project-template-creation'
---
```

### Mode

- [x] Create-only (steps-c/)
- [ ] Tri-modal (steps-c/, steps-e/, steps-v/)

---

## Planned Steps

| Step | Name | Goal |
|------|------|------|
| 1 | Template Configuration | Define template structure and options |
| 2 | Agentfile Integration | Add clean agentfile setup to template |
| 3 | Customization Options | Configure template variables and settings |
| 4 | Validation | Test template generation and installation |
| 5 | Package Template | Create distributable template package |

---

## Workflow Inputs

### Required Inputs

- Template type and structure
- Target project frameworks

### Optional Inputs

- Custom configuration presets
- Integration preferences

---

## Workflow Outputs

### Output Format

- [x] Document-producing
- [ ] Non-document

### Output Files

- Project template files
- Installation scripts
- Configuration documentation
- Template usage guide

---

## Agent Integration

### Primary Agent

Alex (Setup Specialist)

### Other Agents

None

---

## Implementation Notes

**Use the create-workflow workflow to build this workflow.**

Inputs needed:
- Template generation framework
- Project structure analysis
- Configuration management integration
- Package creation utilities

---

_Spec created on 2026-02-24T19-25-00 via BMAD Module workflow_
