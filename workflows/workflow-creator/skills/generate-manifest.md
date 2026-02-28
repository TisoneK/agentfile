# Skill: Generate Manifest

## Purpose
Track the lifecycle of a workflow generation run by keeping `manifest.json` up to date throughout the pipeline. The initial `manifest.json` is created by `agentfile init-run` — this skill covers all subsequent updates.

---

## When to Update the Manifest

Update `manifest.json` at each of these moments:

| Event | What to update |
|---|---|
| Step starts | `steps[id].status = "in_progress"`, `steps[id].started_at` |
| Step completes | `steps[id].status = "completed"`, `steps[id].completed_at`, `steps[id].artifact` |
| Step fails | `steps[id].status = "failed"`, `steps[id].error`, append to `errors[]`, top-level `status = "failed"` |
| File produced | Append to `files[]` with `path`, `role`, `produced_by` |
| Generation done | `phases.generation.status = "completed"` |
| Review passes | `phases.validation.status = "completed"`, top-level `status = "validated"` |

Always update `updated_at` on every write.

---

## File Roles Reference

| File pattern | `role` value |
|---|---|
| `01-clarification.md` | `clarification` |
| `02-design.md` | `design` |
| `03-workflow.yaml` | `workflow_config` |
| `04-agents/*.md` | `agent` |
| `05-skills/*.md` | `skill` |
| `06-scripts/utils/*` | `script_utils` |
| `06-scripts/ide/*` | `script_ide` |
| `06-scripts/cli/*` | `script_cli` |
| `07-review.md` | `review` |

---

## Example: After clarification step completes

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
    { "path": "manifest.json",       "role": "manifest",      "produced_by": "init" },
    { "path": "01-clarification.md", "role": "clarification", "produced_by": "clarify" }
  ],
  "updated_at": "2026-02-23T10:43:10Z"
}
```

---

## Rules

- `manifest.json` lives only in `artifacts/<workflow>/<run-id>/` — never in `workflows/`
- `run_id` is filesystem-safe: `T` separator, hyphens instead of colons (e.g. `2026-02-23T10-41-22`)
- Never overwrite `created_at` after initialization
- `errors[]` is append-only — never remove past errors
- The initial manifest structure is written by `agentfile init-run` — do not recreate it manually
