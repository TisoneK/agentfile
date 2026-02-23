# IDE Execution Instructions

## Workflow: workflow-creator
Execution Mode: IDE

## ⚠️ Execution Mode Warning

**This workflow is configured for IDE execution.**

| Script path | Purpose | API key? | Use in IDE? |
|-------------|---------|----------|-------------|
| `scripts/ide/register.sh` / `.ps1` | Assemble final workflow folder | ❌ Not needed | ✅ Yes — run this |
| `scripts/cli/run.sh` / `.ps1` | Full pipeline via Anthropic API | ✅ Required | ❌ Never — will fail |
| `scripts/cli/register.sh` / `.ps1` | CLI-mode registration | ✅ Required | ❌ Never — will fail |

In IDE mode, your LLM handles steps 1–7 directly. Only `scripts/ide/register.sh` (or `.ps1`) is executed as a shell script, and it requires no credentials.

---

## Step-by-Step Instructions

When an IDE agent sees `/agentfile:create <workflow-name> <description>`, follow these exact steps:

### 1. Parse Command
- Extract workflow name: `workflow-creator`
- Extract input: everything after first line break
- Extract file references: `@filename` patterns (optional)

### 2. Check Execution Mode (CRITICAL STEP)
- Read `workflows/workflow-creator/workflow.yaml`
- **STRICTLY** check `execution.preferred` field:
  - If `preferred: "ide"` → **MUST** use IDE mode
  - If `preferred: "cli"` → **MUST** use CLI mode
  - If no execution field → **DEFAULT** to IDE mode
- **NEVER** ignore execution preference - this is mandatory
- **ALWAYS** follow the specified execution mode

### 3. Execute Steps Sequentially

**Step 1: Clarify Request**
- Load agent: `agents/analyst.md`
- Load skill: `skills/ask-clarifying.md`
- Process input: `$WORKFLOW_REQUEST`
- Goal: Extract and clarify workflow requirements
- Produce: `outputs/01-clarification.md`
- Gate: Wait for human approval

**Step 2: Design Workflow**
- Load agent: `agents/architect.md`
- Load skill: `skills/design-workflow.md`
- Input: `outputs/01-clarification.md`
- Goal: Design complete workflow structure
- Produce: `outputs/02-design.md`
- Gate: Wait for human approval

**Step 3: Generate workflow.yaml**
- Load agent: `agents/generator.md`
- Load skill: `skills/generate-yaml.md`
- Input: `outputs/02-design.md`
- Goal: Generate workflow configuration
- Produce: `outputs/03-workflow.yaml`

**Step 4: Generate Agent Files**
- Load agent: `agents/generator.md`
- Load skill: `skills/generate-agent.md`
- Input: `outputs/02-design.md`
- Goal: Generate all agent .md files
- Produce: `outputs/04-agents/`

**Step 5: Generate Skill Files**
- Load agent: `agents/generator.md`
- Load skill: `skills/generate-skill.md`
- Input: `outputs/02-design.md`
- Goal: Generate all skill .md files
- Produce: `outputs/05-skills/`

**Step 6: Generate Scripts**
- Load agent: `agents/generator.md`
- Load skill: `skills/generate-dual-scripts.md`
- Input: `outputs/02-design.md`
- Goal: Generate both IDE and CLI execution scripts
- Produce: `outputs/06-scripts/`

**Step 7: Review All Outputs**
- Load agent: `agents/reviewer.md`
- Load skill: `skills/review-workflow.md`
- Input: All previous outputs
- Goal: Review for consistency and completeness
- Produce: `outputs/07-review.md`
- Gate: Wait for human approval

**Step 8: Register Workflow**
- Run `scripts/ide/register.sh` (Unix) or `scripts/ide/register.ps1` (Windows)
- These are **API-key-free** — pure file assembly, no LLM calls, no network
- Do NOT run `scripts/cli/register.sh` or `scripts/cli/run.sh` — those require `ANTHROPIC_API_KEY`
- The IDE register scripts will parse the `##FILE: ===` delimiters and assemble the final workflow folder

## Agent Loading Instructions
- Load agents from `agents/*.md` as system prompts
- Load skills from `skills/*.md` as context
- Execute steps sequentially using your LLM
- Never execute external scripts or call APIs
- Process file references by reading the specified files

## Output Format
Each step should produce the specified output file in the `outputs/` directory with clear, structured content that the next step can use as input.

## Notes
- This workflow is designed for IDE execution
- Use IDE agent's built-in LLM capabilities
- Follow agent personas and skill instructions precisely
- Generate outputs directly in chat interface
- Wait for human approval at gated steps
