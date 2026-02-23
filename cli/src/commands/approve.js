'use strict';

const fs    = require('fs');
const path  = require('path');
const chalk = require('chalk');
const { execSync } = require('child_process');
const { log, findProjectRoot, findWorkflow } = require('../lib/utils');
const { loadConfig } = require('./config');

module.exports = async function approve(workflowName, stepId, opts) {
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
    log.error(`Step "${stepId}" not found in workflow "${workflowName}".`);
    log.info('Available steps: ' + state.steps.map(s => s.id).join(', '));
    process.exit(1);
  }

  if (step.status !== 'awaiting_approval') {
    log.error(`Step "${stepId}" is not awaiting approval (current status: ${step.status})`);
    process.exit(1);
  }

  // Show what's being approved
  if (step.artifact) {
    const runId = path.basename(path.dirname(stateFile));
    const artifactPath = path.join(workflow.path, 'outputs', runId, step.artifact);
    if (fs.existsSync(artifactPath)) {
      console.log('');
      console.log(chalk.gray(`  ── Output: ${artifactPath} ──`));
      console.log('');
      const content = fs.readFileSync(artifactPath, 'utf8');
      const preview = content.length > 2000 ? content.slice(0, 2000) + '\n... (truncated)' : content;
      console.log(preview);
      console.log('');
    }
  }

  // Update state: awaiting_approval → approved
  const now = new Date().toISOString();
  step.status      = 'approved';
  step.approved_at = now;
  state.status     = 'running';
  state.updated_at = now;
  fs.writeFileSync(stateFile, JSON.stringify(state, null, 2), 'utf8');

  log.success(`Step "${stepId}" approved.`);
  console.log('');

  // Offer to resume
  if (opts.resume !== false) {
    const { createInterface } = require('readline');
    const rl = createInterface({ input: process.stdin, output: process.stdout });
    const answer = await new Promise(resolve => {
      rl.question(chalk.cyan(`  Resume workflow execution now? [y/N] `), a => { rl.close(); resolve(a); });
    });

    if (answer.toLowerCase() === 'y') {
      const config = loadConfig();
      const apiKey = process.env.ANTHROPIC_API_KEY || process.env.AGENT_API_KEY || config.apiKey;
      if (!apiKey) {
        log.error('No API key found. Set ANTHROPIC_API_KEY or use "agentfile config set api-key <key>"');
        log.info(`Resume manually: ${chalk.cyan(`agentfile resume ${workflowName}`)}`);
        process.exit(1);
      }

      const os = require('os');
      const shell = config.defaultShell || (os.platform() === 'win32' ? 'pwsh' : 'bash');
      const runId = path.basename(path.dirname(stateFile));
      const scriptFile = shell === 'pwsh'
        ? path.join(workflow.path, 'scripts', 'cli', 'run.ps1')
        : path.join(workflow.path, 'scripts', 'cli', 'run.sh');

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
        process.exit(err.status || 1);
      }
    } else {
      console.log('');
      log.info(`Resume later: ${chalk.cyan(`agentfile resume ${workflowName}`)}`);
    }
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
  return candidates.sort().reverse()[0] || null;
}
