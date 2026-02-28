# agentfile list

List all available workflows in the project.

## Usage

```
agentfile list
```

## Description

Scans the `workflows/` directory and displays all available workflows with their names and descriptions.

## Examples

```
agentfile list
```

## Output Format

```
**Available workflows:**
  • **workflow-name**     — Description of the workflow
  • **another-workflow** — Another description
```

## Notes

- No LLM call needed - reads workflow.yaml files directly
- Shows name and description from each workflow's yaml file
