# Skill: Review Workflow

## Purpose
Teach the Reviewer how to systematically validate a complete workflow package for correctness, consistency, and completeness.

## Instructions

### Step 1 — Validate workflow.yaml
- Is it valid YAML? (mentally parse it)
- Does `name` exist and match the folder name?
- Does every step have: id, name, goal, produces?
- Do all `produces:` paths use `outputs/<artifact>` — **not** `artifacts/<workflow>/...`? (BLOCKING if any step writes to artifacts/)
- Do all `agent:` references point to existing files in agents/?
- Do all `skill:` references point to existing files in skills/?
- Do all `script.bash` references point to existing files in scripts/?
- Do all `script.pwsh` references point to existing files in scripts/?
- Are all step ids unique?

### Step 2 — Validate each agent file
- Does it have all 4 required sections: Persona, Responsibilities, Rules, Output Format?
- Is the Output Format a concrete template (not vague)?
- Are the Rules specific and actionable?
- Does the agent's scope match how it's used in workflow.yaml?

### Step 3 — Validate each skill file
- Does it have: Purpose, Instructions, Examples?
- Are instructions numbered steps (not vague advice)?
- Is there at least one concrete example?
- Is the skill focused on one capability?

### Step 4 — Validate scripts

**utils/ scripts**
- Does every non-LLM operation in the workflow have a dedicated utility script? (BLOCKING if missing)
- Does each utility script have both `.sh` and `.ps1` versions?
- Do utility scripts accept inputs as arguments — no hardcoded paths?
- Do utility scripts exit with code 1 and a clear message on failure?

**CLI scripts (scripts/cli/)**
- Does `run.sh` start with `#!/usr/bin/env bash` and `set -euo pipefail`?
- Does `run.ps1` start with `#!/usr/bin/env pwsh` and `$ErrorActionPreference = "Stop"`?
- Is `run.ps1` as fully implemented as `run.sh`? (a skeleton `run.ps1` is a **BLOCKING** defect)
- Do `run.sh` and `run.ps1` call into `utils/` scripts instead of inlining non-LLM logic? (BLOCKING if not)
- Does the script load `project.md` + `AGENTS.md` + agent file into the system prompt?
- Does every step in workflow.yaml have a corresponding function in both scripts?
- Does the script validate required env vars?
- Are human gates implemented for all steps with `gate: human-approval`?

**IDE scripts (scripts/ide/)**
- Is `scripts/ide/instructions.md` present and complete?
- Is `scripts/ide/steps.md` present with one section per workflow step?
- Does `steps.md` reference any `utils/` scripts the user needs to run manually?
- Do `register.sh` and `register.ps1` call `utils/` scripts for file assembly?
- Do IDE scripts contain **zero** API calls or API key references? (BLOCKING if they do)

**README**
- Does `scripts/README.md` list and describe every script across all three directories (utils/, cli/, ide/)?

### Step 5 — Cross-check design vs generated files
- Does the file manifest in the design match what was actually generated?
- Are there any files in the design that are missing from the outputs?
- Are there any generated files that don't appear in the design?

### Step 6 — Assign overall status
- **PASS**: All checks pass, no blocking issues
- **PASS WITH WARNINGS**: No blocking issues, but some warnings exist
- **FAIL**: One or more blocking issues found

## Severity Definitions
- **BLOCKING**: The workflow cannot function correctly without this fix
- **WARNING**: The workflow will function but quality or maintainability is reduced

### Step 7 — Validate workflow connections
- Does the design mention upstream or downstream workflows?
- If yes, are those connections implemented in the scripts (e.g., `TRIGGER_DOWNSTREAM` guard)?
- If yes, is the connection documented in `README.md` and `scripts/README.md`?
- Are trigger conditions clearly specified (what state/output causes the downstream trigger)?
