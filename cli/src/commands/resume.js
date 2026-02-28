'use strict';

const path  = require('path');
const chalk = require('chalk');
const fileOps = require('../../../src/js-utils/file-ops');
const { log, findProjectRoot, findWorkflow, findStateFile } = require('../lib/utils');

// ── resume ─────────────────────────────────────────────────────────────────────
// Shows resume instructions for an incomplete workflow run.
// Actual step execution is done by the IDE agent.
// No shell exec, no API key required.
// ──────────────────────────────────────────────────────────────────────────────

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

  const readResult = fileOps.readFile(stateFile);
  if (!readResult.success) {
    log.error(`Failed to read state file: ${readResult.error.message}`);
    process.exit(1);
  }
  const state = JSON.parse(readResult.content);
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

  const currentStep = state.steps.find(s => s.status === 'pending' || s.status === 'in_progress');

  log.step(`Resume: ${chalk.bold(workflowName)} (run: ${runId})`);
  console.log('');
  console.log(`  ${chalk.gray('Status:')}       ${state.status}`);

  if (currentStep) {
    console.log(`  ${chalk.gray('Current step:')} ${currentStep.id}`);
  } else if (state.status === 'completed') {
    console.log(`  ${chalk.gray('Status:')}       ${chalk.green('All steps completed')}`);
  } else {
    console.log(`  ${chalk.gray('Current step:')} ${chalk.yellow('No active step')}`);
    console.log(`  ${chalk.gray('State:')}         Check with agentfile status ${workflowName}`);
  }
  console.log('');
  console.log('  Load this run in your IDE agent to continue:');

  const ideInstructions = path.join(workflow.path, 'scripts', 'ide', 'instructions.md');
  if (fileOps.existsSync(ideInstructions)) {
    console.log(chalk.gray(`    ${path.relative(findProjectRoot(), ideInstructions)}`));
  }

  console.log('');
  console.log(`  Tell the agent: "Resume run ${runId} of ${workflowName}, starting from step ${currentStep?.id || 'next pending step'}."`);
  console.log('');
  console.log('  Check status:');
  console.log(chalk.cyan(`    agentfile status ${workflowName}`));
  console.log('');
};
