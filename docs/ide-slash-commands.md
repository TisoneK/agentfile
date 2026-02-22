# IDE Slash Command Processing Guide

## CRITICAL: Agentfile Slash Command Processing

When you see `/agentfile-run:<workflow-name>` in an IDE, follow these steps **exactly**:

### STEP 1: PARSE COMMAND
- Extract workflow name: `<workflow-name>` (everything after `:` and before first line break)
- Extract input: everything after the first line break (may be empty)
- Extract file references: `@filename` patterns in the input (optional)

**Example:**
```
/agentfile-run:code-reviewer
Please review this file: @src/main.js
```
- Workflow name: `code-reviewer`
- Input: `Please review this file: @src/main.js`
- File reference: `src/main.js`

### STEP 2: CHECK EXECUTION MODE (CRITICAL)
- READ `workflows/<workflow-name>/workflow.yaml`
- **STRICTLY** LOOK for `execution.preferred` field:
  - IF `preferred: ide` → **MUST** USE IDE MODE
  - IF `preferred: cli` → **MUST** USE CLI MODE
  - IF no execution field → **DEFAULT** TO IDE MODE
- **NEVER** ignore execution preference - this is mandatory
- **ALWAYS** follow the specified execution mode

**Example workflow.yaml:**
```yaml
name: code-reviewer
description: Reviews code changes
execution:
  preferred: ide  # or "cli"
steps:
  - name: analyze
    agent: reviewer
    input: "{{input}}"
```

### STEP 3: IDE MODE EXECUTION
- Load agents from `agents/*.md` as system prompts
- Load skills from `skills/*.md` as context
- Execute steps sequentially using your LLM capabilities
- **NEVER** execute `scripts/run.sh` or `scripts/run.ps1`
- **NEVER** call external APIs or tools unless explicitly required by the workflow
- Process file references by reading the specified files
- Return results in the format specified by the workflow

### STEP 4: CLI MODE EXECUTION
- Execute `workflows/<workflow-name>/scripts/cli/run.sh` or `run.ps1`
- Pass input as command line argument
- Handle file references as the script expects
- Return the script's output

## Validation Examples

### Example 1: IDE Mode Workflow
**Command:** `/agentfile-run:hello-world`
**Input:** `Say hello to Alice`

**Processing:**
1. Read `workflows/hello-world/workflow.yaml`
2. No `execution.preferred` field → Default to IDE mode
3. Load `workflows/hello-world/agents/greeter.md`
4. Execute step with input `Say hello to Alice`
5. Return response

### Example 2: CLI Mode Workflow
**Command:** `/agentfile-run:pr-summarizer`
**Input:** `Summarize PR #123`

**Processing:**
1. Read `workflows/pr-summarizer/workflow.yaml`
2. See `execution.preferred: cli`
3. Execute `workflows/pr-summarizer/scripts/cli/run.sh "Summarize PR #123"`
4. Return script output

### Example 3: File References
**Command:** `/agentfile-run:text-analyzer`
**Input:** `Analyze this file: @docs/spec.md`

**Processing:**
1. Read workflow file to determine mode
2. If IDE mode: read `docs/spec.md` and include in analysis
3. If CLI mode: pass file reference to script as argument

## Common Mistakes to Avoid

❌ **WRONG:** Automatically executing scripts without checking execution mode
❌ **WRONG:** Ignoring file references in input
❌ **WRONG:** Using CLI mode when workflow specifies IDE mode
❌ **WRONG:** Not reading agent/skill files in IDE mode

✅ **CORRECT:** Always check execution preference first
✅ **CORRECT:** Process file references appropriately for the mode
✅ **CORRECT:** Load agent and skill definitions in IDE mode
✅ **CORRECT:** Follow the exact step sequence defined in the workflow

## Troubleshooting

**Workflow not found:** Check that `workflows/<name>/workflow.yaml` exists
**Invalid execution mode:** Default to IDE mode if field is missing or invalid
**Agent files missing:** Continue with available agents, log warning
**Script execution fails:** Return error message from script execution

## IDE Integration Tips

1. **Cache workflow definitions** for better performance
2. **Validate command format** before processing
3. **Provide clear error messages** for invalid commands
4. **Handle file not found errors** gracefully
5. **Support both Windows and Unix** script paths in CLI mode

Remember: The goal is to provide a seamless experience where users can use the same slash commands across different IDEs with consistent behavior.
