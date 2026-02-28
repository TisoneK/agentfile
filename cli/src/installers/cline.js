'use strict';

const path = require('path');
const { existsSync, readFile, deleteFileAsync } = require('../../../src/js-utils/file-ops');
const { log, writeFile } = require('../lib/utils');

/**
 * Install Cline integration
 * Generates .clinerules file pointing to .agentfile/
 * Idempotent: only creates files if they don't exist (preserves user customizations)
 * @param {string} targetDir - Target project directory
 * @param {string} agentfileDir - Relative path to .agentfile/ directory
 */
async function installCline(targetDir, agentfileDir) {
  const clinerulesPath = path.join(targetDir, '.clinerules');
  
  // Idempotency counters
  const counters = { preserved: 0, added: 0, skipped: 0 };
  
  // Idempotent: skip if file already exists (preserve user customizations)
  if (existsSync(clinerulesPath)) {
    counters.preserved++;
    counters.skipped = 1;
    log.success('Installed for Cline');
    log.dim('Skipped 1 file(s) - already exist');
    return counters;
  }
  
  // Generate .clinerules file content
  const content = `# Agentfile Integration

This project uses [Agentfile](https://github.com/TisoneK/agentfile) for workflow automation.

## Available Commands

Run the following agentfile commands using the CLI:

### /agentfile:run <workflow-name> <args>
Run an existing workflow in IDE mode.
- Read workflow definition: ${agentfileDir}/run.md

### /agentfile:create <workflow-name> <description>
Create a new workflow using the workflow-creator pipeline.
- Read workflow creation: ${agentfileDir}/create.md

### /agentfile:list
List all available workflows in the project.
- Read workflow listing: ${agentfileDir}/list.md

### /agentfile:validate <workflow-name>
Validate a workflow against the schema.
- Read validation: ${agentfileDir}/validate.md

## Important Notes

- Always validate workflow.yaml with AJV before execution
- Never create files directly in workflows/ - use workflow-creator pipeline
- Use agentfile CLI commands instead of running shell scripts directly
- For more details, read the command definitions in ${agentfileDir}/
`;
  
  try {
    writeFile(clinerulesPath, content);
    counters.added++;
  } catch (err) {
    log.warn(`Failed to write ${clinerulesPath}: ${err.message}`);
    return counters;
  }
  
  log.success('Installed for Cline');
  return counters;
}

/**
 * Uninstall Cline integration (remove generated files)
 * @param {string} targetDir - Target project directory
 */
async function uninstallCline(targetDir) {
  const clinerulesPath = path.join(targetDir, '.clinerules');
  
  if (existsSync(clinerulesPath)) {
    // Read the file to check if it's an agentfile-generated one
    const readResult = readFile(clinerulesPath);
    if (readResult.success && readResult.content.includes('Agentfile Integration')) {
      const deleteResult = await deleteFileAsync(clinerulesPath);
      if (!deleteResult.success) {
        log.warn(`Failed to delete ${clinerulesPath}: ${deleteResult.error?.message}`);
      }
    }
  }
  
  log.success('Uninstalled Cline');
}

module.exports = {
  installCline,
  uninstallCline,
};
