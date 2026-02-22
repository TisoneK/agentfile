'use strict';

const path   = require('path');
const chalk  = require('chalk');
const { execSync } = require('child_process');
const { log, findProjectRoot, findWorkflow } = require('../lib/utils');

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

  // ── Resolve API key & model ─────────────────────────────────────────────────
  const apiKey = opts.key || process.env.AGENT_API_KEY;
  const model  = opts.model || process.env.AGENT_MODEL || 'claude-sonnet-4-6';

  if (!apiKey) {
    log.error('No API key provided. Use --key or set AGENT_API_KEY.');
    process.exit(1);
  }

  // ── Resolve input ───────────────────────────────────────────────────────────
  const input = opts.input || process.env.AGENT_INPUT;
  if (!input) {
    log.error('No input provided. Use --input "your text" or set AGENT_INPUT.');
    process.exit(1);
  }

  // ── Resolve script ──────────────────────────────────────────────────────────
  const shell = opts.shell || 'bash';
  const scriptFile = shell === 'pwsh'
    ? path.join(workflow.path, 'scripts', 'run.ps1')
    : path.join(workflow.path, 'scripts', 'run.sh');

  const fs = require('fs');
  if (!fs.existsSync(scriptFile)) {
    log.error(`Runtime script not found: ${scriptFile}`);
    log.info(`Expected: workflows/${workflowName}/scripts/run.${shell === 'pwsh' ? 'ps1' : 'sh'}`);
    process.exit(1);
  }

  log.step(`Running workflow: ${chalk.bold(workflowName)}`);
  log.dim(`Script:  ${scriptFile}`);
  log.dim(`Shell:   ${shell}`);
  log.dim(`Model:   ${model}`);
  log.dim(`Input:   ${input.length > 60 ? input.slice(0, 60) + '...' : input}`);
  console.log('');

  // ── Execute ─────────────────────────────────────────────────────────────────
  const cmd = shell === 'pwsh'
    ? `pwsh "${scriptFile}"`
    : `bash "${scriptFile}"`;

  try {
    execSync(cmd, {
      env: {
        ...process.env,
        AGENT_API_KEY: apiKey,
        AGENT_MODEL:   model,
        AGENT_INPUT:   input,
      },
      stdio: 'inherit',
      cwd: workflow.path,
    });
  } catch (err) {
    log.error(`Workflow "${workflowName}" exited with an error.`);
    process.exit(err.status || 1);
  }
};
