# Skill: Generate Utility Scripts

## Purpose
Teach the Generator how to identify, decompose, and write `scripts/utils/` scripts — plain terminal scripts with no LLM involvement that perform discrete, reusable operations. Both `scripts/cli/` and `scripts/ide/` call into these scripts.

---

## Step 1 — What Belongs in utils/

A utility script is needed whenever a workflow step involves a discrete, repeatable operation that:
- Has nothing to do with calling an LLM
- Would clutter `run.sh` / `run.ps1` if inlined
- Could logically be reused by other workflows or steps

### Common utility script categories

| Operation | Example script name |
|-----------|-------------------|
| Read and parse a file | `read-file.sh`, `parse-json.sh`, `parse-csv.sh` |
| Write or append output | `write-output.sh`, `append-report.sh` |
| Validate input or output | `validate-input.sh`, `validate-schema.sh` |
| Transform or reformat data | `transform-data.sh`, `convert-format.sh` |
| File system operations | `create-dirs.sh`, `cleanup-outputs.sh`, `archive.sh` |
| Environment checks | `check-deps.sh`, `check-env.sh` |
| Git operations | `get-staged-files.sh`, `commit-files.sh` |
| Extraction | `extract-section.sh`, `split-file.sh` |
| Reporting | `generate-report.sh`, `summarise-outputs.sh` |

### Decision rule
For each workflow step, ask: **"Does this step do anything besides call the LLM?"**
- If yes → that non-LLM work belongs in a `utils/` script
- If no → it stays in the step function inside `run.sh`

---

## Step 2 — Design Principles for Utils

- **One script, one responsibility** — a script that reads a file should not also validate it
- **Accept input as arguments** — never hardcode paths; always use `$1`, `$2` or named params
- **Write output to stdout or a path argument** — let the caller decide where output goes
- **Exit with clear codes** — `exit 0` for success, `exit 1` with an error message for failure
- **No API keys, no LLM calls** — if it needs an LLM, it belongs in `cli/` not `utils/`
- **Idempotent where possible** — running the script twice should be safe

---

## Step 3 — Bash Utility Script Template

```bash
#!/usr/bin/env bash
set -euo pipefail

# ── Usage ───────────────────────────────────────────────────────────────────────
# Usage: scripts/utils/[script-name].sh <input-arg> [output-arg]
# Description: [What this script does in one sentence]
# Called by: scripts/cli/run.sh, scripts/ide/register.sh

# ── Arguments ───────────────────────────────────────────────────────────────────
INPUT="${1:?Usage: $(basename "$0") <input> [output]}"
OUTPUT="${2:-}"  # optional — if not provided, write to stdout

# ── Helper ───────────────────────────────────────────────────────────────────────
log() { echo "[$(date '+%H:%M:%S')] [$(basename "$0")] $*" >&2; }

# ── Main Logic ───────────────────────────────────────────────────────────────────
main() {
  log "Processing: $INPUT"

  # [Script logic here — no API calls, no LLM]

  if [[ -n "$OUTPUT" ]]; then
    # write result to output path
    echo "$result" > "$OUTPUT"
    log "Written to: $OUTPUT"
  else
    # write result to stdout
    echo "$result"
  fi
}

main "$@"
```

### Example — read-file.sh
```bash
#!/usr/bin/env bash
set -euo pipefail
# Usage: scripts/utils/read-file.sh <file-path>
# Reads a file, strips blank lines and comments, writes cleaned content to stdout

FILE="${1:?Usage: $(basename "$0") <file-path>}"
[[ -f "$FILE" ]] || { echo "ERROR: File not found: $FILE" >&2; exit 1; }
grep -v '^\s*#' "$FILE" | grep -v '^\s*$'
```

### Example — validate-input.sh
```bash
#!/usr/bin/env bash
set -euo pipefail
# Usage: scripts/utils/validate-input.sh <file-path>
# Validates that input file exists, is non-empty, and is valid JSON

FILE="${1:?Usage: $(basename "$0") <file-path>}"
[[ -f "$FILE" ]]       || { echo "ERROR: Not a file: $FILE" >&2; exit 1; }
[[ -s "$FILE" ]]       || { echo "ERROR: File is empty: $FILE" >&2; exit 1; }
jq empty "$FILE" 2>&1  || { echo "ERROR: Invalid JSON: $FILE" >&2; exit 1; }
echo "✓ Input valid: $FILE"
```

