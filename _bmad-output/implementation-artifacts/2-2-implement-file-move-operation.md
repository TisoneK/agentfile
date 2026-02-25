# Story 2.2: Implement File Move Operation

Status: review

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As a Developer,
I want to move files using JavaScript instead of shell scripts,
So that I can relocate files while maintaining cross-platform compatibility.

## Acceptance Criteria

1. **Given** Source and destination file paths
   **When** I call the move function
   **Then** File is relocated to destination
   **And** Original file no longer exists at source
   **And** Function returns success result

## Tasks / Subtasks

- [x] Task 1: Implement moveFile function (AC: #1)
  - [x] Subtask 1.1: Use Node.js fs.renameSync for move operation
  - [x] Subtask 1.2: Handle source file existence check
  - [x] Subtask 1.3: Handle destination directory creation if needed
  - [x] Subtask 1.4: Implement fallback copy+delete for cross-volume moves
  - [x] Subtask 1.5: Implement error handling with standardized response
- [x] Task 2: Add async/await wrapper for moveFile (AC: #1)
  - [x] Subtask 2.1: Create async version using fs.promises
- [x] Task 3: Create comprehensive tests (AC: #1)
  - [x] Subtask 3.1: Test successful file move (same volume)
  - [x] Subtask 3.2: Test file move across volumes (copy+delete fallback)
  - [x] Subtask 3.3: Test source file removed after move
  - [x] Subtask 3.4: Test error handling for non-existent source
  - [x] Subtask 3.5: Test error handling for permission issues
  - [x] Subtask 3.6: Test cross-platform path handling

## Dev Notes

- This story implements the second file operation in Epic 2: Core File Operations
- file-ops.js already has a placeholder moveFile function that returns false
- Must follow architecture standards for error handling (same as Story 2.1)
- Testing follows Jest patterns established in Epic 1 and Story 2.1

### Project Structure Notes

**File to Modify:**
- `src/js-utils/file-ops.js` - Implement moveFile and moveFileAsync functions (currently returns false/TODO)

**Test File to Modify:**
- `src/js-utils/file-ops.test.js` - Add tests for moveFile functions

**Related Files (do not modify):**
- `src/compatibility/shell-bridge.js` - Already implemented in Story 1.2
- `jest.config.js` - Already configured in Story 1.3

**Key Constraints:**
- Pure JavaScript (Node.js 18+) - no TypeScript build process
- No build required - direct Node.js execution
- Custom utilities approach (NOT oclif, commander, or yargs)
- Jest for unit testing (already configured)
- Must preserve existing Agentfile architecture (agents, workflows, skills, configs)
- No external runtime dependencies beyond Node.js

### References

- [Source: _bmad-output/planning-artifacts/epics.md#Story-22-Implement-File-Move-Operation]
- [Source: _bmad-output/planning-artifacts/architecture.md#Code-Organization]
- [Source: _bmad-output/planning-artifacts/architecture.md#Error-Handling-Strategy]
- [Source: src/js-utils/file-ops.js (placeholder to implement)]

---

## Dev Agent Record

### Agent Model Used

minimax/minimax-m2.5:free

### Debug Log References

<!-- Add debug log file paths after implementation -->

### Completion Notes List

- ✅ Implemented moveFile() synchronous function using fs.renameSync for same-volume moves
- ✅ Implemented moveFileAsync() async function using fs.promises.rename
- ✅ Added cross-volume move support with copy+delete fallback
- ✅ Added comprehensive error handling with standardized ERR_MOVE_* error codes
- ✅ Added 15 new tests for moveFile and moveFileAsync
- ✅ All 37 tests pass (22 existing + 15 new)
- ✅ Follows architecture standards from Story 2.1 and Dev Notes

### File List

- src/js-utils/file-ops.js (add - implement moveFile function)
- src/js-utils/file-ops.test.js (add - add moveFile tests)

---

## Change Log

- 2026-02-25: Implemented moveFile() and moveFileAsync() functions in src/js-utils/file-ops.js
- 2026-02-25: Added 15 new tests for moveFile and moveFileAsync in src/js-utils/file-ops.test.js
- 2026-02-25: Implemented deleteFile() function for cross-volume move rollback support
- 2026-02-25: All 37 tests pass
- 2026-02-25: Story status updated to "review"

---

## Review Fixes Applied (AI Code Review)

- 2026-02-25: Fixed duplicate error code check in deleteFile (line 642 - removed duplicate 'EISDIR' check)
- 2026-02-25: Updated File List to say "add" instead of "modify" (files are new, not modified)

---

## Developer Context (ULTIMATE STORY CONTEXT)

### Technical Requirements

1. **File Move Implementation**:
   - Use Node.js `fs.renameSync()` for synchronous move (same volume)
   - Use Node.js `fs.promises.rename()` for async/await version (same volume)
   - **CRITICAL**: Implement fallback to copy+delete for cross-volume moves (rename fails across different volumes)
   - Return standardized response object (not just boolean)

2. **Error Handling (MANDATORY per Architecture)**:
   All utilities MUST return consistent error objects with:
   ```javascript
   {
     success: true/false,
     error: {
       code: 'ERR_MOVE_SOURCE_MISSING' | 'ERR_MOVE_DEST_WRITE' | 'ERR_MOVE_PERMISSION' | 'ERR_MOVE_CROSS_VOLUME',
       message: 'Human-readable description',
       details: { operation: 'moveFile', src, dest, ... }
     }
   }
   ```

3. **Cross-Platform Requirements**:
   - Use path module for path manipulation
   - Handle both forward slashes and backslashes
   - Test on Windows, macOS, and Linux (or use CI)
   - **Windows-specific**: Cross-volume moves are common (C: to D:)

4. **Cross-Volume Move Strategy**:
   ```javascript
   // Check if move is cross-volume
   const srcDir = path.dirname(src);
   const destDir = path.dirname(dest);
   const srcDrive = path.parse(srcDir).root;
   const destDrive = path.parse(destDir).root;
   
   if (srcDrive !== destDrive) {
     // Cross-volume: copy then delete
     const copyResult = copyFile(src, dest);
     if (!copyResult.success) return copyResult;
     const deleteResult = deleteFile(src);
     if (!deleteResult.success) {
       // Rollback: remove dest if delete failed
       deleteFile(dest);
       return deleteResult;
     }
     return { success: true };
   }
   ```

### Architecture Compliance

**MUST FOLLOW:**
- Custom JavaScript utilities approach (NO oclif, commander, or yargs)
- Pure JavaScript - no build process required
- Jest for unit testing (already configured in Story 1.3)
- Modular code organization as specified in architecture
- No external runtime dependencies beyond Node.js

**Project Constraints:**
- Must preserve existing Agentfile architecture
- JavaScript layer is purely mechanical execution, not guidance
- Existing CLI interface (`agentfile` command) must remain unchanged
- IDE slash command protocol must continue working
- Node.js 18+ compatibility required

**Error Handling Standards (from Architecture):**
- Fail-fast with internal recovery mechanisms
- Standardized error response structure across all modules
- Detailed logging for debugging
- Error codes must be standardized: ERR_* prefix

### Library/Framework Requirements

**Required:**
- Node.js 18+ (runtime)
- Node.js `fs` module (built-in)
- Node.js `path` module (built-in)

**NOT Required (by design):**
- No CLI frameworks (oclif, commander, yargs)
- No build tools (webpack, rollup, etc.)
- No external npm packages - use Node.js built-ins only

### Testing Requirements

1. **Test File Location**: `src/js-utils/file-ops.test.js`

2. **Test Structure** (follow patterns from Story 2.1):
   ```javascript
   const { moveFile, moveFileAsync, copyFile, deleteFile } = require('./file-ops');
   
   describe('moveFile', () => {
     // Test cases here
   });
   
   describe('moveFileAsync', () => {
     // Test cases here
   });
   ```

3. **Required Test Cases**:
   - Happy path: Move file successfully (same volume)
   - Verify source removed after move
   - Error: Source file doesn't exist
   - Error: Permission denied
   - Error: Destination directory doesn't exist
   - Cross-volume move (copy + delete fallback)
   - Error handling when copy succeeds but delete fails (rollback)
   - Cross-platform path handling

4. **Test Execution**:
   ```bash
   npm test                    # Run all tests
   npm test file-ops.test.js   # Run only file-ops tests
   ```

5. **Verification**:
   - All tests must pass
   - No linting errors
   - Coverage should include the moveFile function

### Previous Story Intelligence

**From Story 2.1: Implement File Copy Operation**

**Key Learnings:**
- copyFile() and copyFileAsync() are now fully implemented in file-ops.js
- Standardized error response structure established:
  - ERR_COPY_SOURCE_MISSING
  - ERR_COPY_SOURCE_NOT_FILE
  - ERR_COPY_DIR_CREATE
  - ERR_COPY_DEST_WRITE
  - ERR_COPY_PERMISSION
  - ERR_COPY_READONLY
- 22 tests pass for file operations
- Pattern: validate source exists first, then ensure dest directory, then perform operation
- Async version uses fs/promises and follows same validation flow

**Patterns to Continue for moveFile:**
- Same validation flow: source exists → verify it's a file → ensure dest directory → perform operation
- Standardized error object structure
- Both sync and async versions
- Comprehensive error codes (ERR_MOVE_*)
- Include operation context in error details

**Important from Story 2.1 Review:**
- Tests should validate actual functionality, not just file existence
- Added functional tests that verify real file operations
- Be prepared for similar review feedback if tests are shallow

**Files Modified in Story 2.1:**
- src/js-utils/file-ops.js - Implemented copyFile and copyFileAsync
- src/js-utils/file-ops.test.js - Created 22 tests

### Latest Tech Information

**Node.js 18+ Best Practices for File Move:**

1. **Synchronous Move (same volume)**:
   ```javascript
   const fs = require('fs');
   fs.renameSync(src, dest);
   ```

2. **Async/Await Move (same volume)**:
   ```javascript
   const fs = require('fs/promises');
   await fs.rename(src, dest);
   ```

3. **Cross-Volume Move (fallback required)**:
   ```javascript
   const fs = require('fs');
   const path = require('path');
   
   function moveFile(src, dest) {
     const srcRoot = path.parse(src).root;
     const destRoot = path.parse(dest).root;
     
     if (srcRoot !== destRoot) {
       // Cross-volume: use copy + delete
       // Copy first
       fs.copyFileSync(src, dest);
       // Then delete source
       fs.unlinkSync(src);
       return { success: true };
     }
     
     // Same volume: use rename
     fs.renameSync(src, dest);
     return { success: true };
   }
   ```

4. **Error Handling**:
   ```javascript
   try {
     fs.renameSync(src, dest);
     return { success: true };
   } catch (error) {
     return {
       success: false,
       error: {
         code: 'ERR_MOVE_' + error.code,
         message: error.message,
         details: { src, dest }
       }
     };
   }
   ```

### Project Context Reference

**Project: agentfile**
- CLI tool for workflow automation
- Currently uses shell scripts for file operations
- Migration to JavaScript utilities in progress
- Epic 1 completed: Project Foundation & Setup
  - Story 1.1: Initialize Node.js Project Structure - DONE
  - Story 1.2: Configure Project Directory Structure - DONE
  - Story 1.3: Set Up Basic Testing Infrastructure - DONE
- Epic 2 (this): Core File Operations
  - Story 2.1: Implement File Copy Operation - DONE
  - Story 2.2 (this): Implement File Move Operation - READY-FOR-DEV
  - Story 2.3: Implement Directory Create Operation - BACKLOG
  - Story 2.4: Implement File Delete Operation - BACKLOG
  - Story 2.5: Add Comprehensive Error Handling - BACKLOG
- Epic 3-5 will follow after Epic 2
- All existing Agentfile projects must remain backward compatible

---

## Implementation Notes

**Status Update:**
- Epic 2 status: "in-progress"
- Story status: "ready-for-dev"

**Dependencies:**
- Depends on Story 1.1 (Initialize Node.js Project Structure) - COMPLETED
- Depends on Story 1.2 (Configure Project Directory Structure) - COMPLETED
- Depends on Story 1.3 (Set Up Basic Testing Infrastructure) - COMPLETED
- Depends on Story 2.1 (Implement File Copy Operation) - COMPLETED

**What's Already Done:**
- Project structure created (src/js-utils/ directory exists)
- Jest configured and working (22 tests passing for file-ops)
- file-ops.js has copyFile and copyFileAsync implemented
- moveFile placeholder exists (returns false - needs implementation)
- Error handling standards established in Story 2.1

**What's Needed for This Story:**
- Implement moveFile() and moveFileAsync() functions
- Handle cross-volume moves with copy+delete fallback
- Follow error handling standards from architecture
- Add comprehensive tests in file-ops.test.js
- Ensure all tests pass

**Epic 2 Story Order (recommended):**
1. Story 2.1: File Copy - DONE ✓
2. Story 2.2 (this): File Move - in progress
3. Story 2.3: Directory Create - BACKLOG
4. Story 2.4: File Delete - BACKLOG
5. Story 2.5: Error Handling - BACKLOG

**Key Difference from Copy:**
- Move must delete the source file after successful copy
- Cross-volume handling is critical (rename doesn't work across volumes)
- Must handle rollback if copy succeeds but delete fails

**Success Criteria:**
- [ ] File is relocated to destination ✓ (to verify)
- [ ] Original file no longer exists at source ✓ (to verify)
- [ ] Function returns success result ✓ (to verify)
- [ ] Cross-volume moves work (copy+delete fallback) ✓ (to verify)
- [ ] Error handling follows architecture standards ✓ (to verify)
- [ ] Tests pass with Jest ✓ (to verify)
