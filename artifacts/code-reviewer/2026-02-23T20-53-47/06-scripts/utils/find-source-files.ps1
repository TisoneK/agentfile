#!/usr/bin/env pwsh
$ErrorActionPreference = "Stop"

# ── Usage ───────────────────────────────────────────────────────────────────────
# Usage: scripts/utils/find-source-files.ps1 -TargetPath <path> [-ConfigJson <json>]
# Description: Discover source files in target path, applying exclusion patterns
# Called by: scripts/cli/run.ps1, scripts/ide/register.ps1

param(
  [Parameter(Mandatory=$true)][string]$TargetPath,
  [Parameter(Mandatory=$false)][string]$ConfigJson = ""
)

function Write-Log([string]$m) {
  Write-Host "[$(Get-Date -Format 'HH:mm:ss')] [$($MyInvocation.MyCommand.Name)] $m" -ForegroundColor Gray
}

function Get-LanguageFromExtension([string]$path) {
  $ext = [System.IO.Path]::GetExtension($path).ToLower()
  switch ($ext) {
    ".py" { return "python" }
    ".js" { return "javascript" }
    ".jsx" { return "javascript" }
    ".ts" { return "typescript" }
    ".tsx" { return "typescript" }
    ".java" { return "java" }
    ".c" { return "c" }
    ".cpp" { return "cpp" }
    ".h" { return "c" }
    ".hpp" { return "cpp" }
    ".cs" { return "csharp" }
    ".go" { return "go" }
    ".rb" { return "ruby" }
    ".php" { return "php" }
    ".swift" { return "swift" }
    ".kt" { return "kotlin" }
    ".rs" { return "rust" }
    ".scala" { return "scala" }
    default { return "unknown" }
  }
}

# ── Main Logic ───────────────────────────────────────────────────────────────────
Write-Log "Discovering source files in: $TargetPath"

# Validate target path
if (-not (Test-Path $TargetPath)) {
  Write-Log "ERROR: Target path does not exist: $TargetPath"
  exit 1
}

# Default exclusion patterns
$excludePatterns = @(
  "node_modules/",
  ".git/",
  "build/",
  "dist/",
  "__pycache__/",
  "*.min.js",
  "*.min.css",
  ".DS_Store",
  "Thumbs.db",
  "*.log",
  "*.tmp"
)

# Load additional exclusions from config if provided
if ($ConfigJson) {
  try {
    $config = $ConfigJson | ConvertFrom-Json
    if ($config.exclude) {
      $excludePatterns += $config.exclude
    }
  } catch {
    Write-Log "WARNING: Could not parse config JSON for exclusions"
  }
}

# Language-specific file extensions
$extensions = @(
  "*.py", "*.js", "*.ts", "*.jsx", "*.tsx", "*.java", "*.c", "*.cpp", "*.h",
  "*.hpp", "*.cs", "*.go", "*.rb", "*.php", "*.swift", "*.kt", "*.rs", "*.scala"
)

# Find files
$files = @()
foreach ($ext in $extensions) {
  $foundFiles = Get-ChildItem -Path $TargetPath -Filter $ext -File -Recurse | Where-Object {
    $filePath = $_.FullName
    # Apply exclusion patterns
    foreach ($pattern in $excludePatterns) {
      if ($filePath -like "*$pattern*") {
        return $false
      }
    }
    return $true
  }
  $files += $foundFiles
}

# Build JSON result
$fileObjects = @()
foreach ($file in $files) {
  $fileObj = @{
    path = $file.FullName
    language = Get-LanguageFromExtension $file.FullName
    size = $file.Length
  }
  $fileObjects += $fileObj
}

$result = @{
  files = $fileObjects
  count = $files.Count
  target_path = $TargetPath
  discovered_at = (Get-Date).ToString("yyyy-MM-ddTHH:mm:sszzz")
}

$resultJson = $result | ConvertTo-Json -Depth 10
Write-Output $resultJson
Write-Log "Found $($files.Count) source files"