### Example — write-output.sh
```bash
#!/usr/bin/env bash
set -euo pipefail
# Usage: scripts/utils/write-output.sh <content-file> <output-path>
# Copies content to output path, creating parent directories as needed

SRC="${1:?Usage: $(basename "$0") <content-file> <output-path>}"
DST="${2:?Usage: $(basename "$0") <content-file> <output-path>}"
mkdir -p "$(dirname "$DST")"
cp "$SRC" "$DST"
echo "✓ Output written: $DST"
```

---

## Step 4 — PowerShell Utility Script Template

```powershell
#!/usr/bin/env pwsh
$ErrorActionPreference = "Stop"

# ── Usage ───────────────────────────────────────────────────────────────────────
# Usage: scripts/utils/[script-name].ps1 -Input <path> [-Output <path>]
# Description: [What this script does in one sentence]
# Called by: scripts/cli/run.ps1, scripts/ide/register.ps1

param(
  [Parameter(Mandatory=$true)][string]$Input,
  [Parameter(Mandatory=$false)][string]$Output = ""
)

function Write-Log([string]$m) {
  Write-Host "[$(Get-Date -Format 'HH:mm:ss')] [$($MyInvocation.MyCommand.Name)] $m" -ForegroundColor Gray
}

# ── Main Logic ───────────────────────────────────────────────────────────────────
Write-Log "Processing: $Input"

# [Script logic here — no API calls, no LLM]

if ($Output) {
  New-Item -ItemType Directory -Force -Path (Split-Path $Output) | Out-Null
  $result | Set-Content $Output
  Write-Log "Written to: $Output"
} else {
  Write-Output $result
}
```

---

## Step 5 — How cli/ and ide/ Call utils/

### In cli/run.sh
```bash
# Call a utility script and capture its output
VALIDATED=$(bash "$WORKFLOW_DIR/scripts/utils/validate-input.sh" "$INPUT_FILE")

# Call a utility script and pass an output path
bash "$WORKFLOW_DIR/scripts/utils/write-output.sh" "$OUTPUTS_DIR/result.md" "$OUTPUTS_DIR/final.md"

# Call a utility script inline as part of a step
step_validate() {
  log "▶ Validating input"
  bash "$WORKFLOW_DIR/scripts/utils/validate-input.sh" "$INPUT_FILE"
  log "  ✓ Input valid"
}
```

### In cli/run.ps1
```powershell
# Call a utility script and capture output
$validated = & "$WorkflowDir/scripts/utils/validate-input.ps1" -Input $InputFile

# Call inline as part of a step
function Step-Validate {
  Write-Log "▶ Validating input"
  & "$WorkflowDir/scripts/utils/validate-input.ps1" -Input $InputFile
  Write-Log "  ✓ Input valid"
}
```

### In ide/register.sh
```bash
# IDE register scripts call utils/ for file assembly tasks
bash "$WORKFLOW_DIR/scripts/utils/write-output.sh" "$OUTPUTS_DIR/draft.md" "$OUTPUTS_DIR/final.md"
bash "$WORKFLOW_DIR/scripts/utils/generate-report.sh" "$OUTPUTS_DIR" "$OUTPUTS_DIR/report.md"
```

### In ide/steps.md
Reference utils/ scripts in step instructions where the IDE agent should tell the user to run them:
```markdown
### Step 3 — Validate Input
After the IDE agent produces `outputs/parsed.json`, run:
```bash
bash scripts/utils/validate-input.sh outputs/parsed.json
```
```

---

## Step 6 — Quality Checklist

Before finalising utils/:
- [ ] Every non-LLM operation in the workflow has its own utility script
- [ ] Each script does exactly one thing
- [ ] All scripts accept inputs as arguments — no hardcoded paths
- [ ] Both `.sh` and `.ps1` versions exist for every utility script
- [ ] Scripts exit with code 1 and a clear error message on failure
- [ ] `cli/run.sh` and `cli/run.ps1` reference utils/ scripts correctly
- [ ] `ide/register.sh` and `ide/register.ps1` reference utils/ scripts correctly
- [ ] `ide/steps.md` mentions any utils/ scripts the user needs to run manually
- [ ] All utils/ scripts are listed in `scripts/README.md`
