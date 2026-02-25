# Story 1.2: Configure Project Directory Structure

Status: done

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As a Developer,
I want the proper directory structure for all utility modules,
So that I can organize code according to architecture specifications.

## Acceptance Criteria

1. **Given** Initialized Node.js project
   **When** I create the directory structure
   **Then** src/js-utils/ directory exists
   **And** Compatibility layer directory is created
   **And** .agentfile/state/ directory is created for state persistence

## Tasks / Subtasks

- [x] Task 1: Create src/js-utils/ subdirectories (AC: #1)
  - [x] Subtask 1.1: Ensure src/js-utils/ directory exists
- [x] Task 2: Create compatibility layer directory (AC: #2)
  - [x] Subtask 2.1: Create src/compatibility/ directory
  - [x] Subtask 2.2: Create shell-bridge.js placeholder file
- [x] Task 3: Create .agentfile/state/ directory for state persistence (AC: #3)
  - [x] Subtask 3.1: Create .agentfile/ directory
  - [x] Subtask 3.2: Create state/ subdirectory

## Dev Notes

- This story builds on the Node.js project initialization from Story 1.1
- The directory structure must match the architecture specifications exactly
- The .agentfile/state/ directory is critical for Epic 4 (Workflow State Management)
- All directories should be created using Node.js fs module (no shell scripts)

### Project Structure Notes

**Required Directory Structure (from Architecture):**
```
src/
  js-utils/
    file-ops.js       # File operations module
    template-processor.js  # Template processing module
    state-manager.js  # State management module
    cli-orchestrator.js  # CLI orchestration module
  compatibility/
    shell-bridge.js   # Shell script compatibility layer
.agentfile/
  state/              # State persistence directory (Epic 4)
```

**Key Constraints:**
- Pure JavaScript (Node.js 18+) - no TypeScript build process
- No build required - direct Node.js execution
- Custom utilities approach (NOT oclif, commander, or yargs)
- Must preserve existing Agentfile architecture (agents, workflows, skills, configs)

### References

- [Source: _bmad-output/planning-artifacts/epics.md#Story-12-Configure-Project-Directory-Structure]
- [Source: _bmad-output/planning-artifacts/architecture.md#Code-Organization]
- [Source: _bmad-output/planning-artifacts/architecture.md#State-Persistence-Format]
- [Source: _bmad-output/planning-artifacts/epics.md#FR-Coverage-Map]

---

## Dev Agent Record

### Agent Model Used

minimax/minimax-m2.5:free (via bmad-bmm-architect mode)

### Debug Log References

<!-- Add debug log file paths after implementation -->

### Completion Notes List

- Created src/compatibility/ directory using Node.js fs.mkdirSync with { recursive: true }
- Created .agentfile/state/ directory for Epic 4 state persistence
- Created 5 placeholder files:
  - src/js-utils/file-ops.js
  - src/js-utils/template-processor.js
  - src/js-utils/state-manager.js
  - src/js-utils/cli-orchestrator.js
  - src/compatibility/shell-bridge.js
- Created comprehensive test suite (src/js-utils/directory-structure.test.js) with 9 tests
- All 14 tests pass (including Story 1.1 tests)

### File List

- src/compatibility/ (new directory)
- src/compatibility/shell-bridge.js (new placeholder file)
- .agentfile/ (new directory)
- .agentfile/state/ (new subdirectory)
- src/js-utils/file-ops.js (new placeholder file)
- src/js-utils/template-processor.js (new placeholder file)
- src/js-utils/state-manager.js (new placeholder file)
- src/js-utils/cli-orchestrator.js (new placeholder file)
- src/js-utils/directory-structure.test.js (new test file)

---

## Change Log

- 2026-02-25: Created directory structure per architecture specifications - src/compatibility/, .agentfile/state/, and all placeholder files

---

## Developer Context (ULTIMATE STORY CONTEXT)

### Technical Requirements

1. **Directory Creation**:
   - Use Node.js `fs.mkdir()` with `{ recursive: true }` option
   - Create: `src/js-utils/`, `src/compatibility/`, `.agentfile/state/`
   
2. **Placeholder Files**:
   - Create empty placeholder files for future modules:
     - `src/js-utils/file-ops.js`
     - `src/js-utils/template-processor.js`
     - `src/js-utils/state-manager.js`
     - `src/js-utils/cli-orchestrator.js`
     - `src/compatibility/shell-bridge.js`

3. **State Directory**:
   - `.agentfile/state/` must be created at project root
   - This directory will store workflow state YAML files (Epic 4)
   - Initial state can be empty - Epic 4 will populate it

### Architecture Compliance

**MUST FOLLOW:**
- Custom JavaScript utilities approach (NO oclif, commander, or yargs)
- Pure JavaScript - no build process required
- Jest for unit testing (already configured from Story 1.1)
- Modular code organization as specified
- No external runtime dependencies beyond Node.js

**Project Constraints:**
- Must preserve existing Agentfile architecture
- JavaScript layer is purely mechanical execution, not guidance
- Existing CLI interface (`agentfile` command) must remain unchanged
- IDE slash command protocol must continue working
- Node.js 18+ compatibility required

### Library/Framework Requirements

**Required:**
- Node.js 18+ (runtime) - built-in `fs` module for directory creation

**NOT Required (by design):**
- No CLI frameworks (oclif, commander, yargs)
- No build tools (webpack, rollup, etc.)
- No external dependencies

### Testing Requirements

1. **Directory Verification Tests**:
   - Test that all required directories exist
   - Test that placeholder files are created
   - Test that state directory is properly placed at project root

2. **Test Patterns**:
   - Use Jest (already configured from Story 1.1)
   - Unit tests for directory verification
   - Use `fs.existsSync()` to verify directory existence

3. **Verification**:
   - Run `npm test` to verify all tests pass
   - Verify directory structure matches architecture spec

### Previous Story Intelligence

**From Story 1.1: Initialize Node.js Project Structure**

**Key Learnings:**
- package.json test script updated to use Jest
- jest.config.js created with proper configuration for src/js-utils directory
- src/js-utils/project-setup.test.js created with 5 verification tests
- All tests pass successfully
- Project uses CommonJS module system

**Files Created/Modified in Story 1.1:**
- package.json (modified - test script updated)
- jest.config.js (new)
- src/js-utils/project-setup.test.js (new)

**Patterns to Continue:**
- Use Jest for all testing
- Verify with npm test
- Keep module system consistent (CommonJS)

### Git Intelligence Summary

<!-- To be filled after first commit if available -->

No previous commits specific to this story. Will be created after Story 1.1 is merged.

### Latest Tech Information

**Node.js 18+ Best Practices for Directory Operations:**
- Use `fs.mkdir(path, { recursive: true })` to create nested directories
- Use `fs.existsSync(path)` to check if directory exists
- Use `path.join()` for cross-platform path construction
- Use `path.resolve()` to get absolute paths

**Directory Creation Example:**
```javascript
const fs = require('fs');
const path = require('path');

// Create nested directories
fs.mkdirSync(path.join(__dirname, 'src', 'js-utils'), { recursive: true });
fs.mkdirSync(path.join(__dirname, 'src', 'compatibility'), { recursive: true });
fs.mkdirSync(path.join(__dirname, '.agentfile', 'state'), { recursive: true });
```

### Project Context Reference

**Project: agentfile**
- CLI tool for workflow automation
- Currently uses shell scripts for file operations
- Migration to JavaScript utilities in progress (Epic 1)
- Story 1.1 completed: Node.js project initialized with Jest
- Story 1.2 (this): Configure project directory structure
- Story 1.3 next: Set up basic testing infrastructure
- All existing Agentfile projects must remain backward compatible

---

## Implementation Notes

**Status Update:**
- Epic 1 status: "in-progress" (already set from Story 1.1)
- Story status: "ready-for-dev"

**Dependencies:**
- Depends on Story 1.1 (Initialize Node.js Project Structure) - COMPLETED
- Story 1.3 (Set Up Basic Testing Infrastructure) depends on this story

**Next Steps After This Story:**
1. Story 1.3: Set Up Basic Testing Infrastructure
2. Epic 2: Core File Operations (Stories 2.1-2.5)

**Success Criteria:**
- All directories exist at correct paths
- Placeholder files created for future modules
- Tests verify directory structure
- No shell scripts used for directory creation
