## IDE Execution Steps

### Step 1: Clarify Request
1. Load `agents/analyst.md` as system prompt
2. Load `skills/ask-clarifying.md` as context
3. Process the user's workflow request
4. Extract: purpose, inputs, outputs, steps, agents needed, edge cases
5. Ask clarifying questions if anything is unclear
6. Generate `outputs/01-clarification.md`
7. Wait for human approval before continuing

### Step 2: Design Workflow
1. Load `agents/architect.md` as system prompt
2. Load `skills/design-workflow.md` as context
3. Read `outputs/01-clarification.md` as input
4. Design complete workflow structure:
   - Step list with IDs and goals
   - Agent roles and responsibilities
   - Skills needed for each step
   - Script logic requirements
   - File manifest
5. Generate `outputs/02-design.md`
6. Wait for human approval before continuing

### Step 3: Generate workflow.yaml
1. Load `agents/generator.md` as system prompt
2. Load `skills/generate-yaml.md` as context
3. Read `outputs/02-design.md` as input
4. Generate complete `workflow.yaml` configuration
5. Include execution preference, triggers, steps, etc.
6. Produce `outputs/03-workflow.yaml`

### Step 4: Generate Agent Files
1. Load `agents/generator.md` as system prompt
2. Load `skills/generate-agent.md` as context
3. Read `outputs/02-design.md` as input
4. Generate all agent .md files defined in the design
5. Follow agent template: Persona, Responsibilities, Rules, Output Format
6. Produce files in `outputs/04-agents/` directory

### Step 5: Generate Skill Files
1. Load `agents/generator.md` as system prompt
2. Load `skills/generate-skill.md` as context
3. Read `outputs/02-design.md` as input
4. Generate all skill .md files defined in the design
5. Follow skill template: Purpose, Instructions, Examples
6. Produce files in `outputs/05-skills/` directory

### Step 6: Generate Scripts
1. Load `agents/generator.md` as system prompt
2. Load `skills/generate-dual-scripts.md` as context
3. Read `outputs/02-design.md` as input
4. Generate dual-script structure:
   - `scripts/ide/instructions.md` - IDE execution guide
   - `scripts/ide/steps.md` - IDE-specific steps
   - `scripts/cli/run.sh` - Unix/Linux runtime script
   - `scripts/cli/run.ps1` - Windows PowerShell script
   - `scripts/README.md` - Execution documentation
5. Consider execution preference from design
6. Produce files in `outputs/06-scripts/` directory

### Step 7: Review All Outputs
1. Load `agents/reviewer.md` as system prompt
2. Load `skills/review-workflow.md` as context
3. Read all generated files as input:
   - `outputs/02-design.md`
   - `outputs/03-workflow.yaml`
   - `outputs/04-agents/`
   - `outputs/05-skills/`
   - `outputs/06-scripts/`
4. Review for consistency, completeness, and correctness
5. Flag any issues or missing elements
6. Generate `outputs/07-review.md`
7. Wait for human approval before continuing

### Step 8: Register Workflow
1. **Skip this step in IDE mode** - it's a shell step
2. In IDE mode, manually guide user to:
   - Create `workflows/{workflow_name}/` directory
   - Move `outputs/03-workflow.yaml` to `workflow.yaml`
   - Move `outputs/04-agents/*` to `agents/`
   - Move `outputs/05-skills/*` to `skills/`
   - Move `outputs/06-scripts/*` to `scripts/`

## Notes
- Use IDE agent's built-in LLM capabilities
- Follow agent personas and skill instructions precisely
- Generate outputs directly in chat interface
- Each step builds on the previous step's output
- Wait for human approval at gated steps
- Never execute external scripts or call APIs
