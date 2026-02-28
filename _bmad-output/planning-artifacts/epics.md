---
stepsCompleted: [step-01-validate-prerequisites, step-02-design-epics, step-03-create-stories, step-04-final-validation]
inputDocuments:
  - _bmad-output/planning-artifacts/prd.md
  - _bmad-output/planning-artifacts/architecture.md
---

# agentfile - Epic Breakdown

## Overview

This document provides the complete epic and story breakdown for agentfile, decomposing the requirements from the PRD, UX Design if it exists, and Architecture requirements into implementable stories.

## Requirements Inventory

### Functional Requirements

FR1: Developers can create new workflows using slash commands
FR2: Developers can define workflow steps with YAML configuration/bmad-bmm-check-implementation-readiness.md 
FR3: Developers can execute workflows via slash commands
FR4: Developers can list all available workflows
FR5: Developers can view workflow execution status and history
FR6: The system can execute file operations (copy, move, create, delete)
FR7: The system can process templates with variable substitution
FR8: The system can persist workflow state for checkpoint/resume
FR9: The system can handle errors gracefully with clear messages
FR10: The system can execute steps sequentially or in parallel
FR11: The system can configure IDE-native slash commands in supported IDEs
FR12: The IDE parses /agentfile:run and invokes agentfile CLI for execution
FR13: The IDE parses /agentfile:create and invokes agentfile CLI for workflow creation
FR14: The IDE parses /agentfile:list and invokes agentfile CLI to list workflows
FR15: The system can display workflow results in IDE output
FR16: Team leads can share workflows via shared repositories
FR17: Team members can import team-standard workflows
FR18: Teams can version control their workflows
FR19: Developers can create custom agents with defined capabilities
FR20: Developers can create custom skills for reusable logic
FR21: Developers can extend workflows with custom templates
FR22: The system can load third-party agents and skills
FR23: Users can install agentfile via npm
FR24: Users can get clear error messages when workflows fail
FR25: Users can debug workflow execution with step-by-step output
FR26: Users can access documentation from within the IDE
FR27: Users can configure default workflow execution options
FR28: Users can set up environment variables for workflows
FR29: Users can customize output verbosity levels
FR30: The system can log workflow execution history
FR31: Users can view past workflow execution results
FR32: Users can identify which workflows take longest to execute

### NonFunctional Requirements

NFR1: Workflow Initialization - Workflows should initialize within 2 seconds
NFR2: File Operations - File operations should match or exceed shell script performance
NFR3: Cross-Platform Consistency - Behavior should be consistent across Windows, macOS, and Linux
NFR4: Data Protection - User workflow definitions and configurations should be stored securely
NFR5: No Sensitive Data Exposure - Error messages should not expose sensitive system information
NFR6: Safe Execution - Workflow execution should sandbox dangerous operations
NFR7: User Growth - Support growth from initial users to 500+ projects
NFR8: Workflow Complexity - Support workflows with 50+ steps without degradation
NFR9: Team Scale - Support teams with 10+ members sharing workflows
NFR10: IDE Compatibility - Work with Cursor, Windsurf, and VS Code
NFR11: Command Response - Slash commands should respond within 500ms
NFR12: Output Format - Results should display cleanly in IDE output panels

### Additional Requirements

Architecture Requirements:
- CLI Interactive Wizard for IDE Selection: The system must include an interactive wizard (using inquirer) that prompts users to select their IDE(s) during initialization
- .agentfile/ Directory: The system must create and maintain a .agentfile/ directory as the source of truth for all command definitions
- IDE Wrapper Generation: The system must generate IDE-specific wrapper files for Windsurf, Cursor, KiloCode, GitHub Copilot, and Cline
- Template System: The system must use static template files from cli/src/templates/ that are copied directly without variable substitution
- Idempotent Re-run: The system must support idempotent re-runs that merge/preserve existing configurations and add missing IDE wrappers
- File Operations: The system must use existing src/js-utils/file-ops.js for file operations
- CWD Resolution: The system must default to current working directory for agentfile init

### FR Coverage Map

