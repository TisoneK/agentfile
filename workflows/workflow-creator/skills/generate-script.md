# Skill: Generate Script

## Purpose
Teach the Generator how to write complete, robust Bash and PowerShell orchestration scripts for workflows — including how to go beyond the boilerplate `run.sh` / `run.ps1` pair when the workflow requires it.

---

## Step 1 — Think Before You Write

Before generating any script, answer these questions from the workflow design:

1. **What does this workflow actually need to run?** A basic `run.sh` calling the API is a starting point, not an end point.
2. **Are there setup steps?** (install deps, check tools exist, configure env) → generate `setup.sh`
3. **Does the workflow watch for files or events?** → generate `watch.sh`
4. **Can the workflow run in batch mode over many inputs?** → generate `run-batch.sh`
5. **Does it produce output needing cleanup or archival?** → generate `cleanup.sh`
6. **Does it integrate with git hooks?** → generate `install-hook.sh`
7. **Does it have a long pipeline that could fail mid-way?** → support `--resume` flag or generate `resume.sh`

**Rule**: The scripts you generate must fit the workflow. Do not generate irrelevant scripts. Do not skip scripts the workflow clearly needs.

---

## Step 2 — Script Structure (Both Languages)

Every orchestration script must have these sections in order:
1. Shebang + strict mode
2. Path resolution (SCRIPT_DIR, WORKFLOW_DIR, PROJECT_ROOT, SHARED_DIR, OUTPUTS_DIR)
3. Environment variable validation
4. Configuration variables (MODEL, etc.)
5. Helper functions (call_api, load_file, human_gate, log)
6. Step functions — one per workflow step
7. Main execution block

---

## Step 3 — Bash Template

```bash
#!/usr/bin/env bash
set -euo pipefail

# ── Path Resolution ─────────────────────────────────────────────────────────────
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
WORKFLOW_DIR="$(cd "$SCRIPT_DIR/../.." && pwd)"
PROJECT_ROOT="$(cd "$WORKFLOW_DIR/../.." && pwd)"
SHARED_DIR="$PROJECT_ROOT/shared"
OUTPUTS_DIR="$WORKFLOW_DIR/outputs"

# ── Environment & Config ────────────────────────────────────────────────────────
: "${ANTHROPIC_API_KEY:?Error: ANTHROPIC_API_KEY is not set}"
API_KEY="$ANTHROPIC_API_KEY"
MODEL="claude-sonnet-4-6"
mkdir -p "$OUTPUTS_DIR"

# ── Helper Functions ────────────────────────────────────────────────────────────
call_api() {
  local system_prompt="$1" user_prompt="$2"
  local max_tokens="${3:-4096}" temperature="${4:-0.3}"
  curl -s https://api.anthropic.com/v1/messages \
    -H "x-api-key: $API_KEY" \
    -H "anthropic-version: 2023-06-01" \
    -H "content-type: application/json" \
    -d "$(jq -n \
      --arg model   "$MODEL" \
      --arg system  "$system_prompt" \
      --arg user    "$user_prompt" \
      --argjson max_tokens  "$max_tokens" \
      --argjson temperature "$temperature" \
      '{model:$model,max_tokens:$max_tokens,temperature:$temperature,
        system:$system,messages:[{role:"user",content:$user}]}')" \
  | jq -r '.content[0].text'
}

load_file() { cat "$1"; }

human_gate() {
  local step_name="$1" output_file="$2"
  echo ""
  echo "══════════════════════════════════════════════════════"
  echo "  ⏸  GATE: $step_name"
  echo "  📄 Output: $output_file"
  echo "══════════════════════════════════════════════════════"
  cat "$output_file"
  echo ""
  read -rp "  Approve and continue? [y/N] " confirm
  [[ "$confirm" == "y" || "$confirm" == "Y" ]] || { log "Aborted at gate: $step_name"; exit 1; }
}

log() { echo "[$(date '+%H:%M:%S')] $*"; }

# ── Steps ────────────────────────────────────────────────────────────────────────
step_[NAME]() {
  log "▶ Step N/M: [Step name from workflow.yaml]"
  local system user
  system="$(load_file "$SHARED_DIR/project.md")"$'\n\n'"$(load_file "$SHARED_DIR/AGENTS.md")"$'\n\n'"$(load_file "$WORKFLOW_DIR/agents/[agent].md")"
  user="$(load_file "$WORKFLOW_DIR/skills/[skill].md")"$'\n\n'"[step-specific input here]"
  call_api "$system" "$user" > "$OUTPUTS_DIR/[artifact-name]"
  log "  ✓ Saved: $OUTPUTS_DIR/[artifact-name]"
}

# ── Main ─────────────────────────────────────────────────────────────────────────
main() {
  local input="${1:?Usage: $(basename "$0") \"<input>\"}"
  log "🚀 Starting [workflow-name]"
  log "   Input: $input"

  step_[NAME]
  # ... remaining steps ...

  log "✅ Complete. Outputs in: $OUTPUTS_DIR"
}
main "$@"
```

---

## Step 4 — PowerShell Template

