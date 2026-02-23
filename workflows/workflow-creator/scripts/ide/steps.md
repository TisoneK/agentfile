## IDE Execution Steps

> All artifact paths are relative to `artifacts/{WORKFLOW_NAME}/{RUN_ID}/`
> Never write to `outputs/` or directly into `workflows/` during generation.

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
8. Wait for human approval before continuing

### Step 2: Design Workflow
1. Load `agents/architect.md` as system prompt
2. Load `skills/design-workflow.md` as context
3. Read `artifacts/{WORKFLOW_NAME}/{RUN_ID}/01-clarification.md` as input
4. Design complete workflow structure:
   - Step list with IDs and goals
   - Agent roles and responsibilities
   - Skills needed for each step
   - Script logic requirements
   - File manifest (using `artifacts/` paths, not `outputs/`)
5. Write `artifacts/{WORKFLOW_NAME}/{RUN_ID}/02-design.md`
6. Update manifest: `design` step → `completed`
7. Wait for human approval before continuing

### Step 3: Generate workflow.yaml
1. Load `agents/generator.md` as system prompt
2. Load `skills/generate-yaml.md` as context
3. Read `artifacts/{WORKFLOW_NAME}/{RUN_ID}/02-design.md` as input
4. Generate complete `workflow.yaml` configuration
5. Write `artifacts/{WORKFLOW_NAME}/{RUN_ID}/03-workflow.yaml`
6. Register in manifest with role `workflow_config`

### Step 4: Generate Agent Files
1. Load `agents/generator.md` as system prompt
2. Load `skills/generate-agent.md` as context
3. Read `artifacts/{WORKFLOW_NAME}/{RUN_ID}/02-design.md` as input
4. Generate all agent `.md` files
5. Write to `artifacts/{WORKFLOW_NAME}/{RUN_ID}/04-agents/`
6. Register each in manifest with role `agent`

### Step 5: Generate Skill Files
1. Load `agents/generator.md` as system prompt
2. Load `skills/generate-skill.md` as context
3. Read `artifacts/{WORKFLOW_NAME}/{RUN_ID}/02-design.md` as input
4. Generate all skill `.md` files
5. Write to `artifacts/{WORKFLOW_NAME}/{RUN_ID}/05-skills/`
6. Register each in manifest with role `skill`

### Step 6: Generate Scripts
1. Load `agents/generator.md` as system prompt
2. Load `skills/generate-dual-scripts.md` as context
3. Read `artifacts/{WORKFLOW_NAME}/{RUN_ID}/02-design.md` as input
4. Generate:
   - `scripts/ide/instructions.md` — IDE execution guide
   - `scripts/ide/steps.md` — IDE-specific steps
   - `scripts/cli/run.sh` — Unix runtime script
   - `scripts/cli/run.ps1` — Windows PowerShell script
   - `scripts/README.md` — Execution documentation
5. Write to `artifacts/{WORKFLOW_NAME}/{RUN_ID}/06-scripts/`
6. Register each in manifest with role `script_ide` or `script_cli`

### Step 7: Review All Outputs
1. Load `agents/reviewer.md` as system prompt
2. Load `skills/review-workflow.md` as context
3. Read all generated artifacts as input:
   - `artifacts/{WORKFLOW_NAME}/{RUN_ID}/02-design.md`
   - `artifacts/{WORKFLOW_NAME}/{RUN_ID}/03-workflow.yaml`
   - `artifacts/{WORKFLOW_NAME}/{RUN_ID}/04-agents/`
   - `artifacts/{WORKFLOW_NAME}/{RUN_ID}/05-skills/`
   - `artifacts/{WORKFLOW_NAME}/{RUN_ID}/06-scripts/`
4. Review for consistency, completeness, and correctness
5. Flag any issues or missing elements
6. Write `artifacts/{WORKFLOW_NAME}/{RUN_ID}/07-review.md`
7. Update manifest: `phases.generation` → `completed`, `phases.validation` → `completed`, `status` → `validated`
8. Wait for human approval before continuing

### Step 8: Promote to Workflow
1. Load `skills/promote-workflow.md` for the validation checklist
2. Confirm all required artifacts are present in `artifacts/{WORKFLOW_NAME}/{RUN_ID}/`
3. Run the IDE-safe promotion script — **no API key required**:
   - Unix/macOS: `bash workflows/workflow-creator/scripts/ide/register.sh artifacts/{WORKFLOW_NAME}/{RUN_ID}`
   - Windows: `pwsh workflows/workflow-creator/scripts/ide/register.ps1 artifacts/{WORKFLOW_NAME}/{RUN_ID}`
4. The script will:
   - Read `WORKFLOW_NAME` from `03-workflow.yaml`
   - Assemble `workflows/{WORKFLOW_NAME}/` with all canonical files
   - Write `workflow_status.json`
   - Archive the artifact run to `outputs/{WORKFLOW_NAME}/{RUN_ID}/build/`
   - Update `manifest.json` to `status: registered`
5. No env vars, no network calls — pure file I/O

## Notes
- All generation writes go to `artifacts/{WORKFLOW_NAME}/{RUN_ID}/` — never to `outputs/` or `workflows/`
- `outputs/` is only written to by the promote step (archival) and by runtime workflow executions
- Never run `scripts/cli/run.sh` or `run.ps1` in IDE mode — those require `ANTHROPIC_API_KEY`
- Follow agent personas and skill instructions precisely
- Wait for human approval at gated steps (steps 1, 2, 7)