FR1: Epic 1 - Create workflows using slash commands
FR2: Epic 1 - Define workflow steps with YAML configuration
FR3: Epic 1 - Execute workflows via slash commands
FR4: Epic 1 - List all available workflows
FR5: Epic 1 - View workflow execution status and history
FR6: Epic 2 - Execute file operations
FR7: Epic 2 - Process templates with variable substitution
FR8: Epic 2 - Persist workflow state for checkpoint/resume
FR9: Epic 2 - Handle errors gracefully with clear messages
FR10: Epic 2 - Execute steps sequentially or in parallel
FR11: Epic 3 - Configure IDE-native slash commands
FR12: Epic 3 - IDE parses /agentfile:run, invokes CLI
FR13: Epic 3 - IDE parses /agentfile:create, invokes CLI
FR14: Epic 3 - IDE parses /agentfile:list, invokes CLI
FR15: Epic 3 - Display workflow results in IDE output
FR16: Epic 4 - Share workflows via shared repositories
FR17: Epic 4 - Import team-standard workflows
FR18: Epic 4 - Version control workflows
FR19: Epic 5 - Create custom agents with defined capabilities
FR20: Epic 5 - Create custom skills for reusable logic
FR21: Epic 5 - Extend workflows with custom templates
FR22: Epic 5 - Load third-party agents and skills
FR23: Epic 6 - Install agentfile via npm
FR24: Epic 6 - Get clear error messages when workflows fail
FR25: Epic 6 - Debug workflow execution with step-by-step output
FR26: Epic 6 - Access documentation from within the IDE
FR27: Epic 6 - Configure default workflow execution options
FR28: Epic 6 - Set up environment variables for workflows
FR29: Epic 6 - Customize output verbosity levels
FR30: Epic 6 - Log workflow execution history
FR31: Epic 6 - View past workflow execution results
FR32: Epic 6 - Identify which workflows take longest to execute

## Epic List

### Epic 1: Core Workflow Management
Developers can create, define, execute, list, and monitor workflows using intuitive slash commands.
**FRs covered:** FR1, FR2, FR3, FR4, FR5

### Epic 2: Workflow Execution Engine
The system provides a powerful execution engine with file operations, template processing, state persistence, error handling, and parallel execution support.
**FRs covered:** FR6, FR7, FR8, FR9, FR10

### Epic 3: IDE Integration
Slash commands work seamlessly in supported IDEs (Cursor, Windsurf, VS Code) through native IDE configuration. The IDE handles command parsing and invokes agentfile CLI for workflow execution.
**FRs covered:** FR11, FR12, FR13, FR14, FR15

### Epic 4: Team Workflow Sharing
Teams can share, import, and version-control standardized workflows across their organization.
**FRs covered:** FR16, FR17, FR18

### Epic 5: Extensibility System
Developers can create custom agents, skills, and templates, and load third-party extensions.
**FRs covered:** FR19, FR20, FR21, FR22

### Epic 6: Developer Experience & Observability
Users have an excellent developer experience with npm installation, clear error messages, debugging tools, documentation access, configuration options, and execution logging.
**FRs covered:** FR23, FR24, FR25, FR26, FR27, FR28, FR29, FR30, FR31, FR32

### Epic 7: IDE Setup & Configuration
The agentfile CLI provides an interactive wizard for IDE selection, generates IDE-specific wrapper files, and maintains a template system with idempotent re-run support.
**Architecture Requirements covered:** CLI Wizard, .agentfile/ Directory, IDE Wrapper Generation, Template System, Idempotent Re-run, File Operations, CWD Resolution

---

## Epic 1: Core Workflow Management

Developers can create, define, execute, list, and monitor workflows using intuitive slash commands.

### Story 1.1: Create New Workflow via Slash Command

As a developer,
I want to create a new workflow using the /agentfile:create slash command,
So that I can quickly set up automation for my development tasks.

**Acceptance Criteria:**

**Given** the agentfile CLI is installed and integrated with the IDE
**When** I type /agentfile:create followed by a workflow name and description
**Then** a new workflow file is created in the workflows/ directory
**And** the workflow is immediately available for execution

