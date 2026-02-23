# Workflow Design

## Name
file-flow

## Description
A foundational file-processing utility workflow that reads structured data from files (JSON/YAML/CSV), parses and transforms their contents, and saves validated results in an organized output structure. It is designed as a reliable, repeatable file-handling capability used by other workflows within automated pipelines.

## Steps

| id | name | agent | skill | produces |
|----|------|-------|-------|----------|
| load-instruction | Load Instruction | InstructionLoader | parse-instruction | Parsed instruction config |
| guard-execution | Guard Execution | ExecutionGuard | workflow-control | Execution readiness |
| validate-inputs | Validate Inputs | FileValidator | file-io | Validation results |
| parse-files | Parse Files | FileParser | file-parsing | Parsed file data |
| transform-data | Transform Data | DataTransformer | data-transformation | Transformed data |
| validate-output | Validate Output | OutputValidator | data-validation | Validation results |
| save-results | Save Results | ResultWriter | file-io | Output files |
| report-status | Report Status | StatusReporter | execution-logging | Execution report |

**Note**: Results are finalized only after validation succeeds - save-results will not execute if validation fails.

## Agents

### InstructionLoader
- **Role**: Reads and parses the instruction configuration file
- **Input**: Path to instruction file (JSON/YAML)
- **Output**: Parsed instruction object with file list, processing rules, output config
- **Tone/Style**: Precise, detail-oriented

### ExecutionGuard
- **Role**: Ensures execution readiness - validates required fields exist, prevents partial configs, establishes workflow state
- **Input**: Parsed instruction config from InstructionLoader
- **Output**: Execution readiness status (ready/blocked with reasons)
- **Tone/Style**: Cautious, protective

### FileValidator
- **Role**: Validates that input files exist and are accessible
- **Input**: List of file paths from instruction
- **Output**: Validation results (valid/invalid files with reasons)
- **Tone/Style**: Thorough, cautious

### FileParser
- **Role**: Reads and parses input files based on format (JSON/YAML/CSV)
- **Input**: File paths and format specification
- **Output**: Parsed data structures
- **Tone/Style**: Accurate, methodical

### DataTransformer
- **Role**: Applies rule-based restructuring, filtering, or normalization as defined in the instruction
- **Input**: Parsed data, transformation rules from instruction
- **Output**: Transformed data
- **Tone/Style**: Precise, logical

### OutputValidator
- **Role**: Validates processed data meets schema/validation rules
- **Input**: Transformed data, validation rules
- **Output**: Validation results
- **Tone/Style**: Rigorous, thorough

### ResultWriter
- **Role**: Saves processed output to specified destination (only executes after validation succeeds)
- **Input**: Transformed data, output configuration
- **Output**: Written output files
- **Tone/Style**: Reliable, careful

### StatusReporter
- **Role**: Generates execution summary with success/failure details
- **Input**: Execution results from all steps
- **Output**: Execution report (JSON/text)
- **Tone/Style**: Clear, informative

## Skills

### parse-instruction
- **Purpose**: Parse JSON/YAML instruction configuration files
- **Used by**: InstructionLoader
- **Key instructions**:
  - Load and parse JSON or YAML files
  - Validate instruction structure
  - Extract file list, processing rules, output config

### workflow-control
- **Purpose**: Ensure execution readiness and prevent unsafe runs
- **Used by**: ExecutionGuard
- **Key instructions**:
  - Validate required fields exist in instruction config
  - Check for partial/incomplete configurations
  - Establish workflow state and execution context

### file-io
- **Purpose**: File reading and writing operations
- **Used by**: FileValidator, ResultWriter
- **Key instructions**:
  - Check file existence and accessibility
  - Read file contents with proper encoding handling
  - Write files atomically to prevent partial writes

### file-parsing
- **Purpose**: Parse different file formats (JSON/YAML/CSV)
- **Used by**: FileParser
- **Key instructions**:
  - Detect file format from extension
  - Parse JSON files
  - Parse YAML files
  - Parse CSV files with header detection

### data-transformation
- **Purpose**: Apply rule-based restructuring, filtering, or normalization to parsed data
- **Used by**: DataTransformer
- **Key instructions**:
  - Apply field mapping/renaming
  - Filter specific fields
  - Aggregate or combine data
  - Format output structure

### data-validation
- **Purpose**: Validate data against schemas and rules
- **Used by**: OutputValidator
- **Key instructions**:
  - Validate JSON schema compliance
  - Check required fields
  - Validate data types and formats

### execution-logging
- **Purpose**: Log execution progress and results
- **Used by**: StatusReporter
- **Key instructions**:
  - Track step success/failure
  - Capture timing information
  - Generate summary reports

## Scripts

### run.sh / run.ps1
- **Purpose**: Main orchestration - runs all steps in sequence
- **Logic**: 
  1. Load instruction file from argument
  2. Guard execution - validate config completeness
  3. Validate all input files exist
  4. Parse each input file
  5. Apply transformations (rule-based restructuring, filtering, normalization)
  6. Validate output data
  7. Save results to output directory (only if validation succeeded)
  8. Generate execution report

## File Manifest
```
workflows/file-flow/
  workflow.yaml
  agents/
    instruction-loader.md
    execution-guard.md
    file-validator.md
    file-parser.md
    data-transformer.md
    output-validator.md
    result-writer.md
    status-reporter.md
  skills/
    parse-instruction.md
    workflow-control.md
    file-io.md
    file-parsing.md
    data-transformation.md
    data-validation.md
    execution-logging.md
  scripts/
    run.sh
    run.ps1
  outputs/         # runtime, gitignored
```

## Dependencies / Assumptions
- Node.js available for script execution
- File system access for reading/writing files
- JSON/YAML/CSV parsing libraries available
- No external API dependencies - all processing is local
