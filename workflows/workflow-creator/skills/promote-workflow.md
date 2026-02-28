# Skill: Promote Workflow

## Purpose
Trigger `agentfile promote` to cross the factory→shipped boundary. The CLI handles all file operations — validation, copying, archiving, and manifest updates.

---

## The Two-Phase Mental Model

```
artifacts/<workflow>/<run-id>/    ← FACTORY: work in progress, numbered files,
                                     manifest.json, design docs. Never referenced
                                     by the running workflow.

workflows/<workflow>/             ← SHIPPED: clean, self-contained, ready to use.
                                     No factory files whatsoever.
```

`agentfile promote` is the boundary crossing. It does everything atomically — if any step fails, it aborts and leaves the artifact run intact for debugging.

---

## Step 1 — Verify the manifest is validated

Before running promote, confirm `manifest.json` has `status: validated`. Do not promote if any step has `status: failed`.

---

## Step 2 — Run the promote command

```
agentfile promote
```

The command auto-detects the most recent artifact run. To promote a specific run,
pass the path explicitly:
```
agentfile promote artifacts/code-reviewer/2026-02-23T20-53-47
```

If `workflows/<n>/` already exists and you want to overwrite, add `--force`:
```
agentfile promote artifacts/code-reviewer/2026-02-23T20-53-47 --force
```

The command will:
1. Validate all required artifacts are present
2. Assemble `workflows/<workflow-name>/` with only final deliverables (no factory files)
3. Write `workflow_status.json` as a provenance pointer
4. Archive the artifact run to `outputs/<workflow-name>/<run-id>/build/`
5. Update `manifest.json` in the archive to `status: registered`
6. Remove the staging directory from `artifacts/`

---

## Step 3 — Confirm success

`agentfile promote` prints a summary on success:

```
✅ Promotion complete

  Workflow:   <name>
  Run ID:     <run-id>

  Registered: workflows/<name>
  Archived:   outputs/<name>/<run-id>/build
```

If promotion fails, read the error output, fix the issue in the artifact run, and re-run `agentfile promote`.

---

## Rules

- **Never manually copy files into `workflows/`** — always use `agentfile promote`
- **Never run `register.sh` or `register.ps1`** — the CLI replaces them entirely
- If promotion fails, the artifact run is left intact — fix and retry
- If `workflows/<n>/` already exists, use `--force` only after confirming with the user
