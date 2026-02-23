# Skill: Promote Workflow

## Purpose
Validate a completed artifact set, assemble a clean canonical workflow at `workflows/<n>/`, archive the staging run, and leave no factory artifacts in the final workflow directory.

---

## The Two-Phase Mental Model

**CRITICAL — understand this before doing anything:**

```
artifacts/<workflow>/<run-id>/    ← FACTORY: work in progress, numbered files,
                                     _all.md bundles, manifest.json, design docs.
                                     NEVER referenced by the running workflow.

workflows/<workflow>/             ← SHIPPED: clean, ready to use, no relation
                                     to artifacts/ whatsoever. Users and scripts
                                     reference paths here. No factory files.
```

The promote step is the boundary crossing. **Nothing from the factory crosses into shipped except the final deliverables** — no numbered prefixes, no `_all.md` bundles, no `manifest.json`, no design docs, no clarification notes.

---

## Step 1 — Verify readiness

1. Check `manifest.json` status is `validated` — do not promote if any step has `status: failed`
2. Confirm all required artifact files are present:
   - `01-clarification.md`
   - `02-design.md`
   - `03-workflow.yaml`
   - `04-agents/` — at least one `.md` file
   - `05-skills/` — at least one `.md` file
   - `06-scripts/utils/` — at least one `.sh` file (if workflow has non-LLM ops)
   - `06-scripts/cli/run.sh` and `run.ps1`
   - `06-scripts/ide/instructions.md` and `steps.md`
   - `07-review.md`
3. Read the workflow name from `03-workflow.yaml` → `name:` field
4. Check `workflows/<name>/` does not already exist — if it does, warn and require confirmation

---

## Step 2 — Assemble the canonical workflow folder

Copy **only the final deliverables** into `workflows/<workflow-name>/`. Strip all factory conventions (numbered prefixes, `_all.md`, manifest, design docs).

```
workflows/<workflow-name>/         ← clean, no factory artifacts
  workflow.yaml                    ← from 03-workflow.yaml (rename, strip prefix)
  agents/
    <role>.md                      ← from 04-agents/ (individual files or parsed from _all.md)
  skills/
    <skill>.md                     ← from 05-skills/ (individual files or parsed from _all.md)
  scripts/
    utils/
      <operation>.sh               ← from 06-scripts/utils/ (individual files or parsed)
      <operation>.ps1
    cli/
      run.sh                       ← from 06-scripts/cli/
      run.ps1
    ide/
      instructions.md              ← from 06-scripts/ide/
      steps.md
      register.sh
      register.ps1
    README.md
  outputs/                         ← created empty, gitignored at runtime
  .gitignore                       ← always write: outputs/
  workflow_status.json             ← provenance pointer (see Step 4)
```

**What must NOT appear in workflows/<name>/:**
- `manifest.json` — factory control file, stays in archive only
- `01-clarification.md`, `02-design.md`, `07-review.md` — factory docs, archived only
- `_all.md` bundle files — factory intermediates, never shipped
- Numbered prefixes like `03-`, `04-`, `05-`, `06-` — strip these on copy
- `REVIEW.md` — optional, only include if explicitly useful to end users

---

## Step 3 — Strip numbered prefixes and parse bundles

When copying files, the register script must:

1. **Rename prefixed files**: `03-workflow.yaml` → `workflow.yaml`
2. **Parse `_all.md` bundles**: if individual files don't exist, parse the `##FILE:...##END##` delimited bundle and write each file to its correct path with its clean name
3. **Preserve subdirectory structure**: `06-scripts/cli/run.sh` → `scripts/cli/run.sh`
4. **Make shell scripts executable**: `chmod +x` on all `.sh` files after copying

---

## Step 4 — Write workflow_status.json

Write a lightweight provenance pointer to `workflows/<name>/workflow_status.json`:

```json
{
  "workflow": "<name>",
  "registered_at": "<ISO-8601>",
  "source_run_id": "<run-id>",
  "archive": "outputs/<name>/<run-id>/build"
}
```

This is the **only** factory-related file that belongs in the shipped workflow — it's a pointer, not factory content.

---

## Step 5 — Archive the artifact run

Move (not copy) the entire artifact staging directory to `outputs/<name>/<run-id>/build/`:

1. `mkdir -p outputs/<name>/<run-id>/build/`
2. Copy all artifact files into the archive
3. Update `manifest.json` in the archive:
   - `status: registered`
   - `phases.promotion.status: completed`
   - `phases.archival.status: completed`
   - `promotion.target`, `promotion.promoted_at`, `promotion.archive_path`
4. Delete the staging directory from `artifacts/`
5. If the parent `artifacts/<name>/` directory is now empty, remove it too

---

## Step 6 — Confirm and summarise

Output a promotion summary:

```
✅ Promotion complete

Workflow:   <name>
Run ID:     <run-id>

Files written to workflows/<name>/:
  ✓ workflow.yaml
  ✓ agents/analyst.md
  ✓ agents/architect.md
  ✓ skills/ask-clarifying.md
  ✓ scripts/utils/read-file.sh
  ✓ scripts/utils/read-file.ps1
  ✓ scripts/cli/run.sh
  ✓ scripts/cli/run.ps1
  ✓ scripts/ide/instructions.md
  ✓ scripts/ide/steps.md
  ✓ scripts/ide/register.sh
  ✓ scripts/ide/register.ps1
  ✓ scripts/README.md
  ✓ .gitignore
  ✓ workflow_status.json

Artifact archived to:
  outputs/<name>/<run-id>/build/

Next steps:
  IDE:  /agentfile:run <name>
  CLI:  bash workflows/<name>/scripts/cli/run.sh "<input>"
```

---

## Rules

- **Never copy factory files into workflows/** — manifest.json, design docs, numbered prefixes, _all.md bundles
- **Never reference artifacts/ paths from a shipped workflow** — once promoted, the workflow is self-contained in workflows/<name>/
- If promotion fails mid-way, write the error to `manifest.errors[]`, set `status: failed`, and leave the artifact run intact for debugging
- If `workflows/<name>/` already exists, require explicit confirmation before overwriting
- The archive copy is verified before the staging directory is deleted
