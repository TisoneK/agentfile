# Workflows Reference

installation-structure includes 8 workflows:

---

## Clean Installation

**ID:** `clean-installation`
**Workflow:** `clean-installation`

**Purpose:**
Install agentfile with .agentfile/ directory structure for zero-clutter project organization

**When to Use:**
- Starting a new project with agentfile
- Wanting to maintain clean project root
- Setting up professional-grade installation

**Key Steps:**
1. Initialize Clean Setup - Create .agentfile/ directory structure
2. Configure Installation - Set up module.yaml and preferences
3. Install Core Files - Copy agentfile files to .agentfile/ directory
4. Validate Structure - Verify clean installation follows standards
5. Create Status Command - Set up agentfile status reporting

**Agent(s):**
Alex (Setup Specialist)

---

## Migration Analysis

**ID:** `migration-analysis`
**Workflow:** `migration-analysis`

**Purpose:**
Analyze existing v0.1.0 installations for migration readiness and create migration plan

**When to Use:**
- Before upgrading existing agentfile installation
- Need to understand migration complexity
- Planning migration strategy

**Key Steps:**
1. Scan Installation - Detect existing agentfile files and structure
2. Analyze Dependencies - Identify tools, workflows, and customizations
3. Assess Migration Complexity - Evaluate migration difficulty and risks
4. Create Migration Plan - Generate step-by-step migration strategy
5. Backup Strategy - Design backup and rollback procedures

**Agent(s):**
Sam (Migration Specialist)

---

## Project Template Creation

**ID:** `project-template-creation`
**Workflow:** `project-template-creation`

**Purpose:**
Create reusable project templates with agentfile integration

**When to Use:**
- Creating project templates for teams
- Standardizing agentfile setup across projects
- Building template libraries

**Key Steps:**
1. Template Configuration - Define template structure and options
2. Agentfile Integration - Add clean agentfile setup to template
3. Customization Options - Configure template variables and settings
4. Validation - Test template generation and installation
5. Package Template - Create distributable template package

**Agent(s):**
Alex (Setup Specialist)

---

## Safe Migration

**ID:** `safe-migration`
**Workflow:** `safe-migration`

**Purpose:**
Execute migration from v0.1.0 to new clean structure with safety checks

**When to Use:**
- After completing migration analysis
- Ready to upgrade existing installation
- Need backup protection during migration

**Key Steps:**
1. Pre-Migration Backup - Create complete backup of existing installation
2. Migration Preparation - Set up target .agentfile/ structure
3. File Migration - Move files to new structure
4. Configuration Update - Update configurations for new structure
5. Validation - Verify migration success and functionality
6. Cleanup - Remove old files after successful validation

**Agent(s):**
Sam (Migration Specialist)

---

## Configuration Management

**ID:** `configuration-management`
**Workflow:** `configuration-management`

**Purpose:**
Set and manage installation structure preferences and settings

**When to Use:**
- Changing installation preferences
- Updating module configuration
- Managing integration settings

**Key Steps:**
1. Load Current Configuration - Read existing module.yaml settings
2. Present Configuration Options - Show available preferences and settings
3. Process User Changes - Update configuration based on user input
4. Validate Configuration - Ensure settings are valid and compatible
5. Apply Changes - Save updated configuration

**Agent(s):**
Alex (Setup Specialist)

---

## Rollback System

**ID:** `rollback-system`
**Workflow:** `rollback-system`

**Purpose:**
Restore project state if migration fails or issues arise

**When to Use:**
- Migration encounters errors
- Need to restore previous installation
- Emergency recovery after failed migration

**Key Steps:**
1. Detect Rollback Need - Identify failure conditions or user rollback request
2. Validate Backup - Verify backup integrity and availability
3. Rollback Execution - Restore files from backup
4. Configuration Restore - Revert configuration changes
5. Validation - Verify rollback success
6. Cleanup - Remove failed migration artifacts

**Agent(s):**
Sam (Migration Specialist)

---

## Structure Validation

**ID:** `structure-validation`
**Workflow:** `structure-validation`

**Purpose:**
Verify agentfile installation follows best practices and standards

**When to Use:**
- After installation or migration
- Periodic health checks
- Troubleshooting installation issues

**Key Steps:**
1. Scan Installation - Analyze current agentfile structure
2. Check Standards Compliance - Verify against installation standards
3. Validate Configuration - Check module.yaml and settings
4. Test Functionality - Verify agentfile operations work correctly
5. Generate Report - Create detailed validation report

**Agent(s):**
Both Alex and Sam (shared workflow)

---

## Migration Report

**ID:** `migration-report`
**Workflow:** `migration-report`

**Purpose:**
Generate detailed migration documentation and reports

**When to Use:**
- After completing migration
- Documenting migration process
- Creating audit trail for changes

**Key Steps:**
1. Collect Migration Data - Gather migration logs and metrics
2. Analyze Outcomes - Evaluate migration success and issues
3. Document Changes - Record all modifications made
4. Create Summary Report - Generate executive summary
5. Archive Documentation - Store reports for future reference

**Agent(s):**
Sam (Migration Specialist)

---

## Workflow Categories

**Core Workflows (Essential):**
- Clean Installation - Primary setup workflow
- Migration Analysis - Essential for existing installations

**Feature Workflows (Specialized):**
- Project Template Creation - Template management
- Safe Migration - Migration execution
- Configuration Management - Settings management
- Rollback System - Recovery capabilities

**Utility Workflows (Support):**
- Structure Validation - Health checks
- Migration Report - Documentation

---

## Workflow Integration

**Alex's Workflows:** Focus on setup and configuration
**Sam's Workflows:** Focus on migration and safety
**Shared Workflows:** Structure validation for consistency

All workflows integrate with the module's configuration system and respect user preferences set during installation.
