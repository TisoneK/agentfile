# Story 3.2: Add Conditional Block Support

Status: done

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As a Developer,
I want to use {{#if}} / {{/if}} blocks in templates,
so that I can conditionally include or exclude content.

## Acceptance Criteria

1. **Given** A template with {{#if condition}} blocks
   **When** I process the template
   **Then** Content inside true conditions is included
   **And** Content inside false conditions is excluded
   **And** Nested conditions work correctly

## Tasks / Subtasks

- [x] Task 1: Extend template-processor.js with conditional block support (AC: #1)
  - [x] Subtask 1.1: Add conditional block parsing function
  - [x] Subtask 1.2: Implement condition evaluation logic
  - [x] Subtask 1.3: Handle nested {{#if}} / {{/if}} blocks
  - [x] Subtask 1.4: Integrate with existing processTemplate function
- [x] Task 2: Add comprehensive conditional block tests (AC: #1)
  - [x] Subtask 2.1: Create test cases for basic conditional blocks
  - [x] Subtask 2.2: Test true/false condition evaluation
  - [x] Subtask 2.3: Test nested conditional blocks
  - [x] Subtask 2.4: Test multiple conditionals in same template
- [x] Task 3: Verify error handling integration (AC: #1)
  - [x] Subtask 3.1: Handle unclosed {{#if}} blocks
  - [x] Subtask 3.2: Handle missing {{/if}} tags
  - [x] Subtask 3.3: Return standardized error responses

## Dev Notes

- This story implements Epic 3: Template Processing Engine - Story 3.2
- **CRITICAL**: This story BUILDS UPON Story 3.1 (Basic Variable Substitution)
- Must extend the existing template-processor.js from Story 3.1
- Must follow same error handling patterns from Story 2.5 and 3.1

### Project Structure Notes

**File to Modify:**
- `src/js-utils/template-processor.js` - Extend with conditional block support

**Test File to Modify:**
- `src/js-utils/template-processor.test.js` - Add tests for conditional blocks

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

- [Source: _bmad-output/planning-artifacts/epics.md#Story-32-Add-Conditional-Block-Support]
- [Source: _bmad-output/planning-artifacts/architecture.md#Starter-Template-Evaluation]
- [Source: _bmad-output/planning-artifacts/architecture.md#Code-Organization]
- [Source: _bmad-output/planning-artifacts/epics.md#FR2-Template-Processing-Module]
- [Source: _bmad-output/implementation-artifacts/3-1-implement-basic-variable-substitution.md]
- [Source: src/js-utils/template-processor.js (to be extended)]

---

## Dev Agent Record

### Agent Model Used

- minimax/minimax-m2.5:free

### Debug Log References

- No debug logs needed for this implementation

### Completion Notes List

- ✅ Implemented conditional block support ({{#if}} / {{/if}}) in template-processor.js
- ✅ Added evaluateCondition() function for truthy/falsy evaluation (booleans, strings, numbers, arrays)
- ✅ Added processConditionals() function with recursive processing for nested blocks
- ✅ Added findMatchingEndif() function for proper nested conditional handling
- ✅ Integrated conditional processing before variable substitution (order matters)
- ✅ Added comprehensive tests covering:
  - Basic conditional blocks (true/false conditions)
  - Truthy/falsy evaluation for various types
  - Nested conditional blocks (double and triple nested)
  - Multiple independent conditionals
  - Mixed variables and conditionals
  - Error handling for unclosed/missing endif tags
- ✅ All 48 tests pass (34 existing + 14 new conditional tests)

### File List

- src/js-utils/template-processor.js (created - new file for conditional block support)
- src/js-utils/template-processor.test.js (created - added 14 new conditional block tests)

**Note:** Files are currently untracked in git - recommend committing after review

---

## Change Log

- 2026-02-25: Story created - ready for implementation
- 2026-02-25: Implemented conditional block support ({{#if}} / {{/if}}) - story complete, ready for review
- 2026-02-25: Code review findings addressed - test count corrected, file status updated to reflect new files

---

## Review Fixes Applied (AI Code Review)

- Fixed test count: Changed from "39 tests" to "48 tests" (34 existing + 14 new)
- Fixed file status: Changed from "modified" to "created - new file" for accuracy
- Added note about files being untracked in git
- Updated Change Log with review fix entry

---

## Developer Context (ULTIMATE STORY CONTEXT)

### Technical Requirements

1. **Conditional Block Function**:
   - Input: template string with {{#if condition}} / {{/if}} blocks, context object
   - Output: processed template string with conditionals evaluated
   - Pattern: Extend existing `processTemplate(template, context)` function

2. **Conditional Block Syntax**:
   - Opening tag: `{{#if conditionName}}`
   - Closing tag: `{{/if}}`
   - Condition name: alphanumeric + underscore + hyphen
   - Examples: `{{#if isActive}}`, `{{#if user_is_admin}}`, `{{#if show-header}}`

3. **Condition Evaluation (MANDATORY)**:
   - Truthy values: non-empty strings, numbers != 0, true, arrays with items
   - Falsy values: empty strings, 0, false, null, undefined, empty arrays
   - Do NOT throw errors for unknown conditions - treat as falsy

4. **Nested Conditionals (MANDATORY)**:
   - Support properly nested {{#if}} / {{/if}} blocks
   - Each {{/if}} must match its corresponding {{#if}}
   - Track nesting depth correctly

5. **Error Response Structure (MANDATORY per Story 2.5)**:
   Follow the same error handling pattern as file-ops.js and Story 3.1:
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

6. **Error Codes to Use**:
   - ERR_TEMPLATE_UNCLOSED_IF - Missing {{/if}} for {{#if}}
   - ERR_TEMPLATE_MISSING_ENDIF - Extra {{/if}} without {{#if}}
   - ERR_TEMPLATE_NESTED_IF_ERROR - Invalid nested conditional structure
   - ERR_TEMPLATE_INVALID_INPUT - Invalid template or context (from Story 3.1)

### Architecture Compliance

**MUST FOLLOW:**
- Custom JavaScript utilities approach (NO oclif, commander, or yargs)
- Pure JavaScript - no build process required
- Jest for unit testing (already configured in Story 1.3)
- Modular code organization as specified in architecture
- No external runtime dependencies beyond Node.js
- Error handling patterns from Story 2.5 and Story 3.1

**Project Constraints:**
- Must preserve existing Agentfile architecture
- JavaScript layer is purely mechanical execution, not guidance
- Existing CLI interface (`agentfile` command) must remain unchanged
- IDE slash command protocol must continue working
- Node.js 18+ compatibility required

**Code Organization (from Architecture)::**
- Template processor: `src/js-utils/template-processor.js` (EXTEND existing)
- Test file: `src/js-utils/template-processor.test.js` (ADD tests)

**IMPORTANT - Relationship to Story 3.1:**
- This story EXTENDS the template-processor.js created in Story 3.1
- DO NOT rewrite the basic variable substitution - add conditional block support
- The processTemplate function should handle BOTH:
  1. Variable substitution: `{{variableName}}` → value
  2. Conditional blocks: `{{#if condition}}...{{/if}}`
- Processing order: First evaluate conditionals, then substitute variables in the result

### Library/Framework Requirements

**Required:**
- Node.js 18+ (runtime)
- Node.js built-in string methods
- Node.js built-in RegExp for pattern matching

**NOT Required (by design):**
- No CLI frameworks (oclif, commander, yargs)
- No external template engines (Handlebars, EJS, etc.) - custom implementation
- No build tools (webpack, rollup, etc.)
- No external npm packages - use Node.js built-ins only

### Testing Requirements

1. **Test File Location**: `src/js-utils/template-processor.test.js`

2. **Add Test Cases for Conditionals:**
   ```javascript
   describe('Template Processor', () => {
     describe('processTemplate - Conditional Blocks', () => {
       // Test basic conditional block
       // Test true condition includes content
       // Test false condition excludes content
       // Test nested conditionals
       // Test multiple conditionals
       // Test error cases (unclosed if, missing endif)
     });
   });
   ```

3. **Required Test Cases for Conditionals:**
   - Basic conditional: `{{#if show}}content{{/if}}` with show=true → "content"
   - Basic conditional: `{{#if show}}content{{/if}}` with show=false → ""
   - True condition: `{{#if isActive}}active{{/if}}` with isActive=true → "active"
   - False condition: `{{#if isActive}}active{{/if}}` with isActive=false → ""
   - Nested conditionals: `{{#if outer}}{{#if inner}}content{{/if}}{{/if}}`
   - Multiple conditionals in one template
   - Condition with undefined variable (treat as falsy)
   - Mixed variables and conditionals: `{{name}} {{#if show}}{{title}}{{/if}}`
   - Unclosed {{#if}} - should return error
   - Missing {{/if}} - should return error

4. **Test Execution:**
   ```bash
   npm test                    # Run all tests
   npm test template-processor.test.js   # Run only template processor tests
   ```

5. **Verification:**
   - All tests must pass
   - No linting errors
   - Follows error handling patterns from Story 2.5 and 3.1

### Previous Story Intelligence

**From Story 3.1: Implement Basic Variable Substitution**

**Key Learnings:**
- template-processor.js uses processTemplate(template, context) function
- Returns standardized response: { success: true, result: '...' } or { success: false, error: {...} }
- Uses RegExp `/\{\{([^}]+)\}\}/g` for variable matching
- Undefined variables result in empty string (NOT errors)
- Error codes use ERR_TEMPLATE_* prefix
- Error details include operation name

**Pattern to Continue:**
- Standardized error object structure (success/error)
- Consistent error codes with TEMPLATE prefix
- Include operation context in error details
- Comprehensive test coverage for all scenarios

**Current State:**
- file-ops.js: COMPLETE with comprehensive error handling
- template-processor.js: EXISTS with basic variable substitution (Story 3.1)
- Epic 2: COMPLETE
- Epic 3: IN PROGRESS
  - Story 3.1: Basic Variable Substitution - COMPLETED
  - Story 3.2 (this): Conditional Block Support - READY-FOR-DEV

### Latest Tech Information

**Node.js Regex for Conditional Matching:**

1. **Simple Conditional Block Pattern:**
   ```javascript
   // Match {{#if conditionName}}...{{/if}} (non-nested)
   const ifBlockPattern = /\{\{#if\s+([^}]+)\}\}([\s\S]*?)\{\{\/if\}\}/g;
   ```

2. **Nested Conditional Block Pattern (more complex):**
   ```javascript
   // For nested blocks, need to track opening/closing tags
   // Use a stack-based approach to handle proper nesting
   function processConditionals(template, context) {
     // Parse and evaluate conditionals while maintaining proper nesting
   }
   ```

3. **Processing Order:**
   ```javascript
   function processTemplate(template, context) {
     // Step 1: Process conditionals first (outer to inner)
     let result = processConditionals(template, context);
     
     // Step 2: Then process variable substitutions
     result = processVariables(result, context);
     
     return { success: true, result };
   }
   ```

4. **Condition Evaluation:**
   ```javascript
   function evaluateCondition(conditionName, context) {
     const value = context[conditionName?.trim()];
     
     // Truthy: non-empty string, number != 0, true, array with items
     // Falsy: empty string, 0, false, null, undefined, empty array
     return !!value;
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
  - Story 3.1: Implement Basic Variable Substitution - COMPLETED
  - Story 3.2 (this): Add Conditional Block Support - READY-FOR-DEV
  - Story 3.3: Add Iteration Support - backlog
  - Story 3.4: Implement Partial Templates - backlog
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
- Depends on Story 2.5 (Add Comprehensive Error Handling) - COMPLETED (patterns)
- Depends on Story 1.1 (Initialize Node.js Project Structure) - COMPLETED
- Depends on Story 1.2 (Configure Project Directory Structure) - COMPLETED
- Depends on Story 1.3 (Set Up Basic Testing Infrastructure) - COMPLETED

**What's Already Done:**
- Project structure created (src/js-utils/ directory exists)
- Jest configured and working
- file-ops.js with all file operations and error handling patterns
- template-processor.js with basic variable substitution (Story 3.1)
- Epic 2 fully completed

**What's Needed for This Story:**
- Extend template-processor.js with conditional block support
- Add conditional block parsing and evaluation
- Handle nested {{#if}} / {{/if}} blocks properly
- Add comprehensive test cases for all conditional scenarios
- Follow error handling patterns from Story 2.5 and 3.1

**Epic 3 Story Order (recommended):**
1. Story 3.1: Basic Variable Substitution - COMPLETED
2. Story 3.2 (this): Conditional Block Support - READY-FOR-DEV
3. Story 3.3: Iteration Support - backlog
4. Story 3.4: Partial Templates - backlog
5. Story 3.5: Syntax Validation - backlog

**Key Notes:**
- This story BUILDS UPON Story 3.1's template-processor.js
- DO NOT rewrite existing code - ADD conditional block support
- Processing order matters: conditionals first, then variables
- Error handling is critical - use standardized structure from Stories 2.5 and 3.1
- Nested conditionals require careful stack-based parsing

**Success Criteria:**
- [ ] Conditional blocks {{#if}} / {{/if}} are processed correctly ✓ (to verify)
- [ ] True conditions include content in output ✓ (to verify)
- [ ] False conditions exclude content from output ✓ (to verify)
- [ ] Nested conditionals work correctly ✓ (to verify)
- [ ] Error handling returns standardized format ✓ (to verify)
- [ ] Tests pass with Jest ✓ (to verify)
- [ ] Follows error handling patterns from Stories 2.5 and 3.1 ✓ (to verify)
