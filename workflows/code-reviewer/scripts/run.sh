#!/bin/bash

# Agentfile Code Reviewer Workflow Runner
# Usage: ./run.sh "<input>"

set -e

# Get input from command line argument
INPUT="$1"
if [ -z "$INPUT" ]; then
    echo "Usage: $0 \"<input>\""
    echo "Example: $0 \"src/components/Button.js\""
    exit 1
fi

# Create outputs directory
mkdir -p outputs

echo "🔍 Starting Code Reviewer Workflow"
echo "📁 Input: $INPUT"
echo ""

# Step 1: Analyze Code
echo "📊 Step 1: Analyzing code..."
ANALYSIS_OUTPUT=$(cat agents/analyzer.md skills/code-analysis.md | \
    sed "s/\$AGENT_INPUT/$INPUT/g" | \
    anthropic-api --model claude-3-sonnet-20240229 --max-tokens 4000)
echo "$ANALYSIS_OUTPUT" > outputs/01-analysis.md
echo "✓ Analysis complete: outputs/01-analysis.md"

# Step 2: Write Review
echo ""
echo "📝 Step 2: Writing review..."
REVIEW_OUTPUT=$(cat agents/reviewer.md skills/write-review.md outputs/01-analysis.md | \
    anthropic-api --model claude-3-sonnet-20240229 --max-tokens 4000)
echo "$REVIEW_OUTPUT" > outputs/02-review.md
echo "✓ Review complete: outputs/02-review.md"

# Step 3: Create Summary
echo ""
echo "📋 Step 3: Creating summary..."
SUMMARY_OUTPUT=$(cat agents/summarizer.md skills/summarize.md outputs/02-review.md | \
    anthropic-api --model claude-3-sonnet-20240229 --max-tokens 2000)
echo "$SUMMARY_OUTPUT" > outputs/03-summary.md
echo "✓ Summary complete: outputs/03-summary.md"

echo ""
echo "🎉 Code Reviewer Workflow completed successfully!"
echo "📁 Results saved to outputs/ directory"
echo "📄 Final summary: outputs/03-summary.md"
