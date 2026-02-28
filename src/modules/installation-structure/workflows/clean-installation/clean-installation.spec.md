# Workflow Specification: clean-installation

**Module:** installation-structure
**Status:** Placeholder — To be created via create-workflow workflow
**Created:** 2026-02-24T19-25-00

---

## Workflow Overview

**Goal:** Install agentfile with .agentfile/ directory structure for zero-clutter project organization

**Description:** Sets up agentfile using invisible .agentfile/ directory organization that maintains project purity while providing full functionality

**Workflow Type:** Create-only (steps-c/)

---

## Workflow Structure

### Entry Point

```yaml
---
name: clean-installation
description: Install agentfile with .agentfile/ directory structure
web_bundle: true
installed_path: '{project-root}/_bmad/installation-structure/workflows/clean-installation'
---
```

### Mode

- [x] Create-only (steps-c/)
- [ ] Tri-modal (steps-c/, steps-e/, steps-v/)

---

## Planned Steps

| Step | Name | Goal |
|------|------|------|
| 1 | Initialize Clean Setup | Create .agentfile/ directory structure |
| 2 | Configure Installation | Set up module.yaml and preferences |
| 3 | Install Core Files | Copy agentfile files to .agentfile/ directory |
| 4 | Validate Structure | Verify clean installation follows standards |
| 5 | Create Status Command | Set up agentfile status reporting |

---

## Workflow Inputs

### Required Inputs

- Project root directory
- Installation preferences (from module.yaml)

### Optional Inputs

- Custom configuration settings
- Template integration preferences

---

## Workflow Outputs

### Output Format

- [x] Document-producing
- [ ] Non-document

### Output Files

- .agentfile/ directory structure
- Installation log
- Configuration files
- Status report

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
- Clean directory structure creation
- Configuration management integration
- Validation and reporting steps
- Error handling for installation failures

---

_Spec created on 2026-02-24T19-25-00 via BMAD Module workflow_
