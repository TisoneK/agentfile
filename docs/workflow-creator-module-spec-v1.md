# Spec: Workflow Creator BMAD Module for Agentfile

**Author:** Tisone
**Date:** 2026-02-27
**Status:** working

---

## Overview

Refactor the existing `workflows/workflow-creator/` into a formal BMAD module that generates complete Agentfile-compliant workflow packages from natural language descriptions. The module follows the slash command protocol and supports both IDE and CLI execution modes.

---

## Module Location

```
src/modules/workflow-creator/
```

---

## Problem Being Solved

The current `workflow-creator` is an ad-hoc implementation. This refactor formalizes it into a proper BMAD module with defined agents, clear responsibilities, and a structured pipeline — making it maintainable, extensible, and consistent with the rest of the Agentfile framework.

---

## Core Functionality

### 1. Natural Language Processing
Parse user requests to understand what kind of workflow they want to build — infer steps, agents, skills, and structure from plain English descriptions.

### 2. Agentfile Workflow Generation
Generate complete workflow packages including:
- `workflow.yaml` — declarative workflow definition
- Agent definitions — markdown persona + rules files
- Skill definitions — reusable logic markdown files
- JavaScript scripts — using js-utils library for cross-platform compatibility

### 3. Slash Command Protocol
All generated workflows comply with:
- `/agentfile:run <workflow-name>`
- `/agentfile:create <workflow-name>`
- `/agentfile:continue` — resume interrupted workflow creation

### 4. IDE & CLI Dual Support
Every generated workflow supports both execution modes:
- **IDE mode** — AI agent executes workflow steps directly following workflow.yaml
- **CLI mode** — JavaScript script using js-utils library for command-line execution

### 5. Factory-to-Shipped Pipeline
```
artifacts/<workflow-name>/<run-id>/    ← staging (work in progress)
        ↓  promote
.<ide-name>/workflows/agentfile/<workflow-name>/  ← shipped (ready to use)
```

### 6. Resume Capability
If workflow creation is interrupted, the user can run `/agentfile:continue` to pick up from the last completed step using the staged artifacts in `artifacts/`.

---

## Key Components (Agents)

### 1. Workflow Analyst Agent
- **Responsibility:** Analyze user's natural language request, ask clarifying questions, define scope and requirements for the workflow
- **Input:** User description
- **Output:** Structured requirements doc

### 2. Agentfile Architect Agent
- **Responsibility:** Design the workflow structure — define steps, agents needed, skills needed, execution order, and dependencies
- **Input:** Requirements doc from Analyst
- **Output:** Workflow design blueprint

### 3. Generator Agent
- **Responsibility:** Generate all workflow files — `workflow.yaml`, agent files, skill files, JavaScript scripts using js-utils library
- **Input:** Blueprint from Architect
- **Output:** Complete staged package in `artifacts/<workflow-name>/<run-id>/`

### 4. Validation Agent
- **Responsibility:** Review generated files for Agentfile compliance — correct YAML schema, valid agent/skill structure, working slash command references
- **Input:** Staged package from Generator
- **Output:** Validation report + approved package ready for promotion

### 5. Installation Agent
- **Responsibility:** Promote validated package from `artifacts/` to `.<ide-name>/workflows/agentfile/` for all installed IDEs, handle any configuration, register with IDE if needed
- **Input:** Approved package from Validator
- **Output:** Installed workflow in `.<ide-name>/workflows/agentfile/<workflow-name>/`

---

## Pipeline Flow

```
User: /agentfile:create my-workflow "Description of what I want"
          ↓
  Workflow Analyst Agent
  → Clarifies requirements
          ↓
  Agentfile Architect Agent
  → Designs structure
          ↓
  Generator Agent
  → Creates files in artifacts/<workflow-name>/<run-id>/
          ↓
  Validation Agent
  → Reviews for compliance
          ↓
  Installation Agent
  → Promotes to .<ide-name>/workflows/agentfile/<workflow-name>/ (for all IDEs)
          ↓
  Done — workflow available via /agentfile:run my-workflow
```

If interrupted at any step:
```
User: /agentfile:continue
  → Resumes from last completed step using staged artifacts
```

---

## Output Structure

```
artifacts/
  <workflow-name>/
    <run-id>/
      workflow.yaml
      workflow-agents/           # renamed to avoid .agentfile/ conflict
      workflow-skills/           # renamed to avoid .agentfile/ conflict
      scripts/
        run.js                    # JavaScript using js-utils library

.<ide-name>/workflows/agentfile/
  <workflow-name>/           ← promoted after validation
    workflow.yaml
    workflow-agents/         # consistent naming to avoid project conflicts
    workflow-skills/         # consistent naming to avoid project conflicts
    scripts/
      run.js                    # JavaScript using js-utils library
```

**IDE-Specific Locations:**
- `.windsurf/workflows/agentfile/<workflow-name>/`
- `.cursor/workflows/agentfile/<workflow-name>/`
- `.kilocode/workflows/agentfile/<workflow-name>/`
- `.github-copilot/workflows/agentfile/<workflow-name>/`
- `.cline/workflows/agentfile/<workflow-name>/`

---

## Target Users

- Agentfile framework developers extending the system
- Teams creating standardized workflow packages
- Organizations building internal workflow libraries
- Individual developers needing custom workflow automation

---

## Integration Points

| Integration | Notes |
|---|---|
| Agentfile Core | Always available — slash commands, file ops |
| Existing modules | Can reference and extend existing agents/skills |
| Project templates | Can use existing templates as starting point |
| Migration utilities | Can convert existing ad-hoc workflows into proper packages |

---

## What Changes vs Current Implementation

| Aspect | Current | After Refactor |
|---|---|---|
| Location | `workflows/workflow-creator/` | `src/modules/workflow-creator/` |
| Structure | Ad-hoc | Formal BMAD module with defined agents |
| Agents | Loosely defined | 5 agents with clear responsibilities |
| Resume | Partial | Full `/agentfile:continue` support |
| Validation | Manual | Dedicated Validation Agent |
| Installation | Manual promotion | Automated Installation Agent |
| Output Location | `workflows/` (clutters project) | `.<ide-name>/workflows/agentfile/` (IDE-native) |
| Folder Naming | `agents/`, `skills/` | `workflow-agents/`, `workflow-skills/` (no conflicts) |
| Namespace | Mixed with user workflows | Clean `agentfile/` namespace separation |

---

## Dependencies

- Agentfile Core (Epic 7 + Epic 1 must be complete first)
- `src/js-utils/` library — JavaScript utilities for cross-platform workflow execution
- `schema/workflow.schema.json` — for validation
- `.agentfile/` directory — source of truth for commands

---

## Out of Scope (v1)

- AI-assisted step generation beyond what's described
- Workflow marketplace / publishing
- Multi-language runners
- Cloud execution
