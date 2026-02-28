# agentfile run

Run an existing workflow in IDE mode.

## Usage

```
agentfile run <workflow-name> [args]
```

## Arguments

- `workflow-name`: Name of the workflow to run
- `args`: Optional arguments to pass to the workflow

## Description

This command executes an existing workflow from the `workflows/` directory. The workflow must have a valid `workflow.yaml` file.

## Examples

```
agentfile run my-workflow
agentfile run my-workflow --input "hello world"
agentfile run code-review --story-path "path/to/story.md"
```

## Notes

- Reads workflow definition from `workflows/<workflow-name>/workflow.yaml`
- Loads agent and skill files as defined in the workflow
- Executes steps sequentially in the IDE context
