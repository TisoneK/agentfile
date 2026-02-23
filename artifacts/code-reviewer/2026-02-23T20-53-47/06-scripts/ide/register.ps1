#!/usr/bin/env pwsh
$ErrorActionPreference = "Stop"
# IDE-safe: NO API KEY REQUIRED. Pure file assembly.

$ScriptDir   = Split-Path -Parent $MyInvocation.MyCommand.Path
$WorkflowDir = Split-Path -Parent (Split-Path -Parent $ScriptDir)
$OutputsDir  = Join-Path $WorkflowDir "outputs"

function Write-Log([string]$m) {
  Write-Host "[$(Get-Date -Format 'HH:mm:ss')] [$($MyInvocation.MyCommand.Name)] $m" -ForegroundColor Gray
}

# Validate outputs directory exists
if (-not (Test-Path $OutputsDir)) {
  Write-Log "ERROR: outputs/ not found. Run workflow steps first."
  exit 1
}

# Check for required output files
$requiredFiles = @(
  "01-context.md",
  "02-static-analysis.md",
  "03-security-scan.md",
  "04-style-check.md",
  "05-complexity-analysis.md",
  "06-review-report.md",
  "07-evaluation.md",
  "08-final-report.md"
)

Write-Log "Validating workflow outputs..."
$missingFiles = @()
foreach ($file in $requiredFiles) {
  $filePath = Join-Path $OutputsDir $file
  if (-not (Test-Path $filePath)) {
    $missingFiles += $file
  }
}

if ($missingFiles.Count -gt 0) {
  Write-Log "ERROR: Missing required output files:"
  foreach ($file in $missingFiles) {
    Write-Log "  - $file"
  }
  exit 1
}

# Generate artifacts using utility script
Write-Log "Generating artifacts and metadata..."
& "$WorkflowDir/scripts/utils/generate-artifacts.ps1" -OutputsDir $OutputsDir -ArtifactType "review"

# Create a summary index
Write-Log "Creating workflow summary..."
$htmlContent = @"
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
        <p>Generated on $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')</p>
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
"@

$htmlContent | Set-Content (Join-Path $OutputsDir "index.html") -Encoding UTF8

Write-Log "✅ Registration complete"
Write-Log "   Output directory: $OutputsDir"
Write-Log "   Final report: $(Join-Path $OutputsDir '08-final-report.md')"
Write-Log "   HTML index: $(Join-Path $OutputsDir 'index.html')"
Write-Log ""
Write-Log "🎉 Code review workflow completed successfully!"
