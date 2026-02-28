---
stepsCompleted: [1, 2, 3, 4, 5, 6, 7, 8]
inputDocuments:
  - _bmad-output/planning-artifacts/prd.md
  - docs/agentfile-init-spec-v1.md
workflowType: 'architecture'
project_name: 'agentfile'
user_name: 'Tisone'
date: '2026-02-27T08:35:00Z'
status: 'complete'
---

# Architecture Decision Document - agentfile init & IDE Setup

_This document defines the architecture for the `agentfile init` command and IDE slash command integration system._

## Project Context

**Focus:** Architecture for `agentfile init` command and IDE slash command setup system

**Key Components:**
- CLI interactive wizard for IDE selection
- `.agentfile/` source of truth directory
- IDE-specific wrapper generators (Windsurf, Cursor, KiloCode, GitHub Copilot, Cline)
- Template system for IDE configurations
- Idempotent re-run support

## Core Architectural Decisions

### 1. CWD Resolution

**Decision:** Default to current working directory

- `agentfile init` = current directory
- `agentfile init .` = current directory  
- `agentfile init --here` = current directory

### 2. .agentfile/ Population

**Decision:** Copy template files from `cli/src/templates/agentfile/`

On first init:
1. Create `.agentfile/` directory
2. Copy all command definition files from templates
3. These are the source of truth for all IDEs

### 3. IDE Wrapper Integration

**Decision:** Generated files with relative paths

Each IDE gets generated wrapper files that reference `.agentfile/`:
- Windsurf: `.windsurf/workflows/*.md`
- Cursor: `.cursor/` config files
- KiloCode: `.kilocode/modes/` config
- GitHub Copilot: `.github/prompts/*.prompt.md`
- Cline: `.clinerules`

### 4. Idempotency / Re-run Logic

**Decision:** Merge/preserve existing, add missing IDEs

When `agentfile init` runs again:
- Preserve existing `.agentfile/` contents
- Add any new command files if templates updated
- Add missing IDE wrapper configs
- Never overwrite existing IDE configs destructively

### 5. Template System

**Decision:** Static files - copy as-is

Template location: `cli/src/templates/<ide>/`
- Templates are static markdown/config files
- Copied directly without variable substitution
- Each IDE has its own template subdirectory

## Project Structure

```
cli/src/
├── commands/
│   └── init.js           # Main init command handler
├── prompts/
│   └── ide-selector.js   # Interactive IDE selection
├── installers/
│   ├── index.js          # Installer orchestrator
│   ├── windsurf.js       # Windsurf wrapper generator
│   ├── cursor.js         # Cursor wrapper generator
│   ├── kilocode.js       # KiloCode wrapper generator
│   ├── github-copilot.js # GitHub Copilot generator
│   └── cline.js          # Cline wrapper generator
└── templates/
    ├── agentfile/        # .agentfile/ template contents
    │   ├── run.md
    │   ├── create.md
    │   └── ...
    ├── windsurf/         # Windsurf templates
    ├── cursor/           # Cursor templates
    ├── kilocode/         # KiloCode templates
    ├── github-copilot/   # GitHub Copilot templates
    └── cline/           # Cline templates
```

## Implementation Patterns

### CLI Command Flow

1. Parse arguments (resolve CWD)
2. Check if `.agentfile/` exists
3. Run interactive IDE selector (inquirer)
4. For each selected IDE, run corresponding installer
5. Report success/failure

### Installer Pattern

Each IDE installer:
1. Check if IDE config directory exists
2. Generate wrapper files pointing to `.agentfile/`
3. Handle idempotency (merge vs overwrite)
4. Report results

### File Operations

- Use existing `src/js-utils/file-ops.js` for file operations
- Create directories with proper permissions
- Handle existing files gracefully

## Summary

Key architectural decisions for `agentfile init`:
1. **CWD:** Default to current directory
2. **Population:** Copy templates to `.agentfile/`
3. **IDE Integration:** Generated wrapper files with relative paths
4. **Idempotency:** Merge/preserve existing configs
5. **Templates:** Static files, copy as-is

The architecture is ready for implementation.
