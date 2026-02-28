'use strict';

const path  = require('path');
const chalk = require('chalk');
const fileOps = require('../../../src/js-utils/file-ops');
const { log, findProjectRoot, findWorkflow, findStateFile } = require('../lib/utils');

// ── approve ────────────────────────────────────────────────────────────────────
// Approves a gated step, updates execution-state.json, and prints resume hint.
// No shell exec, no API key required.
// ──────────────────────────────────────────────────────────────────────────────

module.exports = async function approve(workflowName, stepId, opts) {
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
    log.error(`Step "${stepId}" not found in workflow "${workflowName}".`);
    log.info('Available steps: ' + state.steps.map(s => s.id).join(', '));
    process.exit(1);
  }

  if (step.status !== 'awaiting_approval') {
    log.error(`Step "${stepId}" is not awaiting approval (current status: ${step.status})`);
    process.exit(1);
  }

  // Show artifact preview if available
  const runId = path.basename(path.dirname(stateFile));
  if (step.artifact) {
    const artifactPath = path.join(workflow.path, 'outputs', runId, step.artifact);
    if (fileOps.existsSync(artifactPath)) {
      console.log('');
      console.log(chalk.gray(`  ── ${path.relative(projectRoot, artifactPath)} ──`));
      console.log('');
      const contentResult = fileOps.readFile(artifactPath);
      if (contentResult.success) {
        const content = contentResult.content;
        console.log(content.length > 2000 ? content.slice(0, 2000) + '\n... (truncated)' : content);
      }
      console.log('');
    }
  }

  // Update state: awaiting_approval → approved
  const now        = new Date().toISOString();
  step.status      = 'approved';
  step.approved_at = now;
  state.status     = 'running';
  state.updated_at = now;
  const writeResult = fileOps.writeFile(stateFile, JSON.stringify(state, null, 2) + '\n');
  if (!writeResult.success) {
    log.error(`Failed to write state file: ${writeResult.error.message}`);
    process.exit(1);
  }

  log.success(`Step "${stepId}" approved.`);
  console.log('');

  // Find next pending step
  const nextStep = state.steps.find(s => s.status === 'pending');
  if (nextStep) {
    console.log(`  Next step: ${chalk.bold(nextStep.id)}`);
    console.log('');
    console.log('  Continue in your IDE agent, or check status:');
    console.log(chalk.cyan(`    agentfile status ${workflowName}`));
  } else {
    const allDone = state.steps.every(s => s.status === 'completed' || s.status === 'approved');
    if (allDone) {
      console.log(chalk.green('  All steps complete.'));
      console.log(`  Outputs: ${chalk.gray(path.join(workflow.path, 'outputs', runId))}`);
    } else {
      console.log('  Continue in your IDE agent:');
      console.log(chalk.cyan(`    agentfile status ${workflowName}`));
    }
  }
  console.log('');
};
