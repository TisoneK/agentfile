# Story 3.4: Implement Partial Templates

Status: done

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As a Developer,
I want to include partial templates within other templates,
So that I can reuse common template components.

## Acceptance Criteria

1. **Given** A main template that includes a partial
   **When** I process the template
   **Then** Partial content is inserted at include location
   **And** Partials can access parent context
   **And** Nested partials work correctly

## Tasks / Subtasks

- [x] Task 1: Extend template-processor.js with partial template support (AC: #1)
  - [x] Subtask 1.1: Add partial file loading function
  - [x] Subtask 1.2: Implement partial include syntax parsing
  - [x] Subtask 1.3: Handle partial content insertion
  - [x] Subtask 1.4: Implement parent context access for partials
  - [x] Subtask 1.5: Handle nested partials (partials including partials)
  - [x] Subtask 1.6: Integrate with existing processTemplate function
- [x] Task 2: Add comprehensive partial template tests (AC: #1)
  - [x] Subtask 2.1: Create test cases for basic partial includes
  - [x] Subtask 2.2: Test partial with parent context access
  - [x] Subtask 2.3: Test nested partials
  - [x] Subtask 2.4: Test partial with variables and conditionals
  - [x] Subtask 2.5: Test partial not found error handling
- [x] Task 3: Verify error handling integration (AC: #1)
  - [x] Subtask 3.1: Handle missing partial files
  - [x] Subtask 3.2: Handle circular partial references
  - [x] Subtask 3.3: Return standardized error responses

## Dev Notes

- This story implements Epic 3: Template Processing Engine - Story 3.4
- **CRITICAL**: This story BUILDS UPON Stories 3.1, 3.2, and 3.3
- Must extend the existing template-processor.js from Stories 3.1, 3.2, and 3.3
- Must follow same error handling patterns from Story 2.5

### Project Structure Notes

**File to Modify:**
- `src/js-utils/template-processor.js` - Extend with partial template support

**Test File to Modify:**
- `src/js-utils/template-processor.test.js` - Add tests for partial templates

**Related Files (do not modify):**
- `src/js-utils/file-ops.js` - Already implemented in Epic 2
- `jest.config.js` - Already configured in Story 1.3

**Key Constraints:**
- Pure JavaScript (Node.js 18+) - no TypeScript build process
- No build required - direct Node.js execution
- Custom utilities approach (NOT oclif, commander, or yargs)
- Jest for unit testing (already configured)
- Must preserve existing Agentfile architecture (agents, workflows, skills, configs)
- No external runtime dependencies beyond Node.js

### References

- [Source: _bmad-output/planning-artifacts/epics.md#Story-34-Implement-Partial-Templates]
- [Source: _bmad-output/planning-artifacts/architecture.md#Code-Organization]
- [Source: _bmad-output/implementation-artifacts/3-1-implement-basic-variable-substitution.md]
- [Source: _bmad-output/implementation-artifacts/3-2-add-conditional-block-support.md]
- [Source: _bmad-output/implementation-artifacts/3-3-add-iteration-support.md]
- [Source: src/js-utils/template-processor.js (to be extended)]

---

## Dev Agent Record

### Agent Model Used

- minimax/minimax-m2.5:free

### Debug Log References

- No debug logs needed for this implementation

### Completion Notes List

- Implemented partial template support with {{> partialName}} syntax
- Added loadPartial() function to load partial files from filesystem
- Added processPartials() function to resolve partial includes
- Partials have access to parent template context
- Nested partials (partials including partials) are supported
- Circular reference detection with ERR_TEMPLATE_PARTIAL_CIRCULAR error
- Maximum nesting depth of 10 levels with ERR_TEMPLATE_PARTIAL_DEPTH_EXCEEDED error
- Processing order: conditionals → iterations → partials → variables
- All 56 tests pass (basic + partial template + validation tests)

### File List

- src/js-utils/template-processor.js (modified - added partial template support)
- src/js-utils/template-processor.test.js (modified - added partial template tests)
- partials/header.html (new - test partial)
- partials/footer.html (new - test partial)
- partials/nested.html (new - test partial)

---

## Change Log

- 2026-02-25: Story created - ready for implementation
- 2026-02-25: Implemented partial template support in template-processor.js
- 2026-02-25: Added comprehensive tests for partial templates (19 tests, all passing)
- 2026-02-25: Story complete - ready for review

---

## Review Fixes Applied (AI Code Review)

- 2026-02-25: Fixed test count discrepancy - updated from "19 tests" to "56 tests" (all tests)

---

## Developer Context (ULTIMATE STORY CONTEXT)

### Technical Requirements

1. **Partial Template Include Function**:
   - Input: template string with {{> partialName}} includes, context object, partials directory
   - Output: processed template string with partials resolved
   - Pattern: Extend existing `processTemplate(template, context)` function with partial resolution

2. **Partial Include Syntax**:
   - Opening tag: `{{> partialName}}`
   - Partial name: alphanumeric + underscore + hyphen
   - Examples: `{{> header}}`, `{{> footer-partial}}`, `{{> common/components/button}}`
   - Path support: `{{> partials/header}}` - supports subdirectories

3. **Partial File Resolution (MANDATORY)**:
   - Default partials directory: `./partials/` (configurable)
   - File extension: `.html`, `.md`, `.txt`, or no extension (try all)
   - Resolution order: exact name → name + extension
   - Must use Node.js fs module (from file-ops.js patterns)

4. **Parent Context Access (MANDATORY)**:
   - Partials should have access to the parent template's context
   - Variables defined in main template should be available in partial
   - Support: `{{variableName}}` in partial resolves from parent context
   - Example: Main template has `{{title}}`, partial can use `{{title}}`

5. **Nested Partials (MANDATORY)**:
   - Support partials including other partials
   - Must handle circular references with error detection
   - Track resolution depth to prevent infinite loops
   - Maximum nesting depth: 10 levels (configurable)

6. **Processing Order (MANDATORY)**:
   - Process in correct order: conditionals → iterations → partials → variables
   - Partials should be resolved before variable substitution
   - This ensures partial content has access to context variables

7. **Error Response Structure (MANDATORY per Story 2.5)**:
   Follow the same error handling pattern as file-ops.js and Stories 3.1/3.2/3.3:
   ```javascript
   // Success response
   {
     success: true,
     result: 'processed template string'
   }
   
   // Error response
   {
     success: false,
     error: {
       code: 'ERR_TEMPLATE_*',
       message: 'Human-readable description',
       details: {
         operation: 'processTemplate',
         // Additional context
       }
     }
   }
   ```

8. **Error Codes to Use**:
   - ERR_TEMPLATE_PARTIAL_NOT_FOUND - Partial file cannot be found
   - ERR_TEMPLATE_PARTIAL_CIRCULAR - Circular partial reference detected
   - ERR_TEMPLATE_PARTIAL_DEPTH_EXCEEDED - Maximum partial nesting depth exceeded
   - ERR_TEMPLATE_PARTIAL_INVALID_SYNTAX - Invalid partial include syntax
   - ERR_TEMPLATE_INVALID_INPUT - Invalid template or context (from Stories 3.1/3.2/3.3)

### Architecture Compliance

**MUST FOLLOW:**
- Custom JavaScript utilities approach (NO oclif, commander, or yargs)
- Pure JavaScript - no build process required
- Jest for unit testing (already configured in Story 1.3)
- Modular code organization as specified in architecture
- No external runtime dependencies beyond Node.js
- Error handling patterns from Stories 2.5, 3.1, 3.2, and 3.3

**Project Constraints:**
- Must preserve existing Agentfile architecture
- JavaScript layer is purely mechanical execution, not guidance
- Existing CLI interface (`agentfile` command) must remain unchanged
- IDE slash command protocol must continue working
- Node.js 18+ compatibility required

**Code Organization (from Architecture):**
- Template processor: `src/js-utils/template-processor.js` (EXTEND existing)
- Test file: `src/js-utils/template-processor.test.js` (ADD tests)
- Partial templates directory: `./partials/` (configurable)

**IMPORTANT - Relationship to Stories 3.1, 3.2, and 3.3:**
- This story EXTENDS the template-processor.js created in Stories 3.1, 3.2, and 3.3
- DO NOT rewrite the variable substitution, conditional blocks, or iteration blocks - ADD partial support
- The processTemplate function should handle ALL FOUR:
  1. Variable substitution: `{{variableName}}` → value
  2. Conditional blocks: `{{#if condition}}...{{/if}}`
  3. Iteration blocks: `{{#each collection}}...{{/each}}`
  4. Partial templates: `{{> partialName}}` → partial content
- Processing order: First evaluate conditionals, then iterations, then resolve partials, then substitute variables

### Library/Framework Requirements

**Required:**
- Node.js 18+ (runtime)
- Node.js built-in fs module for file reading
- Node.js built-in string methods
- Node.js built-in RegExp for pattern matching
- Node.js built-in path module for path resolution

**NOT Required (by design):**
- No CLI frameworks (oclif, commander, yargs)
- No external template engines (Handlebars, EJS, etc.) - custom implementation
- No build tools (webpack, rollup, etc.)
- No external npm packages - use Node.js built-ins only

### Testing Requirements

1. **Test File Location**: `src/js-utils/template-processor.test.js`

2. **Add Test Cases for Partial Templates:**
   ```javascript
   describe('Template Processor', () => {
     describe('processTemplate - Partial Templates', () => {
       // Test basic partial include
       // Test partial with parent context
       // Test nested partials
       // Test partial with variables and conditionals
       // Test partial not found error
       // Test circular partial reference error
     });
   });
   ```

3. **Required Test Cases for Partials:**
   - Basic partial: `{{> header}}` with partials/header.html → insert content
   - Partial with context: partial has access to parent variables
   - Nested partials: partial includes another partial
   - Partial with conditionals: `{{#if show}}{{> partial}}{{/if}}`
   - Partial with iterations: `{{#each items}}{{> item}}{{/each}}`
   - Partial not found - should return error with ERR_TEMPLATE_PARTIAL_NOT_FOUND
   - Circular reference - should return error with ERR_TEMPLATE_PARTIAL_CIRCULAR
   - Deep nesting (>10) - should return error with ERR_TEMPLATE_PARTIAL_DEPTH_EXCEEDED

4. **Test Execution:**
   ```bash
   npm test                    # Run all tests
   npm test template-processor.test.js   # Run only template processor tests
   ```

5. **Verification:**
   - All tests must pass
   - No linting errors
   - Follows error handling patterns from Stories 2.5, 3.1, 3.2, and 3.3

### Previous Story Intelligence

**From Story 3.3: Add Iteration Support**

**Key Learnings:**
- template-processor.js uses processTemplate(template, context) function
- Returns standardized response: { success: true, result: '...' } or { success: false, error: {...} }
- Supports {{#if condition}} / {{/if}} blocks
- Supports {{#each collection}} / {{/each}} loops
- Stack-based parsing handles nested conditionals and iterations correctly
- Processing order: conditionals → iterations → variables
- Error codes use ERR_TEMPLATE_* prefix
- Already handles: variable substitution, conditionals, iterations

**Pattern to Continue:**
- Standardized error object structure (success/error)
- Consistent error codes with TEMPLATE prefix
- Include operation context in error details
- Comprehensive test coverage for all scenarios
- Extend existing function - don't rewrite

**Current State:**
- file-ops.js: COMPLETE with comprehensive error handling
- template-processor.js: EXISTS with:
  - Variable substitution (Story 3.1) - COMPLETED
  - Conditional blocks (Story 3.2) - COMPLETED
  - Iteration blocks (Story 3.3) - COMPLETED
- Epic 2: COMPLETE
- Epic 3: IN PROGRESS
  - Story 3.1: Basic Variable Substitution - COMPLETED
  - Story 3.2: Conditional Block Support - COMPLETED
  - Story 3.3: Iteration Support - COMPLETED
  - Story 3.4 (this): Partial Templates - READY-FOR-DEV
  - Story 3.5: Add Template Syntax Validation - backlog

### Latest Tech Information

**Node.js Partial Template Implementation:**

1. **Partial Include Pattern:**
   ```javascript
   // Match {{> partialName}} or {{> path/to/partial}}
   const partialPattern = /\{\{>\s*([^}]+)\}\}/g;
   ```

2. **Partial Resolution Function:**
   ```javascript
   function resolvePartial(partialName, partialsDir, context, depth = 0) {
     // Check maximum depth to prevent infinite loops
     if (depth > 10) {
       return { error: 'ERR_TEMPLATE_PARTIAL_DEPTH_EXCEEDED' };
     }
     
     // Try to find partial file
     const extensions = ['', '.html', '.md', '.txt'];
     for (const ext of extensions) {
       const partialPath = path.join(partialsDir, partialName + ext);
       if (fs.existsSync(partialPath)) {
         const content = fs.readFileSync(partialPath, 'utf-8');
         // Process the partial content with same context
         return processTemplate(content, context);
       }
     }
     
     return { error: 'ERR_TEMPLATE_PARTIAL_NOT_FOUND', partialName };
   }
   ```

3. **Processing Order:**
   ```javascript
   function processTemplate(template, context, options = {}) {
     const partialsDir = options.partialsDir || './partials';
     
     // Step 1: Process conditionals first (outer to inner)
     let result = processConditionals(template, context);
     
     // Step 2: Process iterations (outer to inner)
     result = processIterations(result, context);
     
     // Step 3: Resolve partials (with depth tracking)
     result = processPartials(result, context, partialsDir, 0);
     
     // Step 4: Then process variable substitutions
     result = processVariables(result, context);
     
     return { success: true, result };
   }
   ```

4. **Circular Reference Detection:**
   ```javascript
   // Track currently resolving partials to detect cycles
   const resolvingPartials = new Set();
   
   function processPartials(template, context, partialsDir, depth) {
     // ... resolve partials
     if (resolvingPartials.has(partialName)) {
       return { error: 'ERR_TEMPLATE_PARTIAL_CIRCULAR', partialName };
     }
     resolvingPartials.add(partialName);
     // ... process
     resolvingPartials.delete(partialName);
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
- Epic 2 completed: Core File Operations
  - Story 2.1: Implement File Copy Operation - DONE
  - Story 2.2: Implement File Move Operation - DONE
  - Story 2.3: Implement Directory Create Operation - DONE
  - Story 2.4: Implement File Delete Operation - DONE
  - Story 2.5: Add Comprehensive Error Handling - DONE
- Epic 3 (this): Template Processing Engine
  - Story 3.1: Basic Variable Substitution - COMPLETED
  - Story 3.2: Conditional Block Support - COMPLETED
  - Story 3.3: Iteration Support - COMPLETED
  - Story 3.4 (this): Partial Templates - READY-FOR-DEV
  - Story 3.5: Add Template Syntax Validation - backlog
- Epic 4-5: Future work
- All existing Agentfile projects must remain backward compatible

---

## Implementation Notes

**Status Update:**
- Epic 3 status: "in-progress"
- Story status: "ready-for-dev"

**Dependencies:**
- Depends on Story 3.1 (Basic Variable Substitution) - COMPLETED
- Depends on Story 3.2 (Conditional Block Support) - COMPLETED
- Depends on Story 3.3 (Iteration Support) - COMPLETED
- Depends on Story 2.5 (Add Comprehensive Error Handling) - COMPLETED (patterns)
- Depends on Story 1.1 (Initialize Node.js Project Structure) - COMPLETED
- Depends on Story 1.2 (Configure Project Directory Structure) - COMPLETED
- Depends on Story 1.3 (Set Up Basic Testing Infrastructure)**What's Already Done - COMPLETED

:**
- Project structure created (src/js-utils/ directory exists)
- Jest configured and working
- file-ops.js with all file operations and error handling patterns
- template-processor.js with:
  - Variable substitution (Story 3.1) - COMPLETED
  - Conditional blocks (Story 3.2) - COMPLETED
  - Iteration blocks (Story 3.3) - COMPLETED
- Epic 2 fully completed
- Epic 3 Stories 3.1, 3.2, and 3.3 completed

**What's Needed for This Story:**
- Extend template-processor.js with partial template support
- Add partial file resolution and loading
- Handle parent context access for partials
- Implement nested partials with circular reference detection
- Add comprehensive test cases for all partial scenarios
- Follow error handling patterns from Stories 2.5, 3.1, 3.2, and 3.3

**Epic 3 Story Order (recommended):**
1. Story 3.1: Basic Variable Substitution - COMPLETED
2. Story 3.2: Conditional Block Support - COMPLETED
3. Story 3.3: Iteration Support - COMPLETED
4. Story 3.4 (this): Partial Templates - READY-FOR-DEV
5. Story 3.5: Syntax Validation - backlog

**Key Notes:**
- This story BUILDS UPON Stories 3.1, 3.2, and 3.3's template-processor.js
- DO NOT rewrite existing code - ADD partial template support
- Processing order matters: conditionals → iterations → partials → variables
- Error handling is critical - use standardized structure from Stories 2.5, 3.1, 3.2, and 3.3
- Circular reference detection is mandatory - prevent infinite loops
- Parent context access: partials should have access to main template variables

**Success Criteria:**
- [ ] Partial templates {{> partialName}} are resolved correctly ✓ (to verify)
- [ ] Partials load from filesystem correctly ✓ (to verify)
- [ ] Parent context is accessible in partials ✓ (to verify)
- [ ] Nested partials work correctly ✓ (to verify)
- [ ] Circular references are detected and return error ✓ (to verify)
- [ ] Error handling returns standardized format ✓ (to verify)
- [ ] Tests pass with Jest ✓ (to verify)
- [ ] Follows error handling patterns from Stories 2.5, 3.1, 3.2, and 3.3 ✓ (to verify)
