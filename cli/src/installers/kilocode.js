'use strict';

const path = require('path');
const { ensureDirAsync, existsSync, deleteFile, readdirAsync, deleteFileAsync } = require('../../../src/js-utils/file-ops');
const { log, writeFile } = require('../lib/utils');

/**
 * Install KiloCode integration
 * Generates .kilocode/rules/ with wrapper files pointing to .agentfile/
 * Idempotent: only creates files if they don't exist (preserves user customizations)
 * @param {string} targetDir - Target project directory
 * @param {string} agentfileDir - Relative path to .agentfile/ directory
 */
async function installKiloCode(targetDir, agentfileDir) {
  const rulesDir = path.join(targetDir, '.kilocode', 'rules', 'agentfile');
  
  // Idempotency counters
  const counters = { preserved: 0, added: 0 };
  
  // Ensure directory exists
  const dirResult = await ensureDirAsync(rulesDir);
  if (!dirResult.success) {
    log.warn(`Failed to create .kilocode/rules/: ${dirResult.error?.message}`);
    return counters;
  }
  
  // Generate agentfile rules file
  const content = `# Agentfile Integration

This project uses [Agentfile](https://github.com/TisoneK/agentfile) for workflow automation.

## Available Commands

- **agentfile:run** - Run an existing workflow
- **agentfile:create** - Create a new workflow
- **agentfile:list** - List all available workflows
- **agentfile:validate** - Validate a workflow

## Configuration

Agentfile commands are defined in the \`.agentfile/\` directory.
For more details, read the command definitions at:
${agentfileDir}/run.md
${agentfileDir}/create.md
${agentfileDir}/list.md
${agentfileDir}/validate.md
`;
  
  const filePath = path.join(rulesDir, 'agentfile.md');
  
  // Idempotent: skip if file already exists (preserve user customizations)
  if (existsSync(filePath)) {
    counters.preserved++;
    counters.skipped = 1;
    log.success('Installed for KiloCode');
    log.dim('Skipped 1 file(s) - already exist');
    return counters;
  }
  
  try {
    writeFile(filePath, content);
    counters.added++;
  } catch (err) {
    log.warn(`Failed to write ${filePath}: ${err.message}`);
  }
  
  log.success('Installed for KiloCode');
  return counters;
}

/**
 * Uninstall KiloCode integration (remove generated files)
 * @param {string} targetDir - Target project directory
 */
async function uninstallKiloCode(targetDir) {
  const rulesDir = path.join(targetDir, '.kilocode', 'rules');
  
  if (existsSync(rulesDir)) {
    const result = await readdirAsync(rulesDir);
    if (result.success) {
      for (const file of result.files) {
        if (file === 'agentfile.md') {
          const filePath = path.join(rulesDir, file);
          const deleteResult = await deleteFileAsync(filePath);
          if (!deleteResult.success) {
            log.warn(`Failed to delete ${filePath}: ${deleteResult.error?.message}`);
          }
        }
      }
    }
    
    // Remove empty agentfile directory if it exists
    const agentfileDir = path.join(rulesDir, 'agentfile');
    if (existsSync(agentfileDir)) {
      try {
        const fs = require('fs');
        const remaining = await readdirAsync(agentfileDir);
        if (remaining.success && remaining.files.length === 0) {
          fs.rmdirSync(agentfileDir);
        }
      } catch (e) {
        // ignore errors when removing directory
      }
    }
  }
  
  log.success('Uninstalled KiloCode');
}

module.exports = {
  installKiloCode,
  uninstallKiloCode,
};
