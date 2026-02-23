# Skill: Setup Review Context

## Purpose
Initialize the code review environment by loading configuration, identifying target files, and preparing analysis workspace.

## Instructions

1. **Parse Input Parameters**
   - Extract target path from INPUT_PATH environment variable
   - Validate that the path exists and is accessible
   - Determine if input is a file, directory, or git reference

2. **Load Review Configuration**
   - Read configuration from `.review-config.json` or default settings
   - Parse review rules, thresholds, and exclusion patterns
   - Load language-specific analysis rules
   - Validate configuration completeness and consistency

3. **Identify Target Files**
   - Discover source files in the target path
   - Apply exclusion patterns (node_modules, .git, build artifacts)
   - Group files by programming language
   - Generate file inventory with metadata

4. **Setup Analysis Environment**
   - Create temporary workspace for analysis artifacts
   - Initialize logging and reporting structures
   - Set environment variables for analysis tools
   - Prepare git context if repository detected

5. **Initialize Git Context**
   - Detect git repository and extract branch information
   - Generate diff if comparing against another branch/commit
   - Identify changed files for incremental review
   - Extract commit metadata and author information

6. **Create Context Document**
   - Summarize configuration and scope
   - Document file inventory and analysis plan
   - Record environment setup details
   - Provide workflow state and next steps

## Examples

### Good Input Handling
```bash
# Single file
INPUT_PATH="src/main.py"

# Directory
INPUT_PATH="src/"

# Git reference
INPUT_PATH="HEAD~1..HEAD"

# With explicit config
INPUT_PATH="src/" REVIEW_CONFIG=".review-config.json"
```

### Configuration Structure
```json
{
  "languages": ["python", "javascript"],
  "thresholds": {
    "complexity_max": 10,
    "duplication_max": 5,
    "security_critical": true
  },
  "exclude": ["tests/", "vendor/"],
  "tools": {
    "static_analyzer": "pylint",
    "security_scanner": "bandit"
  }
}
```

### Context Document Output
```markdown
# Review Context Initialization

## Configuration
**Languages:** Python, JavaScript
**Complexity Threshold:** 10
**Security Critical:** Enabled

## Target Scope
**Files:** 47 source files
**Languages:** Python (32), JavaScript (15)
**Git Context:** feature-branch vs main (23 files changed)

## Analysis Environment
**Workspace:** /tmp/review-2023-01-15-001
**Tools:** pylint, bandit, eslint, semgrep
**Logging:** /tmp/review-2023-01-15-001/logs/

## Workflow State
**Current Step:** Context initialization complete
**Next Steps:** Static analysis, security scan, style check
```

### Bad Example to Avoid
```markdown
# Missing configuration details
## Setup complete
Files found: some files
Ready to start
```

## Validation Checklist
- [ ] Input path validated and accessible
- [ ] Configuration loaded and validated
- [ ] File inventory created with metadata
- [ ] Analysis workspace prepared
- [ ] Git context extracted if applicable
- [ ] Context document complete and structured
- [ ] All required environment variables set
- [ ] Logging and error handling configured
