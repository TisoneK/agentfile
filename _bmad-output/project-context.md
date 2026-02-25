---
project_name: 'agentfile'
user_name: 'Tisone'
date: '2026-02-24T14-05-00'
sections_completed: ['technology_stack', 'language_specific', 'framework_specific', 'testing_rules', 'code_quality', 'development_workflow', 'critical_dont_miss', 'completed']
status: 'complete'
rule_count: 47
optimized_for_llm: true
existing_patterns_found: 0
---

# Project Context for AI Agents

_This file contains critical rules and patterns that AI agents must follow when implementing code in this project. Focus on unobvious details that agents might otherwise miss._

---

## Technology Stack & Versions

- **Node.js**: v18.0.0+ (required for CLI runtime)
- **Agentfile**: YAML workflow format with Markdown agents/skills
- **Commander.js**: v12.0.0 (CLI argument parsing)
- **Chalk**: v4.1.2 (terminal output styling)
- **js-yaml**: v4.1.0 (YAML file processing)
- **AJV**: v8.12.0 (JSON Schema validation)
- **Runtime**: Cross-platform (Bash + PowerShell scripts)
- **Module System**: CommonJS (type: "commonjs" in package.json)

## Critical Implementation Rules

### Language-Specific Rules

- **Module System**: Use CommonJS (`require()`/`module.exports`) - NOT ES modules
- **Node.js Version**: Target v18.0.0+ for CLI runtime compatibility
- **CLI Entry Point**: Always use `./src/index.js` as main entry point
- **YAML Processing**: Use js-yaml with try-catch error handling
- **Schema Validation**: Validate workflow.yaml with AJV before processing
- **Error Handling**: CLI commands must catch and display user-friendly errors
- **Shebang**: CLI scripts should use `#!/usr/bin/env node` for portability

### Framework-Specific Rules

- **Agentfile Workflows**: Always validate workflow.yaml against schema before execution
- **Dual Execution Modes**: Support both IDE mode (direct step execution) and CLI mode (scripted)
- **Slash Protocol**: Use `/agentfile:run|create|list` commands - never improvise slash commands
- **Artifact Locations**: Runtime artifacts go in `outputs/` (gitignored), generation in `artifacts/`
- **Workflow Structure**: Follow exact folder layout - workflow.yaml, agents/, skills/, scripts/
- **CLI Commands**: Use Commander.js subcommands with consistent help text
- **Configuration**: Store user config in ~/.agentfile/config.json, never in project repo
- **Cross-Platform Scripts**: Always provide both .sh and .ps1 versions in scripts/cli/

### Testing Rules

- **CLI Testing**: Test all Commander.js subcommands with various argument combinations
- **Schema Validation**: Test AJV validation with both valid and invalid workflow.yaml files
- **Cross-Platform**: Test both .sh and .ps1 scripts on their respective platforms
- **Configuration Testing**: Mock ~/.agentfile/config.json for isolated testing
- **Workflow Testing**: Test complete workflow execution from start to finish
- **Error Scenarios**: Test error handling and user-friendly error messages
- **Dry-Run Mode**: Include dry-run options for testing without side effects

### Code Quality & Style Rules

- **File Naming**: Workflows use kebab-case, CLI files use camelCase, YAML keys use snake_case
- **Directory Structure**: Follow established layout - cli/src/, workflows/, shared/, artifacts/
- **CLI Help**: Provide comprehensive --help text for all Commander.js commands
- **README Files**: Every workflow must have README.md with usage examples and quick-start sections
- **Error Messages**: Use Chalk for colored, user-friendly error output with consistent exit codes
- **Code Comments**: Document complex CLI logic and workflow step purposes
- **YAML Formatting**: Use 2 spaces indentation with consistent key ordering (required first)
- **Line Length**: Maximum 80-100 characters for readability
- **Function Complexity**: Keep CLI functions focused and testable
- **Version Control**: Use conventional commit patterns aligned with workflow structure
- **Documentation Updates**: Tie to semantic versioning and feature changes
- **Code Review**: Include checklist items for all style standards

### Development Workflow Rules

- **Branch Naming**: Use kebab-case for feature branches, aligning with workflow naming conventions
- **Commit Messages**: Include workflow names for workflow-related changes, follow semantic versioning
- **PR Requirements**: Update README.md for workflow changes, help text for CLI changes, version bump for schema changes
- **Release Process**: npm publish for CLI updates, GitHub releases for workflow collections
- **Documentation Sync**: Keep shared/project.md and AGENTS.md in sync with project changes
- **Schema Updates**: Require workflow_status.json updates when schema changes

### Critical Don't-Miss Rules

- **Workflow Creation**: Never create files directly in workflows/ - always use workflow-creator pipeline
- **Script Execution**: Never run shell scripts directly in IDE mode - use agentfile CLI commands
- **Slash Commands**: Never improvise slash commands - stick to exact /agentfile: protocol
- **API Keys**: Never store API keys or secrets in project files - use ~/.agentfile/config.json
- **Config Handling**: Handle missing ~/.agentfile/config.json gracefully with helpful error messages
- **Schema Validation**: Always validate workflow.yaml with AJV before execution
- **Execution Modes**: Support both IDE and CLI modes properly - check workflow.yaml execution.preferred
- **Cross-Platform**: Test both .sh and .ps1 scripts - handle platform-specific differences
- **Security**: Never expose secrets in logs, validate inputs to prevent injection attacks
- **Performance**: Use streaming for large files, cache validation results, handle concurrency

---

## Usage Guidelines

**For AI Agents:**

- Read this file before implementing any code
- Follow ALL rules exactly as documented
- When in doubt, prefer the more restrictive option
- Update this file if new patterns emerge

**For Humans:**

- Keep this file lean and focused on agent needs
- Update when technology stack changes
- Review quarterly for outdated rules
- Remove rules that become obvious over time

Last Updated: 2026-02-24T14-05-00
