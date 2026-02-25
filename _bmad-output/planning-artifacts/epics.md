---
stepsCompleted: [1, 2, 3, 4]
inputDocuments: 
  - "_bmad-output/planning-artifacts/javascript-migration-prd.md"
  - "_bmad-output/planning-artifacts/architecture.md"
---

# agentfile - Epic Breakdown

## Overview

This document provides the complete epic and story breakdown for agentfile, decomposing the requirements from the PRD, UX Design if it exists, and Architecture requirements into implementable stories.

## Requirements Inventory

### Functional Requirements

**FR1: File Operations Module**
- Replace shell script file operations (cp, mv, mkdir, rm) with JavaScript equivalents
- Maintain cross-platform compatibility
- Provide async/await interface
- Include comprehensive error handling

**FR2: Template Processing Module**
- Implement variable substitution engine
- Support conditional blocks and iteration
- Handle partial templates and includes
- Validate template syntax

**FR3: State Management Module**
- Workflow state persistence
- Step tracking and history
- Checkpoint/resume capabilities
- Rollback functionality

**FR4: CLI Orchestration Module**
- Command parsing and execution
- Environment validation
- Progress tracking
- Integration with existing workflow.yaml

### NonFunctional Requirements

**NFR1: Backward Compatibility**
- Existing Agentfile projects must continue working
- No breaking changes to workflow.yaml format
- Gradual migration path supported

**NFR2: Performance**
- File operations equal or better than shell scripts
- Minimal overhead for template processing
- Fast startup times

**NFR3: Cross-Platform Support**
- Single codebase works on Windows, macOS, Linux
- No platform-specific dependencies
- Consistent behavior across OS

**NFR4: Developer Experience**
- Better error messages than shell scripts
- Clear debugging information
- Comprehensive documentation

### Additional Requirements

**From Architecture Document:**

- **Starter Template**: Custom JavaScript utilities approach (NOT oclif, commander, or yargs)
  - Initialization command: `mkdir -p src/js-utils && npm init -y && npm install --save-dev jest`
  - Project uses pure JavaScript (Node.js 18+)
  - No build process required - direct Node.js execution
  - Jest for unit testing file operations
  - Code organization: `src/js-utils/file-ops.js`, `template-processor.js`, `state-manager.js`, `cli-orchestrator.js`

- **Migration Strategy**: Big Bang Migration
  - Complete replacement of shell scripts with JavaScript utilities
  - No hybrid period - single switchover
  - No fallback to shell scripts

- **State Persistence**: YAML Files
  - State files stored in `.agentfile/state/` directory
  - Each workflow gets `workflow-id.yaml` state file
  - Includes: step status, timestamps, variables, history

- **Package Distribution**: Bundled with Agentfile
  - JavaScript utilities included in Agentfile distribution
  - No npm dependency required
  - No additional installation steps

- **Error Handling**: Fail-fast with internal recovery mechanisms
  - Standardized error response structure
  - Automatic retry for transient failures
  - Checkpoint/resume for interrupted workflows
  - Rollback capabilities
  - Detailed logging for debugging

- **Technical Constraints**:
  - Must preserve existing Agentfile architecture (agents, workflows, skills, configs)
  - JavaScript layer is purely mechanical execution, not guidance
  - Node.js 18+ compatibility required
  - No external runtime dependencies beyond Node.js
  - Existing CLI interface (`agentfile` command) must remain unchanged
  - IDE slash command protocol must continue working

### FR Coverage Map

| FR | Requirement | Epic |
|----|-------------|------|
| FR1 | File Operations Module | Epic 2: Core File Operations |
| FR2 | Template Processing Module | Epic 3: Template Processing Engine |
| FR3 | State Management Module | Epic 4: Workflow State Management |
| FR4 | CLI Orchestration Module | Epic 5: CLI Integration |

## Epic List

### Epic 1: Project Foundation & Setup
Set up Node.js project structure with JavaScript utilities foundation. Initialize the src/js-utils directory with package.json and Jest testing framework.
**FRs covered:** None (prerequisite)

### Epic 2: Core File Operations
Replace shell script file operations (cp, mv, mkdir, rm) with JavaScript equivalents that work cross-platform with async/await interface.
**FRs covered:** FR1

### Epic 3: Template Processing Engine
Implement variable substitution engine with conditional blocks, iteration, partial templates, and syntax validation.
**FRs covered:** FR2

### Epic 4: Workflow State Management
Implement workflow state persistence, step tracking, checkpoint/resume capabilities, and rollback functionality.
**FRs covered:** FR3

