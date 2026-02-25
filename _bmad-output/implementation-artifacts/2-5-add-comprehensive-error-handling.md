# Story 2.5: Add Comprehensive Error Handling

Status: done

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As a Developer,
I want consistent error handling across all file operations,
So that failures are properly reported with actionable messages.

## Acceptance Criteria

1. **Given** Any file operation that fails
   **When** Operation encounters an error
   **Then** Error object contains success: false
   **And** Error includes standardized error code
   **And** Error includes human-readable message
   **And** Error includes operation context details

## Tasks / Subtasks

- [x] Task 1: Audit existing error handling in file-ops.js (AC: #1)
  - [x] Subtask 1.1: Review all error responses in copyFile/copyFileAsync
  - [x] Subtask 1.2: Review all error responses in moveFile/moveFileAsync
  - [x] Subtask 1.3: Review all error responses in deleteFile/deleteFileAsync
  - [x] Subtask 1.4: Review all error responses in createDirectory/createDirectoryAsync
  - [x] Subtask 1.5: Review all error responses in ensureDirectory
  - [x] Subtask 1.6: Document inconsistencies found
- [x] Task 2: Standardize error codes across all operations (AC: #1)
  - [x] Subtask 2.1: Define complete error code taxonomy
  - [x] Subtask 2.2: Apply ERR_COPY_* codes consistently
  - [x] Subtask 2.3: Apply ERR_MOVE_* codes consistently
  - [x] Subtask 2.4: Apply ERR_DELETE_* codes consistently
  - [x] Subtask 2.5: Apply ERR_DIR_* codes consistently
- [x] Task 3: Ensure error message consistency (AC: #1)
  - [x] Subtask 3.1: Verify all messages are human-readable
  - [x] Subtask 3.2: Ensure consistent message format
  - [x] Subtask 3.3: Add contextual info where missing
- [x] Task 4: Verify operation context in error details (AC: #1)
  - [x] Subtask 4.1: Ensure all errors include operation name
  - [x] Subtask 4.2: Ensure all errors include relevant paths
  - [x] Subtask 4.3: Ensure all errors include original error code
- [x] Task 5: Add comprehensive error handling tests (AC: #1)
  - [x] Subtask 5.1: Add tests for error code consistency
  - [x] Subtask 5.2: Add tests for error message format
  - [x] Subtask 5.3: Add tests for error details completeness

## Dev Notes

- This story implements comprehensive error handling for Epic 2: Core File Operations
- **CRITICAL**: This story ENSURES ALL file operations have consistent, comprehensive error handling
- Error handling is partially implemented - this story standardizes and completes it
- Must follow architecture standards for error handling from architecture.md
- **Key insight**: Looking at the current implementation, error handling exists but may have inconsistencies across operations

### Project Structure Notes

**File to Modify:**
- `src/js-utils/file-ops.js` - Audit and standardize error handling across ALL functions

**Test File to Modify:**
- `src/js-utils/file-ops.test.js` - Add comprehensive error handling tests

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

- [Source: _bmad-output/planning-artifacts/epics.md#Story-25-Add-Comprehensive-Error-Handling]
- [Source: _bmad-output/planning-artifacts/architecture.md#Error-Handling-Strategy]
- [Source: _bmad-output/planning-artifacts/architecture.md#Critical-Decision-Error-Handling-Strategy]
- [Source: src/js-utils/file-ops.js (current implementation)]

---

## Dev Agent Record

### Agent Model Used

- minimax/minimax-m2.5:free

### Debug Log References

- No debug logs needed for this implementation

### Completion Notes List

- Standardized error codes across all file operations (ERR_COPY_*, ERR_MOVE_*, ERR_DELETE_*, ERR_DIR_*)
- Fixed ensureDirectory to use ERR_DIR_CREATE_FAILED instead of ERR_COPY_DIR_CREATE
- Fixed createDirectory/createDirectoryAsync to use ERR_DIR_CREATE_FAILED instead of ERR_DIR_CREATE
- Fixed ERR_DIR_EXISTS_NOT_DIR to ERR_DIR_NOT_EMPTY
- Fixed ERR_DIR_READONLY to ERR_DIR_PERMISSION
- Fixed ERR_DELETE_IS_DIR to ERR_DELETE_NOT_FILE
- Added originalError to all early-return error responses
- Added comprehensive error handling tests covering:
  - All operations return {success: false} on error
  - All errors use standardized error codes
  - All errors include human-readable messages
  - All errors include operation context details
  - Error codes consistent between sync and async versions
  - Error details include original Node.js error codes

### File List

- src/js-utils/file-ops.js (created - standardized error handling)
- src/js-utils/file-ops.test.js (created - added comprehensive error handling tests)

---

## Change Log

- 2026-02-25: Implemented comprehensive error handling standardization
  - Fixed ensureDirectory to use ERR_DIR_CREATE_FAILED
  - Fixed createDirectory to use ERR_DIR_CREATE_FAILED and ERR_DIR_NOT_EMPTY
  - Fixed ERR_DIR_READONLY to ERR_DIR_PERMISSION
  - Fixed ERR_DELETE_IS_DIR to ERR_DELETE_NOT_FILE
  - Added originalError to all early-return error responses
  - Added 30+ new error handling tests

---

## Review Fixes Applied (AI Code Review)

<!-- To be filled if review fixes are needed -->

- 2026-02-25: Fixed error message format in deleteFileAsync to use error.message instead of custom message
- 2026-02-25: Added missing originalError to moveFileAsync cross-volume verification error paths

---

## Developer Context (ULTIMATE STORY CONTEXT)

### Technical Requirements

1. **Error Handling Audit**:
   - Review ALL error responses in file-ops.js
   - Document any inconsistencies in error codes, messages, or details
   - Identify gaps where error handling is missing

2. **Error Code Standardization (MANDATORY per Architecture)**:
   All utilities MUST use standardized error codes:
   ```javascript
   // Copy operations - ERR_COPY_*
   ERR_COPY_SOURCE_MISSING
   ERR_COPY_SOURCE_NOT_FILE
   ERR_COPY_DIR_CREATE
   ERR_COPY_DEST_WRITE
   ERR_COPY_PERMISSION
   ERR_COPY_DEST_PATH
   ERR_COPY_DEST_IS_DIR
   ERR_COPY_READONLY
   ERR_COPY_UNKNOWN
   
   // Move operations - ERR_MOVE_*
   ERR_MOVE_SOURCE_MISSING
   ERR_MOVE_SOURCE_NOT_FILE
   ERR_MOVE_DIR_CREATE
   ERR_MOVE_CROSS_VOLUME_COPY
   ERR_MOVE_CROSS_VOLUME_DELETE
   ERR_MOVE_SOURCE_STILL_EXISTS
   ERR_MOVE_DEST_MISSING
   ERR_MOVE_PERMISSION
   ERR_MOVE_DEST_IS_DIR
   ERR_MOVE_READONLY
   ERR_MOVE_CROSS_VOLUME
   ERR_MOVE_UNKNOWN
   
   // Delete operations - ERR_DELETE_*
   ERR_DELETE_SOURCE_MISSING
   ERR_DELETE_NOT_FILE
   ERR_DELETE_PERMISSION
   ERR_DELETE_READONLY
   ERR_DELETE_FAILED
   ERR_DELETE_UNKNOWN
   
   // Directory operations - ERR_DIR_*
   ERR_DIR_CREATE_FAILED
   ERR_DIR_EXISTS
   ERR_DIR_NOT_EMPTY
   ERR_DIR_PERMISSION
   ERR_DIR_INVALID_PATH
   ERR_DIR_UNKNOWN
   ```

3. **Error Response Structure (MANDATORY)**:
   All error responses MUST follow this exact structure:
   ```javascript
   {
     success: false,
     error: {
       code: 'ERR_*',           // Standardized error code
       message: 'Human-readable description',  // User-friendly message
       details: {               // Context-specific details
         operation: 'functionName',  // Always required
         // Additional context:
         src: '/path/to/source',
         dest: '/path/to/dest',
         originalError: 'ENOENT',  // Node.js error code if available
         // ... operation-specific fields
       }
     }
   }
   ```

4. **Error Message Guidelines**:
   - Messages should be human-readable and actionable
   - Format: "Verb + description + context"
   - Examples:
     - "Source file does not exist: {path}"
     - "Permission denied to write to: {path}"
     - "Failed to create directory: {path}"

5. **Error Details Requirements**:
   Every error MUST include:
   - `operation`: The function name where error occurred
   - Relevant paths (src, dest, filePath, dirPath)
   - `originalError`: The original Node.js error code if available
   - Additional context (phase, rollback status, etc.)

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
- Error codes MUST be standardized: ERR_* prefix
- Error codes specific to each operation type

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

2. **Test Structure**:
   ```javascript
   describe('Error Handling Consistency', () => {
     // Test error code standardization
     // Test error message format
     // Test error details completeness
   });
   ```

3. **Required Test Cases**:
   - All operations return {success: false} on error
   - All errors include standardized code
   - All errors include human-readable message
   - All errors include operation context details
   - Error codes match between sync and async versions
   - Error details include original Node.js error codes

4. **Test Execution**:
   ```bash
   npm test                    # Run all tests
   npm test file-ops.test.js   # Run only file-ops tests
   ```

5. **Verification**:
   - All tests must pass
   - No linting errors
   - Error handling is consistent across all operations

### Previous Story Intelligence

**From Story 2.4: Implement File Delete Operation**

**Key Learnings:**
- deleteFile and deleteFileAsync are fully implemented
- Standardized error response structure with ERR_DELETE_* codes
- Both sync and async versions have identical error handling
- Pattern: validate input → perform operation → verify success → return standardized response

**Pattern to Continue:**
- Standardized error object structure (success/error)
- Error codes with operation-specific prefix (ERR_COPY_*, ERR_MOVE_*, etc.)
- Include operation context in error details
- Both sync and async versions should behave identically
- Comprehensive test coverage for error scenarios

**Current State in file-ops.js:**
- `copyFile()` / `copyFileAsync()` - implemented with error handling
- `moveFile()` / `moveFileAsync()` - implemented with error handling
- `deleteFile()` / `deleteFileAsync()` - implemented with error handling
- `createDirectory()` / `createDirectoryAsync()` - implemented with error handling
- `ensureDirectory()` - implemented with error handling
- **This Story**: Audit and standardize ALL error handling

### Latest Tech Information

**Node.js 18+ Error Handling Best Practices:**

1. **Consistent Error Response**:
   ```javascript
   function exampleOperation(src, dest) {
     try {
       // Operation logic
       return { success: true };
     } catch (error) {
       // Map Node.js error codes to standardized codes
       let errorCode = 'ERR_UNKNOWN';
       
       if (error.code === 'EACCES' || error.code === 'EPERM') {
         errorCode = 'ERR_PERMISSION';
       } else if (error.code === 'ENOENT') {
         errorCode = 'ERR_NOT_FOUND';
       } else if (error.code === 'EISDIR') {
         errorCode = 'ERR_IS_DIRECTORY';
       }
       
       return {
         success: false,
         error: {
           code: errorCode,
           message: error.message,
           details: {
             operation: 'exampleOperation',
             src,
             dest,
             originalError: error.code
           }
         }
       };
     }
   }
   ```

2. **Error Code Mapping**:
   | Node.js Code | Standardized Code | Context |
   |--------------|-------------------|---------|
   | EACCES | ERR_PERMISSION | Permission denied |
   | EPERM | ERR_PERMISSION | Operation not permitted |
   | ENOENT | ERR_NOT_FOUND | File/directory not found |
   | EISDIR | ERR_IS_DIRECTORY | Path is directory |
   | EROFS | ERR_READONLY | Read-only file system |
   | ENOTDIR | ERR_NOT_DIRECTORY | Path component not directory |
   | EXDEV | ERR_CROSS_DEVICE | Cross-device link |
   | EBUSY | ERR_BUSY | Resource busy |
   | EMFILE | ERR_TOO_MANY_FILES | Too many open files |
   | ENFILE | ERR_FILE_TABLE | File table overflow |

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
  - Story 2.4: Implement File Delete Operation - REVIEW
  - Story 2.5 (this): Add Comprehensive Error Handling - READY-FOR-DEV
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
 2.3- Depends on Story (Implement Directory Create Operation) - COMPLETED
- Depends on Story 2.4 (Implement File Delete Operation) - COMPLETED

**What's Already Done:**
- Project structure created (src/js-utils/ directory exists)
- Jest configured and working
- file-ops.js has all file operations implemented
- Error handling is partially implemented across all functions

**What's Needed for This Story:**
- Audit ALL error responses for consistency
- Standardize error codes across operations
- Ensure all error messages are human-readable
- Verify all error details include operation context
- Add comprehensive error handling tests

**Epic 2 Story Order (recommended):**
1. Story 2.1: File Copy - DONE ✓
2. Story 2.2: File Move - REVIEW ✓
3. Story 2.3: Directory Create - REVIEW ✓
4. Story 2.4: File Delete - REVIEW ✓
5. Story 2.5 (this): Error Handling - READY-FOR-DEV

**Key Notes:**
- This story COMPLETES the error handling for Epic 2
- Error handling exists but needs audit and standardization
- All functions should return consistent error structure
- Error codes should follow taxonomy defined above
- Tests should verify error handling consistency

**Success Criteria:**
- [ ] All operations return {success: false} on error ✓ (to verify)
- [ ] All errors include standardized error code ✓ (to verify)
- [ ] All errors include human-readable message ✓ (to verify)
- [ ] All errors include operation context details ✓ (to verify)
- [ ] Error codes consistent between sync/async ✓ (to verify)
- [ ] Error codes match taxonomy ✓ (to verify)
- [ ] Tests pass with Jest ✓ (to verify)
