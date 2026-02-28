'use strict';

const path  = require('path');
const chalk = require('chalk');
const fileOps = require('../../../src/js-utils/file-ops');
const { log, findProjectRoot, findWorkflow, findStateFile } = require('../lib/utils');

module.exports = async function retry(workflowName, stepId, opts) {
  const projectRoot = findProjectRoot();
  if (!projectRoot) { log.error('No Agentfile project found.'); process.exit(1); }

  const workflow = findWorkflow(projectRoot, workflowName);
  if (!workflow) { log.error(`Workflow "${workflowName}" not found.`); process.exit(1); }

  const stateFile = findStateFile(workflow.path, opts.run, { anyStatus: true });
  if (!stateFile) {
    log.error(`No execution state found for "${workflowName}".`);
    process.exit(1);
  }

  const readResult = fileOps.readFile(stateFile);
  if (!readResult.success) {
    log.error(`Failed to read state file: ${readResult.error.message}`);
    process.exit(1);
  }
  const state = JSON.parse(readResult.content);
  const step  = state.steps.find(s => s.id === stepId);

  if (!step) {
    log.error(`Step "${stepId}" not found.`);
    log.info('Available steps: ' + state.steps.map(s => s.id).join(', '));
    process.exit(1);
  }

  // Reset the step and all steps after it to pending
  let reset = false;
  for (const s of state.steps) {
    if (s.id === stepId) reset = true;
    if (reset) {
      s.status       = 'pending';
      s.error        = null;
      s.started_at   = null;
      s.completed_at = null;
      s.artifact     = null;
    }
  }

  state.status     = 'running';
  state.updated_at = new Date().toISOString();
  const writeResult = fileOps.writeFile(stateFile, JSON.stringify(state, null, 2));
  if (!writeResult.success) {
    log.error(`Failed to write state file: ${writeResult.error.message}`);
    process.exit(1);
  }

  log.success(`Step "${stepId}" (and all subsequent steps) reset to pending.`);
  console.log('');
  log.info(`Resume: ${chalk.cyan(`agentfile resume ${workflowName}`)}`);
  console.log('');
};
