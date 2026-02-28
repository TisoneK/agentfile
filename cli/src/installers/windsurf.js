'use strict';

const path = require('path');
const { ensureDirAsync, ensureDir, existsSync, deleteFile, readdirAsync, deleteFileAsync } = require('../../../src/js-utils/file-ops');
const { log, writeFile } = require('../lib/utils');

/**
 * Install Windsurf integration
 * Generates .windsurf/workflows/ with wrapper files pointing to .agentfile/
 * Idempotent: only creates files if they don't exist (preserves user customizations)
 * @param {string} targetDir - Target project directory
 * @param {string} agentfileDir - Relative path to .agentfile/ directory
 */
async function installWindsurf(targetDir, agentfileDir) {
  const windsurfDir = path.join(targetDir, '.windsurf', 'workflows', 'agentfile');
  
  // Idempotency counters
  const counters = { preserved: 0, added: 0, skipped: 0 };
  
  // Ensure directory exists
  const dirResult = await ensureDirAsync(windsurfDir);
  if (!dirResult.success) {
    log.warn(`Failed to create .windsurf/workflows/: ${dirResult.error?.message}`);
    return counters;
  }
  
  // Command definitions in .agentfile/
  const commands = [
    { id: 'run', source: 'run.md', desc: 'Run an existing workflow' },
    { id: 'create', source: 'create.md', desc: 'Create a new workflow' },
    { id: 'list', source: 'list.md', desc: 'List all available workflows' },
    { id: 'validate', source: 'validate.md', desc: 'Validate a workflow' },
  ];
  
  for (const cmd of commands) {
    const content = `# agentfile:${cmd.id}

Read the command definition at \${agentfileDir}/${cmd.source}

Follow all instructions in the command definition exactly as written.
`;
    
    const filePath = path.join(windsurfDir, `agentfile-${cmd.id}.md`);
    
    // Idempotent: skip if file already exists (preserve user customizations)
    if (existsSync(filePath)) {
      counters.preserved++;
      counters.skipped = (counters.skipped || 0) + 1;
      continue;
    }
    
    try {
      writeFile(filePath, content);
      counters.added++;
    } catch (err) {
      log.warn(`Failed to write ${filePath}: ${err.message}`);
    }
  }
  
  log.success('Installed for Windsurf');
  if (counters.skipped > 0) {
    log.dim(`Skipped ${counters.skipped} file(s) - already exist`);
  }
  return counters;
}

/**
 * Uninstall Windsurf integration (remove generated files)
 * @param {string} targetDir - Target project directory
 */
async function uninstallWindsurf(targetDir) {
  const windsurfAgentfileDir = path.join(targetDir, '.windsurf', 'workflows', 'agentfile');
  const windsurfWorkflowsDir = path.join(targetDir, '.windsurf', 'workflows');
  
  // Delete files in .windsurf/workflows/agentfile/
  if (existsSync(windsurfAgentfileDir)) {
    const result = await readdirAsync(windsurfAgentfileDir);
    if (result.success) {
      for (const file of result.files) {
        // Delete all files in agentfile directory (complete uninstall)
        const filePath = path.join(windsurfAgentfileDir, file);
        const deleteResult = await deleteFileAsync(filePath);
        if (!deleteResult.success) {
          log.warn(`Failed to delete ${filePath}: ${deleteResult.error?.message}`);
        }
      }
    }
    
    // Remove empty agentfile directory
    try {
      const fs = require('fs');
      const remaining = await readdirAsync(windsurfAgentfileDir);
      if (remaining.success && remaining.files.length === 0) {
        fs.rmdirSync(windsurfAgentfileDir);
      }
    } catch (e) {
      // ignore errors when removing directory
    }
  }
  
  // Check if workflows directory is now empty and remove it too
  try {
    const fs = require('fs');
    const remaining = await readdirAsync(windsurfWorkflowsDir);
    if (remaining.success && remaining.files.length === 0) {
      fs.rmdirSync(windsurfWorkflowsDir);
    }
  } catch (e) {
    // ignore errors when removing directory
  }
  
  log.success('Uninstalled Windsurf');
}

module.exports = {
  installWindsurf,
  uninstallWindsurf,
};
