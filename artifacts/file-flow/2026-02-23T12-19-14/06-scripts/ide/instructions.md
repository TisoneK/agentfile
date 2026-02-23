# IDE Execution Instructions

## Workflow: file-flow
Version: 1.0.0 | Execution Mode: IDE

## Overview

This workflow processes files (JSON/YAML/CSV) by reading, parsing, transforming, validating, and saving the results. It is designed as a foundational utility for automated pipelines.

## ⚠️ Execution Mode Warning

| Script path | Purpose | API key? | Use in IDE? |
|------------|---------|----------|-------------|
| `scripts/ide/register.sh` / `.ps1` | Assemble final workflow folder | ❌ Not needed | ✅ Yes |
| `scripts/cli/run.sh` / `.ps1` | Full pipeline via Anthropic API | ✅ Required | ❌ Never |

## Step-by-Step Instructions

### 1. Load Instruction
- Read the instruction file path from `FILE_FLOW_INPUT` environment variable
- Use the InstructionLoader agent with parse-instruction skill
- Produces: Parsed instruction configuration

### 2. Guard Execution
- Validate required fields exist in the instruction
- Prevent partial or incomplete configurations
- Use ExecutionGuard agent with workflow-control skill
- Produces: Execution readiness status

### 3. Validate Inputs
- Verify all input files exist and are accessible
- Use FileValidator agent with file-io skill
- Produces: Validation results

### 4. Parse Files
- Read and parse each input file (JSON/YAML/CSV)
- Use FileParser agent with file-parsing skill
- Produces: Parsed file data

### 5. Transform Data
- Apply rule-based transformations as specified
- Use DataTransformer agent with data-transformation skill
- Produces: Transformed data

### 6. Validate Output
- Validate processed data against schema/rules
- Use OutputValidator agent with data-validation skill
- Produces: Validation results

### 7. Save Results
- Write processed output to destination (only if validation passed)
- Use ResultWriter agent with file-io skill
- Produces: Output files

### 8. Report Status
- Generate execution summary with timing and status
- Use StatusReporter agent with execution-logging skill
- Produces: Execution report

## Agent Loading Instructions
- Load agents from `agents/*.md` as system prompts
- Load skills from `skills/*.md` as context
- Execute steps sequentially using IDE agent's LLM
- Never run `scripts/cli/` scripts — those require ANTHROPIC_API_KEY
- Only run `scripts/ide/register.sh` (or .ps1) at the final step

## Input Format
The workflow expects `FILE_FLOW_INPUT` to contain a path to an instruction file:

```json
{
  "input_files": ["data/users.json", "data/settings.yaml"],
  "processing": {
    "transformations": [{"type": "filter", "field": "active", "value": true}],
    "validation_rules": [{"type": "required", "fields": ["email"]}]
  },
  "output": {"directory": "output/", "format": "json"}
}
```

## Output Format
Each step produces artifacts in the workflow's outputs directory:
- `instruction-config.json` - Parsed instruction
- `execution-readiness.json` - Guard check results
- `input-validation.json` - File validation results
- `parsed-data.json` - Parsed file contents
- `transformed-data.json` - Data after transformations
- `output-validation.json` - Output validation results
- `output-files/` - Final output files
- `execution-report.json` - Final execution report
