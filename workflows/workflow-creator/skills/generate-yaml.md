# Skill: Generate YAML

## Purpose
Teach the Generator how to produce valid, well-structured `workflow.yaml` files that conform to project conventions.

## Instructions

### Required Top-Level Fields
```yaml
name: <slug>
version: <semver>
description: >
  <multi-line description>

trigger:
  type: <natural-language | file | schedule | command>
  input_var: <env var name for the trigger input>

output:
  directory: workflows/{workflow_name}

steps:
  - id: <step-id>
    ...
```

### Step Fields
```yaml
- id: <lowercase-hyphenated>         # required
  name: <Human Readable Name>        # required
  agent: agents/<name>.md            # required for LLM steps
  skill: skills/<name>.md            # optional but recommended
  input: <file path or $VAR>         # required
  goal: >                            # required — what this step achieves
    <description>
  produces: outputs/<artifact>       # required
  gate: human-approval               # optional — pauses for human review
```

### Shell Step Fields
```yaml
- id: <id>
  name: <name>
  action: shell
  script:
    bash: scripts/<name>.sh
    pwsh: scripts/<name>.ps1
  goal: >
    <description>
```

### YAML Rules
- Use 2-space indentation
- Use `>` for multi-line strings (folded scalar)
- Use `|` only for literal block content
- Quote strings that contain `:`, `{`, `}`, `[`, `]`, `#`, `&`, `*`
- No trailing whitespace
- End file with a newline

### Validation Checklist
- [ ] All step ids are unique
- [ ] All agent references match files in agents/
- [ ] All skill references match files in skills/
- [ ] All steps have `produces`
- [ ] trigger.input_var is defined
- [ ] output.directory is defined
