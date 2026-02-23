'use strict';

const path   = require('path');
const fs     = require('fs');
const chalk  = require('chalk');
const { execSync } = require('child_process');
const { log, findProjectRoot, findWorkflow } = require('../lib/utils');
const { loadConfig } = require('./config');

module.exports = async function run(workflowName, opts) {
  const projectRoot = findProjectRoot();
  if (!projectRoot) {
    log.error('No Agentfile project found. Run `agentfile init` first.');
    process.exit(1);
  }

  const workflow = findWorkflow(projectRoot, workflowName);
  if (!workflow) {
    log.error(`Workflow "${workflowName}" not found.`);
    log.info('Run `agentfile list` to see available workflows.');
    process.exit(1);
  }

  // ── Resolve API key & model ──────────────────────────────────────────────────
  const config = loadConfig();
  const apiKey = opts.key
    || process.env.ANTHROPIC_API_KEY
    || process.env.AGENT_API_KEY
    || config.apiKey;
  const model = opts.model || process.env.AGENT_MODEL || config.model || 'claude-sonnet-4-6';

  if (!apiKey) {
    log.error('No API key provided. Use --key, set ANTHROPIC_API_KEY, or run "agentfile config set api-key <key>"');
    process.exit(1);
  }

  // ── Resolve input ────────────────────────────────────────────────────────────
  const input = opts.input || process.env.AGENT_INPUT;
  if (!input && !opts.resume) {
    log.error('No input provided. Use --input "your text" or set AGENT_INPUT.');
    process.exit(1);
  }

  // ── Resolve shell ────────────────────────────────────────────────────────────
  const os = require('os');
  const isWindows = os.platform() === 'win32';
  const shell = opts.shell || config.defaultShell || (isWindows ? 'pwsh' : 'bash');

  // ── Resolve script path — scripts/cli/ is the correct location ──────────────
  const scriptFile = shell === 'pwsh'
    ? path.join(workflow.path, 'scripts', 'cli', 'run.ps1')
    : path.join(workflow.path, 'scripts', 'cli', 'run.sh');

  if (!fs.existsSync(scriptFile)) {
    log.error(`Runtime script not found: ${scriptFile}`);
    console.log('');
    log.info(chalk.bold('Expected location:'));
    log.info(`  workflows/${workflowName}/scripts/cli/run.${shell === 'pwsh' ? 'ps1' : 'sh'}`);
    console.log('');
    log.info(chalk.bold('Why this happened:'));
    log.info('  This workflow has no CLI execution scripts.');
    log.info('  It may be designed for IDE agents only, or was created before');
    log.info('  the scripts/cli/ structure was introduced.');
    console.log('');
    log.info(chalk.bold('Options:'));
    log.info('  1. Use an IDE agent: load workflow.yaml and follow scripts/ide/steps.md');
    log.info('  2. Re-generate with: agentfile create (uses workflow-creator)');
    process.exit(1);
  }

  // ── Build resume args ────────────────────────────────────────────────────────
  const resumeArgs = opts.resume
    ? `--resume ${opts.runId || ''}`
    : '';

  log.step(`Running workflow: ${chalk.bold(workflowName)}`);
  log.dim(`Script:  ${scriptFile}`);
  const shellSource = opts.shell ? 'explicit' : config.defaultShell ? 'config' : 'auto-detected';
  log.dim(`Shell:   ${shell} (${shellSource})`);
  log.dim(`Model:   ${model}`);
  if (input) log.dim(`Input:   ${input.length > 60 ? input.slice(0, 60) + '...' : input}`);
  if (opts.resume) log.dim(`Mode:    resume${opts.runId ? ` (run: ${opts.runId})` : ' (latest)'}`);
  console.log('');

  // ── Execute ──────────────────────────────────────────────────────────────────
  const cmd = shell === 'pwsh'
    ? `pwsh -ExecutionPolicy Bypass "${scriptFile}" ${resumeArgs}`
    : `bash "${scriptFile}" ${resumeArgs}`;

  try {
    execSync(cmd, {
      env: {
        ...process.env,
        ANTHROPIC_API_KEY: apiKey,
        AGENT_API_KEY:     apiKey,
        AGENT_MODEL:       model,
        AGENT_INPUT:       input || '',
      },
      stdio: 'inherit',
      cwd:   workflow.path,
    });
  } catch (err) {
    log.error(`Workflow "${workflowName}" exited with an error.`);
    log.info(`Check status:  ${chalk.cyan(`agentfile status ${workflowName}`)}`);
    log.info(`Resume:        ${chalk.cyan(`agentfile resume ${workflowName}`)}`);
    process.exit(err.status || 1);
  }
};
