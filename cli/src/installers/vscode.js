'use strict';

const path = require('path');
const { ensureDirAsync, existsSync, readdirAsync, deleteFileAsync } = require('../../../src/js-utils/file-ops');
const { log, writeFile } = require('../lib/utils');

/**
 * Install VS Code integration
 * Generates .vscode/agentfile/tasks.json with agentfile tasks
 * Idempotent: only creates files if they don't exist (preserves user customizations)
 * @param {string} targetDir - Target project directory
 * @param {string} agentfileDir - Relative path to .agentfile/ directory
 */
async function installVSCode(targetDir, agentfileDir) {
  const vscodeDir = path.join(targetDir, '.vscode', 'agentfile');
  
  // Idempotency counters
  const counters = { preserved: 0, added: 0, skipped: 0 };
  
  // Ensure directory exists
  const dirResult = await ensureDirAsync(vscodeDir);
  if (!dirResult.success) {
    log.warn(`Failed to create .vscode/agentfile/: ${dirResult.error?.message}`);
    return counters;
  }
  
  // Generate tasks.json for VS Code
  const tasksJson = {
    "version": "2.0.0",
    "tasks": [
      {
        "label": "agentfile: run",
        "type": "shell",
        "command": "agentfile run ${input:workflowName}",
        "problemMatcher": [],
        "group": {
          "kind": "build",
          "isDefault": false
        }
      },
      {
        "label": "agentfile: create",
        "type": "shell",
        "command": "agentfile create ${input:workflowName}",
        "problemMatcher": [],
        "group": {
          "kind": "build",
          "isDefault": false
        }
      },
      {
        "label": "agentfile: list",
        "type": "shell",
        "command": "agentfile list",
        "problemMatcher": []
      },
      {
        "label": "agentfile: validate",
        "type": "shell",
        "command": "agentfile validate ${input:workflowName}",
        "problemMatcher": [],
        "group": {
          "kind": "test",
          "isDefault": false
        }
      }
    ],
    "inputs": [
      {
        "id": "workflowName",
        "type": "promptString",
        "description": "Enter workflow name"
      }
    ]
  };
  
  const filePath = path.join(vscodeDir, 'tasks.json');
  
  // Idempotent: skip if file already exists (preserve user customizations)
  if (existsSync(filePath)) {
    counters.preserved++;
    counters.skipped = 1;
    log.success('Installed for VS Code');
    log.dim('Skipped 1 file(s) - already exist');
    return counters;
  }
  
  try {
    writeFile(filePath, JSON.stringify(tasksJson, null, 2));
    counters.added++;
  } catch (err) {
    log.warn(`Failed to write ${filePath}: ${err.message}`);
  }
  
  log.success('Installed for VS Code');
  return counters;
}

/**
 * Uninstall VS Code integration (remove generated files)
 * @param {string} targetDir - Target project directory
 */
async function uninstallVSCode(targetDir) {
  const vscodeAgentfileDir = path.join(targetDir, '.vscode', 'agentfile');
  const vscodeDir = path.join(targetDir, '.vscode');
  
  // Delete files in .vscode/agentfile/
  if (existsSync(vscodeAgentfileDir)) {
    const result = await readdirAsync(vscodeAgentfileDir);
    if (result.success) {
      for (const file of result.files) {
        if (file === 'tasks.json') {
          const filePath = path.join(vscodeAgentfileDir, file);
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
      const remaining = await readdirAsync(vscodeAgentfileDir);
      if (remaining.success && remaining.files.length === 0) {
        fs.rmdirSync(vscodeAgentfileDir);
      }
    } catch (e) {
      // ignore errors when removing directory
    }
  }
  
  log.success('Uninstalled VS Code');
}

module.exports = {
  installVSCode,
  uninstallVSCode,
};