### Epic 5: CLI Integration
Implement command parsing, environment validation, progress tracking, and integration with existing workflow.yaml.
**FRs covered:** FR4

---

## Epic 1: Project Foundation & Setup

Set up Node.js project structure with JavaScript utilities foundation. Initialize the src/js-utils directory with package.json and Jest testing framework.

### Story 1.1: Initialize Node.js Project Structure

As a Developer,
I want to initialize a Node.js project with package.json and Jest testing framework,
So that I can start developing JavaScript utilities with proper testing infrastructure.

**Acceptance Criteria:**

**Given** A clean directory without Node.js project files
**When** I run the initialization command
**Then** package.json is created with name, version, and test script
**And** jest is installed as dev dependency
**And** src/js-utils directory is created

### Story 1.2: Configure Project Directory Structure

As a Developer,
I want the proper directory structure for all utility modules,
So that I can organize code according to architecture specifications.

**Acceptance Criteria:**

**Given** Initialized Node.js project
**When** I create the directory structure
**Then** src/js-utils/ directory exists
**And** Compatibility layer directory is created
**And** .agentfile/state/ directory is created for state persistence

### Story 1.3: Set Up Basic Testing Infrastructure

As a Developer,
I want Jest configured for unit testing,
So that I can write and run tests for all utility modules.

**Acceptance Criteria:**

**Given** Node.js project with Jest installed
**When** I configure Jest
**Then** jest.config.js exists with appropriate settings
**And** A sample test can be executed successfully
**And** Test output is clear and readable

---

## Epic 2: Core File Operations

Replace shell script file operations (cp, mv, mkdir, rm) with JavaScript equivalents that work cross-platform with async/await interface.

### Story 2.1: Implement File Copy Operation

As a Developer,
I want to copy files using JavaScript instead of shell scripts,
So that file operations work consistently across Windows, macOS, and Linux.

**Acceptance Criteria:**

**Given** Source and destination file paths
**When** I call the copy function
**Then** Source file is duplicated at destination
**And** Original file remains unchanged
**And** Function returns success result
**And** Works across Windows, macOS, Linux

### Story 2.2: Implement File Move Operation

As a Developer,
I want to move files using JavaScript instead of shell scripts,
So that I can relocate files while maintaining cross-platform compatibility.

**Acceptance Criteria:**

**Given** Source and destination file paths
**When** I call the move function
**Then** File is relocated to destination
**And** Original file no longer exists at source
**And** Function returns success result

### Story 2.3: Implement Directory Create Operation

As a Developer,
I want to create directories using JavaScript instead of shell scripts,
So that directory creation works consistently across platforms.

**Acceptance Criteria:**

**Given** Directory path to create
**When** I call the mkdir function
**Then** Directory is created at specified path
**And** Parent directories are created if they don't exist
**And** Function returns success result

### Story 2.4: Implement File Delete Operation

As a Developer,
I want to delete files using JavaScript instead of shell scripts,
So that file deletion works consistently across platforms.

**Acceptance Criteria:**

**Given** File path to delete
**When** I call the delete function
**Then** File is removed from filesystem
**And** Function returns success result
**And** Error is returned if file doesn't exist

### Story 2.5: Add Comprehensive Error Handling

As a Developer,
I want consistent error handling across all file operations,
So that failures are properly reported with actionable messages.

**Acceptance Criteria:**

**Given** Any file operation that fails
**When** Operation encounters an error
**Then** Error object contains success: false
**And** Error includes standardized error code
**And** Error includes human-readable message
**And** Error includes operation context details

---

## Epic 3: Template Processing Engine

Implement variable substitution engine with conditional blocks, iteration, partial templates, and syntax validation.

### Story 3.1: Implement Basic Variable Substitution

As a Developer,
I want to replace {{variable}} placeholders in templates,
So that I can dynamically generate files from templates.

**Acceptance Criteria:**

**Given** A template with {{variable}} placeholders and context data
**When** I call the template processor
**Then** All placeholders are replaced with corresponding values
**And** Undefined variables result in empty strings
**And** Function returns processed template string

### Story 3.2: Add Conditional Block Support

