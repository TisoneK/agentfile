# Test Workflow

A simple test workflow that demonstrates basic Agentfile functionality with a hello world example.

## Purpose

This workflow showcases the fundamental concepts of Agentfile:
- Multi-step workflow execution
- Agent-based task processing
- File-based communication between steps
- Natural language input handling

## Workflow Steps

1. **Greet**: Generate a friendly hello world greeting
2. **Process**: Process the user's request and provide a response

## Usage

### With IDE Agents (Recommended)

Load `workflow.yaml` in your IDE agent (Cursor, Windsurf, Claude Code, etc.) and follow the steps.

### With CLI

This workflow is designed for IDE agents and doesn't include CLI runtime scripts. To use with CLI, you would need to add `scripts/run.sh` and `scripts/run.ps1`.

## Input

Provide any natural language request as the `USER_REQUEST` input variable.

## Output

The workflow generates:
- `outputs/greeting.md` - Hello world greeting
- `outputs/response.md` - Final processed response

## Example

Input: "Create a test workflow"

Output files will contain a friendly greeting and a response explaining that the test workflow demonstrates basic Agentfile functionality.