**Given** the agentfile CLI is installed and integrated with the IDE
**When** I type /agentfile:create without arguments
**Then** I am prompted to enter a workflow name and description interactively

---

### Story 1.2: Define Workflow Steps with YAML

As a developer,
I want to define workflow steps using YAML configuration,
So that I can specify the exact actions and order of execution for my workflow.

**Acceptance Criteria:**

**Given** a new workflow has been created
**When** I edit the workflow.yaml file and add steps with name, action, and parameters
**Then** the workflow parser validates the YAML structure
**And** the steps are stored for later execution

**Given** an invalid YAML structure
**When** I try to save the workflow
**Then** I receive a clear error message explaining the validation failure

---

### Story 1.3: Execute Workflow via Slash Command

As a developer,
I want to execute a workflow using the /agentfile:run slash command,
So that I can automate my development tasks with a single command.

**Acceptance Criteria:**

**Given** a valid workflow exists with at least one step
**When** I type /agentfile:run followed by the workflow name
**Then** the workflow executes each step in sequence
**And** the results are displayed in the IDE output

**Given** a workflow with multiple steps
**When** I execute the workflow
**Then** each step executes sequentially by default
**And** I can see progress for each step as it completes

---

### Story 1.4: List All Available Workflows

As a developer,
I want to list all available workflows using the /agentfile:list slash command,
So that I can see what workflows are available in my project.

**Acceptance Criteria:**

**Given** workflows exist in the project
**When** I type /agentfile:list
**Then** I see a list of all workflow names and their descriptions
**And** I can quickly identify which workflows are available

**Given** no workflows exist in the project
**When** I type /agentfile:list
**Then** I see a message indicating no workflows are available
**And** I am prompted to create a new workflow

---

### Story 1.5: View Workflow Execution Status and History

As a developer,
I want to view the execution status and history of workflows,
So that I can monitor progress and review past executions.

**Acceptance Criteria:**

**Given** a workflow has been executed
**When** I request execution history
**Then** I see a list of past executions with timestamps
**And** each entry shows success/failure status

**Given** a workflow is currently executing
**When** I check the status
**Then** I see the current step being executed
**And** I see progress information (e.g., step 2 of 5)

---

## Epic 2: Workflow Execution Engine

The system provides a powerful execution engine with file operations, template processing, state persistence, error handling, and parallel execution support.

### Story 2.1: Execute File Operations

As a developer,
I want my workflow to perform file operations like copy, move, create, and delete,
So that I can automate file management tasks.

**Acceptance Criteria:**

**Given** a workflow step with file operation type "copy"
**When** the step executes
**Then** the source file is copied to the destination path
**And** the operation completes without errors for valid paths

**Given** a workflow step with file operation type "create"
**When** the step executes
**Then** a new file is created at the specified path
**And** any necessary parent directories are created automatically

**Given** an invalid source or destination path
**When** the file operation executes
**Then** the workflow fails with a clear error message

---

### Story 2.2: Process Templates with Variable Substitution

As a developer,
I want my workflow to process templates with variable substitution,
So that I can create dynamic content based on context.

**Acceptance Criteria:**

**Given** a template file with {{variable}} placeholders
**When** the template processing step executes
**Then** all placeholders are replaced with actual values
**And** the processed content is written to the output file

**Given** a template with missing variable values
**When** the template processing executes
**Then** the workflow fails with a clear error indicating the missing variable

**Given** a template with nested variable references
**When** the template processes
**Then** all nested references are resolved correctly

---

### Story 2.3: Persist Workflow State for Checkpoint/Resume

As a developer,
I want my workflow to persist state so it can be resumed after interruption,
So that long-running workflows are not lost if something fails.

**Acceptance Criteria:**

**Given** a workflow is executing
**When** the workflow completes a step
**Then** the current state is saved to persistent storage
**And** the workflow can be resumed from this checkpoint

**Given** a workflow was interrupted
**When** I run the same workflow again with a resume flag
**Then** the workflow continues from the last successful step
**And** previously completed steps are skipped

**Given** a workflow completes all steps
**When** execution finishes
**Then** the checkpoint data is cleaned up
**And** the workflow can run fresh on next execution

---

