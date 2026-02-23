'use strict';

const fs    = require('fs');
const path  = require('path');
const chalk = require('chalk');
const { log, findProjectRoot, findWorkflow } = require('../lib/utils');

module.exports = async function retry(workflowName, stepId, opts) {
  const projectRoot = findProjectRoot();
  if (!projectRoot) { log.error('No Agentfile project found.'); process.exit(1); }

  const workflow = findWorkflow(projectRoot, workflowName);
  if (!workflow) { log.error(`Workflow "${workflowName}" not found.`); process.exit(1); }

  const stateFile = findStateFile(workflow.path, opts.run);
  if (!stateFile) {
    log.error(`No execution state found for "${workflowName}".`);
    process.exit(1);
  }

  const state = JSON.parse(fs.readFileSync(stateFile, 'utf8'));
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
  fs.writeFileSync(stateFile, JSON.stringify(state, null, 2), 'utf8');

  log.success(`Step "${stepId}" (and all subsequent steps) reset to pending.`);
  console.log('');
  log.info(`Resume: ${chalk.cyan(`agentfile resume ${workflowName}`)}`);
  console.log('');
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
  return candidates.sort().reverse()[0] || null;
}
