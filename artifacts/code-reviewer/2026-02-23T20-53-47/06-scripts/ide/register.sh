#!/usr/bin/env bash
set -euo pipefail
# IDE-safe: NO API KEY REQUIRED. Pure file assembly.

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
WORKFLOW_DIR="$(cd "$SCRIPT_DIR/../.." && pwd)"
OUTPUTS_DIR="$WORKFLOW_DIR/outputs"

log() { echo "[$(date '+%H:%M:%S')] [$(basename "$0")] $*" >&2; }

# Validate outputs directory exists
[[ -d "$OUTPUTS_DIR" ]] || { echo "ERROR: outputs/ not found. Run workflow steps first."; exit 1; }

# Check for required output files
required_files=(
  "01-context.md"
  "02-static-analysis.md"
  "03-security-scan.md"
  "04-style-check.md"
  "05-complexity-analysis.md"
  "06-review-report.md"
  "07-evaluation.md"
  "08-final-report.md"
)

log "Validating workflow outputs..."
missing_files=()
for file in "${required_files[@]}"; do
  if [[ ! -f "$OUTPUTS_DIR/$file" ]]; then
    missing_files+=("$file")
  fi
done

if [[ ${#missing_files[@]} -gt 0 ]]; then
  log "ERROR: Missing required output files:"
  for file in "${missing_files[@]}"; do
    log "  - $file"
  done
  exit 1
fi

# Generate artifacts using utility script
log "Generating artifacts and metadata..."
bash "$WORKFLOW_DIR/scripts/utils/generate-artifacts.sh" "$OUTPUTS_DIR" "review"

# Create a summary index
log "Creating workflow summary..."
cat > "$OUTPUTS_DIR/index.html" << 'EOF'
<!DOCTYPE html>
<html>
<head>
    <title>Code Review Results</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 40px; }
        .header { background: #f5f5f5; padding: 20px; border-radius: 5px; margin-bottom: 20px; }
        .file-list { list-style: none; padding: 0; }
        .file-list li { margin: 10px 0; padding: 10px; background: #f9f9f9; border-left: 4px solid #007cba; }
        .file-list a { text-decoration: none; color: #007cba; font-weight: bold; }
        .status { color: #28a745; font-weight: bold; }
    </style>
</head>
<body>
    <div class="header">
        <h1>🔍 Code Review Results</h1>
        <p class="status">✅ Review completed successfully</p>
        <p>Generated on $(date)</p>
    </div>
    
    <h2>📄 Output Files</h2>
    <ul class="file-list">
        <li><a href="01-context.md">01-context.md</a> - Review context and configuration</li>
        <li><a href="02-static-analysis.md">02-static-analysis.md</a> - Static code analysis results</li>
        <li><a href="03-security-scan.md">03-security-scan.md</a> - Security vulnerability scan</li>
        <li><a href="04-style-check.md">04-style-check.md</a> - Style and standards check</li>
        <li><a href="05-complexity-analysis.md">05-complexity-analysis.md</a> - Complexity metrics</li>
        <li><a href="06-review-report.md">06-review-report.md</a> - Compiled review report</li>
        <li><a href="07-evaluation.md">07-evaluation.md</a> - Pass/fail evaluation</li>
        <li><a href="08-final-report.md">08-final-report.md</a> - Final formatted report</li>
    </ul>
    
    <h2>📊 Artifacts</h2>
    <ul class="file-list">
        <li><a href="artifacts/manifest.json">artifacts/manifest.json</a> - Artifact manifest</li>
        <li><a href="artifacts/summary.txt">artifacts/summary.txt</a> - Text summary</li>
    </ul>
</body>
</html>
EOF

log "✅ Registration complete"
log "   Output directory: $OUTPUTS_DIR"
log "   Final report: $OUTPUTS_DIR/08-final-report.md"
log "   HTML index: $OUTPUTS_DIR/index.html"
log ""
log "🎉 Code review workflow completed successfully!"
