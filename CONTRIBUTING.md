# Contributing to Agentfile

Thank you for your interest in contributing! Here's how to get involved.

## Ways to Contribute

### 1. Add a new example workflow
The best contributions are real, useful workflows. Good examples:
- `doc-generator` — generates documentation from code
- `test-writer` — writes unit tests for existing functions
- `commit-message` — writes conventional commit messages from a diff
- `bug-report-triage` — classifies and prioritizes bug reports

To add an example, create a folder under `examples/` following the structure in any existing example.

### 2. Improve the spec
If you find ambiguities, missing fields, or better ways to structure workflows, open an issue or PR against `SPEC.md`.

### 3. Add an IDE adapter guide
Document how to use Agentfile with a specific IDE agent. Add it to `docs/adapters/<ide-name>.md`.

### 4. Build a runtime in another language
The reference runtime is Bash + PowerShell. Runtimes in Python, TypeScript, Go, etc. are welcome. Add them to `runtime/<language>/`.

## Contribution Guidelines

- **Examples must be complete** — every example needs `workflow.yaml`, at least one agent, at least one skill, and `run.sh` + `run.ps1`
- **Follow the spec** — all `workflow.yaml` files must validate against `schema/workflow.schema.json`
- **Keep agents and skills generic** — they should work with any LLM, not just one provider
- **No framework dependencies** — the reference runtime uses only `curl` and `jq`

## Pull Request Process

1. Fork the repo
2. Create a branch: `git checkout -b add-my-workflow`
3. Make your changes
4. Test your workflow with the reference runtime
5. Open a PR with a description of what you added and why

## Spec Changes

Changes to `SPEC.md` or `schema/workflow.schema.json` require an issue discussion before a PR. Breaking changes to the spec increment the major version.
