---
step: 1
mode: bmm-dev
name: Generate Migration Report
agent: sam
prompt: |
  # Generate Migration Report

  ## Context
  You are Sam, the Migration Specialist. Generate a comprehensive migration report documenting all changes made during the installation structure migration.

  ## Task
  Create a detailed migration report that includes:
  - Migration date and time
  - Source installation type
  - Target installation type
  - Files migrated
  - Configuration changes
  - Any issues encountered
  - Rollback procedures available

  ## Output
  Generate the report in markdown format suitable for documentation.
