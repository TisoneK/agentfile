# Story 7.1: CLI Interactive Wizard for IDE Selection

Status: done

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As a developer,
I want an interactive wizard to guide IDE selection,
so that I can easily set up agentfile for my preferred IDE.

## Acceptance Criteria

1. [AC1] Given I run agentfile init, When no IDE is specified, Then an interactive wizard prompts me to select my IDE(s), And I can choose from supported IDEs (Cursor, Windsurf, VS Code, etc.)
   - **Source:** [epics.md#849-854]

2. [AC2] Given multiple IDEs are selected, When the wizard completes, Then agentfile is configured for all selected IDEs
   - **Source:** [epics.md#856-859]

## Tasks / Subtasks

- [x] Task 1: Implement interactive wizard using inquirer (AC: #1)
  - [x] Subtask 1.1: Set up inquirer as CLI dependency
  - [x] Subtask 1.2: Create wizard flow with IDE selection prompt
  - [x] Subtask 1.3: Handle multiple IDE selection (checkbox prompt)
- [x] Task 2: Integrate wizard with agentfile init command (AC: #1, #2)
  - [x] Subtask 2.1: Call wizard when no --ide flag provided
  - [x] Subtask 2.2: Pass selected IDEs to configuration system
- [x] Task 3: Add command-line flag support (AC: #1)
  - [x] Subtask 3.1: Add --ide flag for non-interactive mode
  - [x] Subtask 3.2: Handle --ide flag vs interactive mode logic

## Dev Notes

### Architecture Requirements (MANDATORY)

The implementation MUST follow these architecture requirements:

1. **Use inquirer for interactive prompts**
   - Source: [epics.md#69] - "The system must include an interactive wizard (using inquirer) that prompts users to select their IDE(s) during initialization"
   - Install inquirer package: `npm install inquirer`

2. **Supported IDEs**
   - Cursor
   - Windsurf  
   - VS Code
   - KiloCode
   - GitHub Copilot
   - Cline
   - Source: [epics.md#71] and [epics.md#854]

3. **Default to current working directory**
   - Source: [epics.md#75] - "The system must default to current working directory for agentfile init"

4. **Use existing file operations utilities**
   - Source: [epics.md#74] - "The system must use existing src/js-utils/file-ops.js for file operations"

### Project Structure Notes

Based on the architecture requirements:

- **CLI Entry Point:** Likely in `cli/src/` directory
- **Wizard Implementation:** Should be in `cli/src/` with separate module
- **File Operations:** Use `src/js-utils/file-ops.js` (not shell commands)
- **IDE Configurations:** Store in `.agentfile/` directory (per Story 7.2)

### Technical Requirements

1. **Dependencies:**
   - `inquirer` - for interactive prompts
   - Already existing `src/js-utils/file-ops.js` for file operations

2. **Wizard Flow:**
   ```
   agentfile init
   → Check for --ide flag
   → If no flag: Launch inquirer wizard
   → Prompt: "Select your IDE(s)" with checkbox multi-select
   → Options: Cursor, Windsurf, VS Code, KiloCode, GitHub Copilot, Cline
   → Pass selections to configuration
   → Complete initialization
   ```

3. **CLI Flag Support:**
   - `--ide <name>` - Specify IDE non-interactively
   - `--ide <name1,name2>` - Specify multiple IDEs
   - `--help` - Show usage

### Testing Standards

1. **Unit Tests:** Test wizard prompt generation, flag parsing
2. **Integration Tests:** Test full init flow with mock user input
3. **Test Frameworks:** Use project's existing test framework (check package.json)

### References

- Architecture Requirements: [epics.md#68-76]
- Epic 7 Overview: [epics.md#138-140]
- Story 7.1 Details: [epics.md#843-859]
- NFR10 (IDE Compatibility): [epics.md#62] - "Work with Cursor, Windsurf, and VS Code"

## Dev Agent Record

### Agent Model Used

minimax/minimax-m2.5:free

### Debug Log References

<!-- Reference any debug logs from implementation -->

### Completion Notes List

- Implemented interactive wizard using inquirer with checkbox prompt for multi-IDE selection
- Updated ide-selector.js to use inquirer and added VS Code to supported IDEs
- Integrated wizard with init command - launches when no --ide flag provided
- Added --ide flag support for non-interactive mode (comma-separated IDEs)
- Created .agentfile/ directory with config.json and IDE marker files
- Updated README.md to show configured IDEs
- All existing tests pass (389 tests)

### File List

- cli/src/prompts/ide-selector.js (modified - now uses inquirer)
- cli/src/commands/init.js (modified - integrated wizard, now uses file-ops.js)
- cli/src/index.js (modified - added --ide flag)
- cli/package.json (modified - added inquirer dependency)
- cli/tests/ide-selector.test.js (added - unit tests for IDE selector)
- cli/jest.config.js (added - jest config for CLI tests)
- src/js-utils/file-ops.js (modified - added existsSync, ensureDir for CLI use)
