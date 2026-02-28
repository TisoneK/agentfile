# Story 7.7: Implement CWD Resolution for agentfile init

Status: review

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As a developer,
I want agentfile init to default to the current working directory,
So that I can initialize in the right location easily.

## Acceptance Criteria

1. [AC1] Given I run agentfile init without arguments, When the command executes, Then the current working directory is used
   - **Source:** [epics.md#971-973]

2. [AC2] Given I run agentfile init with ".", When the command executes, Then the current working directory is used
   - **Source:** [epics.md#975-977]

3. [AC3] Given I run agentfile init --here, When the command executes, Then the current working directory is used
   - **Source:** [epics.md#979-981]

## Tasks / Subtasks

- [x] Task 1: Parse command arguments for path (AC: #1, #2, #3)
  - [x] Subtask 1.1: Handle undefined/null path (use cwd)
  - [x] Subtask 1.2: Handle "." path (use cwd)
  - [x] Subtask 1.3: Handle "--here" flag (use cwd)
  - [x] Subtask 1.4: Handle explicit path argument

- [x] Task 2: Implement CWD resolution (AC: #1)
  - [x] Subtask 2.1: Use process.cwd() to get current working directory
  - [x] Subtask 2.2: Validate the directory exists and is accessible
  - [x] Subtask 2.3: Handle errors gracefully

- [x] Task 3: Add path validation (AC: #1, #2, #3)
  - [x] Subtask 3.1: Check if resolved path is a directory
  - [x] Subtask 3.2: Check if resolved path is writable
  - [x] Subtask 3.3: Provide clear error messages for invalid paths

- [x] Task 4: Integrate with existing init flow (AC: #1, #2, #3)
  - [x] Subtask 4.1: Update cli/src/commands/init.js to use CWD resolution
  - [x] Subtask 4.2: Ensure compatibility with existing IDE selection flow
  - [x] Subtask 4.3: Test all three entry points work correctly

## Dev Notes

### Architecture Requirements (MANDATORY)

The implementation MUST follow these architecture requirements:

1. **CWD Resolution Pattern**
   - Source: [architecture.md#31-36] - "Default to current working directory"
   - `agentfile init` = current directory
   - `agentfile init .` = current directory
   - `agentfile init --here` = current directory
   - Source: [epics.md#75] - "CWD Resolution: The system must default to current working directory for agentfile init"

2. **Use file-ops.js for File Operations**
   - Source: [epics.md#74] - "The system must use existing src/js-utils/file-ops.js for file operations"
   - All file operations must use the utility, NOT direct fs module calls
   - Use `existsSync`, `ensureDir`, `ensureDirectory` functions from file-ops.js

3. **Async/Await Pattern**
   - Source: [epics.md#959] - "all file operations use async/await"
   - Use async functions for any file operations
   - Ensure CLI entry points are async

### Project Structure Notes

Based on the architecture requirements:

- **CLI Entry Point:** `cli/src/commands/init.js` - needs CWD resolution logic
- **File Operations:** Use `src/js-utils/file-ops.js` (not fs directly)
- **IDE Installers:** `cli/src/installers/*.js` - already using file-ops.js
- **Prompts:** `cli/src/prompts/*.js` - for interactive flow

### Technical Requirements

1. **CWD Resolution Flow:**
   ```
   agentfile init [path|--here]
   → Parse arguments:
     → No args: use process.cwd()
     → ".": use process.cwd()
     → "--here": use process.cwd()
     → "explicit/path": use explicit path
   → Validate path is directory and writable
   → Proceed with initialization
   ```

2. **Implementation Pattern:**
   ```javascript
   // Parse path from arguments
   function resolveInitPath(args) {
     if (args.here || !args.path || args.path === '.') {
       return process.cwd();
     }
     return path.resolve(args.path);
   }
   
   // Validate path
   async function validateInitPath(targetPath) {
     const exists = fileOps.existsSync(targetPath);
     if (!exists) {
       throw new Error(`Directory does not exist: ${targetPath}`);
     }
     // Check if writable...
   }
   ```

3. **Key Functions to Implement:**
   - `resolveInitPath(args)` - Resolve target path from command arguments
   - `validateTargetDirectory(targetPath)` - Validate directory exists and is writable
   - `normalizePath(path)` - Normalize path for cross-platform compatibility

### Testing Standards

1. **Unit Tests:** Test CWD resolution with various argument combinations
2. **Integration Tests:** Test full init flow with different path scenarios
3. **Edge Cases:**
   - Invalid path provided
   - Non-existent directory
   - Permission denied
   - Symbolic links
4. **Test Frameworks:** Use project's existing test framework (Jest)
5. **Coverage:** Ensure new code paths are covered

### Previous Story Context (from Stories 7-1 through 7-6)

**Story 7-1 (done):**
- Interactive wizard for IDE selection using inquirer
- Handles CLI argument parsing for IDE selection

**Story 7-2 (done):**
- Created .agentfile/ directory as the source of truth
- Copies command definition files to .agentfile/

**Story 7-3 (review):**
- IDE installer infrastructure (cli/src/installers/index.js)
- IDE wrapper generators for all 5 IDEs

**Story 7-4 (review):**
- IDE-specific template directories
- Implemented idempotent template copying

**Story 7-5 (ready-for-dev):**
- Enhanced idempotent re-run logic at directory level
- Ensures .agentfile/ directory contents are preserved

**Story 7-6 (ready-for-dev):**
- Migrating CLI to async/await pattern using file-ops.js
- Audit and migrate file operations to use file-ops.js

**This story (7-7) should:**
- Implement CWD resolution for agentfile init command
- Handle all three entry points: no args, ".", and "--here"
- Validate target directory exists and is writable
- Integrate seamlessly with the existing init flow

### References

- Architecture Requirements: [epics.md#68-76]
- CWD Resolution: [epics.md#75]
- Architecture Decision: [architecture.md#31-36]
- Epic 7 Overview: [epics.md#138-140]
- Story 7.7 Details: [epics.md#963-981]
- Previous Story 7-6: [_bmad-output/implementation-artifacts/7-6-implement-file-operations-using-js-utils.md]
- Previous Story 7-5: [_bmad-output/implementation-artifacts/7-5-implement-idempotent-re-run-logic.md]
- file-ops.js: [src/js-utils/file-ops.js]

## Dev Agent Record

### Agent Model Used

minimax/minimax-m2.5:free

### Debug Log References

N/A - Implementation completed in single session

### Completion Notes List

- ✅ Implemented `resolveInitPath(argsPath, hereFlag)` function to resolve target directory from CLI arguments
- ✅ Implemented `validateTargetDirectory(targetPath)` function to validate directory exists and is writable
- ✅ Updated CLI entry point (cli/src/index.js) to accept `[path]` argument and `--here` flag
- ✅ Updated init.js to use CWD resolution instead of hardcoded process.cwd()
- ✅ All 404 tests pass (389 original + 15 new tests for CWD resolution)
- ✅ Integration with existing IDE selection flow maintained

### File List

**Modified Files:**
- `cli/src/index.js` - Added path argument and --here flag to init command
- `cli/src/commands/init.js` - Added CWD resolution and validation logic

**New Files:**
- `src/js-utils/init-cwd-resolution.test.js` - Unit tests for CWD resolution logic (15 tests)
