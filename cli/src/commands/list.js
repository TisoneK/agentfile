'use strict';

const fs    = require('fs');
const path  = require('path');
const chalk = require('chalk');
const yaml  = require('js-yaml');
const { log, findProjectRoot, listWorkflows } = require('../lib/utils');

module.exports = async function list(opts) {
  const projectRoot = findProjectRoot();
  if (!projectRoot) {
    log.error('No Agentfile project found. Run `agentfile init` first.');
    process.exit(1);
  }

  const workflows = listWorkflows(projectRoot, opts.examples);

  if (workflows.length === 0) {
    log.warn('No workflows found.');
    console.log('');
    console.log('  Create one with:');
    console.log(chalk.cyan('    agentfile create my-workflow'));
    console.log('');
    return;
  }

  console.log(chalk.bold(`  Workflows in ${path.basename(projectRoot)}/\n`));

  for (const w of workflows) {
    // Try to read description from workflow.yaml
    let description = '';
    let version     = '';
    let stepCount   = 0;
    try {
      const raw  = fs.readFileSync(w.yaml, 'utf8');
      const parsed = yaml.load(raw);
      description = parsed.description
        ? parsed.description.trim().split('\n')[0].slice(0, 70)
        : '';
      version   = parsed.version || '';
      stepCount = Array.isArray(parsed.steps) ? parsed.steps.length : 0;
    } catch (_) {}

    console.log(
      '  ' +
      chalk.bold.cyan(w.name.padEnd(30)) +
      chalk.gray(`v${version}`.padEnd(10)) +
      chalk.gray(`${stepCount} step${stepCount !== 1 ? 's' : ''}`)
    );
    if (description) {
      console.log(chalk.gray('    ' + description));
    }
    console.log('');
  }

  console.log(chalk.gray(`  ${workflows.length} workflow${workflows.length !== 1 ? 's' : ''} found.`));
  console.log('');
  console.log('  Run a workflow:');
  console.log(chalk.cyan(`    agentfile run <workflow-name> --input "your input"`));
  console.log('');
};