```powershell
#!/usr/bin/env pwsh
$ErrorActionPreference = "Stop"

# ── Path Resolution ─────────────────────────────────────────────────────────────
$ScriptDir   = Split-Path -Parent $MyInvocation.MyCommand.Path
$WorkflowDir = Split-Path -Parent (Split-Path -Parent $ScriptDir)
$ProjectRoot = Split-Path -Parent (Split-Path -Parent $WorkflowDir)
$SharedDir   = Join-Path $ProjectRoot "shared"
$OutputsDir  = Join-Path $WorkflowDir "outputs"

# ── Environment & Config ────────────────────────────────────────────────────────
param([Parameter(Mandatory=$true)][string]$Input)
$ApiKey = $env:ANTHROPIC_API_KEY ?? $(throw "ANTHROPIC_API_KEY is not set")
$Model  = "claude-sonnet-4-6"
New-Item -ItemType Directory -Force -Path $OutputsDir | Out-Null

# ── Helper Functions ────────────────────────────────────────────────────────────
function Invoke-Api {
  param([string]$System, [string]$User, [int]$MaxTokens=4096, [float]$Temp=0.3)
  $body = @{
    model=$Model; max_tokens=$MaxTokens; temperature=$Temp
    system=$System; messages=@(@{role="user";content=$User})
  } | ConvertTo-Json -Depth 10
  $r = Invoke-RestMethod `
    -Uri "https://api.anthropic.com/v1/messages" -Method POST `
    -Headers @{"x-api-key"=$ApiKey;"anthropic-version"="2023-06-01";"content-type"="application/json"} `
    -Body $body
  return $r.content[0].text
}

function Get-FC([string]$Path)                      { Get-Content $Path -Raw }
function Write-Log([string]$m)                      { Write-Host "[$(Get-Date -Format 'HH:mm:ss')] $m" }
function Invoke-Gate([string]$Name, [string]$File) {
  Write-Host "`n══════════════════════════════════════════"
  Write-Host "  GATE: $Name  |  File: $File"
  Get-Content $File | Write-Host
  $c = Read-Host "Approve? [y/N]"
  if ($c -ne "y") { throw "Aborted at gate: $Name" }
}

# ── Steps ────────────────────────────────────────────────────────────────────────
function Step-[Name] {
  Write-Log "▶ Step N/M: [Step name from workflow.yaml]"
  $sys = (Get-FC "$SharedDir/project.md") + "`n`n" + (Get-FC "$SharedDir/AGENTS.md") + "`n`n" + (Get-FC "$WorkflowDir/agents/[agent].md")
  $usr = (Get-FC "$WorkflowDir/skills/[skill].md") + "`n`n[step-specific input]"
  Invoke-Api $sys $usr | Set-Content "$OutputsDir/[artifact-name]"
  Write-Log "  ✓ Saved: $OutputsDir/[artifact-name]"
}

# ── Main ─────────────────────────────────────────────────────────────────────────
Write-Log "🚀 Starting [workflow-name]. Input: $Input"
Step-[Name]
# ... remaining steps ...
Write-Log "✅ Complete. Outputs in: $OutputsDir"
```

---

## Step 5 — Additional Script Patterns

### Watch Script (`watch.sh`)
```bash
#!/usr/bin/env bash
set -euo pipefail
WATCH_DIR="${1:?Usage: $0 <directory-to-watch>}"
log() { echo "[$(date '+%H:%M:%S')] $*"; }
log "👁  Watching: $WATCH_DIR"
while inotifywait -q -e close_write,moved_to "$WATCH_DIR"; do
  for f in "$WATCH_DIR"/*; do
    [[ -f "$f" ]] || continue
    log "Processing: $f"
    bash "$(dirname "$0")/run.sh" "$f" && mv "$f" "$WATCH_DIR/processed/"
  done
done
```

### Batch Script (`run-batch.sh`)
```bash
#!/usr/bin/env bash
set -euo pipefail
INPUT_DIR="${1:?Usage: $0 <input-dir>}"
SUCCESS=0; FAIL=0
for f in "$INPUT_DIR"/*; do
  [[ -f "$f" ]] || continue
  if bash "$(dirname "$0")/run.sh" "$f"; then
    ((SUCCESS++))
  else
    echo "FAILED: $f"; ((FAIL++))
  fi
done
echo "Done: $SUCCESS success, $FAIL failed"
```

### Setup Script (`setup.sh`)
```bash
#!/usr/bin/env bash
set -euo pipefail
# Verify required tools
for tool in curl jq; do
  command -v "$tool" &>/dev/null || { echo "Missing: $tool"; exit 1; }
done
echo "✅ All dependencies present"
```

---

## Step 6 — Key Patterns to Always Follow

- Validate required env vars at startup (fail fast with clear error messages)
- Use `set -euo pipefail` (Bash) or `$ErrorActionPreference = "Stop"` (PS)
- Always resolve paths relative to `$SCRIPT_DIR` — never assume CWD
- Load system prompt from: `project.md` + `AGENTS.md` + agent file
- Load skill into user prompt before the task instruction
- Human gates must display file contents before prompting for approval
- Progress messages use `log` / `Write-Log` — never raw `echo` without timestamp
- Every step function corresponds 1:1 to a step in workflow.yaml
- PowerShell script is functionally equivalent to the Bash script — not a stub
