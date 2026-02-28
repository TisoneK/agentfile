'use strict';

const path  = require('path');
const chalk = require('chalk');
const fileOps = require('../../../src/js-utils/file-ops');
const { log, findProjectRoot, findWorkflow, writeFile } = require('../lib/utils');

// ── run ────────────────────────────────────────────────────────────────────────
// Initialises a new execution-state.json for a workflow run.
// The actual LLM work is done by the IDE agent.
// No shell exec, no API key required.
// ──────────────────────────────────────────────────────────────────────────────

module.exports = async function run(workflowName, opts) {
  const projectRoot = findProjectRoot();
  if (!projectRoot) { log.error('No Agentfile project found.'); process.exit(1); }

  const workflow = findWorkflow(projectRoot, workflowName);
  if (!workflow) {
    log.error(`Workflow "${workflowName}" not found.`);
    log.info('Run `agentfile list` to see available workflows.');
    process.exit(1);
  }

  if (opts.resume) {
    // Delegate to resume logic
    const cmdResume = require('./resume');
    return cmdResume(workflowName, { run: opts.runId });
  }

  const input = opts.input || process.env.AGENT_INPUT;
  if (!input) {
    log.error('No input provided. Use --input "your text" or set AGENT_INPUT.');
    process.exit(1);
  }

  // ── Load workflow.yaml to read steps ────────────────────────────────────────
  const yaml = require('js-yaml');
  const readResult = fileOps.readFile(workflow.yaml);
  if (!readResult.success) {
    log.error(`Failed to read workflow.yaml: ${readResult.error.message}`);
    process.exit(1);
  }
  const workflowYaml = yaml.load(readResult.content);
  const steps = (workflowYaml.steps || []).map(s => ({
    id:           s.id,
    name:         s.name || s.id,
    status:       'pending',
    started_at:   null,
    completed_at: null,
    artifact:     null,
    error:        null,
    custom:       {},
  }));

  // ── Create run directory and execution-state.json ───────────────────────────
  const now   = new Date();
  const runId = now.toISOString().replace(/\.\d{3}Z$/, '').replace(/:/g, '-').replace('Z', '');
  const runDir     = path.join(workflow.path, 'outputs', runId);
  const stateFile  = path.join(runDir, 'execution-state.json');

  const dirResult = fileOps.ensureDir(runDir);
  if (!dirResult.success) {
    log.error(`Failed to create run directory: ${dirResult.error.message}`);
    process.exit(1);
  }

  const state = {
    workflow:     workflowName,
    run_id:       runId,
    started_at:   now.toISOString(),
    updated_at:   now.toISOString(),
    status:       'running',
    input,
    current_step: steps[0]?.id || null,
    steps,
    errors:       [],
  };

  writeFile(stateFile, JSON.stringify(state, null, 2) + '\n');

  log.step(`Workflow: ${chalk.bold(workflowName)}`);
  log.success(`Run initialised: ${runId}`);
  console.log('');
  console.log(`  ${chalk.gray('Input:')}   ${input.length > 60 ? input.slice(0, 60) + '...' : input}`);
  console.log(`  ${chalk.gray('State:')}   ${path.relative(projectRoot, stateFile)}`);
  console.log(`  ${chalk.gray('Steps:')}   ${steps.length}`);
  console.log('');

  if (workflowYaml.execution?.preferred === 'cli') {
    log.warn('This workflow is configured for CLI execution (execution.preferred: cli).');
    log.warn('CLI script execution has been removed. Use IDE mode instead.');
    log.dim('  Load scripts/ide/instructions.md in your IDE agent to proceed.');
  } else {
    const ideInstructions = path.join(workflow.path, 'scripts', 'ide', 'instructions.md');

    console.log('  Load this workflow in your IDE agent to execute steps:');
    if (fileOps.existsSync(ideInstructions)) {
      console.log(chalk.gray(`    ${path.relative(projectRoot, ideInstructions)}`));
    }
    console.log('');
    console.log('  Tell your IDE agent:');
    console.log(chalk.cyan(`    "Execute workflow '${workflowName}', run ID '${runId}'."`));
    console.log(chalk.cyan(`    Start from step '${steps[0]?.id || 'first'}'."`));
    console.log('');
    console.log('  Available commands:');
    console.log(chalk.cyan(`    agentfile approve ${workflowName} <step-id>`) + '   ' + chalk.gray('- Approve a gate step'));
    console.log(chalk.cyan(`    agentfile status ${workflowName}`) + '              ' + chalk.gray('- Check run status'));
    console.log(chalk.cyan(`    agentfile resume ${workflowName}`) + '              ' + chalk.gray('- Resume from current step'));
  }
  console.log('');
};
