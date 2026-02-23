# Skill: Promote Workflow

## Purpose
Validate a completed artifact set and promote it from `artifacts/<name>/<run-id>/` into the canonical `workflows/<name>/` location, then archive the artifact folder.

## Instructions

1. **Verify manifest status is `validated`** — do not promote if any step has `status: failed` or if `phases.validation.status` is not `completed`.

2. **Check all required files are present** in the artifact run directory:
   - `manifest.json`
   - `01-clarification.md`
   - `02-design.md`
   - `03-workflow.yaml`
   - `04-agents/` (at least one `.md` file)
   - `05-skills/` (at least one `.md` file, or directory acknowledged as empty)
   - `06-scripts/` (at least `ide/` or `cli/` subdirectory with files)
   - `07-review.md`

3. **Read the workflow name from `03-workflow.yaml`** — use the `name:` field. This determines the target directory. Never use a hardcoded name.

4. **Assemble the canonical workflow folder** at `workflows/<workflow-name>/`:
   ```
   workflows/<workflow-name>/
     workflow.yaml          ← from 03-workflow.yaml
     agents/                ← extracted from 04-agents/
     skills/                ← extracted from 05-skills/
     scripts/
       ide/                 ← extracted from 06-scripts/ide/
       cli/                 ← extracted from 06-scripts/cli/
     outputs/               ← created empty, will be gitignored
     REVIEW.md              ← from 07-review.md
     .gitignore             ← always write: outputs/
   ```

5. **Archive the artifact run folder** to `outputs/<workflow-name>/<run-id>/build/` — move, do not copy. This preserves provenance without cluttering the artifact staging area.

6. **Update the manifest** (now in the archive location) with:
   - `status: registered`
   - `phases.promotion.status: completed`
   - `phases.archival.status: completed`
   - `promotion.target`, `promotion.promoted_at`, `promotion.archive_path`

7. **Write a `workflow_status.json`** to `workflows/<workflow-name>/` as a lightweight pointer back to the originating run:
   ```json
   {
     "workflow": "<name>",
     "registered_at": "<ISO-8601>",
     "source_run_id": "<run-id>",
     "archive": "outputs/<name>/<run-id>/build"
   }
   ```

8. **Confirm success** — output a summary listing all files written and the final directory layout.

## Validation Checklist (run before promotion)

Before promoting, confirm each item:

| Check | Pass condition |
|---|---|
| Manifest status | `validated` or `generated` (if no validation step ran) |
| No failed steps | `steps[].status` contains no `failed` entries |
| workflow.yaml valid | File is present and `name:` field is parseable |
| Agents present | At least one `.md` file in `04-agents/` |
| Review approved | `07-review.md` exists and gate was passed |
| No name collision | `workflows/<name>/` does not already exist, or user confirmed overwrite |

## Example: Promotion output summary

```
✅ Promotion complete

Workflow:   dir-structure
Run ID:     2026-02-23T10-41-22

Files written to workflows/dir-structure/:
  ✓ workflow.yaml
  ✓ agents/analyst.md
  ✓ agents/architect.md
  ✓ skills/ask-clarifying.md
  ✓ scripts/ide/instructions.md
  ✓ scripts/ide/steps.md
  ✓ scripts/cli/run.sh
  ✓ scripts/cli/run.ps1
  ✓ REVIEW.md
  ✓ .gitignore
  ✓ workflow_status.json

Artifact archived to:
  outputs/dir-structure/2026-02-23T10-41-22/build/

Next steps:
  IDE:  /agentfile:run dir-structure
  CLI:  bash workflows/dir-structure/scripts/cli/run.sh
```

## Rules

- Never write generation artifacts directly into `workflows/<name>/` — always go through the staging path
- If promotion fails mid-way, write the error to `manifest.errors[]` and set `status: failed`. Leave the artifact run directory intact for debugging.
- If `workflows/<name>/` already exists, warn the user and require explicit confirmation before overwriting
- The archive move is destructive on the source — ensure all files are verified in the target before deleting from `artifacts/`