As a Developer,
I want to use {{#if}} / {{/if}} blocks in templates,
So that I can conditionally include or exclude content.

**Acceptance Criteria:**

**Given** A template with {{#if condition}} blocks
**When** I process the template
**Then** Content inside true conditions is included
**And** Content inside false conditions is excluded
**And** Nested conditions work correctly

### Story 3.3: Add Iteration Support

As a Developer,
I want to use {{#each}} / {{/each}} loops in templates,
So that I can repeat content for each item in a collection.

**Acceptance Criteria:**

**Given** A template with {{#each items}} loop and array data
**When** I process the template
**Then** Content is repeated for each item in the array
**And** Each iteration has access to item data
**And** Nested loops work correctly

### Story 3.4: Implement Partial Templates

As a Developer,
I want to include partial templates within other templates,
So that I can reuse common template components.

**Acceptance Criteria:**

**Given** A main template that includes a partial
**When** I process the template
**Then** Partial content is inserted at include location
**And** Partials can access parent context
**And** Nested partials work correctly

### Story 3.5: Add Template Syntax Validation

As a Developer,
I want to validate template syntax before processing,
So that errors are caught early with clear messages.

**Acceptance Criteria:**

**Given** A template with syntax errors
**When** I call validate on the template
**Then** Validation returns list of errors with line numbers
**And** Errors include human-readable descriptions
**And** Valid templates return success

---

## Epic 4: Workflow State Management

Implement workflow state persistence, step tracking, checkpoint/resume capabilities, and rollback functionality.

### Story 4.1: Implement Workflow State Persistence

As a Developer,
I want workflow state saved to YAML files,
So that state persists across sessions.

**Acceptance Criteria:**

**Given** A workflow with current state
**When** I save the state
**Then** State is written to .agentfile/state/[workflow-id].yaml
**And** File is human-readable YAML format
**And** State can be loaded back successfully

### Story 4.2: Implement Step Tracking

As a Developer,
I want to track which workflow steps have been completed,
So that I know the current progress.

**Acceptance Criteria:**

**Given** A running workflow
**When** A step completes
**Then** Step is marked as complete in state
**And** Timestamp is recorded for each step
**And** Step history is maintained

### Story 4.3: Add Checkpoint/Resume Capabilities

As a Developer,
I want to save checkpoints and resume from them,
So that I can recover from failures without restarting.

**Acceptance Criteria:**

**Given** A workflow at a specific point
**When** I create a checkpoint
**Then** Complete state is saved
**And** I can resume from that checkpoint later
**And** All variables and progress are restored

### Story 4.4: Implement Rollback Functionality

As a Developer,
I want to rollback to a previous state on failure,
So that I can recover from errors gracefully.

**Acceptance Criteria:**

**Given** A workflow that has failed
**When** I trigger rollback
**Then** State reverts to last known good state
**And** Changes made by failed steps are undone
**And** Rollback status is reported clearly

---

## Epic 5: CLI Integration

Implement command parsing, environment validation, progress tracking, and integration with existing workflow.yaml.

### Story 5.1: Implement Command Parsing

As a Developer,
I want agentfile CLI commands to be parsed,
So that user commands are executed correctly.

**Acceptance Criteria:**

**Given** User runs agentfile command with arguments
**When** CLI parses the command
**Then** Command and arguments are correctly identified
**And** Options are properly extracted
**And** Invalid commands return helpful error

### Story 5.2: Add Environment Validation

As a Developer,
I want environment to be validated before execution,
So that missing requirements are caught early.

**Acceptance Criteria:**

**Given** User runs agentfile command
**When** Environment is checked
**Then** Node.js version is validated (18+)
**And** Required directories exist
**And** Clear error if requirements not met

### Story 5.3: Implement Progress Tracking

As a Developer,
I want to see workflow execution progress,
So that I know what's happening during execution.

**Acceptance Criteria:**

**Given** A running workflow
**When** Steps are executing
**Then** Current step is displayed
**And** Progress percentage is shown
**And** Step completion is indicated

### Story 5.4: Integrate with workflow.yaml

As a Developer,
I want JavaScript utilities to read and execute workflow.yaml,
So that existing workflows continue to work.

**Acceptance Criteria:**

**Given** A valid workflow.yaml file
**When** I run a workflow
**Then** All steps are read from YAML
**And** Steps are executed in order
**And** Step outputs are captured

### Story 5.5: Maintain Backward Compatibility

As a Developer,
I want existing Agentfile projects to work unchanged,
So that users don't need to modify their workflows.

**Acceptance Criteria:**

**Given** An existing Agentfile project with shell scripts
**When** I run with JavaScript utilities
**Then** All workflows execute correctly
**And** workflow.yaml format is unchanged
**And** Agent/skill file structure is unchanged
