'use strict';

const path = require('path');
const { ensureDirAsync, existsSync, deleteFile, readdirAsync, deleteFileAsync } = require('../../../src/js-utils/file-ops');
const { log, writeFile } = require('../lib/utils');

/**
 * Install GitHub Copilot integration
 * Generates .github/prompts/ with prompt files pointing to .agentfile/
 * Idempotent: only creates files if they don't exist (preserves user customizations)
 * @param {string} targetDir - Target project directory
 * @param {string} agentfileDir - Relative path to .agentfile/ directory
 */
async function installGitHubCopilot(targetDir, agentfileDir) {
  const promptsDir = path.join(targetDir, '.github', 'prompts', 'agentfile');
  
  // Idempotency counters
  const counters = { preserved: 0, added: 0, skipped: 0 };
  
  // Ensure directory exists
  const dirResult = await ensureDirAsync(promptsDir);
  if (!dirResult.success) {
    log.warn(`Failed to create .github/prompts/: ${dirResult.error?.message}`);
    return counters;
  }
  
  // Command definitions in .agentfile/
  const commands = [
    { id: 'run', source: 'run.md', desc: 'Run an existing workflow', instructions: 'Execute the workflow using agentfile CLI commands' },
    { id: 'create', source: 'create.md', desc: 'Create a new workflow', instructions: 'Use the workflow-creator pipeline' },
    { id: 'list', source: 'list.md', desc: 'List all available workflows', instructions: 'Scan workflows/ directory and display available workflows' },
    { id: 'validate', source: 'validate.md', desc: 'Validate a workflow', instructions: 'Check workflow.yaml against schema before execution' },
  ];
  
  for (const cmd of commands) {
    const content = `# agentfile:${cmd.id}

## Description
${cmd.desc}

## Instructions
${cmd.instructions}

## Command Definition
Read the full command definition at: ${agentfileDir}/${cmd.source}

Follow all instructions in the command definition exactly as written.
`;
    
    const filePath = path.join(promptsDir, `agentfile-${cmd.id}.prompt.md`);
    
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
  
  log.success('Installed for GitHub Copilot');
  if (counters.skipped > 0) {
    log.dim(`Skipped ${counters.skipped} file(s) - already exist`);
  }
  return counters;
}

/**
 * Uninstall GitHub Copilot integration (remove generated files)
 * @param {string} targetDir - Target project directory
 */
async function uninstallGitHubCopilot(targetDir) {
  const promptsAgentfileDir = path.join(targetDir, '.github', 'prompts', 'agentfile');
  const promptsDir = path.join(targetDir, '.github', 'prompts');
  
  // Delete files in .github/prompts/agentfile/
  if (existsSync(promptsAgentfileDir)) {
    const result = await readdirAsync(promptsAgentfileDir);
    if (result.success) {
      for (const file of result.files) {
        if (file.startsWith('agentfile-')) {
          const filePath = path.join(promptsAgentfileDir, file);
          const deleteResult = await deleteFileAsync(filePath);
          if (!deleteResult.success) {
            log.warn(`Failed to delete ${filePath}: ${deleteResult.error?.message}`);
          }
        }
      }
    }
    
    // Remove empty agentfile directory
    try {
      const fs = require('fs');
      const remaining = await readdirAsync(promptsAgentfileDir);
      if (remaining.success && remaining.files.length === 0) {
        fs.rmdirSync(promptsAgentfileDir);
      }
    } catch (e) {
      // ignore errors when removing directory
    }
  }
  
  log.success('Uninstalled GitHub Copilot');
}

module.exports = {
  installGitHubCopilot,
  uninstallGitHubCopilot,
};