### Story 2.4: Handle Errors Gracefully with Clear Messages

As a developer,
I want my workflow to handle errors gracefully with clear messages,
So that I can quickly identify and fix issues.

**Acceptance Criteria:**

**Given** a workflow step fails
**When** the error occurs
**Then** the workflow stops execution
**And** a clear error message explains what failed and why

**Given** a workflow fails
**When** the error is displayed
**Then** the error message does not expose sensitive system information
**And** the user is given actionable guidance on how to fix the issue

**Given** a workflow has error handling configured
**When** a step fails
**Then** the configured error handler is invoked
**And** the workflow can either retry, skip, or abort based on configuration

---

### Story 2.5: Execute Steps Sequentially or In Parallel

As a developer,
I want my workflow to support both sequential and parallel step execution,
So that I can optimize workflow performance based on task dependencies.

**Acceptance Criteria:**

**Given** a workflow with sequential steps (default)
**When** the workflow executes
**Then** each step completes before the next one starts
**And** the final result is the same as the sequential order

**Given** a workflow with parallel steps marked
**When** the workflow executes
**Then** independent steps run concurrently
**And** the workflow waits for all parallel steps to complete before continuing

**Given** parallel steps with dependencies
**When** the workflow executes
**Then** steps wait for their dependencies to complete
**And** the execution respects the dependency graph

---

## Epic 3: IDE Integration

Slash commands work seamlessly in supported IDEs (Cursor, Windsurf, VS Code) through native IDE configuration. The IDE handles command parsing and invokes agentfile CLI for workflow execution.

### Story 3.1: Configure IDE-Native Slash Commands

As a developer,
I want agentfile slash commands to be natively available in my IDE,
So that I can access workflow functionality directly from the command line.

**Acceptance Criteria:**

**Given** the agentfile init command has been run
**When** I open my IDE
**Then** the slash commands (/agentfile:run, /agentfile:create, /agentfile:list) are available
**And** they respond to invocation

**Given** multiple IDEs are configured
**When** I use each IDE
**Then** the slash commands work consistently across all supported IDEs
**And** the behavior is uniform

---

### Story 3.2: IDE Invokes agentfile CLI for /agentfile:run

As a developer,
I want to execute workflows using /agentfile:run,
So that I can quickly run my automated tasks.

**Acceptance Criteria:**

**Given** /agentfile:run is invoked with a valid workflow name
**When** the command is parsed
**Then** the specified workflow is executed
**And** results are displayed in the IDE output

**Given** /agentfile:run is invoked with an invalid workflow name
**When** the command is parsed
**Then** an error message lists available workflows
**And** the user is guided to use /agentfile:list

**Given** /agentfile:run is invoked with additional arguments
**When** the command is parsed
**Then** arguments are passed to the workflow as variables
**And** the workflow can use these at runtime

---

### Story 3.3: IDE Invokes agentfile CLI for /agentfile:create

As a developer,
I want to create new workflows using /agentfile:create,
So that I can quickly set up new automation tasks.

**Acceptance Criteria:**

**Given** /agentfile:create is invoked with a workflow name
**When** the command is parsed
**Then** a new workflow file is scaffolded
**And** the user can immediately edit the workflow

**Given** /agentfile:create is invoked without arguments
**When** the command is parsed
**Then** an interactive wizard guides the user through workflow creation

**Given** /agentfile:create is invoked with a name that already exists
**When** the command is parsed
**Then** the user is prompted to either overwrite or choose a different name

---

### Story 3.4: IDE Invokes agentfile CLI for /agentfile:list

As a developer,
I want to list all available workflows using /agentfile:list,
So that I can see what automation is available.

**Acceptance Criteria:**

**Given** /agentfile:list is invoked
**When** the command is parsed
**Then** all workflows in the project are displayed
**And** each entry shows name, description, and last execution time

**Given** /agentfile:list is invoked with a filter argument
**When** the command is parsed
**Then** only workflows matching the filter are displayed

**Given** no workflows exist
**When** /agentfile:list is invoked
**Then** a helpful message is displayed
**And** the user is directed to /agentfile:create

---

