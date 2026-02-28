# Story 7.3: Generate IDE-Specific Wrapper Files

Status: done

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As a developer,
I want agentfile to generate IDE-specific wrapper files,
so that each IDE can invoke agentfile commands correctly.

## Acceptance Criteria

1. [AC1] Given IDE selection during init, When initialization completes, Then IDE-specific wrapper files are generated, And they reference the .agentfile/ directory
   - **Source:** [epics.md#890-893]

2. [AC2] Given Windsurf is selected, When init runs, Then .windsurf/workflows/*.md files are created
   - **Source:** [epics.md#895-897]

3. [AC3] Given Cursor is selected, When init runs, Then .cursor/ configuration files are created
   - **Source:** [epics.md#899-901]

4. [AC4] Given other IDEs are selected, When init runs, Then the appropriate configuration files are created
   - **Source:** [epics.md#903-905]

## Tasks / Subtasks

- [x] Task 1: Create IDE installer infrastructure (AC: #1)
  - [x] Subtask 1.1: Create cli/src/installers/index.js as orchestrator
  - [x] Subtask 1.2: Create base installer pattern all IDEs follow
- [x] Task 2: Implement Windsurf wrapper generator (AC: #2)
  - [x] Subtask 2.1: Create cli/src/installers/windsurf.js
  - [x] Subtask 2.2: Generate .windsurf/workflows/*.md files
  - [x] Subtask 2.3: Ensure files reference .agentfile/ directory
- [x] Task 3: Implement Cursor wrapper generator (AC: #3)
  - [x] Subtask 3.1: Create cli/src/installers/cursor.js
  - [x] Subtask 3.2: Generate .cursor/ configuration files
  - [x] Subtask 3.3: Ensure files reference .agentfile/ directory
- [x] Task 4: Implement KiloCode wrapper generator (AC: #4)
  - [x] Subtask 4.1: Create cli/src/installers/kilocode.js
  - [x] Subtask 4.2: Generate .kilocode/rules/ config files
- [x] Task 5: Implement GitHub Copilot wrapper generator (AC: #4)
  - [x] Subtask 5.1: Create cli/src/installers/github-copilot.js
  - [x] Subtask 5.2: Generate .github/prompts/*.prompt.md files
- [x] Task 6: Implement Cline wrapper generator (AC: #4)
  - [x] Subtask 6.1: Create cli/src/installers/cline.js
  - [x] Subtask 6.2: Generate .clinerules files

## Dev Notes

### Architecture Requirements (MANDATORY)

The implementation MUST follow these architecture requirements:

1. **IDE Wrapper Integration with Relative Paths**
   - Source: [architecture.md#47-56] - "Generated files with relative paths"
   - Each IDE gets generated wrapper files that reference `.agentfile/` using relative paths
   - IDEs supported: Windsurf, Cursor, KiloCode, GitHub Copilot, Cline

2. **Installer Pattern**
   - Source: [architecture.md#114-120] - Each IDE installer follows the pattern:
     1. Check if IDE config directory exists
     2. Generate wrapper files pointing to .agentfile/
     3. Handle idempotency (merge vs overwrite)
     4. Report results

3. **Use file-ops.js for File Operations**
   - Source: [epics.md#74] - "The system must use existing src/js-utils/file-ops.js for file operations"
   - All file operations must use the existing utility, NOT shell commands

4. **Template System**
   - Source: [architecture.md#68-75] - Templates located at `cli/src/templates/<ide>/`
   - Templates are static markdown/config files copied directly without variable substitution

5. **Idempotent Re-run Support**
   - Source: [epics.md#73] - "The system must support idempotent re-runs that merge/preserve existing configurations and add missing IDE wrappers"
   - Never overwrite existing IDE configs destructively

### Project Structure Notes

Based on the architecture requirements:

- **CLI Entry Point:** `cli/src/commands/init.js` (already exists from Story 7-1)
- **Installer Orchestrator:** `cli/src/installers/index.js` (to be created)
- **Individual Installers:** `cli/src/installers/windsurf.js`, `cursor.js`, `kilocode.js`, `github-copilot.js`, `cline.js`
- **IDE Templates:** `cli/src/templates/windsurf/`, `cursor/`, `kilocode/`, `github-copilot/`, `cline/`
- **File Operations:** Use `src/js-utils/file-ops.js` (not shell commands)

### Technical Requirements

1. **Dependencies:**
   - Use existing `src/js-utils/file-ops.js` for all file operations
   - Use template files from `cli/src/templates/<ide>/` directories
   - No new npm dependencies should be needed

2. **IDE Wrapper File Locations:**
   - Windsurf: `.windsurf/workflows/*.md`
   - Cursor: `.cursor/` configuration files
   - KiloCode: `.kilocode/modes/` config
   - GitHub Copilot: `.github/prompts/*.prompt.md`
   - Cline: `.clinerules`

3. **Wrapper File Content:**
   - Each wrapper file should reference the .agentfile/ directory
   - Use relative paths from IDE config location to .agentfile/
   - Include command definitions (run, create, list, etc.)

4. **File Operations Requirements:**
   - Use file-ops.js `copyFile`, `copyDirectory`, `ensureDirectory` functions
   - Ensure async/await pattern is used
   - Handle errors gracefully with clear messages

### Testing Standards

1. **Unit Tests:** Test each IDE installer independently
2. **Integration Tests:** Test full init flow with IDE wrapper generation
3. **Test Frameworks:** Use project's existing test framework (Jest)
4. **Coverage:** Ensure new code paths are covered

### Previous Story Context (from Story 7-2)

Story 7-2 (ready-for-dev) already handles:
- Creating .agentfile/ directory as the source of truth
- Copying command definition files from templates
- Basic idempotent re-run logic

**This story (7-3) should:**
- Generate IDE-specific wrapper files for each supported IDE
- Use the installer pattern to handle each IDE uniquely
- Reference the .agentfile/ directory from each IDE's config location

### References

- Architecture Requirements: [epics.md#68-76]
- Epic 7 Overview: [epics.md#138-140]
- Story 7.3 Details: [epics.md#882-906]
- Architecture Decision: [architecture.md#47-56]
- Previous Story 7-2: [_bmad-output/implementation-artifacts/7-2-create-and-populate-agentfile-directory.md]

## Dev Agent Record

### Agent Model Used

<!-- Specify the model used for implementation -->
- minimax/minimax-m2.5:free

### Debug Log References

<!-- Reference any debug logs from implementation -->

### Completion Notes List

1. Created installer orchestrator (cli/src/installers/index.js) that manages IDE wrapper installation
2. Updated windsurf.js, cursor.js, kilocode.js to use file-ops.js for file operations
3. Created github-copilot.js installer for .github/prompts/ generation
4. Created cline.js installer for .clinerules generation
5. Integrated installer orchestrator into init.js to call installIdes() after IDE markers are created
6. All installers use relative paths to .agentfile/ directory for cross-project portability
7. All installers support idempotent re-runs (won't overwrite existing configs)

### File List

- cli/src/installers/index.js (NEW - orchestrator)
- cli/src/installers/windsurf.js (MODIFIED - updated to use file-ops.js)
- cli/src/installers/cursor.js (MODIFIED - updated to use file-ops.js)
- cli/src/installers/kilocode.js (MODIFIED - completed implementation)
- cli/src/installers/github-copilot.js (NEW)
- cli/src/installers/cline.js (NEW)
- cli/src/commands/init.js (MODIFIED - added installer call)

### Change Log

- 2026-02-27: Implemented IDE-specific wrapper file generation for all 5 supported IDEs (Windsurf, Cursor, KiloCode, GitHub Copilot, Cline)
