# Examples & Use Cases

This section provides practical examples for using Installation Structure Enhancement.

---

## Example Workflows

### Example 1: Sarah's Clean React Project Setup

**Scenario:** Sarah is starting a new React project and wants to use agentfile without cluttering her project root.

**Steps:**
1. Sarah runs `bmad install installation-structure`
2. Alex (Setup Specialist) greets her: "Clean slate, fresh start! Let's set up your project."
3. Sarah chooses "clean" installation mode
4. Alex creates `.agentfile/` directory with all agentfile files
5. Project root stays perfectly clean with only `agentfile.yaml` visible
6. Sarah validates installation with `[VS]` Validate Structure

**Result:** Professional-grade setup with zero clutter in project root.

---

### Example 2: Team Migration from v0.1.0

**Scenario:** Development team has 10 projects using agentfile v0.1.0 and wants to upgrade to clean structure.

**Steps:**
1. Team lead engages Sam (Migration Specialist) for first project
2. Sam runs `[MA]` Migration Analysis on existing installation
3. Analysis reveals custom workflows and configurations
4. Sam creates detailed migration plan with backup strategy
5. Team approves plan, Sam executes `[SM]` Safe Migration
6. Migration completes successfully, Sam generates `[MR]` Migration Report
7. Team repeats process for remaining projects using lessons learned

**Result:** All 10 projects upgraded with zero data loss and full documentation.

---

### Example 3: DevOps Template Creation

**Scenario:** DevOps engineer wants to create project templates with agentfile pre-configured.

**Steps:**
1. Engineer engages Alex for template creation
2. Alex runs `[PT]` Project Template Creation workflow
3. Configures template for React, Vue, and Angular projects
4. Sets clean installation as default for all templates
5. Alex validates template generation and packaging
6. Templates distributed to development teams
7. New projects automatically get clean agentfile setup

**Result:** Consistent project organization across entire organization.

---

## Common Scenarios

### Scenario 1: "This project is already pristine!"

**Situation:** User tries to migrate a project that already has clean structure.

**Solution:**
- Structure validation detects clean installation
- System displays "This project is already pristine!" message
- No migration needed, user can continue with confidence

### Scenario 2: Migration Failure Recovery

**Situation:** Migration fails halfway through due to permission issues.

**Solution:**
- Sam detects failure automatically
- Rollback system engages using `[RS]` Rollback System
- Project restored to pre-migration state
- Sam analyzes failure and provides updated migration plan

### Scenario 3: Configuration Change After Installation

**Situation:** User wants to change backup location after initial setup.

**Solution:**
- Alex runs `[CM]` Configuration Management
- User updates backup_location setting
- Alex validates new configuration
- Change applied immediately for future operations

---

## Tips & Tricks

### Tip 1: Use "agentfile magic" Command

After installation, try the hidden command:
```bash
agentfile magic
```

Shows fun file organization animation demonstrating the invisible integration concept.

### Tip 2: "Clean Code" Badge

Run `[VS]` Validate Structure on your installation. If everything is perfect, you'll earn a "Clean Code" badge in your status report.

### Tip 3: Migration Safety First

Always run migration analysis before migration. Sam's "Safety first, progress always" approach means:
- Complete backup before any changes
- Validation at each step
- Rollback capability always available

### Tip 4: Template Integration

Enable `template_integration` during installation to automatically integrate with other BMAD modules' project creation workflows.

---

## Troubleshooting

### Common Issues

**Issue: "Permission denied" during migration**
- Solution: Check file permissions, run with appropriate privileges, or use rollback system

**Issue: "Configuration invalid" error**
- Solution: Run `[CM]` Configuration Management to validate and fix settings

**Issue: "Backup failed" during migration**
- Solution: Check backup location permissions and disk space before retrying

**Issue: "Template generation fails"**
- Solution: Validate template configuration and ensure all required fields are set

**Issue: "Structure validation fails"**
- Solution: Run `[VS]` Validate Structure for detailed report and fix recommendations

### Recovery Procedures

**Complete Migration Failure:**
1. Use `[RS]` Rollback System immediately
2. Review migration report for failure cause
3. Run `[MA]` Migration Analysis again with updated requirements
4. Retry migration with corrected approach

**Configuration Corruption:**
1. Use `[CM]` Configuration Management
2. Reset to defaults if needed
3. Reconfigure preferences
4. Validate with `[VS]` Structure Validation

---

## Getting More Help

- Review the main BMAD documentation
- Check module configuration in module.yaml
- Verify all agents and workflows are properly installed
- Contact support with detailed error logs and configuration details
