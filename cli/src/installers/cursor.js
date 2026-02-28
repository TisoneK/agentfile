'use strict';

const path = require('path');
const { ensureDirAsync, existsSync, deleteFile, readdirAsync, deleteFileAsync } = require('../../../src/js-utils/file-ops');
const { log, writeFile } = require('../lib/utils');

/**
 * Install Cursor integration
 * Generates .cursor/commands/ with wrapper files pointing to .agentfile/
 * Idempotent: only creates files if they don't exist (preserves user customizations)
 * @param {string} targetDir - Target project directory
 * @param {string} agentfileDir - Relative path to .agentfile/ directory
 */
async function installCursor(targetDir, agentfileDir) {
  const cursorDir = path.join(targetDir, '.cursor', 'commands', 'agentfile');
  
  // Idempotency counters
  const counters = { preserved: 0, added: 0, skipped: 0 };
  
  // Ensure directory exists
  const dirResult = await ensureDirAsync(cursorDir);
  if (!dirResult.success) {
    log.warn(`Failed to create .cursor/commands/: ${dirResult.error?.message}`);
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
    const content = `---
description: '${cmd.desc}'
---

# agentfile:${cmd.id}

Read the entire command definition at ${agentfileDir}/${cmd.source}

Follow all instructions in the command definition exactly as written.
`;
    
    const filePath = path.join(cursorDir, `agentfile-${cmd.id}.md`);
    
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
  
  log.success('Installed for Cursor');
  if (counters.skipped > 0) {
    log.dim(`Skipped ${counters.skipped} file(s) - already exist`);
  }
  return counters;
}

/**
 * Uninstall Cursor integration (remove generated files)
 * @param {string} targetDir - Target project directory
 */
async function uninstallCursor(targetDir) {
  const cursorAgentfileDir = path.join(targetDir, '.cursor', 'commands', 'agentfile');
  const cursorCommandsDir = path.join(targetDir, '.cursor', 'commands');
  
  // Delete files in .cursor/commands/agentfile/
  if (existsSync(cursorAgentfileDir)) {
    const result = await readdirAsync(cursorAgentfileDir);
    if (result.success) {
      for (const file of result.files) {
        // Delete all files in agentfile directory (complete uninstall)
        const filePath = path.join(cursorAgentfileDir, file);
        const deleteResult = await deleteFileAsync(filePath);
        if (!deleteResult.success) {
          log.warn(`Failed to delete ${filePath}: ${deleteResult.error?.message}`);
        }
      }
    }
    
    // Remove empty agentfile directory
    try {
      const fs = require('fs');
      const remaining = await readdirAsync(cursorAgentfileDir);
      if (remaining.success && remaining.files.length === 0) {
        fs.rmdirSync(cursorAgentfileDir);
      }
    } catch (e) {
      // ignore errors when removing directory
    }
  }
  
  // Check if commands directory is now empty and remove it too
  try {
    const fs = require('fs');
    const remaining = await readdirAsync(cursorCommandsDir);
    if (remaining.success && remaining.files.length === 0) {
      fs.rmdirSync(cursorCommandsDir);
    }
  } catch (e) {
    // ignore errors when removing directory
  }
  
  log.success('Uninstalled Cursor');
}

module.exports = {
  installCursor,
  uninstallCursor,
};
