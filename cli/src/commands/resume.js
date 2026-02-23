'use strict';

const fs    = require('fs');
const path  = require('path');
const chalk = require('chalk');
const { execSync } = require('child_process');
const { log, findProjectRoot, findWorkflow } = require('../lib/utils');
const { loadConfig } = require('./config');

module.exports = async function resume(workflowName, opts) {
  const projectRoot = findProjectRoot();
  if (!projectRoot) { log.error('No Agentfile project found.'); process.exit(1); }

  const workflow = findWorkflow(projectRoot, workflowName);
  if (!workflow) { log.error(`Workflow "${workflowName}" not found.`); process.exit(1); }

  const stateFile = findStateFile(workflow.path, opts.run);
  if (!stateFile) {
    log.error(`No incomplete run found for "${workflowName}".`);
    log.info(`Start a new run: ${chalk.cyan(`agentfile run ${workflowName} --input "..."`)}`);
    process.exit(1);
  }

  const state = JSON.parse(fs.readFileSync(stateFile, 'utf8'));
  const runId = path.basename(path.dirname(stateFile));

  if (state.status === 'completed') {
    log.info(`Run ${runId} is already completed.`);
    log.info(`Outputs: ${path.join(workflow.path, 'outputs', runId)}`);
    process.exit(0);
  }

  if (state.status === 'awaiting_approval') {
    const gateStep = state.steps.find(s => s.status === 'awaiting_approval');
    log.warn(`Run ${runId} is awaiting approval for step: ${chalk.bold(gateStep?.id)}`);
    log.info(`Approve first: ${chalk.cyan(`agentfile approve ${workflowName} ${gateStep?.id}`)}`);
    process.exit(1);
  }

  const config = loadConfig();
  const apiKey = opts.key
    || process.env.ANTHROPIC_API_KEY
    || process.env.AGENT_API_KEY
    || config.apiKey;

  if (!apiKey) {
    log.error('No API key found. Set ANTHROPIC_API_KEY or use "agentfile config set api-key <key>"');
    process.exit(1);
  }

  const os = require('os');
  const shell = opts.shell || config.defaultShell || (os.platform() === 'win32' ? 'pwsh' : 'bash');
  const scriptFile = shell === 'pwsh'
    ? path.join(workflow.path, 'scripts', 'cli', 'run.ps1')
    : path.join(workflow.path, 'scripts', 'cli', 'run.sh');

  if (!fs.existsSync(scriptFile)) {
    log.error(`Run script not found: ${scriptFile}`);
    process.exit(1);
  }

  log.step(`Resuming workflow: ${chalk.bold(workflowName)}`);
  log.dim(`Run ID: ${runId}`);
  log.dim(`Script: ${scriptFile}`);
  console.log('');

  const cmd = shell === 'pwsh'
    ? `pwsh -ExecutionPolicy Bypass "${scriptFile}" --resume ${runId}`
    : `bash "${scriptFile}" --resume ${runId}`;

  try {
    execSync(cmd, {
      env: { ...process.env, ANTHROPIC_API_KEY: apiKey, AGENT_API_KEY: apiKey },
      stdio: 'inherit',
      cwd: workflow.path,
    });
  } catch (err) {
    log.error('Resume failed.');
    log.info(`Check status: ${chalk.cyan(`agentfile status ${workflowName}`)}`);
    process.exit(err.status || 1);
  }
};

function findStateFile(workflowPath, runId) {
  const outputsDir = path.join(workflowPath, 'outputs');
  if (!fs.existsSync(outputsDir)) return null;
  if (runId) {
    const f = path.join(outputsDir, runId, 'execution-state.json');
    return fs.existsSync(f) ? f : null;
  }
  const candidates = [];
  for (const entry of fs.readdirSync(outputsDir)) {
    const f = path.join(outputsDir, entry, 'execution-state.json');
    if (fs.existsSync(f)) candidates.push(f);
  }
  // Return most recent non-completed run
  return candidates.sort().reverse().find(f => {
    try {
      const s = JSON.parse(fs.readFileSync(f, 'utf8'));
      return s.status !== 'completed';
    } catch { return false; }
  }) || null;
}
