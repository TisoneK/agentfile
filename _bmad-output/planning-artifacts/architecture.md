---
stepsCompleted: [1, 2, 3, 4, 5, 6]
workflowType: 'architecture'
project_name: 'agentfile'
user_name: 'Tisone'
date: '2026-02-25T00:12:00Z'
status: 'complete'
workflowType: 'architecture'
project_name: 'agentfile'
user_name: 'Tisone'
date: '2026-02-25T00:12:00Z'
---

# Architecture Decision Document

_This document builds collaboratively through step-by-step discovery. Sections are appended as we work through each architectural decision together._

## Project Context Analysis

### Requirements Overview

**Functional Requirements:**
The JavaScript migration requires four core modules:
- **File Operations Module**: Direct replacement for shell script operations (cp, mv, mkdir, rm) with async/await interface and comprehensive error handling
- **Template Processing Module**: Variable substitution engine with conditional blocks, iteration, partial templates, and syntax validation
- **State Management Module**: Workflow state persistence, step tracking, checkpoint/resume capabilities, and rollback functionality
- **CLI Orchestration Module**: Command parsing, environment validation, progress tracking, and integration with existing workflow.yaml

**Non-Functional Requirements:**
Critical NFRs that will drive architectural decisions:
- **Backward Compatibility**: Existing Agentfile projects must continue working without modification - this is the primary constraint
- **Performance**: File operations must equal or exceed shell script performance with minimal overhead
- **Cross-Platform Support**: Single codebase for Windows, macOS, Linux with consistent behavior
- **Developer Experience**: Better error messages and debugging information than current shell scripts

**Scale & Complexity:**
- Primary domain: CLI tools/developer tooling
- Complexity level: medium - significant refactoring but bounded scope
- Estimated architectural components: 4 core modules + compatibility layer

### Technical Constraints & Dependencies

**Critical Constraints:**
- Must preserve existing Agentfile architecture (agents, workflows, skills, configs) completely
- JavaScript layer is purely mechanical execution, not guidance
- Node.js 18+ compatibility required
- No external runtime dependencies beyond Node.js
- No breaking changes to workflow.yaml format

**Dependencies:**
- Existing shell script functionality must be replicated exactly
- Current CLI interface (`agentfile` command) must remain unchanged
- IDE slash command protocol must continue working

### Cross-Cutting Concerns Identified

**Backward Compatibility Layer:**
- Hybrid execution mode during migration period
- Graceful fallback to shell scripts if JavaScript utilities fail
- Compatibility testing across existing Agentfile projects

**Error Handling & Recovery:**
- Standardized error response structure across all modules
- Automatic retry for transient failures
- Rollback capabilities for failed operations
- Detailed logging for debugging

**Performance & Monitoring:**
- Progress tracking for long-running operations
- Performance benchmarking against shell scripts
- Memory usage optimization for large file operations

## Starter Template Evaluation

### Primary Technology Domain

CLI tool/Developer tooling with Node.js - specifically for migrating Agentfile shell scripts to JavaScript utilities

### Starter Options Considered

**oclif (Open CLI Framework):**
- Enterprise-grade framework with plugin architecture
- Built-in testing helpers and auto-documentation
- TypeScript support with minimal boilerplate
- JSON output for CI/CD integration
- Flexible command taxonomy
- CLI generator for quick scaffolding

**Commander.js:**
- Lightweight, minimal dependencies
- Simple API for basic CLI needs
- Good for single-purpose tools
- Less opinionated structure

**Yargs:**
- Low learning curve
- Flexible customization
- Good for small-to-medium CLIs
- Built-in type conversion

**Custom Approach:**
- Maximum control over architecture
- No framework dependencies
- Tailored specifically to Agentfile needs
- More development work

### Selected Starter: Custom JavaScript Utilities Approach

**Rationale for Selection:**
Given that this is a migration project (not greenfield), and the primary constraint is preserving existing Agentfile architecture, a custom approach is most suitable. The JavaScript utilities need to integrate seamlessly with the existing `agentfile` command structure and maintain backward compatibility with shell scripts during the transition period.

**Initialization Command:**

```bash
mkdir -p src/js-utils && npm init -y && npm install --save-dev jest
```

**Architectural Decisions Provided by Starter:**

**Language & Runtime:**
- Pure JavaScript (Node.js 18+) for maximum compatibility
- Optional TypeScript support for type safety in utilities

**Build Tooling:**
- No build process required - direct Node.js execution
- Simple package.json scripts for development

**Testing Framework:**
- Jest for unit testing file operations
- Integration tests for shell script compatibility

**Code Organization:**
- Modular structure: `src/js-utils/file-ops.js`, `template-processor.js`, `state-manager.js`, `cli-orchestrator.js`
- Compatibility layer: `src/compatibility/shell-bridge.js`

**Development Experience:**
- Simple npm scripts for testing and development
- No complex build configuration
- Focus on utility functions rather than CLI framework

**Note:** Project initialization using this command should be the first implementation story.

---

## Critical Decision: Migration Strategy

**Decision:** Big Bang Migration

**Rationale:** Complete replacement of shell scripts with JavaScript utilities for a cleaner codebase. No hybrid period - once JavaScript utilities are ready, they fully replace shell scripts.

**Implementation:**
- Phase 1: Create all JavaScript utility modules in parallel
- Phase 2: Comprehensive testing of all utilities
- Phase 3: Single switchover - all shell scripts replaced with JS equivalents
- Phase 4: Remove shell script files entirely

**Benefits:**
- Cleaner codebase with no dual implementation
- No compatibility layer maintenance
- Faster cross-platform consistency

**Risks:**
- Higher upfront testing requirements
- No gradual rollback option
- All-or-nothing transition

---

## Next Decision: Error Handling Strategy

Since we're doing Big Bang (no shell script fallback), errors should be handled with:

**Standardized Error Response Structure:** All utilities return consistent error objects with:
- `success`: boolean
- `error.code`: Standardized error codes
- `error.message`: Human-readable description
- `error.details`: Operation context

**Recovery Mechanisms:**
- Automatic retry for transient failures
- Checkpoint/resume for interrupted workflows
- Rollback capabilities
- Detailed logging for debugging

With Big Bang migration, there's no fallback to shell scripts - the JavaScript utilities must handle all errors internally.

---

## Critical Decision: State Persistence Format

**Decision:** YAML Files

**Rationale:** Human-readable format like JSON, but better for version control merge conflicts. Agentfile already uses YAML extensively, maintaining consistency.

**Implementation:**
- State files stored in `.agentfile/state/` directory
- Each workflow gets `workflow-id.yaml` state file
- Includes: step status, timestamps, variables, history
- Easy to inspect, debug, and manually edit if needed

---

## Critical Decision: Package Distribution

**Decision:** Bundled with Agentfile

**Rationale:** Utilities ship as part of Agentfile installation. No npm dependency required - simplifies deployment and reduces external dependencies.

**Implementation:**
- JavaScript utilities included in Agentfile distribution
- Single package for end users
- No additional installation steps
- Easier for enterprise environments with strict dependency policies

---

## Summary & Next Steps

Key architectural decisions recorded:
1. **Migration Strategy:** Big Bang - complete shell script replacement
2. **State Persistence:** YAML files
3. **Package Distribution:** Bundled with Agentfile
4. **Error Handling:** Fail-fast with internal recovery mechanisms

The architecture document is now ready for implementation planning.
