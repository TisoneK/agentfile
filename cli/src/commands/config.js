'use strict';

const path  = require('path');
const os    = require('os');
const chalk = require('chalk');
const fileOps = require('../../../src/js-utils/file-ops');
const { log } = require('../lib/utils');

// ── config ─────────────────────────────────────────────────────────────────────
// Lightweight config store for user preferences.
// Note: The agentfile CLI does not call any LLM API — execution is handled
// entirely by the IDE agent. Config values here are informational/preference only.
// ──────────────────────────────────────────────────────────────────────────────

const CONFIG_DIR  = path.join(os.homedir(), '.agentfile');
const CONFIG_FILE = path.join(CONFIG_DIR, 'config.json');

const DEFAULT_CONFIG = {
  defaultEditor: null,  // hint for IDE instructions output (e.g. "cursor", "vscode")
};

function loadConfig() {
  try {
    if (fileOps.existsSync(CONFIG_FILE)) {
      const readResult = fileOps.readFile(CONFIG_FILE);
      if (readResult.success) {
        return { ...DEFAULT_CONFIG, ...JSON.parse(readResult.content) };
      }
    }
  } catch {
    log.warn('Config file corrupted, using defaults');
  }
  return { ...DEFAULT_CONFIG };
}

function saveConfig(config) {
  try {
    if (!fileOps.existsSync(CONFIG_DIR)) {
      const dirResult = fileOps.ensureDir(CONFIG_DIR);
      if (!dirResult.success) {
        throw new Error(dirResult.error.message);
      }
    }
    const writeResult = fileOps.writeFile(CONFIG_FILE, JSON.stringify(config, null, 2) + '\n');
    if (!writeResult.success) {
      throw new Error(writeResult.error.message);
    }
    return true;
  } catch (err) {
    log.error(`Failed to save config: ${err.message}`);
    return false;
  }
}

function showConfig() {
  const config = loadConfig();

  // Check for legacy config values and warn
  let legacyWarning = null;
  if (fileOps.existsSync(CONFIG_FILE)) {
    try {
      const readResult = fileOps.readFile(CONFIG_FILE);
      if (readResult.success) {
        const raw = JSON.parse(readResult.content);
        if (raw.apiKey || raw.model || raw.defaultShell) {
          legacyWarning = [];
          if (raw.apiKey) legacyWarning.push('apiKey');
          if (raw.model) legacyWarning.push('model');
          if (raw.defaultShell) legacyWarning.push('defaultShell');
        }
      }
    } catch { /* ignore parse errors, will use defaults */ }
  }

  console.log(chalk.bold('\n  Agentfile Configuration'));
  console.log(chalk.gray(`  Config file: ${CONFIG_FILE}`));
  console.log('');

  if (legacyWarning) {
    console.log(chalk.yellow('  ⚠ Legacy config values detected (no longer used):'));
    console.log(chalk.gray(`    ${legacyWarning.join(', ')}`));
    console.log(chalk.gray('    These are ignored — the CLI no longer calls any LLM API.'));
    console.log('');
  }

  console.log(chalk.bold('  Settings:'));
  console.log(`  Default editor: ${config.defaultEditor || chalk.gray('not set')}`);
  console.log('');
  console.log(chalk.gray('  Note: API keys and model selection are managed by your IDE agent,'));
  console.log(chalk.gray('  not by the agentfile CLI. The CLI performs no LLM calls.'));
  console.log('');
}

function setConfig(key, value) {
  const config = loadConfig();
  switch (key) {
    case 'default-editor':
    case 'defaultEditor':
      config.defaultEditor = value;
      break;
    case 'api-key':
    case 'apiKey':
      log.warn('api-key is no longer stored — the CLI does not call any LLM API.');
      return true;
    case 'model':
      log.warn('model is no longer stored — the CLI does not call any LLM API.');
      return true;
    case 'shell':
      log.warn('shell is no longer stored — the CLI does not call any LLM API.');
      return true;
    default:
      log.error(`Unknown config key: ${key}`);
      log.info('Available keys: default-editor');
      log.info('Note: api-key, model, and shell are no longer stored here — the CLI makes no LLM calls.');
      return false;
  }
  if (saveConfig(config)) { log.success(`Set ${key} = ${value}`); return true; }
  return false;
}

function unsetConfig(key) {
  const config = loadConfig();
  switch (key) {
    case 'default-editor':
    case 'defaultEditor':
      config.defaultEditor = null;
      break;
    case 'api-key':
    case 'apiKey':
      log.warn('api-key was never stored persistently.');
      return true;
    case 'model':
      log.warn('model is no longer stored — the CLI does not call any LLM API.');
      return true;
    case 'shell':
      log.warn('shell is no longer stored — the CLI does not call any LLM API.');
      return true;
    default:
      log.error(`Unknown config key: ${key}`);
      log.info('Available keys: default-editor');
      return false;
  }
  if (saveConfig(config)) { log.success(`Unset ${key}`); return true; }
  return false;
}

module.exports = async function config(action, key, value) {
  if (!action || action === 'show') { showConfig(); return; }

  switch (action) {
    case 'set':
      if (!key || !value) {
        log.error('Usage: agentfile config set <key> <value>');
        log.info('Available keys: default-editor');
        process.exit(1);
      }
      setConfig(key, value);
      break;
    case 'unset':
      if (!key) {
        log.error('Usage: agentfile config unset <key>');
        log.info('Available keys: default-editor');
        process.exit(1);
      }
      unsetConfig(key);
      break;
    default:
      log.error(`Unknown action: ${action}`);
      log.info('Available actions: show, set, unset');
      process.exit(1);
  }
};

module.exports.loadConfig = loadConfig;
