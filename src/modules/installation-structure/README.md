# Installation Structure Enhancement

Zero-clutter agentfile integration with invisible .agentfile/ directory organization

Professional-grade installation that respects project organization and enables seamless migration

---

## Overview

The Installation Structure Enhancement transforms agentfile from a tool that pollutes project roots into a professional-grade framework enhancement that respects developer workflows and project organization through invisible integration.

This module provides zero-clutter agentfile integration using invisible `.agentfile/` directory organization that maintains project purity while enabling seamless migration from existing v0.1.0 installations.

---

## Installation

```bash
bmad install installation-structure
```

---

## Quick Start

**For new projects:** Choose clean installation to keep your project root perfectly pristine with only a single `agentfile.yaml` visible.

**For existing installations:** Use migration utilities to safely upgrade to the clean structure with automatic backup and rollback capabilities.

**For detailed documentation, see [docs/](docs/).**

---

## Components

### Agents

- **Alex (Setup Specialist)** - Handles new installations and configuration with efficient, setup-focused approach
- **Sam (Migration Specialist)** - Manages upgrading existing installations with cautious, safety-focused methods

### Workflows

**Core Workflows:**
- **Clean Installation** - Install agentfile with .agentfile/ directory structure
- **Migration Analysis** - Analyze existing v0.1.0 installations for migration

**Feature Workflows:**
- **Project Template Creation** - Create reusable project templates with agentfile
- **Safe Migration** - Execute migration from v0.1.0 to new structure
- **Configuration Management** - Set and manage installation structure preferences
- **Rollback System** - Restore project state if migration fails

**Utility Workflows:**
- **Structure Validation** - Verify agentfile installation follows best practices
- **Migration Report** - Generate detailed migration documentation

---

## Configuration

The module supports these configuration options (set during installation):

- **installation_mode** - Choose 'clean' for invisible .agentfile/ directory or 'traditional' for root-level files
- **enable_migration** - Enable migration utilities for existing v0.1.0 installations
- **backup_location** - Where should migration backups be stored
- **auto_commit_migration** - Automatically create git commits for migration changes
- **template_integration** - Integrate with project template creation workflows
- **validate_structure** - Enable automatic installation structure validation

---

## Module Structure

```
installation-structure/
├── module.yaml
├── README.md
├── TODO.md
├── docs/
│   ├── getting-started.md
│   ├── agents.md
│   ├── workflows.md
│   └── examples.md
├── agents/
└── workflows/
```

---

## Documentation

For detailed user guides and documentation, see the **[docs/](docs/)** folder:
- [Getting Started](docs/getting-started.md)
- [Agents Reference](docs/agents.md)
- [Workflows Reference](docs/workflows.md)
- [Examples](docs/examples.md)

---

## Development Status

This module is currently in development. The following components are planned:

- [ ] Agents: 2 agents
- [ ] Workflows: 8 workflows

See TODO.md for detailed status.

---

## Author

Created via BMAD Module workflow

---

## License

Part of the BMAD framework.
