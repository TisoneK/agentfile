'use strict';

const fs   = require('fs');
const path = require('path');
const os   = require('os');
const chalk = require('chalk');
const { log } = require('../lib/utils');

// Config file location
const CONFIG_DIR = path.join(os.homedir(), '.agentfile');
const CONFIG_FILE = path.join(CONFIG_DIR, 'config.json');

// Default config
const DEFAULT_CONFIG = {
  apiKey: null,
  model: 'claude-sonnet-4-6',
  defaultShell: null, // null = auto-detect
};

// Load config from file
function loadConfig() {
  try {
    if (fs.existsSync(CONFIG_FILE)) {
      const content = fs.readFileSync(CONFIG_FILE, 'utf8');
      return { ...DEFAULT_CONFIG, ...JSON.parse(content) };
    }
  } catch (err) {
    log.warn('Config file corrupted, using defaults');
  }
  return DEFAULT_CONFIG;
}

// Save config to file
function saveConfig(config) {
  try {
    if (!fs.existsSync(CONFIG_DIR)) {
      fs.mkdirSync(CONFIG_DIR, { recursive: true });
    }
    fs.writeFileSync(CONFIG_FILE, JSON.stringify(config, null, 2));
    return true;
  } catch (err) {
    log.error(`Failed to save config: ${err.message}`);
    return false;
  }
}

// Show current config
function showConfig() {
  const config = loadConfig();
  
  console.log(chalk.bold('\n  Agentfile Configuration'));
  console.log(chalk.gray(`  Config file: ${CONFIG_FILE}`));
  console.log('');
  
  console.log(chalk.bold('  Settings:'));
  console.log(`  API Key:    ${config.apiKey ? '***' + config.apiKey.slice(-4) : chalk.red('not set')}`);
  console.log(`  Model:      ${config.model || chalk.gray('default')}`);
  console.log(`  Shell:      ${config.defaultShell || chalk.gray('auto-detect')}`);
  console.log('');
}

// Set a config value
function setConfig(key, value) {
  const config = loadConfig();
  
  switch (key) {
    case 'api-key':
    case 'apiKey':
      config.apiKey = value;
      break;
    case 'model':
      config.model = value;
      break;
    case 'shell':
      if (!['bash', 'pwsh'].includes(value)) {
        log.error('Shell must be "bash" or "pwsh"');
        return false;
      }
      config.defaultShell = value;
      break;
    default:
      log.error(`Unknown config key: ${key}`);
      log.info('Available keys: api-key, model, shell');
      return false;
  }
  
  if (saveConfig(config)) {
    log.success(`Set ${key} = ${key === 'api-key' ? '***' + value.slice(-4) : value}`);
    return true;
  }
  return false;
}

// Remove a config value
function unsetConfig(key) {
  const config = loadConfig();
  
  switch (key) {
    case 'api-key':
    case 'apiKey':
      config.apiKey = null;
      break;
    case 'model':
      config.model = DEFAULT_CONFIG.model;
      break;
    case 'shell':
      config.defaultShell = null;
      break;
    default:
      log.error(`Unknown config key: ${key}`);
      log.info('Available keys: api-key, model, shell');
      return false;
  }
  
  if (saveConfig(config)) {
    log.success(`Unset ${key}`);
    return true;
  }
  return false;
}

module.exports = async function config(action, key, value) {
  // No arguments = show config
  if (!action) {
    showConfig();
    return;
  }
  
  switch (action) {
    case 'show':
      showConfig();
      break;
    case 'set':
      if (!key || !value) {
        log.error('Usage: agentfile config set <key> <value>');
        log.info('Available keys: api-key, model, shell');
        process.exit(1);
      }
      setConfig(key, value);
      break;
    case 'unset':
      if (!key) {
        log.error('Usage: agentfile config unset <key>');
        log.info('Available keys: api-key, model, shell');
        process.exit(1);
      }
      unsetConfig(key);
      break;
    default:
      log.error(`Unknown action: ${action}`);
      log.info('Available actions: show, set, unset');
      log.info('Usage: agentfile config [show|set|unset] [key] [value]');
      process.exit(1);
  }
};

// Export for other commands to use
module.exports.loadConfig = loadConfig;
