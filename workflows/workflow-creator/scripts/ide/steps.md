## IDE Execution Steps

> All artifact paths are relative to `artifacts/{WORKFLOW_NAME}/{RUN_ID}/`
> Never write to `outputs/` or directly into `workflows/` during generation.
> **To resume an interrupted run: `/agentfile:continue [workflow-name]`**

---

### Step 0: Initialize Artifact Run
1. Generate `RUN_ID` = UTC timestamp `YYYY-MM-DDTHH-MM-SS`
2. Create directory `artifacts/{WORKFLOW_NAME}/{RUN_ID}/`
3. Load `skills/generate-manifest.md`
4. Write initial `manifest.json` — status `generating`, all steps `pending`

### Step 1: Clarify Request
1. Load `agents/analyst.md` as system prompt
2. Load `skills/ask-clarifying.md` as context
3. Process the user's workflow request
4. Extract: purpose, inputs, outputs, steps, agents needed, edge cases
5. Ask clarifying questions if anything is unclear
6. Write `artifacts/{WORKFLOW_NAME}/{RUN_ID}/01-clarification.md`
7. Update manifest: `clarify` step → `completed`, register file with role `clarification`
8. **Wait for human approval before continuing**

> ⚡ If interrupted here, resume with `/agentfile:continue {WORKFLOW_NAME}`

### Step 2: Design Workflow
1. Load `agents/architect.md` as system prompt
2. Load `skills/design-workflow.md` as context
3. Read `01-clarification.md` as input
4. Design complete workflow structure:
   - Step list, agent roles, skills, utils/ scripts needed, file manifest
   - Use `outputs/<artifact>` for step `produces:` paths — NOT `artifacts/`
5. Write `artifacts/{WORKFLOW_NAME}/{RUN_ID}/02-design.md`
6. Update manifest: `design` step → `completed`
7. **Wait for human approval before continuing**

> ⚡ If interrupted here, resume with `/agentfile:continue {WORKFLOW_NAME}`

### Step 3: Generate workflow.yaml
1. Load `agents/generator.md` as system prompt
2. Load `skills/generate-yaml.md` as context
3. Read `02-design.md` as input
4. Generate `workflow.yaml` — all `produces:` paths must use `outputs/`, NOT `artifacts/`
5. Write `artifacts/{WORKFLOW_NAME}/{RUN_ID}/03-workflow.yaml`
6. Register in manifest with role `workflow_config`

### Step 4: Generate Agent Files
1. Load `agents/generator.md` as system prompt
2. Load `skills/generate-agent.md` as context
3. Read `02-design.md` as input
4. Generate all agent `.md` files
5. Write to `artifacts/{WORKFLOW_NAME}/{RUN_ID}/04-agents/`
6. Register each in manifest with role `agent`

### Step 5: Generate Skill Files
1. Load `agents/generator.md` as system prompt
2. Load `skills/generate-skill.md` as context
3. Read `02-design.md` as input
4. Generate all skill `.md` files
5. Write to `artifacts/{WORKFLOW_NAME}/{RUN_ID}/05-skills/`
6. Register each in manifest with role `skill`

### Step 6: Generate Utility Scripts
1. Load `agents/generator.md` as system prompt
2. Load `skills/generate-utils.md` as context
3. Read `02-design.md` as input
4. Identify every non-LLM operation — file I/O, validation, transformation, etc.
5. Generate a `.sh` and `.ps1` for each operation
6. Write to `artifacts/{WORKFLOW_NAME}/{RUN_ID}/06-scripts/utils/`
7. Register each in manifest with role `script_utils`

### Step 7: Generate CLI and IDE Scripts
1. Load `agents/generator.md` as system prompt
2. Load `skills/generate-dual-scripts.md` as context
3. Read `02-design.md` and `06-scripts/utils/` as input
4. Generate with equal completeness:
   - `scripts/utils/` already done — wire cli/ and ide/ into them
   - `scripts/cli/run.sh` + `run.ps1` — call utils/ scripts, no inline non-LLM logic
   - `scripts/ide/instructions.md` + `steps.md` — reference utils/ where user runs them
   - `scripts/ide/register.sh` + `register.ps1` — call utils/ for assembly
   - `scripts/README.md`
5. Write to `artifacts/{WORKFLOW_NAME}/{RUN_ID}/06-scripts/cli/` and `06-scripts/ide/`
6. Register each in manifest with role `script_cli` or `script_ide`

### Step 8: Review All Outputs
1. Load `agents/reviewer.md` as system prompt
2. Load `skills/review-workflow.md` as context
3. Read all generated artifacts as input
4. Review for consistency, completeness, correctness
5. Check: no `artifacts/` paths in generated workflow.yaml, utils/ scripts exist for all non-LLM ops
6. Write `artifacts/{WORKFLOW_NAME}/{RUN_ID}/07-review.md`
7. Update manifest: `phases.generation` → `completed`, `phases.validation` → `completed`, `status` → `validated`
8. **Wait for human approval before continuing**

### Step 9: Promote to Workflow
1. Load `skills/promote-workflow.md` for the checklist
2. Confirm all required artifacts are present
3. Run the promotion script — **no API key required**:
   ```bash
   # Unix/macOS:
   bash workflows/workflow-creator/scripts/ide/register.sh artifacts/{WORKFLOW_NAME}/{RUN_ID}
   # Windows:
   pwsh workflows/workflow-creator/scripts/ide/register.ps1 artifacts/{WORKFLOW_NAME}/{RUN_ID}
   ```
4. The script will:
   - Assemble `workflows/{WORKFLOW_NAME}/` with **clean deliverables only** (no factory files)
   - Strip numbered prefixes, exclude manifest.json and design docs
   - Write `workflow_status.json` (provenance pointer)
   - Archive artifact run to `outputs/{WORKFLOW_NAME}/{RUN_ID}/build/`
   - Verify no factory files leaked into workflows/

---

## Notes
- All generation writes go to `artifacts/{WORKFLOW_NAME}/{RUN_ID}/` — never to `outputs/` or `workflows/`
- `workflows/<n>/` receives only clean deliverables — no factory files ever
- `outputs/` is only written by the promote step (archival) and by runtime workflow executions
- Never run `scripts/cli/` scripts in IDE mode — those require `ANTHROPIC_API_KEY`
- **If interrupted at any point**: `/agentfile:continue {WORKFLOW_NAME}` resumes from last completed step