### Story 3.5: Display Workflow Results in IDE Output

As a developer,
I want workflow execution results displayed in the IDE output panel,
So that I can see the results of my automated tasks.

**Acceptance Criteria:**

**Given** a workflow executes successfully
**When** execution completes
**Then** success output is displayed in the IDE output panel
**And** the output is formatted for readability

**Given** a workflow fails
**When** execution stops
**Then** error details are displayed in the IDE output panel
**And** the error message is clear and actionable

**Given** a long-running workflow
**When** steps are executing
**Then** progress updates appear in real-time
**And** the user can see which step is currently running

---

## Epic 4: Team Workflow Sharing

Teams can share, import, and version-control standardized workflows across their organization.

### Story 4.1: Share Workflows via Shared Repositories

As a team lead,
I want to share workflows via shared repositories,
So that my team can access standardized automation.

**Acceptance Criteria:**

**Given** a workflow exists in a local project
**When** I export the workflow to a shared location
**Then** the workflow files are saved to the shared repository
**And** the workflow can be imported by team members

**Given** a workflow is updated in the shared repository
**When** team members sync their local projects
**Then** they receive the latest version of the workflow

---

### Story 4.2: Import Team-Standard Workflows

As a team member,
I want to import team-standard workflows into my project,
So that I can use the team's standardized automation.

**Acceptance Criteria:**

**Given** a shared workflow repository is configured
**When** I run the import command
**Then** all available team workflows are listed
**And** I can select which ones to import

**Given** a specific workflow name to import
**When** I run the import command with the workflow name
**Then** only that workflow is imported
**And** it is immediately available in my project

---

### Story 4.3: Version Control Workflows

As a developer,
I want my workflows to be version controlled,
So that I can track changes and collaborate with others.

**Acceptance Criteria:**

**Given** a workflow is created
**When** the project uses git
**Then** the workflow file is tracked by version control
**And** changes can be committed and reviewed

**Given** multiple team members edit the same workflow
**When** they merge their changes
**Then** the workflow history shows all changes
**And** conflicts can be resolved using standard git workflows

---

## Epic 5: Extensibility System

Developers can create custom agents, skills, and templates, and load third-party extensions.

### Story 5.1: Create Custom Agents with Defined Capabilities

As a developer,
I want to create custom agents with defined capabilities,
So that I can extend agentfile with specialized functionality.

**Acceptance Capabilities:**

**Given** I want to create a custom agent
**When** I define an agent configuration file
**Then** the agent is loaded by agentfile
**And** it can be used in workflows

**Given** a custom agent with specific capabilities
**When** a workflow references that agent
**Then** the agent performs its defined actions
**And** the results are integrated into the workflow

---

### Story 5.2: Create Custom Skills for Reusable Logic

As a developer,
I want to create custom skills for reusable logic,
So that I can encapsulate common patterns and share them across workflows.

**Acceptance Criteria:**

**Given** I want to create a custom skill
**When** I define a skill configuration file
**Then** the skill is registered with agentfile
**And** it can be invoked from any workflow

**Given** a custom skill is defined
**When** a workflow calls that skill
**Then** the skill executes its logic
**And** returns results to the workflow

---

### Story 5.3: Extend Workflows with Custom Templates

As a developer,
I want to extend workflows with custom templates,
So that I can create reusable workflow patterns.

**Acceptance Criteria:**

**Given** I want to create a custom template
**When** I save a workflow as a template
**Then** the template is available for future workflow creation
**And** new workflows can be based on this template

**Given** a template with variables
**When** I create a new workflow from the template
**Then** I am prompted to fill in the variable values
**And** a customized workflow is generated

---

### Story 5.4: Load Third-Party Agents and Skills

As a developer,
I want to load third-party agents and skills,
So that I can use community-built extensions.

**Acceptance Criteria:**

**Given** a third-party agent or skill package
**When** I install it via npm
**Then** agentfile automatically discovers and loads it
**And** it is available for use in workflows

**Given** a third-party extension is loaded
**When** I use it in a workflow
**Then** it functions the same as built-in agents and skills
**And** documentation from the package is accessible

---

## Epic 6: Developer Experience & Observability

