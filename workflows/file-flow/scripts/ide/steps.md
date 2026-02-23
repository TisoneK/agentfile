## IDE Execution Steps

1. **Load Instruction**
   - Set `FILE_FLOW_INPUT` to the path of your instruction file
   - Execute the InstructionLoader agent with parse-instruction skill
   - Verify instruction-config.json was created

2. **Guard Execution**
   - Execute the ExecutionGuard agent with workflow-control skill
   - Check execution-readiness.json shows status "ready"
   - If blocked, fix the instruction file and retry

3. **Validate Inputs**
   - Execute the FileValidator agent with file-io skill
   - Verify all input files are accessible

4. **Parse Files**
   - Execute the FileParser agent with file-parsing skill
   - Verify parsed-data.json contains the parsed content

5. **Transform Data**
   - Execute the DataTransformer agent with data-transformation skill
   - Verify transformed-data.json contains the transformed results

6. **Validate Output**
   - Execute the OutputValidator agent with data-validation skill
   - If validation fails, review and fix the data or rules

7. **Save Results**
   - Execute the ResultWriter agent with file-io skill
   - Verify output files exist in the output directory

8. **Report Status**
   - Execute the StatusReporter agent with execution-logging skill
   - Review the execution-report.json for overall status

## Register Workflow
   - Run `scripts/ide/register.sh` (Unix) or `scripts/ide/register.ps1` (Windows)
   - No API key required — pure file assembly
   - Do NOT run `scripts/cli/` scripts in IDE mode

## Notes
- Use IDE agent's built-in LLM capabilities for reasoning steps
- `scripts/ide/register.sh` / `.ps1` are the only shell scripts to run in IDE mode
- Each step produces artifacts in the outputs directory
- Check execution-report.json for the final summary
