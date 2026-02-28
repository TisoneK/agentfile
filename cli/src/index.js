#!/usr/bin/env node
'use strict';

const path        = require('path');
const { program } = require('commander');
const chalk        = require('chalk');
const { version }  = require('../package.json');

const cmdInit     = require('./commands/init');
const cmdCreate   = require('./commands/create');
const cmdInitRun  = require('./commands/init-run');
const cmdPromote  = require('./commands/promote');
const cmdRun      = require('./commands/run');
const cmdResume   = require('./commands/resume');
const cmdStatus   = require('./commands/status');
const cmdApprove  = require('./commands/approve');
const cmdRetry    = require('./commands/retry');
const cmdList     = require('./commands/list');
const cmdValidate = require('./commands/validate');
const cmdConfig   = require('./commands/config');
const cmdSetupIde = require('./commands/setup-ide');
const { uninstallIdes } = require('./installers');

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
  .command('init [path]')
  .description('Scaffold a new Agentfile project in the current directory or specified path')
  .option('--name <n>', 'Project name', 'my-agentfile-project')
  .option('--ide <ides>', 'IDE(s) to configure (comma-separated: cursor,windsurf,vscode,kilocode,github-copilot,cline) - omit for interactive wizard')
  .option('--here', 'Initialize in the current working directory (equivalent to passing ".")')
  .action(async (path, opts) => { banner(); await cmdInit(path, opts); });

program
  .command('create <workflow-name>')
  .description('Scaffold a blank workflow structure')
  .option('--request <text>', 'Description of the workflow to create')
  .action(async (workflowName, opts) => { banner(); await cmdCreate(workflowName, opts); });

program
  .command('init-run <workflow-name>')
  .description('Initialise an artifact staging run for workflow-creator (used by IDE agent)')
  .action(async (workflowName, opts) => { await cmdInitRun(workflowName, opts); });

program
  .command('promote [artifact-run-dir]')
  .description('Promote a completed artifact run to workflows/ (used by IDE agent)')
  .option('--force', 'Overwrite existing workflow directory', false)
  .action(async (artifactRunDir, opts) => { await cmdPromote(artifactRunDir, opts); });

program
  .command('run <workflow-name>')
  .description('Initialise a new workflow run (IDE agent executes the steps)')
  .option('--input <text>', 'Input to pass to the workflow')
  .option('--resume', 'Resume the most recent incomplete run')
  .option('--run-id <id>', 'Specific run ID to resume (use with --resume)')
  .action(async (workflowName, opts) => { banner(); await cmdRun(workflowName, opts); });

program
  .command('resume <workflow-name>')
  .description('Show resume instructions for the most recent incomplete run')
  .option('--run <run-id>', 'Specific run ID to resume')
  .action(async (workflowName, opts) => { banner(); await cmdResume(workflowName, opts); });

program
  .command('status <workflow-name>')
  .description('Show execution status of a workflow run')
  .option('--run <run-id>', 'Specific run ID to inspect (defaults to most recent)')
  .action(async (workflowName, opts) => { banner(); await cmdStatus(workflowName, opts); });

program
  .command('approve <workflow-name> <step-id>')
  .description('Approve a gated step')
  .option('--run <run-id>', 'Specific run ID (defaults to most recent)')
  .action(async (workflowName, stepId, opts) => { banner(); await cmdApprove(workflowName, stepId, opts); });

program
  .command('retry <workflow-name> <step-id>')
  .description('Reset a failed step (and all subsequent steps) to pending')
  .option('--run <run-id>', 'Specific run ID (defaults to most recent)')
  .action(async (workflowName, stepId, opts) => { banner(); await cmdRetry(workflowName, stepId, opts); });

program
  .command('list')
  .description('List all workflows in the current project')
  .action(async (opts) => { banner(); await cmdList(opts); });

program
  .command('validate [workflow-name]')
  .description('Validate a workflow.yaml against the Agentfile spec')
  .action(async (workflowName, opts) => { banner(); await cmdValidate(workflowName, opts); });

