# Agentfile Code Reviewer Workflow Runner
# Usage: .\run.ps1 "<input>"

param(
    [Parameter(Mandatory=$true)]
    [string]$Input
)

# Create outputs directory
New-Item -ItemType Directory -Force -Path "outputs" | Out-Null

Write-Host "🔍 Starting Code Reviewer Workflow" -ForegroundColor Cyan
Write-Host "📁 Input: $Input" -ForegroundColor Yellow
Write-Host ""

# Step 1: Analyze Code
Write-Host "📊 Step 1: Analyzing code..." -ForegroundColor Blue
$AnalysisPrompt = Get-Content "agents/analyzer.md", "skills/code-analysis.md" | Out-String
$AnalysisPrompt = $AnalysisPrompt -replace '\$AGENT_INPUT', $Input

$AnalysisOutput = anthropic-api --model claude-3-sonnet-20240229 --max-tokens 4000 --prompt $AnalysisPrompt
$AnalysisOutput | Out-File -FilePath "outputs/01-analysis.md" -Encoding UTF8
Write-Host "✓ Analysis complete: outputs/01-analysis.md" -ForegroundColor Green

# Step 2: Write Review
Write-Host ""
Write-Host "📝 Step 2: Writing review..." -ForegroundColor Blue
$ReviewPrompt = Get-Content "agents/reviewer.md", "skills/write-review.md", "outputs/01-analysis.md" | Out-String

$ReviewOutput = anthropic-api --model claude-3-sonnet-20240229 --max-tokens 4000 --prompt $ReviewPrompt
$ReviewOutput | Out-File -FilePath "outputs/02-review.md" -Encoding UTF8
Write-Host "✓ Review complete: outputs/02-review.md" -ForegroundColor Green

# Step 3: Create Summary
Write-Host ""
Write-Host "📋 Step 3: Creating summary..." -ForegroundColor Blue
$SummaryPrompt = Get-Content "agents/summarizer.md", "skills/summarize.md", "outputs/02-review.md" | Out-String

$SummaryOutput = anthropic-api --model claude-3-sonnet-20240229 --max-tokens 2000 --prompt $SummaryPrompt
$SummaryOutput | Out-File -FilePath "outputs/03-summary.md" -Encoding UTF8
Write-Host "✓ Summary complete: outputs/03-summary.md" -ForegroundColor Green

Write-Host ""
Write-Host "🎉 Code Reviewer Workflow completed successfully!" -ForegroundColor Green
Write-Host "📁 Results saved to outputs/ directory" -ForegroundColor Cyan
Write-Host "📄 Final summary: outputs/03-summary.md" -ForegroundColor Yellow