Users have an excellent developer experience with npm installation, clear error messages, debugging tools, documentation access, configuration options, and execution logging.

### Story 6.1: Install agentfile via npm

As a developer,
I want to install agentfile via npm,
So that I can quickly get started with the tool.

**Acceptance Criteria:**

**Given** Node.js 18+ is installed
**When** I run npm install -g agentfile
**Then** the agentfile CLI is installed globally
**And** the agentfile command is available in my terminal

**Given** agentfile is installed
**When** I run agentfile --version
**Then** the version number is displayed
**And** the installation is confirmed

---

### Story 6.2: Get Clear Error Messages When Workflows Fail

As a developer,
I want clear error messages when workflows fail,
So that I can quickly identify and fix issues.

**Acceptance Criteria:**

**Given** a workflow step fails
**When** the error occurs
**Then** a clear message explains what failed
**And** suggests how to fix the issue

**Given** a workflow fails due to invalid configuration
**When** the error is displayed
**Then** the exact line or parameter causing the issue is highlighted

---

### Story 6.3: Debug Workflow Execution with Step-by-Step Output

As a developer,
I want to debug workflow execution with step-by-step output,
So that I can identify issues in my workflow logic.

**Acceptance Criteria:**

**Given** a workflow is executed with debug mode enabled
**When** each step executes
**Then** detailed output shows exactly what is happening
**And** variable values are displayed at each step

**Given** a workflow fails in debug mode
**When** the error occurs
**Then** the full context at the time of failure is displayed

---

### Story 6.4: Access Documentation from Within the IDE

As a developer,
I want to access documentation from within the IDE,
So that I can learn how to use agentfile without leaving my workflow.

**Acceptance Criteria:**

**Given** I am using the IDE with agentfile integrated
**When** I invoke the help command
**Then** documentation is displayed in the IDE
**And** I can quickly reference workflow syntax and examples

**Given** I want help on a specific command
**When** I invoke help with the command name
**Then** specific documentation for that command is shown

---

### Story 6.5: Configure Default Workflow Execution Options

As a developer,
I want to configure default workflow execution options,
So that I don't have to specify them every time.

**Acceptance Criteria:**

**Given** I want to set default execution options
**When** I create a configuration file
**Then** the options are applied to all workflow executions
**And** they can be overridden per execution if needed

**Given** default options are configured
**When** I run a workflow without specifying options
**Then** the defaults are used
**And** I see the applied configuration in the output

---

### Story 6.6: Set Up Environment Variables for Workflows

As a developer,
I want to set up environment variables for workflows,
So that I can customize behavior without hardcoding values.

**Acceptance Criteria:**

**Given** I want to configure environment variables
**When** I create an environment configuration
**Then** variables are available to all workflow steps
**And** they can be referenced in templates and commands

**Given** sensitive environment variables
**When** they are configured
**Then** they are stored securely
**And** they are not exposed in logs or error messages

---

### Story 6.7: Customize Output Verbosity Levels

As a developer,
I want to customize output verbosity levels,
So that I can see only the information I need.

**Acceptance Criteria:**

**Given** I want minimal output
**When** I set verbosity to "quiet"
**Then** only essential information is displayed
**And** success/failure status is shown

**Given** I want detailed output
**When** I set verbosity to "verbose"
**Then** all execution details are displayed
**And** debugging information is available

---

### Story 6.8: Log Workflow Execution History

As a developer,
I want to log workflow execution history,
So that I can maintain a record of what was executed.

**Acceptance Criteria:**

**Given** a workflow executes
**When** execution completes
**Then** details are saved to the execution log
**And** the log includes timestamps, inputs, and outputs

**Given** I want to search past executions
**When** I query the log
**Then** I can filter by workflow name, date, or status

---

### Story 6.9: View Past Workflow Execution Results

As a developer,
I want to view past workflow execution results,
So that I can review what happened in previous runs.

**Acceptance Criteria:**

**Given** past workflow executions exist
**When** I request to view past results
**Then** I see a list of previous executions
**And** I can select one to view full details

**Given** I want to view a specific execution
**When** I select it from the history
**Then** the full output and any errors are displayed

