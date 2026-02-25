# Story 1.1: Initialize Node.js Project Structure

Status: done

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As a Developer,
I want to initialize a Node.js project with package.json and Jest testing framework,
So that I can start developing JavaScript utilities with proper testing infrastructure.

## Acceptance Criteria

1. **Given** A clean directory without Node.js project files
   **When** I run the initialization command
   **Then** package.json is created with name, version, and test script
   **And** jest is installed as dev dependency
   **And** src/js-utils directory is created

## Tasks / Subtasks

- [x] Initialize Node.js project with npm init
  - [x] Create package.json with proper metadata
  - [x] Set test script to run Jest
- [x] Install Jest as dev dependency
  - [x] Run npm install --save-dev jest
  - [x] Verify jest is added to package.json
- [x] Create src/js-utils directory structure
  - [x] Create src/js-utils/ directory
  - [x] Verify directory exists

## Dev Notes

- This is the foundational story for all subsequent JavaScript utility development
- All other stories in Epic 1 and future epics depend on this being properly set up
- The project structure should follow the architecture specifications exactly
- Testing infrastructure is critical - all future utilities must have unit tests

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
```

**Initialization Command:**
```bash
mkdir -p src/js-utils && npm init -y && npm install --save-dev jest
```

**Key Constraints:**
- Pure JavaScript (Node.js 18+) - no TypeScript build process
- No build required - direct Node.js execution
- Jest for unit testing file operations
- Custom utilities approach (NOT oclif, commander, or yargs)
- Must preserve existing Agentfile architecture (agents, workflows, skills, configs)

### References

- [Source: _bmad-output/planning-artifacts/epics.md#Epic-1-Project-Foundation--Setup]
- [Source: _bmad-output/planning-artifacts/architecture.md#Selected-Starter-Custom-JavaScript-Utilities-Approach]
- [Source: _bmad-output/planning-artifacts/architecture.md#Code-Organization]

## Dev Agent Record

### Agent Model Used

- minimax/minimax-m2.5:free

### Debug Log References

<!-- Add debug log file paths after implementation -->

### Completion Notes List

- Updated package.json test script to use Jest
- Created jest.config.js with proper configuration for src/js-utils directory
- Created src/js-utils/project-setup.test.js with 5 tests verifying:
  - package.json exists and has valid structure
  - package.json has test script configured for Jest
  - jest.config.js exists
  - src/js-utils directory exists
  - project uses CommonJS module system
- All tests pass successfully

### File List

- package.json (modified - test script updated)
- jest.config.js (new)
- src/js-utils/project-setup.test.js (new)

---

## Change Log

- 2026-02-24: Initialized Node.js project with Jest testing framework
  - Updated package.json test script to use Jest
  - Created jest.config.js configuration
  - Created src/js-utils/project-setup.test.js for verification tests

## Developer Context (ULTIMATE STORY CONTEXT)

### Technical Requirements

1. **Node.js Version**: Must be 18+ (verify with `node --version`)
2. **Package.json Requirements**:
   - name: should reflect the project (e.g., "agentfile-js-utils")
   - version: "1.0.0" or appropriate initial version
   - test script: "jest" or "jest --coverage"
   - type: "module" (for ES6 imports) or commonjs
3. **Jest Configuration**:
   - Can use jest.config.js or package.json jest key
   - Should support ES6 modules if using "type": "module"
4. **Directory Structure**:
   - src/js-utils/ for all utility modules
   - Tests can be co-located (e.g., file-ops.test.js) or in __tests__/

### Architecture Compliance

**MUST FOLLOW:**
- Custom JavaScript utilities approach (NO oclif, commander, or yargs)
- Pure JavaScript - no build process required
- Jest for unit testing
- Modular code organization as specified
- No external runtime dependencies beyond Node.js

**Project Constraints:**
- Must preserve existing Agentfile architecture
- JavaScript layer is purely mechanical execution, not guidance
- Existing CLI interface (`agentfile` command) must remain unchanged
- IDE slash command protocol must continue working

### Library/Framework Requirements

**Required:**
- Node.js 18+ (runtime)
- Jest (dev dependency for testing)

**NOT Required (by design):**
- No CLI frameworks (oclif, commander, yargs)
- No build tools (webpack, rollup, etc.)
- No TypeScript (unless specifically needed later)

### Testing Requirements

1. **Jest Setup**:
   - Install jest as dev dependency
   - Configure test script in package.json
   - Create sample test to verify setup works

2. **Test Patterns**:
   - Unit tests for each utility function
   - Integration tests for shell script compatibility
   - Use describe/test blocks

3. **Verification**:
   - Run `npm test` to verify Jest works
   - Check test output is clear and readable

### Previous Story Intelligence

This is the FIRST story in Epic 1 - no previous story to reference.

### Git Intelligence Summary

No previous commits for this story yet. This is the initial implementation.

### Latest Tech Information

**Jest Best Practices (Latest):**
- Jest 29+ supports ES modules natively with Node.js 18+
- Use `--experimental-vm-modules` flag if needed for ESM
- Jest configuration can be in package.json or jest.config.js
- Coverage reporting with `--coverage` flag

**Node.js 18+ Features:**
- Native fetch API available
- Top-level await supported
- ES2022 features fully supported

### Project Context Reference

**Project: agentfile**
- CLI tool for workflow automation
- Currently uses shell scripts for file operations
- Migration to JavaScript utilities in progress
- All existing Agentfile projects must remain backward compatible

---

## Implementation Notes

**Status Update:**
- Epic 1 status will be updated to: "in-progress"
- Story status: "ready-for-dev"

**Next Steps After This Story:**
1. Story 1.2: Configure Project Directory Structure
2. Story 1.3: Set Up Basic Testing Infrastructure

**Success Criteria:**
- `npm test` runs successfully
- package.json contains correct configuration
- src/js-utils/ directory exists and is empty (ready for utilities)
