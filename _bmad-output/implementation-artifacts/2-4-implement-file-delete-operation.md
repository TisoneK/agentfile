# Story 2.4: Implement File Delete Operation

Status: done

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As a Developer,
I want to delete files using JavaScript instead of shell scripts,
So that file deletion works consistently across platforms.

## Acceptance Criteria

1. **Given** File path to delete
   **When** I call the delete function
   **Then** File is removed from filesystem
   **And** Function returns success result
   **And** Error is returned if file doesn't exist

## Tasks / Subtasks

- [x] Task 1: Implement deleteFileAsync function (AC: #1)
  - [x] Subtask 1.1: Use Node.js fs.promises.unlink for async delete
  - [x] Subtask 1.2: Follow same error handling pattern as deleteFile
  - [x] Subtask 1.3: Include verification after delete
- [x] Task 2: Add deleteFileAsync to module exports (AC: #1)
  - [x] Subtask 2.1: Export deleteFileAsync alongside deleteFile
- [x] Task 3: Create comprehensive tests (AC: #1)
  - [x] Subtask 3.1: Test successful file deletion
  - [x] Subtask 3.2: Test error handling for non-existent file
  - [x] Subtask 3.3: Test error handling for directory path (not a file)
  - [x] Subtask 3.4: Test error handling for permission issues
  - [x] Subtask 3.5: Verify consistency between sync and async versions

## Dev Notes

- This story implements the fourth file operation in Epic 2: Core File Operations
- file-ops.js already has a synchronous `deleteFile` function implemented
- **CRITICAL**: This story implements `deleteFileAsync` - the async/await version
- Must follow architecture standards for error handling (same as Story 2.1, 2.2, 2.3)
- Testing follows Jest patterns established in Epic 1 and Stories 2.1, 2.2, 2.3
- **Key insight**: Looking at the exports, `deleteFileAsync` is missing while all other operations have both sync and async versions

### Project Structure Notes

**File to Modify:**
- `src/js-utils/file-ops.js` - Implement deleteFileAsync function (currently missing from exports)

**Test File to Modify:**
- `src/js-utils/file-ops.test.js` - Add tests for deleteFileAsync function

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

- [Source: _bmad-output/planning-artifacts/epics.md#Story-24-Implement-File-Delete-Operation]
- [Source: _bmad-output/planning-artifacts/architecture.md#Code-Organization]
- [Source: _bmad-output/planning-artifacts/architecture.md#Error-Handling-Strategy]
- [Source: src/js-utils/file-ops.js (deleteFile sync version already implemented)]

---

## Dev Agent Record

### Agent Model Used

<!-- To be filled by implementing developer -->

### Debug Log References

<!-- Add debug log file paths after implementation -->

### Completion Notes List

**Implementation Date:** 2026-02-25

**Summary:**
- Implemented `deleteFileAsync` function using `fs.promises.unlink()`
- Added comprehensive tests covering happy path, error handling, and consistency with sync version
- All 112 tests pass (17 new tests for deleteFile and deleteFileAsync)

**Files Modified:**
- `src/js-utils/file-ops.js` - Added deleteFileAsync function and exports
- `src/js-utils/file-ops.test.js` - Added tests for deleteFile and deleteFileAsync

**Acceptance Criteria Verification:**
- ✅ AC #1: File is removed from filesystem - Implemented with verification
- ✅ AC #1: Function returns success result - Returns {success: true}
- ✅ AC #1: Error is returned if file doesn't exist - Returns ERR_DELETE_SOURCE_MISSING

### File List

- src/js-utils/file-ops.js (new - implement deleteFileAsync function)
- src/js-utils/file-ops.test.js (new - add deleteFileAsync tests)

---

## Change Log

**2026-02-25:**
- Implemented `deleteFileAsync` function using `fs.promises.unlink()`
- Added `deleteFileAsync` to module exports
- Added comprehensive tests for deleteFile (sync) and deleteFileAsync (async)
- Verified consistency between sync and async versions
- All 78 tests pass

---

## Review Fixes Applied (AI Code Review)

- Fixed test count in Dev Agent Record: 78 → 112 tests
- Fixed error message in deleteFileAsync catch block to use standardized format
- Updated test file comment to reflect all tested functions

---

---

## Developer Context (ULTIMATE STORY CONTEXT)

### Technical Requirements

1. **File Delete Async Implementation**:
   - Use Node.js `fs.promises.unlink()` for asynchronous delete
   - Follow the same validation pattern as `deleteFile`:
     - Check if file exists first
     - Check if path is actually a file (not directory)
     - Perform delete operation
     - Verify deletion was successful
   - Return standardized response object (not just boolean)

2. **Error Handling (MANDATORY per Architecture)**:
   All utilities MUST return consistent error objects with:
   ```javascript
   {
     success: true/false,
     error: {
       code: 'ERR_DELETE_*' | 'ERR_DELETE_SOURCE_MISSING' | 'ERR_DELETE_NOT_FILE' | 'ERR_DELETE_PERMISSION' | 'ERR_DELETE_FAILED',
       message: 'Human-readable description',
       details: { operation: 'deleteFileAsync', filePath, ... }
     }
   }
   ```

3. **Key Difference from deleteFile (sync)**:
   - `deleteFile(filePath)` - synchronous version using `fs.unlinkSync()`
   - `deleteFileAsync(filePath)` - async version using `fs.promises.unlink()`
   - Both should have identical behavior and error codes
   - Error codes should use ERR_DELETE_* prefix consistently

4. **Cross-Platform Requirements**:
   - Use path module for path manipulation
   - Handle both forward slashes and backslashes
   - Test on Windows, macOS, and Linux (or use CI)
   - `fs.unlink()` works consistently across platforms

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
- Error codes specific to delete operations should use ERR_DELETE_* prefix

### Library/Framework Requirements

**Required:**
- Node.js 18+ (runtime)
- Node.js `fs` module (built-in)
- Node.js `fs/promises` module (built-in)
- Node.js `path` module (built-in)

**NOT Required (by design):**
- No CLI frameworks (oclif, commander, yargs)
- No build tools (webpack, rollup, etc.)
- No external npm packages - use Node.js built-ins only

### Testing Requirements

1. **Test File Location**: `src/js-utils/file-ops.test.js`

2. **Test Structure** (follow patterns from Stories 2.1, 2.2, 2.3):
   ```javascript
   const { deleteFile, deleteFileAsync } = require('./file-ops');
   
   describe('deleteFileAsync', () => {
     // Test cases here
   });
   ```

3. **Required Test Cases**:
   - Happy path: Delete file successfully
   - Error: File doesn't exist (should return ERR_DELETE_SOURCE_MISSING)
   - Error: Path is a directory not a file (should return ERR_DELETE_NOT_FILE)
   - Error: Permission denied
   - Cross-platform path handling
   - Consistency between deleteFile (sync) and deleteFileAsync

4. **Test Execution**:
   ```bash
   npm test                    # Run all tests
   npm test file-ops.test.js   # Run only file-ops tests
   ```

5. **Verification**:
   - All tests must pass
   - No linting errors
   - Coverage should include the deleteFileAsync function
   - Ensure tests are functional (test actual behavior, not just existence)

### Previous Story Intelligence

**From Story 2.3: Implement Directory Create Operation**

**Key Learnings:**
- `createDirectory()` and `createDirectoryAsync()` are now fully implemented in file-ops.js
- 61 tests pass for file operations (37 existing + 24 new)
- Standardized error response structure established with ERR_DIR_* codes
- Both sync and async versions have identical behavior
- Pattern: validate input → perform operation → verify success → return standardized response

**Pattern to Continue for deleteFileAsync:**
- Standardized error object structure (success/error)
- Error codes with ERR_DELETE_* prefix
- Include operation context in error details
- Both sync and async versions should behave identically
- Comprehensive test coverage with functional tests
- Verify actual deletion, not just existence checks

**What's Already Implemented in file-ops.js:**
- `ensureDirectory()` - helper that creates parent directories
- `copyFile()` / `copyFileAsync()` - implemented
- `moveFile()` / `moveFileAsync()` - implemented
- `deleteFile()` - implemented (synchronous)
- `createDirectory()` / `createDirectoryAsync()` - implemented
- **Missing**: `deleteFileAsync()` ← THIS STORY

### Latest Tech Information

**Node.js 18+ Best Practices for File Deletion:**

1. **Async Delete**:
   ```javascript
   const fs = require('fs/promises');
   
   async function deleteFileAsync(filePath) {
     try {
       await fs.unlink(filePath);
       return { success: true };
     } catch (error) {
       // Handle errors
     }
   }
   ```

2. **Error Handling Pattern** (follow same as deleteFile sync):
   ```javascript
   try {
     // Validate file exists
     if (!fs.existsSync(filePath)) {
       return {
         success: false,
         error: {
           code: 'ERR_DELETE_SOURCE_MISSING',
           message: `File does not exist: ${filePath}`,
           details: { operation: 'deleteFileAsync', filePath }
         }
       };
     }
     
     // Verify it's a file (not directory)
     const stats = fs.statSync(filePath);
     if (!stats.isFile()) {
       return {
         success: false,
         error: {
           code: 'ERR_DELETE_NOT_FILE',
           message: `Path is not a file: ${filePath}`,
           details: { operation: 'deleteFileAsync', filePath }
         }
       };
     }
     
     // Perform delete
     await fsPromises.unlink(filePath);
     
     // Verify deletion
     if (fs.existsSync(filePath)) {
       return {
         success: false,
         error: {
           code: 'ERR_DELETE_FAILED',
           message: 'File deletion failed - file still exists after operation',
           details: { operation: 'deleteFileAsync', filePath }
         }
       };
     }
     
     return { success: true };
   } catch (error) {
     // Handle specific error codes
   }
   ```

3. **Error Code Mapping**:
   - `EACCES` / `EPERM` → `ERR_DELETE_PERMISSION`
   - `ENOENT` → `ERR_DELETE_SOURCE_MISSING`
   - `EISDIR` → `ERR_DELETE_NOT_FILE`
   - `EROFS` → `ERR_DELETE_READONLY`

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
  - Story 2.2: Implement File Move Operation - REVIEW
  - Story 2.3: Implement Directory Create Operation - REVIEW
  - Story 2.4 (this): Implement File Delete Operation - READY-FOR-DEV
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
- Depends on Story 2.2 (Implement File Move Operation) - COMPLETED
- Depends on Story 2.3 (Implement Directory Create Operation) - COMPLETED

**What's Already Done:**
- Project structure created (src/js-utils/ directory exists)
- Jest configured and working (61 tests passing for file-ops)
- file-ops.js has copyFile, copyFileAsync, moveFile, moveFileAsync implemented
- deleteFile (sync) already implemented
- createDirectory, createDirectoryAsync implemented
- ensureDirectory() helper exists
- Error handling standards established
- Standardized error response structure with ERR_* codes

**What's Needed for This Story:**
- Implement `deleteFileAsync(filePath)` function using fs.promises.unlink()
- Add `deleteFileAsync` to module exports
- Handle same error cases as deleteFile:
  - File doesn't exist → ERR_DELETE_SOURCE_MISSING
  - Path is directory not file → ERR_DELETE_NOT_FILE
  - Permission denied → ERR_DELETE_PERMISSION
  - Read-only file system → ERR_DELETE_READONLY
- Add comprehensive tests in file-ops.test.js
- Ensure all tests pass (should be ~67+ tests)

**Epic 2 Story Order (recommended):**
1. Story 2.1: File Copy - DONE ✓
2. Story 2.2: File Move - REVIEW ✓
3. Story 2.3: Directory Create - REVIEW ✓
4. Story 2.4 (this): File Delete - READY-FOR-DEV
5. Story 2.5: Error Handling - BACKLOG

**Key Notes:**
- deleteFile already exists (sync version) - implement deleteFileAsync (async version)
- Follow exact same pattern as deleteFile for consistency
- fs.promises.unlink() is the async equivalent of fs.unlinkSync()
- Include verification after delete to confirm file is actually gone
- Tests should verify actual file deletion, not just existence checks
- Error codes MUST match between sync and async versions

**Success Criteria:**
- [ ] File is removed from filesystem ✓ (to verify)
- [ ] Function returns success result ✓ (to verify)
- [ ] Error is returned if file doesn't exist ✓ (to verify)
- [ ] deleteFileAsync exported from module ✓ (to verify)
- [ ] Error handling follows architecture standards ✓ (to verify)
- [ ] Tests pass with Jest ✓ (to verify)
- [ ] Consistency between sync and async versions ✓ (to verify)