program
  .command('config [action] [key] [value]')
  .description('Manage configuration')
  .on('--help', () => {
    console.log('');
    console.log('Examples:');
    console.log('  agentfile config                    # Show current config');
    console.log('  agentfile config set api-key <key>  # Save API key (for reference only)');
    console.log('  agentfile config unset api-key      # Remove stored key');
    console.log('');
    console.log('Available keys: api-key, model');
    console.log('Available actions: show, set, unset');
  })
  .action(async (action, key, value, opts) => { banner(); await cmdConfig(action, key, value, opts); });

program
  .command('setup-ide [ide-name]')
  .description('Generate IDE integration instructions for slash commands')
  .action(async (ideName, opts) => { banner(); await cmdSetupIde(ideName, opts); });

program
  .command('uninstall [ide-names]')
  .description('Uninstall IDE wrapper files (comma-separated: cursor,windsurf,github-copilot,cline,kilocode)')
  .option('--ide <ides>', 'IDE(s) to uninstall (comma-separated)')
  .option('--yes, -y', 'Skip confirmation prompt', false)
  .option('--all', 'Uninstall all configured IDEs', false)
  .action(async (ideNames, opts) => { 
    banner(); 
    let ides = [];
    const configPath = path.join(process.cwd(), '.agentfile', 'config.json');
    const { existsSync, readFileSync } = require('fs');
    let configuredIdes = [];
    
    // Load configured IDEs from config
    if (existsSync(configPath)) {
      try {
        const content = readFileSync(configPath, 'utf-8');
        const config = JSON.parse(content);
        configuredIdes = config.configured_ides || [];
      } catch (e) {
        // ignore
      }
    }
    
    // Get IDEs from argument or --ide flag
    if (ideNames) {
      ides = ideNames.split(',').map(s => s.trim());
    } else if (opts.ide) {
      ides = opts.ide.split(',').map(s => s.trim());
    } else if (opts.all) {
      ides = [...configuredIdes];
      
      if (ides.length === 0) {
        console.log(chalk.yellow('\n  No IDEs configured. Run agentfile init first.'));
        return;
      }
      
      console.log(chalk.cyan(`\n  Configured IDEs: ${ides.join(', ')}`));
      
      // Interactive confirmation (skip if --yes flag provided)
      if (!opts.yes) {
        const readline = require('readline');
        const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
        
        const answer = await new Promise((resolve) => {
          rl.question(chalk.yellow('\n  Uninstall all these IDEs? [y/N] '), (ans) => {
            rl.close();
            resolve(ans.trim().toLowerCase());
          });
        });
        
        if (answer !== 'y' && answer !== 'yes') {
          console.log(chalk.gray('\n  Cancelled.'));
          return;
        }
      }
    } else {
      // Interactive mode: prompt for IDE selection
      if (configuredIdes.length === 0) {
        console.log(chalk.yellow('\n  No IDEs configured. Run agentfile init first.'));
        return;
      }
      
      const { promptIdeSelector } = require('./prompts/ide-selector');
      ides = await promptIdeSelector(configuredIdes, { uninstallMode: true });
      
      if (ides.length === 0) {
        console.log(chalk.gray('\n  No IDEs selected for uninstall.'));
        return;
      }
    }
    
    if (ides.length === 0) {
      console.log(chalk.yellow('\n  No IDEs selected for uninstall.'));
      return;
    }
    
    const cwd = process.cwd();
    const result = await uninstallIdes(cwd, ides);
    if (result.success) {
      console.log(chalk.green(`\n  ✓ Uninstalled: ${result.uninstalled.join(', ')}`));
    } else {
      console.log(chalk.red(`\n  ✗ Failed: ${result.failed.map(f => f.ide).join(', ')}`));
    }
  });

// ── Parse ─────────────────────────────────────────────────────────────────────
program.parse(process.argv);

if (!process.argv.slice(2).length) {
  banner();
  program.outputHelp();
}
