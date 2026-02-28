# Spec: `agentfile init` — IDE Slash Command Setup

## Overview

When a developer installs Agentfile globally and runs `agentfile init` inside a project, an interactive CLI wizard runs that asks which IDEs they use, then generates the appropriate IDE-specific slash command config files that point to `.agentfile/` as the source of truth.

---

## Installation & Entry Point

```bash
npm install -g agentfile        # one-time global install

cd my-project
agentfile init                  # all three mean the same thing
agentfile init .
agentfile init --here
```

All variants resolve to the **current working directory** as the target project root.

---

## Source of Truth: `.agentfile/`

All agentfile commands live in `{project-root}/.agentfile/`. This folder is created and populated during `agentfile init`.

```
.agentfile/
    run.md
    create.md
    init.md
    ...
```

IDE slash command config files are **thin wrappers** that point to `.agentfile/`. They do not duplicate command logic.

---

## Interactive Wizard

After running `agentfile init`, the CLI starts an interactive prompt session. The user navigates with arrow keys, selects with Space/Tab, and confirms with Enter.

### Step 1 — IDE Selection

```
? Which IDEs do you use in this project?
  (↑↓ to navigate, Space to select, Enter to confirm)

  ❯ ◯ Windsurf
    ◯ Cursor
    ◯ KiloCode
    ◯ GitHub Copilot
    ◯ Cline
```

- User can select **one or more** IDEs
- At least one must be selected to proceed

### Step 2 — Confirmation & Installation

```
✔ Setting up .agentfile/...        done
✔ Installing for Windsurf...       done
✔ Installing for Cursor...         done

Agentfile initialized in /my-project
Slash commands available in: Windsurf, Cursor
```

---

## What Gets Generated

### `.agentfile/` (always created)
Populated with all available agentfile command definitions. This is the source of truth for all IDEs.

### Per-IDE config files (based on user selection)

| IDE | Location | Format |
|---|---|---|
| Windsurf | `.windsurf/workflows/` | `.md` files per command |
| Cursor | `.cursor/` | slash command config |
| KiloCode | `.kilocode/` | modes/prompts config |
| GitHub Copilot | `.github/prompts/` | `.prompt.md` files |
| Cline | `.clinerules` | rules file |

Each generated file points back to the corresponding command in `.agentfile/`.

---

## Re-runnable / Idempotent

- `agentfile init` can be run **multiple times** in the same project
- Running it again allows the user to add a new IDE without breaking existing config
- Existing `.agentfile/` and IDE configs are merged/updated, not overwritten destructively

---

## Components to Build

### `cli/src/commands/init.js`
Main command handler. Resolves target directory, orchestrates prompts and installers.

### `cli/src/prompts/ide-selector.js`
Interactive multi-select prompt for IDE choice. Use `inquirer` or `clack` (confirm which is already in use).

### `cli/src/installers/`
One installer module per IDE. Each is responsible for generating the IDE-specific wrapper files pointing to `.agentfile/`.

```
cli/src/installers/
    windsurf.js
    cursor.js
    kilocode.js
    github-copilot.js
    cline.js
```

### `cli/src/templates/`
Template files per IDE. Source from existing `.windsurf/`, `.github/prompts/`, `.cursor/`, `.kilocode/`, `.clinerules` already present in the agentfile repo.

```
cli/src/templates/
    windsurf/
    cursor/
    kilocode/
    github-copilot/
    cline/
```

### `src/js-utils/file-utils.js`
Already exists. Used for all file copy/write/merge operations.

---

## Out of Scope (v1)

- Asking which specific commands to enable (all commands in `.agentfile/` are always available)
- Project type, language, or stack detection
- CI/CD or GitHub Actions setup
- Team workflow configuration
