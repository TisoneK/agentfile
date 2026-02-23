#!/usr/bin/env node
'use strict';

const { program } = require('commander');
const chalk        = require('chalk');
const { version }  = require('../package.json');

const cmdInit     = require('./commands/init');
const cmdCreate   = require('./commands/create');
const cmdRun      = require('./commands/run');
const cmdResume   = require('./commands/resume');
const cmdStatus   = require('./commands/status');
const cmdApprove  = require('./commands/approve');
const cmdRetry    = require('./commands/retry');
const cmdList     = require('./commands/list');
const cmdValidate = require('./commands/validate');
const cmdConfig   = require('./commands/config');
const cmdSetupIde = require('./commands/setup-ide');

// ── Banner ────────────────────────────────────────────────────────────────────
const banner = () => {
  console.log(chalk.bold.cyan('\n  Agentfile') + chalk.gray(` v${version}`));
  console.log(chalk.gray('  Define LLM workflows as files. Run with any IDE agent.\n'));
};

program
  .name('agentfile')
  .description('CLI for the Agentfile workflow specification')
  .version(version, '-v, --version')
  .addHelpText('before', `
${chalk.bold.cyan('Agentfile')} ${chalk.gray(`v${version}`)}
Define LLM workflows as files. Run with any IDE agent.
`);

// ── Commands ──────────────────────────────────────────────────────────────────

program
  .command('init')
  .description('Scaffold a new Agentfile project in the current directory')
  .option('--name <n>', 'Project name', 'my-agentfile-project')
  .action(async (opts) => { banner(); await cmdInit(opts); });

program
  .command('create <workflow-name>')
  .description('Create a new workflow (AI-powered if workflow-creator is installed)')
  .option('--request <text>', 'Natural language description of the workflow to create')
  .option('--key <key>', 'LLM API key (or set ANTHROPIC_API_KEY)')
  .option('--shell <shell>', 'Shell to use for workflow-creator: bash or pwsh')
  .action(async (workflowName, opts) => { banner(); await cmdCreate(workflowName, opts); });

program
  .command('run <workflow-name>')
  .description('Run a workflow by name')
  .option('--input <text>', 'Input to pass to the workflow')
  .option('--key <key>', 'LLM API key (or set ANTHROPIC_API_KEY)')
  .option('--model <model>', 'Model to use (or set AGENT_MODEL)')
  .option('--shell <shell>', 'Runtime shell: bash or pwsh (auto-detected by OS)')
  .option('--resume', 'Resume the most recent incomplete run instead of starting fresh')
  .option('--run-id <id>', 'Specific run ID to resume (use with --resume)')
  .action(async (workflowName, opts) => { banner(); await cmdRun(workflowName, opts); });

program
  .command('resume <workflow-name>')
  .description('Resume the most recent incomplete run of a workflow')
  .option('--run <run-id>', 'Specific run ID to resume')
  .option('--key <key>', 'LLM API key (or set ANTHROPIC_API_KEY)')
  .option('--shell <shell>', 'Runtime shell: bash or pwsh')
  .action(async (workflowName, opts) => { banner(); await cmdResume(workflowName, opts); });

program
  .command('status <workflow-name>')
  .description('Show execution status of a workflow run')
  .option('--run <run-id>', 'Specific run ID to inspect (defaults to most recent)')
  .action(async (workflowName, opts) => { banner(); await cmdStatus(workflowName, opts); });

program
  .command('approve <workflow-name> <step-id>')
  .description('Approve a gated step and optionally resume execution')
  .option('--run <run-id>', 'Specific run ID (defaults to most recent)')
  .option('--no-resume', 'Approve without prompting to resume')
  .action(async (workflowName, stepId, opts) => { banner(); await cmdApprove(workflowName, stepId, opts); });

program
  .command('retry <workflow-name> <step-id>')
  .description('Reset a failed step (and all subsequent steps) to pending and resume')
  .option('--run <run-id>', 'Specific run ID (defaults to most recent)')
  .action(async (workflowName, stepId, opts) => { banner(); await cmdRetry(workflowName, stepId, opts); });

program
  .command('list')
  .description('List all workflows in the current project')
  .option('--examples', 'Include example workflows', false)
  .action(async (opts) => { banner(); await cmdList(opts); });

program
  .command('validate [workflow-name]')
  .description('Validate a workflow.yaml against the Agentfile spec')
  .action(async (workflowName, opts) => { banner(); await cmdValidate(workflowName, opts); });

program
  .command('config [action] [key] [value]')
  .description('Manage configuration (API keys, default model, etc.)')
  .on('--help', () => {
    console.log('');
    console.log('Examples:');
    console.log('  agentfile config                    # Show current config');
    console.log('  agentfile config set api-key <key>  # Save API key');
    console.log('  agentfile config set model <model>  # Set default model');
    console.log('  agentfile config set shell pwsh     # Set default shell');
    console.log('  agentfile config unset api-key      # Remove API key');
    console.log('');
    console.log('Available keys: api-key, model, shell');
    console.log('Available actions: show, set, unset');
  })
  .action(async (action, key, value, opts) => { banner(); await cmdConfig(action, key, value, opts); });

program
  .command('setup-ide [ide-name]')
  .description('Generate IDE integration instructions for slash commands')
  .action(async (ideName, opts) => { banner(); await cmdSetupIde(ideName, opts); });

// ── Parse ─────────────────────────────────────────────────────────────────────
program.parse(process.argv);

if (!process.argv.slice(2).length) {
  banner();
  program.outputHelp();
}
