# Story 7.2: Create and Populate .agentfile/ Directory

Status: done

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As a developer,
I want agentfile to create a .agentfile/ directory as the source of truth,
so that all IDE configurations reference a central location.

## Acceptance Criteria

1. [AC1] Given agentfile init runs for the first time, When initialization completes, Then a .agentfile/ directory is created, And command definition files are copied to it
   - **Source:** [epics.md#870-873]

2. [AC2] Given .agentfile/ already exists, When agentfile init runs again, Then existing contents are preserved, And only new files are added
   - **Source:** [epics.md#875-878]

## Tasks / Subtasks

- [x] Task 1: Create .agentfile/ directory structure (AC: #1)
  - [x] Subtask 1.1: Implement directory creation logic using file-ops.js
  - [x] Subtask 1.2: Verify .agentfile/ is created in correct CWD
- [x] Task 2: Copy command definition files from templates (AC: #1)
  - [x] Subtask 2.1: Locate template source in cli/src/templates/agentfile/
  - [x] Subtask 2.2: Implement file copy logic using file-ops.js
  - [x] Subtask 2.3: Copy all template files to .agentfile/
- [x] Task 3: Implement idempotent re-run (AC: #2)
  - [x] Subtask 3.1: Check if .agentfile/ exists before creation
  - [x] Subtask 3.2: Compare existing files with templates
  - [x] Subtask 3.3: Add only missing files, preserve existing

## Dev Notes

### Architecture Requirements (MANDATORY)

The implementation MUST follow these architecture requirements:

1. **.agentfile/ Directory as Source of Truth**
   - Source: [epics.md#70] - "The system must create and maintain a .agentfile/ directory as the source of truth for all command definitions"
   - This directory is the central location that all IDE configurations reference

2. **Use file-ops.js for File Operations**
   - Source: [epics.md#74] - "The system must use existing src/js-utils/file-ops.js for file operations"
   - All file operations must use the existing utility, NOT shell commands

3. **Template Source Location**
   - Source: [architecture.md#40] - "Copy template files from `cli/src/templates/agentfile/`"
   - Templates are static files copied directly without variable substitution

4. **Idempotent Re-run Support**
   - Source: [epics.md#73] - "The system must support idempotent re-runs that merge/preserve existing configurations and add missing IDE wrappers"
   - Story 7.5 specifically covers idempotent logic, but Story 7.2 should handle basic preservation

### Project Structure Notes

Based on the architecture requirements:

- **CLI Entry Point:** `cli/src/commands/init.js` (already exists from Story 7-1)
- **File Operations:** Use `src/js-utils/file-ops.js` (not shell commands)
- **Template Source:** `cli/src/templates/agentfile/` (to be created or populated)
- **Target Directory:** `.agentfile/` (created in project root CWD)

### Technical Requirements

1. **Dependencies:**
   - Use existing `src/js-utils/file-ops.js` for all file operations
   - No new dependencies should be needed for this story

2. **Directory Creation Flow:**
   ```
   agentfile init
   → Resolve CWD (from Story 7-7)
   → Check if .agentfile/ exists
   → If not: Create .agentfile/ directory
   → Copy all files from cli/src/templates/agentfile/
   → If exists: Check for missing files
   → Add only missing files, preserve existing
   ```

3. **File Copy Requirements:**
   - Use file-ops.js `copyFile` or `copyDirectory` functions
   - Ensure async/await pattern is used
   - Handle errors gracefully with clear messages

### Testing Standards

1. **Unit Tests:** Test directory creation, file copy logic
2. **Integration Tests:** Test full init flow with .agentfile/ creation
3. **Test Frameworks:** Use project's existing test framework (Jest)
4. **Coverage:** Ensure new code paths are covered

### Previous Story Context (from Story 7-1)

Story 7-1 already implemented:
- Interactive wizard using inquirer
- IDE selection prompts
- Created .agentfile/ directory with config.json and IDE marker files

**This story (7-2) should:**
- Enhance .agentfile/ population with proper command definition files
- Ensure templates are copied from cli/src/templates/agentfile/
- Implement idempotent logic for re-runs

### References

- Architecture Requirements: [epics.md#68-76]
- Epic 7 Overview: [epics.md#138-140]
- Story 7.2 Details: [epics.md#862-879]
- Architecture Decision: [architecture.md#38-46]
- Previous Story 7-1: [_bmad-output/implementation-artifacts/7-1-cli-interactive-wizard-for-ide-selection.md]

## Dev Agent Record

### Agent Model Used

<!-- Specify the model used for implementation -->

### Debug Log References

<!-- Reference any debug logs from implementation -->

### Completion Notes List

<!-- List completion notes as tasks are finished -->
- ✅ Created template directory cli/src/templates/agentfile/
- ✅ Created commands.json template with command definitions
- ✅ Created index.md template with documentation
- ✅ Modified init.js to implement idempotent re-run logic
- ✅ Added check for .agentfile/ existence before creation
- ✅ Added template file copying with preservation of existing files
- ✅ All tests pass (389 tests)
- ✅ [AI-Review] Fixed architecture violation: replaced fs.copyFileSync with file-ops.js copyFile function

### File List

<!-- List all files created or modified -->
- cli/src/templates/agentfile/commands.json (created) - Template file for command definitions
- cli/src/templates/agentfile/index.md (created) - Template documentation file
- cli/src/commands/init.js (modified) - Added idempotent re-run logic and template copying
- _bmad-output/implementation-artifacts/sprint-status.yaml (modified) - Updated story status to in-progress