---

### Story 6.10: Identify Which Workflows Take Longest to Execute

As a developer,
I want to identify which workflows take longest to execute,
So that I can optimize performance bottlenecks.

**Acceptance Criteria:**

**Given** multiple workflows have been executed
**When** I view performance metrics
**Then** I see execution times for each workflow
**And** the slowest workflows are highlighted

**Given** I want detailed timing information
**When** I run a workflow in performance mode
**Then** each step shows its individual execution time
**And** I can identify which steps are slow

---

## Epic 7: IDE Setup & Configuration

The agentfile CLI provides an interactive wizard for IDE selection, generates IDE-specific wrapper files, and maintains a template system with idempotent re-run support.

### Story 7.1: CLI Interactive Wizard for IDE Selection

As a developer,
I want an interactive wizard to guide IDE selection,
So that I can easily set up agentfile for my preferred IDE.

**Acceptance Criteria:**

**Given** I run agentfile init
**When** no IDE is specified
**Then** an interactive wizard prompts me to select my IDE(s)
**And** I can choose from supported IDEs (Cursor, Windsurf, VS Code, etc.)

**Given** multiple IDEs are selected
**When** the wizard completes
**Then** agentfile is configured for all selected IDEs

---

### Story 7.2: Create and Populate .agentfile/ Directory

As a developer,
I want agentfile to create a .agentfile/ directory as the source of truth,
So that all IDE configurations reference a central location.

**Acceptance Criteria:**

**Given** agentfile init runs for the first time
**When** initialization completes
**Then** a .agentfile/ directory is created
**And** command definition files are copied to it

**Given** .agentfile/ already exists
**When** agentfile init runs again
**Then** existing contents are preserved
**And** only new files are added

---

### Story 7.3: Generate IDE-Specific Wrapper Files

As a developer,
I want agentfile to generate IDE-specific wrapper files,
So that each IDE can invoke agentfile commands correctly.

**Acceptance Criteria:**

**Given** IDE selection during init
**When** initialization completes
**Then** IDE-specific wrapper files are generated
**And** they reference the .agentfile/ directory

**Given** Windsurf is selected
**When** init runs
**Then** .windsurf/workflows/*.md files are created

**Given** Cursor is selected
**When** init runs
**Then** .cursor/ configuration files are created

**Given** other IDEs are selected
**When** init runs
**Then** the appropriate configuration files are created

---

### Story 7.4: Implement Template System for Static File Copying

As a developer,
I want agentfile to use a template system that copies files as-is,
So that I can customize the command definitions.

**Acceptance Criteria:**

**Given** template files exist in cli/src/templates/
**When** agentfile init runs
**Then** templates are copied directly without modification
**And** they become the .agentfile/ contents

**Given** I want to customize command definitions
**When** I edit files in .agentfile/
**Then** my changes take precedence over defaults

---

### Story 7.5: Implement Idempotent Re-Run Logic

As a developer,
I want agentfile init to be idempotent,
So that I can run it multiple times without breaking existing setup.

**Acceptance Criteria:**

**Given** agentfile has been initialized
**When** I run agentfile init again
**Then** existing configurations are preserved
**And** missing IDE wrappers are added

**Given** I have customized IDE configurations
**When** agentfile init runs
**Then** my customizations are never overwritten
**And** only missing files are created

---

### Story 7.6: Implement File Operations Using js-utils

As a developer,
I want agentfile to use the existing file-ops utility,
So that file operations are consistent and reliable.

**Acceptance Criteria:**

**Given** file operations are needed during init
**When** the init command executes
**Then** src/js-utils/file-ops.js is used
**And** all file operations use async/await

---

### Story 7.7: Implement CWD Resolution for agentfile init

As a developer,
I want agentfile init to default to the current working directory,
So that I can initialize in the right location easily.

**Acceptance Criteria:**

**Given** I run agentfile init without arguments
**When** the command executes
**Then** the current working directory is used

**Given** I run agentfile init with "."
**When** the command executes
**Then** the current working directory is used

**Given** I run agentfile init --here
**When** the command executes
**Then** the current working directory is used















