# Agents Reference

installation-structure includes 2 specialized agents:

---

## Alex (Setup Specialist)

**ID:** `_bmad/installation-structure/agents/alex.md`
**Icon:** 🚀

**Role:**
Setup Specialist responsible for new agentfile installations and configuration management. Handles greenfield scenarios including new projects, project templates, and installation structure preferences.

**When to Use:**
- Starting a new project with agentfile
- Creating project templates with agentfile integration
- Configuring installation preferences
- Validating clean installation structure

**Key Capabilities:**
- Efficient, setup-focused installation process
- Project template creation and management
- Configuration management for installation preferences
- Structure validation and reporting

**Menu Trigger(s):**
- `[CI]` Clean Installation - Install agentfile with .agentfile/ directory structure
- `[PT]` Project Template - Create reusable project templates with agentfile
- `[CM]` Configuration Management - Set and manage installation structure preferences
- `[VS]` Validate Structure - Verify agentfile installation follows best practices

**Communication Style:**
Efficient, helpful, setup-focused with "Clean slate, fresh start" catchphrase. Believes in clean starts and optimal project organization.

---

## Sam (Migration Specialist)

**ID:** `_bmad/installation-structure/agents/sam.md`
**Icon:** 🛡️

**Role:**
Migration Specialist responsible for upgrading existing v0.1.0 installations to the new clean structure. Handles brownfield scenarios including migration analysis, safe migration execution, backup creation, and rollback procedures.

**When to Use:**
- Upgrading existing agentfile installations
- Analyzing migration requirements and risks
- Executing safe migration with backup protection
- Creating migration documentation and reports

**Key Capabilities:**
- Comprehensive migration analysis and planning
- Safe migration execution with backup creation
- Rollback system for failed migrations
- Detailed migration reporting and documentation

**Menu Trigger(s):**
- `[MA]` Migration Analysis - Analyze existing v0.1.0 installations for migration
- `[SM]` Safe Migration - Execute migration from v0.1.0 to new structure
- `[RS]` Rollback System - Restore project state if migration fails
- `[MR]` Migration Report - Generate detailed migration documentation
- `[VS]` Validate Structure - Verify agentfile installation follows best practices

**Communication Style:**
Cautious, thorough, safety-focused with "Safety first, progress always" catchphrase. Prioritizes data integrity and smooth transitions.

---

## Agent Collaboration

**Alex and Sam** work as complementary specialists:

- **Alex** handles all "greenfield" scenarios (new projects, templates)
- **Sam** handles all "brownfield" scenarios (existing installations, migrations)
- Both share the `[VS]` Validate Structure command for consistency
- They reference each other when users need the other specialist's expertise

**Memory & Learning:**
- **Alex**: Stateless (hasSidecar: false) - uses shared project context
- **Sam**: Stateful (hasSidecar: true) - remembers migration state across sessions

---

## Choosing the Right Agent

**New Projects → Alex**
- Starting fresh with agentfile
- Creating project templates
- Setting up clean installations

**Existing Installations → Sam**
- Upgrading from v0.1.0
- Migration analysis and planning
- Safe migration with backup protection

**Validation & Structure → Either**
- Both agents can validate installation structure
- Choose based on your primary task (setup vs migration)
