# Skill: Generate Manifest

## Purpose
Produce the `manifest.json` control plane file that tracks the full lifecycle of a workflow generation run — from first artifact to final archive.

## Instructions

1. **Initialize the manifest at generation start** — before any content is generated, write a `manifest.json` in the artifact run directory with status `generating` and all steps set to `pending`.

2. **Use the run_id already established for the directory** — the run directory is `artifacts/<workflow-name>/<run-id>/`. Extract `<run-id>` from that path. Never generate a new one.

3. **Populate `steps[]` from the workflow.yaml steps** — mirror each step's `id` and `name`. Set `status: pending` for all on init.

4. **Update step status as each step completes** — when a step finishes, set its `status`, `completed_at`, and `artifact` fields.

5. **Register every file produced into `files[]`** — for each file written during generation, add an entry with `path` (relative to run dir), `role`, and `produced_by` (step id).

6. **Phase transitions must update `phases`** — when generation completes, set `phases.generation.status: completed`. When validation begins, set `phases.validation.status: in_progress`, and so on.

7. **On any failure**, set the step's `status: failed`, append to `errors[]`, and set top-level `status: failed`. Do not proceed to the next phase.

8. **On promotion**, populate the `promotion` object with `target`, `promoted_at`, and `archive_path`.

9. **The manifest stays in artifacts/ — it never crosses into workflows/**. It is a factory control file and is archived to `outputs/<n>/<run-id>/build/` after promotion.

## File Roles Reference

| File pattern | `role` value |
|---|---|
| `01-clarification.md` | `clarification` |
| `02-design.md` | `design` |
| `03-workflow.yaml` | `workflow_config` |
| `04-agents/*.md` | `agent` |
| `05-skills/*.md` | `skill` |
| `06-scripts/ide/*` | `script_ide` |
| `06-scripts/cli/*` | `script_cli` |
| `07-review.md` | `review` |
| `manifest.json` | `manifest` |

## Example: Initial manifest (generation start)

```json
{
  "specVersion": "1.0",
  "workflow": "dir-structure",
  "run_id": "2026-02-23T10-41-22",
  "created_at": "2026-02-23T10:41:22Z",
  "updated_at": "2026-02-23T10:41:22Z",
  "execution_mode": "ide",
  "generator": "workflow-creator",
  "status": "generating",
  "phases": {
    "generation": { "status": "in_progress", "started_at": "2026-02-23T10:41:22Z" },
    "validation": { "status": "pending" },
    "promotion":  { "status": "pending" },
    "archival":   { "status": "pending" }
  },
  "steps": [
    { "id": "clarify",          "name": "Clarify Request",        "status": "pending" },
    { "id": "design",           "name": "Design Workflow",         "status": "pending" },
    { "id": "generate-config",  "name": "Generate workflow.yaml",  "status": "pending" },
    { "id": "generate-agents",  "name": "Generate Agent Files",    "status": "pending" },
    { "id": "generate-skills",  "name": "Generate Skill Files",    "status": "pending" },
    { "id": "generate-utils",   "name": "Generate Utility Scripts","status": "pending" },
    { "id": "generate-scripts", "name": "Generate CLI/IDE Scripts","status": "pending" },
    { "id": "review",           "name": "Review All Outputs",      "status": "pending" },
    { "id": "promote",          "name": "Promote to Workflow",     "status": "pending" }
  ],
  "files": [
    { "path": "manifest.json", "role": "manifest", "produced_by": "init" }
  ],
  "errors": []
}
```

## Example: After clarification step completes

Update the manifest — change the `clarify` step entry and append to `files[]`:

```json
{
  "steps": [
    {
      "id": "clarify",
      "name": "Clarify Request",
      "status": "completed",
      "started_at": "2026-02-23T10:41:25Z",
      "completed_at": "2026-02-23T10:43:10Z",
      "artifact": "01-clarification.md"
    }
  ],
  "files": [
    { "path": "manifest.json",       "role": "manifest",       "produced_by": "init" },
    { "path": "01-clarification.md", "role": "clarification",  "produced_by": "clarify" }
  ]
}
```

## Example: Fully registered manifest

```json
{
  "specVersion": "1.0",
  "workflow": "dir-structure",
  "run_id": "2026-02-23T10-41-22",
  "created_at": "2026-02-23T10:41:22Z",
  "updated_at": "2026-02-23T11:02:44Z",
  "execution_mode": "ide",
  "generator": "workflow-creator",
  "status": "registered",
  "phases": {
    "generation": { "status": "completed", "started_at": "2026-02-23T10:41:22Z", "completed_at": "2026-02-23T11:00:10Z" },
    "validation": { "status": "completed", "started_at": "2026-02-23T11:00:10Z", "completed_at": "2026-02-23T11:01:30Z" },
    "promotion":  { "status": "completed", "started_at": "2026-02-23T11:01:30Z", "completed_at": "2026-02-23T11:02:44Z" },
    "archival":   { "status": "completed", "started_at": "2026-02-23T11:02:44Z", "completed_at": "2026-02-23T11:02:44Z" }
  },
  "steps": [
    { "id": "clarify",          "status": "completed", "artifact": "01-clarification.md" },
    { "id": "design",           "status": "completed", "artifact": "02-design.md" },
    { "id": "generate-config",  "status": "completed", "artifact": "03-workflow.yaml" },
    { "id": "generate-agents",  "status": "completed", "artifact": "04-agents/" },
    { "id": "generate-skills",  "status": "completed", "artifact": "05-skills/" },
    { "id": "generate-scripts", "status": "completed", "artifact": "06-scripts/" },
    { "id": "review",           "status": "completed", "artifact": "07-review.md" },
    { "id": "promote",          "status": "completed" }
  ],
  "files": [
    { "path": "manifest.json",             "role": "manifest",        "produced_by": "init" },
    { "path": "01-clarification.md",       "role": "clarification",   "produced_by": "clarify" },
    { "path": "02-design.md",              "role": "design",          "produced_by": "design" },
    { "path": "03-workflow.yaml",          "role": "workflow_config",  "produced_by": "generate-config" },
    { "path": "04-agents/analyst.md",      "role": "agent",           "produced_by": "generate-agents" },
    { "path": "04-agents/architect.md",    "role": "agent",           "produced_by": "generate-agents" },
    { "path": "05-skills/my-skill.md",     "role": "skill",           "produced_by": "generate-skills" },
    { "path": "06-scripts/ide/run.md",     "role": "script_ide",      "produced_by": "generate-scripts" },
    { "path": "06-scripts/cli/run.sh",     "role": "script_cli",      "produced_by": "generate-scripts" },
    { "path": "06-scripts/cli/run.ps1",    "role": "script_cli",      "produced_by": "generate-scripts" },
    { "path": "07-review.md",              "role": "review",          "produced_by": "review" }
  ],
  "promotion": {
    "target": "workflows/dir-structure",
    "promoted_at": "2026-02-23T11:02:44Z",
    "archive_path": "outputs/dir-structure/2026-02-23T10-41-22/build"
  },
  "errors": []
}
```

## Rules

- Always write `manifest.json` to the artifact run root: `artifacts/<workflow-name>/<run-id>/manifest.json`
- `run_id` is filesystem-safe: use `T` separator, hyphens instead of colons (e.g. `2026-02-23T10-41-22`)
- Never overwrite `created_at` after initialization
- Always update `updated_at` on every write
- `errors[]` is append-only — never remove past errors
- If generation is running in a restricted environment where file writes are blocked, write the manifest as a JSON block in chat output clearly labelled `MANIFEST:` so it can be captured manually
