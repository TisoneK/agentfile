'use strict';

const fs    = require('fs');
const path  = require('path');
const chalk = require('chalk');
const { log, findProjectRoot, findWorkflow } = require('../lib/utils');

module.exports = async function status(workflowName, opts) {
  const projectRoot = findProjectRoot();
  if (!projectRoot) { log.error('No Agentfile project found.'); process.exit(1); }

  const workflow = findWorkflow(projectRoot, workflowName);
  if (!workflow) { log.error(`Workflow "${workflowName}" not found.`); process.exit(1); }

  const stateFile = findStateFile(workflow.path, opts.run);
  if (!stateFile) {
    log.info(`No execution state found for "${workflowName}".`);
    log.info(`Start a run: ${chalk.cyan(`agentfile run ${workflowName} --input "..."`)} `);
    process.exit(0);
  }

  const state = JSON.parse(fs.readFileSync(stateFile, 'utf8'));
  const runId = path.basename(path.dirname(stateFile));

  console.log('');
  console.log(chalk.bold.cyan('  ╔══════════════════════════════════════════════════════╗'));
  console.log(chalk.bold.cyan(`  ║  Workflow: ${padEnd(workflowName, 42)}║`));
  console.log(chalk.bold.cyan('  ╚══════════════════════════════════════════════════════╝'));
  console.log('');
  console.log(`  ${chalk.gray('Run ID:')}       ${runId}`);
  console.log(`  ${chalk.gray('Status:')}       ${statusBadge(state.status)}`);
  console.log(`  ${chalk.gray('Started:')}      ${state.started_at}`);
  console.log(`  ${chalk.gray('Input:')}        ${truncate(state.input, 60)}`);
  console.log(`  ${chalk.gray('Current step:')} ${state.current_step || '—'}`);
  console.log('');
  console.log(`  ${chalk.gray('Steps:')}`);

  for (const step of state.steps) {
    const icon  = stepIcon(step.status);
    const color = stepColor(step.status);
    const artifact = step.artifact ? chalk.gray(` → ${step.artifact}`) : '';
    console.log(`    ${color(icon)} ${step.id} ${chalk.gray(`[${step.status}]`)}${artifact}`);
    if (step.error) console.log(`      ${chalk.red('↳ ERROR:')} ${step.error}`);
    if (step.custom && Object.keys(step.custom).length) {
      for (const [k, v] of Object.entries(step.custom)) {
        console.log(`      ${chalk.gray(`${k}:`)} ${v}`);
      }
    }
  }

  console.log('');

  // Next action hint
  switch (state.status) {
    case 'awaiting_approval': {
      const gateStep = state.steps.find(s => s.status === 'awaiting_approval');
      console.log(`  ${chalk.yellow('⏸')}  Awaiting approval for: ${chalk.bold(gateStep?.id)}`);
      if (gateStep?.artifact) {
        console.log(`     Output: ${path.join(workflow.path, 'outputs', runId, gateStep.artifact)}`);
      }
      console.log(`     Approve: ${chalk.cyan(`agentfile approve ${workflowName} ${gateStep?.id}`)}`);
      break;
    }
    case 'failed': {
      const failStep = state.steps.find(s => s.status === 'failed');
      console.log(`  ${chalk.red('✗')}  Failed at: ${chalk.bold(failStep?.id)}`);
      console.log(`     Retry: ${chalk.cyan(`agentfile retry ${workflowName} ${failStep?.id}`)}`);
      break;
    }
    case 'running':
      console.log(`  ${chalk.blue('▶')}  Workflow is running...`);
      break;
    case 'completed':
      console.log(`  ${chalk.green('✓')}  Completed successfully.`);
      console.log(`     Outputs: ${path.join(workflow.path, 'outputs', runId)}`);
      break;
  }

  if (state.errors && state.errors.length) {
    console.log('');
    console.log(`  ${chalk.red('Errors:')}`);
    for (const e of state.errors) {
      console.log(`    ${chalk.gray(e.at)} ${chalk.red(e.step)}: ${e.error}`);
    }
  }

  console.log('');
};

// ── Helpers ───────────────────────────────────────────────────────────────────

function findStateFile(workflowPath, runId) {
  const outputsDir = path.join(workflowPath, 'outputs');
  if (!fs.existsSync(outputsDir)) return null;

  if (runId) {
    const f = path.join(outputsDir, runId, 'execution-state.json');
    return fs.existsSync(f) ? f : null;
  }

  // Most recent run
  const candidates = [];
  for (const entry of fs.readdirSync(outputsDir)) {
    const f = path.join(outputsDir, entry, 'execution-state.json');
    if (fs.existsSync(f)) candidates.push(f);
  }
  return candidates.sort().reverse()[0] || null;
}

function statusBadge(s) {
  const map = {
    running:            chalk.blue('running'),
    completed:          chalk.green('completed'),
    failed:             chalk.red('failed'),
    awaiting_approval:  chalk.yellow('awaiting_approval'),
  };
  return map[s] || chalk.gray(s);
}

function stepIcon(s) {
  return { completed: '✓', in_progress: '▶', awaiting_approval: '⏸', failed: '✗', approved: '✓' }[s] || '○';
}

function stepColor(s) {
  return { completed: chalk.green, in_progress: chalk.blue, awaiting_approval: chalk.yellow,
           failed: chalk.red, approved: chalk.green }[s] || chalk.gray;
}

function truncate(s, n) { return s && s.length > n ? s.slice(0, n) + '...' : (s || ''); }
function padEnd(s, n)   { return s.length >= n ? s.slice(0, n) : s + ' '.repeat(n - s.length); }
