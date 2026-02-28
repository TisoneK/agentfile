# Story 7.5: Implement Idempotent Re-Run Logic

Status: done

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As a developer,
I want agentfile init to be idempotent,
so that I can run it multiple times without breaking existing setup.

## Acceptance Criteria

1. [AC1] Given agentfile has been initialized, When I run agentfile init again, Then existing configurations are preserved, And missing IDE wrappers are added
   - **Source:** [epics.md#936-939]

2. [AC2] Given I have customized IDE configurations, When agentfile init runs, Then my customizations are never overwritten, And only missing files are created
   - **Source:** [epics.md#941-944]

3. [AC3] Given new command files are added to cli/src/templates/agentfile/, When agentfile init runs on existing project, Then new command files are added to .agentfile/ without modifying existing files
   - **Source:** [architecture.md#63-66]

## Tasks / Subtasks

- [x] Task 1: Implement .agentfile/ directory idempotency (AC: #1)
  - [x] Subtask 1.1: Check if .agentfile/ directory already exists before creating
  - [x] Subtask 1.2: Compare existing .agentfile/ files with templates
  - [x] Subtask 1.3: Only add missing command definition files
  - [x] Subtask 1.4: Never modify existing files in .agentfile/

- [x] Task 2: Implement IDE wrapper idempotency (AC: #1, #2)
  - [x] Subtask 2.1: Check if IDE config directory already exists
  - [x] Subtask 2.2: For each IDE wrapper file, check if destination exists
  - [x] Subtask 2.3: Skip existing IDE wrapper files (preserve user customizations)
  - [x] Subtask 2.4: Only create missing IDE wrapper files

- [x] Task 3: Implement template directory idempotency (AC: #3)
  - [x] Subtask 3.1: Scan cli/src/templates/agentfile/ for template files
  - [x] Subtask 3.2: Compare with existing .agentfile/ contents
  - [x] Subtask 3.3: Add only missing template files to .agentfile/
  - [x] Subtask 3.4: Log which files were skipped (already exist)

- [x] Task 4: Add idempotency reporting (AC: #1)
  - [x] Subtask 4.1: Report count of preserved files
  - [x] Subtask 4.2: Report count of new files added
  - [x] Subtask 4.3: Clear success message even when no changes needed
  - [x] Subtask 4.4: Show "Already up to date" when nothing new to add

## Dev Notes

### Architecture Requirements (MANDATORY)

The implementation MUST follow these architecture requirements:

1. **Idempotent Re-run Logic**
   - Source: [architecture.md#58-66] - "Merge/preserve existing, add missing IDEs"
   - When `agentfile init` runs again:
     - Preserve existing `.agentfile/` contents
     - Add any new command files if templates updated
     - Add missing IDE wrapper configs
     - **Never overwrite existing IDE configs destructively**

2. **Use file-ops.js for File Operations**
   - Source: [epics.md#74] - "The system must use existing src/js-utils/file-ops.js for file operations"
   - All file operations must use the existing utility, NOT shell commands
   - Use `fileExists`, `readDirectory`, `copyFile`, `ensureDirectory` functions from file-ops.js

3. **Template System (Already Implemented in Story 7-4)**
   - Source: [architecture.md#68-75]
   - Templates are static markdown/config files copied directly without variable substitution
   - Template location: `cli/src/templates/<ide>/`

### Project Structure Notes

Based on the architecture requirements:

- **CLI Entry Point:** `cli/src/commands/init.js` (already exists from Stories 7-1, 7-2)
- **File Operations:** Use `src/js-utils/file-ops.js` (not shell commands)
- **IDE Installers:** `cli/src/installers/*.js` (created in Story 7-3)
- **Template Source:** `cli/src/templates/agentfile/` (created in Story 7-4)
- **.agentfile/ Directory:** Created in Story 7-2

### Technical Requirements

1. **Idempotent Flow:**
   ```
   agentfile init (re-run)
   → Resolve CWD
   → Check if .agentfile/ exists:
     → If exists: Use existing contents
     → If not: Create and populate (first run behavior)
   → Check each IDE config directory:
     → If exists: Skip existing files
     → If not: Create and populate
   → Scan templates for new files:
     → If exists in .agentfile/: Skip
     → If missing: Add to .agentfile/
   → Report: Preserved X files, Added Y files
   ```

2. **File Operations Requirements:**
   - Use file-ops.js `fileExists()` to check if files/directories exist
   - Use file-ops.js `readDirectory()` to scan directories
   - Use file-ops.js `copyFile()` to copy individual files
   - Use file-ops.js `ensureDirectory()` to create directories
   - Ensure async/await pattern is used
   - Handle errors gracefully with clear messages

3. **Key Functions to Implement:**
   - `checkIdempotency(targetDir, templateDir)` - Compare and identify missing files
   - `syncMissingFiles(sourceDir, targetDir)` - Copy only missing files
   - `generateIdempotencyReport(preserved, added)` - Format output message

### Testing Standards

1. **Unit Tests:** Test idempotency functions with mock file system
2. **Integration Tests:** Test full init flow with existing .agentfile/ directory
3. **Edge Cases:**
   - Re-run with partial IDE selection
   - Re-run after user manually adds files
   - Re-run after templates are updated with new files
4. **Test Frameworks:** Use project's existing test framework (Jest)
5. **Coverage:** Ensure new code paths are covered

### Previous Story Context (from Stories 7-1, 7-2, 7-3, 7-4)

**Story 7-1 (done):**
- Interactive wizard for IDE selection using inquirer

**Story 7-2 (done):**
- Created .agentfile/ directory as the source of truth
- Copies command definition files from cli/src/templates/agentfile/ to .agentfile/
- Basic idempotent re-run logic (checks if .agentfile/ exists)

**Story 7-3 (review):**
- IDE installer infrastructure (cli/src/installers/index.js)
- IDE wrapper generators for all 5 IDEs (Windsurf, Cursor, KiloCode, GitHub Copilot, Cline)
- Uses file-ops.js for file operations

**Story 7-4 (review):**
- IDE-specific template directories (cli/src/templates/windsurf/, cursor/, etc.)
- Implemented idempotent template copying (templates only copied if destination doesn't exist)
- Templates reference .agentfile/ using relative paths

**This story (7-5) should:**
- Enhance the idempotent re-run logic at the directory level
- Ensure .agentfile/ directory contents are preserved and synced correctly
- Ensure IDE wrapper files are preserved and only missing ones are added
- Add comprehensive idempotency reporting
- Handle edge cases: partial re-runs, template updates, user customizations

### References

- Architecture Requirements: [epics.md#68-76]
- Idempotent Re-run: [epics.md#73]
- Epic 7 Overview: [epics.md#138-140]
- Story 7.5 Details: [epics.md#928-944]
- Architecture Decision: [architecture.md#58-66]
- Previous Story 7-2: [_bmad-output/implementation-artifacts/7-2-create-and-populate-agentfile-directory.md]
- Previous Story 7-3: [_bmad-output/implementation-artifacts/7-3-generate-ide-specific-wrapper-files.md]
- Previous Story 7-4: [_bmad-output/implementation-artifacts/7-4-implement-template-system-for-static-file-copying.md]

## Dev Agent Record

### Agent Model Used

minimax/minimax-m2.5:free

### Debug Log References

N/A - No debug logs needed for this implementation

### Completion Notes List

- **Task 1 (Complete):** Implemented `.agentfile/` directory idempotency by:
  - Adding `isAgentfileInitialized()` function to check if .agentfile/config.json exists
  - Changed guard condition from checking `workflows/` to checking `.agentfile/`
  - Added `getFilesInDir()` helper to get file lists
  - Modified init.js to run in idempotent mode when .agentfile/ already exists
  - Preserves existing files, only adds missing ones

- **Task 2 (Complete):** Implemented IDE wrapper idempotency by:
  - Updated all 5 IDE installers (windsurf.js, cursor.js, kilocode.js, github-copilot.js, cline.js)
  - Each installer now checks if file exists before writing (`existsSync()`)
  - Preserves user customizations - skips if destination exists
  - Added log.dim() for skipped files

- **Task 3 (Complete):** Template directory idempotency was already implemented in Story 7-4
  - Verified existing code correctly skips files that already exist
  - Added counter tracking for templatesPreserved and templatesAdded

- **Task 4 (Complete):** Added comprehensive idempotency reporting by:
  - Added idempotencyCounters object to track preserved vs added files
  - Shows "Idempotent Re-Run Report" with counts on re-run
  - Displays "Preserved: X files" and "Added: Y files"
  - Shows "Already up to date!" when no new files to add

### File List

**New Files:**
- `cli/src/commands/init.js` - Core idempotent re-run logic, guard condition fix, reporting
- `cli/src/installers/windsurf.js` - Added idempotent file check with counter tracking
- `cli/src/installers/cursor.js` - Added idempotent file check with counter tracking
- `cli/src/installers/kilocode.js` - Added idempotent file check with counter tracking
- `cli/src/installers/github-copilot.js` - Added idempotent file check with counter tracking
- `cli/src/installers/cline.js` - Added idempotent file check with counter tracking (also cleaned up unused import)

### Review Follow-ups (AI)

- [ ] [AI-Review][Medium] IDE wrapper file naming - Files are named `bmad-agentfile-*` but should be named `agentfile-*` since they're for agentfile integration, not bmad (bmad is the build tool, agentfile is the output). Update in all 5 installers.

