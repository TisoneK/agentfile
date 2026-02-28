# agentfile create

Create a new workflow using the workflow-creator pipeline.

## Usage

```
agentfile create <workflow-name> <description>
```

## Arguments

- `workflow-name`: Name of the workflow to create
- `description`: Brief description of what the workflow should do

## Description

This command creates a new workflow using the `workflow-creator` pipeline. It generates the complete workflow structure including agents, skills, and scripts.

## Examples

```
agentfile create my-workflow "A workflow that does X"
agentfile create data-processing "Process data from CSV files"
```

## Notes

- Follows the exact workflow-creator protocol
- Generates files in `artifacts/<workflow-name>/<run-id>/`
- After approval, promotes to `workflows/<workflow-name>/`
