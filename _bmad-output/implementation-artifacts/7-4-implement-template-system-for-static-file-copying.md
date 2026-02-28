# Story 7.4: Implement Template System for Static File Copying

Status: review

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As a developer,
I want agentfile to use a template system that copies files as-is,
so that I can customize the command definitions.

## Acceptance Criteria

1. [AC1] Given template files exist in cli/src/templates/, When agentfile init runs, Then templates are copied directly without modification, And they become the .agentfile/ contents
   - **Source:** [epics.md#917-920]

2. [AC2] Given I want to customize command definitions, When I edit files in .agentfile/, Then my changes take precedence over defaults
   - **Source:** [epics.md#922-924]

3. [AC3] Given IDE-specific templates exist in cli/src/templates/<ide>/, When init runs, Then templates are copied to appropriate IDE config directories
   - **Source:** [architecture.md#68-75]

## Tasks / Subtasks

- [x] Task 1: Create IDE-specific template directory structure (AC: #3)
  - [x] Subtask 1.1: Create cli/src/templates/windsurf/ directory
  - [x] Subtask 1.2: Create cli/src/templates/cursor/ directory
  - [x] Subtask 1.3: Create cli/src/templates/kilocode/ directory
  - [x] Subtask 1.4: Create cli/src/templates/github-copilot/ directory
  - [x] Subtask 1.5: Create cli/src/templates/cline/ directory

- [x] Task 2: Populate IDE-specific template files (AC: #3)
  - [x] Subtask 2.1: Create Windurf workflow templates (.windsurf/workflows/)
  - [x] Subtask 2.2: Create Cursor configuration templates (.cursor/)
  - [x] Subtask 2.3: Create KiloCode config templates (.kilocode/)
  - [x] Subtask 2.4: Create GitHub Copilot prompt templates (.github/prompts/)
  - [x] Subtask 2.5: Create Cline rules templates (.clinerules)

- [x] Task 3: Implement template copying system in init.js (AC: #1, #3)
  - [x] Subtask 3.1: Add function to copy IDE-specific templates
  - [x] Subtask 3.2: Ensure templates are copied to correct IDE config directories
  - [x] Subtask 3.3: Use file-ops.js for all file operations (NOT shell commands)
  - [x] Subtask 3.4: Implement idempotent copying (skip if file exists)

- [x] Task 4: Ensure user customizations take precedence (AC: #2)
  - [x] Subtask 4.1: Only copy templates if destination doesn't exist
  - [x] Subtask 4.2: Never overwrite existing user customizations
  - [x] Subtask 4.3: Add missing template files while preserving existing

## Dev Notes

### Architecture Requirements (MANDATORY)

The implementation MUST follow these architecture requirements:

1. **Template System - Static File Copying**
   - Source: [architecture.md#68-75] - "Templates are static markdown/config files copied directly without variable substitution"
   - Template location: `cli/src/templates/<ide>/`
   - Each IDE has its own template subdirectory
   - NO variable substitution - copy files as-is

2. **Use file-ops.js for File Operations**
   - Source: [epics.md#74] - "The system must use existing src/js-utils/file-ops.js for file operations"
   - All file operations must use the existing utility, NOT shell commands
   - Use `copyFile`, `copyDirectory`, `ensureDirectory` functions from file-ops.js

3. **Idempotent Re-run Support**
   - Source: [epics.md#73] - "The system must support idempotent re-runs that merge/preserve existing configurations and add missing IDE wrappers"
   - Never overwrite existing IDE configs destructively
   - Only copy if destination file doesn't exist

4. **IDE-Specific Template Destinations**
   - Windsurf: `.windsurf/workflows/*.md`
   - Cursor: `.cursor/` configuration files
   - KiloCode: `.kilocode/modes/` config
   - GitHub Copilot: `.github/prompts/*.prompt.md`
   - Cline: `.clinerules`

### Project Structure Notes

Based on the architecture requirements:

- **CLI Entry Point:** `cli/src/commands/init.js` (already exists from Stories 7-1, 7-2)
- **Template Source:** `cli/src/templates/<ide>/` directories (to be created)
- **File Operations:** Use `src/js-utils/file-ops.js` (not shell commands)
- **IDE Installers:** `cli/src/installers/*.js` (created in Story 7-3)

### Technical Requirements

1. **Dependencies:**
   - Use existing `src/js-utils/file-ops.js` for all file operations
   - Use template files from `cli/src/templates/<ide>/` directories
   - No new npm dependencies should be needed

2. **Template Copy Flow:**
   ```
   agentfile init
   → Resolve CWD
   → Check IDE selection
   → For each selected IDE:
     → Check if IDE-specific template directory exists (cli/src/templates/<ide>/)
     → If exists: Copy all template files to IDE config directory
     → If destination exists: Skip (preserve user customizations)
     → If destination doesn't exist: Copy template file
   ```

3. **File Operations Requirements:**
   - Use file-ops.js `copyFile`, `copyDirectory`, `ensureDirectory` functions
   - Ensure async/await pattern is used
   - Handle errors gracefully with clear messages

4. **Template File Content:**
   - Each IDE template should reference the .agentfile/ directory using relative paths
   - Templates are static - no variable substitution
   - Include command definitions (run, create, list, etc.)

### Testing Standards

1. **Unit Tests:** Test template copying function with mock file system
2. **Integration Tests:** Test full init flow with template copying
3. **Test Frameworks:** Use project's existing test framework (Jest)
4. **Coverage:** Ensure new code paths are covered

### Previous Story Context (from Stories 7-2 and 7-3)

**Story 7-2 (done) already handles:**
- Creating .agentfile/ directory as the source of truth
- Copying command definition files from cli/src/templates/agentfile/ to .agentfile/
- Basic idempotent re-run logic

**Story 7-3 (review) already handles:**
- IDE installer infrastructure (cli/src/installers/index.js)
- IDE wrapper generators for all 5 IDEs
- Using file-ops.js for file operations
- Idempotent re-runs (won't overwrite existing configs)

**This story (7-4) should:**
- Create IDE-specific template directories (cli/src/templates/windsurf/, cursor/, etc.)
- Populate templates with appropriate IDE-specific content
- Modify init.js to copy IDE-specific templates to their respective directories
- Ensure templates reference .agentfile/ using relative paths

### References

- Architecture Requirements: [epics.md#68-76]
- Epic 7 Overview: [epics.md#138-140]
- Story 7.4 Details: [epics.md#909-925]
- Architecture Decision: [architecture.md#68-75]
- Previous Story 7-2: [_bmad-output/implementation-artifacts/7-2-create-and-populate-agentfile-directory.md]
- Previous Story 7-3: [_bmad-output/implementation-artifacts/7-3-generate-ide-specific-wrapper-files.md]

## Dev Agent Record

### Agent Model Used

<!-- Specify the model used for implementation -->
- minimax/minimax-m2.5:free

### Debug Log References

<!-- Reference any debug logs from implementation -->

### Completion Notes List

- Task 1 & 2: Created IDE-specific template directories and populated them with template files for all 5 IDEs (Windsurf, Cursor, KiloCode, GitHub Copilot, Cline)
- Task 3: Implemented template copying system in init.js - iterates over selected IDEs and copies templates from cli/src/templates/<ide>/ to IDE config directories
- Task 4: Implemented idempotent copying - templates are only copied if destination doesn't exist, preserving user customizations

- All acceptance criteria satisfied:
  - [AC1] Templates are copied directly without modification
  - [AC2] User customizations take precedence over defaults
  - [AC3] IDE-specific templates are copied to appropriate IDE config directories

### File List

**Created - IDE-specific template directories:**
- cli/src/templates/windsurf/workflows/agentfile-run.md
- cli/src/templates/windsurf/workflows/agentfile-create.md
- cli/src/templates/windsurf/workflows/agentfile-list.md
- cli/src/templates/windsurf/workflows/agentfile-validate.md
- cli/src/templates/cursor/commands/agentfile-run.md
- cli/src/templates/cursor/commands/agentfile-create.md
- cli/src/templates/cursor/commands/agentfile-list.md
- cli/src/templates/cursor/commands/agentfile-validate.md
- cli/src/templates/kilocode/rules/agentfile.md
- cli/src/templates/github-copilot/prompts/agentfile-run.prompt.md
- cli/src/templates/github-copilot/prompts/agentfile-create.prompt.md
- cli/src/templates/github-copilot/prompts/agentfile-list.prompt.md
- cli/src/templates/github-copilot/prompts/agentfile-validate.prompt.md
- cli/src/templates/cline/clinerules

**Modified:**
- cli/src/commands/init.js (added template copying system for IDEs)

**Added:**
- cli/tests/init-template.test.js (unit tests for template system)

## Code Review Fixes Applied

- [x] [AI-Review][HIGH] Fixed template path references - Changed `../.agentfile/` to `../../.agentfile/` in all IDE template files
- [x] [AI-Review][MEDIUM] Fixed inconsistent fs require - Changed to use destructured imports from fs module
- [x] [AI-Review][MEDIUM] Added logging for missing template directories
- [x] [AI-Review][HIGH] Fixed IDE template destination paths - Corrected path mapping to create files directly in IDE config directories (not nested subdirectories)
- [x] [AI-Review][HIGH] Added unit tests - Created cli/tests/init-template.test.js with tests for template system
- [x] [AI-Review][MEDIUM] Fixed inconsistent error handling - Standardized error.message access across init.js

## Code Review Fixes Applied (Second Review)

- [x] [AI-Review][HIGH] Fixed broken IDE template copying - getFilesInDir() only returned files directly in directory, not in subdirectories. Added getAllFilesRecursive() function to traverse nested directories and copy all IDE-specific templates properly
