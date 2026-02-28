'use strict';

const path = require('path');
const { ensureDirAsync, copyFileAsync, existsSync, readdirAsync } = require('../../../src/js-utils/file-ops');
const { log } = require('../lib/utils');

/**
 * IDE Installer Orchestrator
 * Manages installation of IDE-specific wrapper files for agentfile integration
 * 
 * @module installers
 */

// IDE installer modules
const windsurf = require('./windsurf');
const cursor = require('./cursor');
const kilocode = require('./kilocode');
const githubCopilot = require('./github-copilot');
const cline = require('./cline');
const vscode = require('./vscode');

/**
 * Map of IDE IDs to their installer functions
 * @type {Object.<string, function>}
 */
const installers = {
  windsurf: windsurf.installWindsurf,
  cursor: cursor.installCursor,
  kilocode: kilocode.installKiloCode,
  'github-copilot': githubCopilot.installGitHubCopilot,
  cline: cline.installCline,
  vscode: vscode.installVSCode,
};

/**
 * Map of IDE IDs to their uninstaller functions
 * @type {Object.<string, function>}
 */
const uninstallers = {
  windsurf: windsurf.uninstallWindsurf,
  cursor: cursor.uninstallCursor,
  kilocode: kilocode.uninstallKiloCode,
  'github-copilot': githubCopilot.uninstallGitHubCopilot,
  cline: cline.uninstallCline,
  vscode: vscode.uninstallVSCode,
};

/**
 * Install IDE wrappers for selected IDEs
 * @param {string} targetDir - Target project directory
 * @param {string} agentfileDir - Path to .agentfile/ directory
 * @param {string[]} ides - Array of IDE IDs to install
 * @returns {Object} Result with success status and installed IDEs
 */
async function installIdes(targetDir, agentfileDir, ides) {
  const results = {
    success: true,
    installed: [],
    failed: [],
    idempotency: {
      preserved: 0,
      added: 0,
    },
  };

  // Calculate relative path from targetDir to agentfileDir
  const relativeAgentfileDir = path.relative(targetDir, agentfileDir);

  for (const ideId of ides) {
    const installer = installers[ideId];
    
    if (!installer) {
      log.warn(`No installer found for IDE: ${ideId}`);
      results.failed.push({ ide: ideId, reason: 'No installer available' });
      continue;
    }

    try {
      // Use relative path for the wrapper files
      const counters = await installer(targetDir, relativeAgentfileDir);
      results.installed.push(ideId);
      
      // Aggregate idempotency counters
      if (counters) {
        results.idempotency.preserved += counters.preserved || 0;
        results.idempotency.added += counters.added || 0;
      }
    } catch (error) {
      log.error(`Failed to install ${ideId}: ${error.message}`);
      results.failed.push({ ide: ideId, reason: error.message });
      results.success = false;
    }
  }

  return results;
}

/**
 * Uninstall IDE wrappers for selected IDEs
 * @param {string} targetDir - Target project directory
 * @param {string[]} ides - Array of IDE IDs to uninstall
 * @returns {Object} Result with success status and uninstalled IDEs
 */
async function uninstallIdes(targetDir, ides) {
  const results = {
    success: true,
    uninstalled: [],
    failed: [],
  };

  for (const ideId of ides) {
    const uninstaller = uninstallers[ideId];
    
    if (!uninstaller) {
      log.warn(`No uninstaller found for IDE: ${ideId} (not supported)`);
      results.failed.push({ ide: ideId, reason: 'IDE not supported for uninstall' });
      continue;
    }

    try {
      await uninstaller(targetDir);
      results.uninstalled.push(ideId);
    } catch (error) {
      log.error(`Failed to uninstall ${ideId}: ${error.message}`);
      results.failed.push({ ide: ideId, reason: error.message });
      results.success = false;
    }
  }

  return results;
}

/**
 * Check which IDE wrappers are installed
 * @param {string} targetDir - Target project directory
 * @returns {string[]} Array of IDE IDs that have wrappers installed
 */
function getInstalledIdes(targetDir) {
  const installed = [];
  
  const idePaths = {
    windsurf: path.join(targetDir, '.windsurf', 'workflows'),
    cursor: path.join(targetDir, '.cursor', 'commands'),
    kilocode: path.join(targetDir, '.kilocode', 'rules'),
    'github-copilot': path.join(targetDir, '.github', 'prompts'),
    cline: path.join(targetDir, '.clinerules'),
    vscode: path.join(targetDir, '.vscode', 'agentfile'),
  };

  for (const [ideId, idePath] of Object.entries(idePaths)) {
    if (existsSync(idePath)) {
      installed.push(ideId);
    }
  }

  return installed;
}

module.exports = {
  installIdes,
  uninstallIdes,
  getInstalledIdes,
  installers,
  uninstallers,
};
