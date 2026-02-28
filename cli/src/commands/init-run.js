'use strict';

const path = require('path');
const chalk = require('chalk');
const fileOps = require('../../../src/js-utils/file-ops');
const { log, findProjectRoot, writeFile } = require('../lib/utils');

// ── init-run ───────────────────────────────────────────────────────────────────
// Creates the artifact staging directory and writes the initial manifest.json
// for a workflow-creator run.
//
// Usage:
//   agentfile init-run <workflow-name>
//
// Output: prints the artifact run directory path so the agent can use it.
// Pure file I/O — no shell, no API key required.
// ──────────────────────────────────────────────────────────────────────────────

module.exports = async function initRun(workflowName, opts) {
  if (!/^[a-z][a-z0-9-]*$/.test(workflowName)) {
    log.error('Workflow name must be lowercase and hyphenated (e.g. my-workflow)');
    process.exit(1);
  }

  const projectRoot = findProjectRoot();
  if (!projectRoot) {
    log.error('No Agentfile project found. Run `agentfile init` first.');
    process.exit(1);
  }

  // ── Validate workflow exists ───────────────────────────────────────────────
  const workflowDir = path.join(projectRoot, 'workflows', workflowName);
  const workflowYaml = path.join(workflowDir, 'workflow.yaml');
  if (!fileOps.existsSync(workflowDir)) {
    log.error(`Workflow directory not found: workflows/${workflowName}`);
    log.info('Create it first: agentfile create ' + workflowName);
    process.exit(1);
  }
  if (!fileOps.existsSync(workflowYaml)) {
    log.error(`workflow.yaml not found in workflows/${workflowName}/`);
    log.info('The workflow directory is incomplete. Recreate it: agentfile create ' + workflowName);
    process.exit(1);
  }

  // ── Generate run ID ─────────────────────────────────────────────────────────
  let runId = new Date().toISOString()
    .replace(/\.\d{3}Z$/, 'Z')   // drop milliseconds
    .replace(/:/g, '-')           // colons → hyphens (filesystem safe)
    .replace('Z', '');            // drop trailing Z
  // Result: YYYY-MM-DDTHH-MM-SS

  let artifactDir = path.join(projectRoot, 'artifacts', workflowName, runId);

  // Handle run ID collision - generate new ID if directory exists
  let attempts = 0;
  const maxAttempts = 10;
  while (fileOps.existsSync(artifactDir) && attempts < maxAttempts) {
    attempts++;
    const now = new Date(Date.now() + attempts * 1000); // Add seconds to ensure uniqueness
    runId = now.toISOString()
      .replace(/\.\d{3}Z$/, 'Z')
      .replace(/:/g, '-')
      .replace('Z', '');
    artifactDir = path.join(projectRoot, 'artifacts', workflowName, runId);
  }

  if (fileOps.existsSync(artifactDir)) {
    log.error(`Could not generate unique run ID after ${maxAttempts} attempts`);
    log.error(`Artifact run directory already exists: ${artifactDir}`);
    process.exit(1);
  }

  // ── Create directory structure ──────────────────────────────────────────────
  for (const d of ['04-agents', '05-skills', '06-scripts/utils', '06-scripts/cli', '06-scripts/ide']) {
    const dirResult = fileOps.ensureDir(path.join(artifactDir, d));
    if (!dirResult.success) {
      log.error(`Failed to create directory: ${dirResult.error.message}`);
      process.exit(1);
    }
  }

  // ── Write initial manifest.json ─────────────────────────────────────────────
  const manifest = {
    specVersion:    '1.0',
    workflow:       workflowName,
    run_id:         runId,
    created_at:     now.toISOString(),
    updated_at:     now.toISOString(),
    execution_mode: 'ide',
    generator:      'workflow-creator',
    status:         'generating',
    phases: {
      generation: { status: 'in_progress',  started_at: now.toISOString() },
      validation: { status: 'pending' },
      promotion:  { status: 'pending' },
      archival:   { status: 'pending' },
    },
    steps: [
      { id: 'clarify',          name: 'Clarify Request',        status: 'pending' },
      { id: 'design',           name: 'Design Workflow',         status: 'pending' },
      { id: 'generate-config',  name: 'Generate workflow.yaml',  status: 'pending' },
      { id: 'generate-agents',  name: 'Generate Agent Files',    status: 'pending' },
      { id: 'generate-skills',  name: 'Generate Skill Files',    status: 'pending' },
      { id: 'generate-utils',   name: 'Generate Utility Scripts',status: 'pending' },
      { id: 'generate-scripts', name: 'Generate CLI/IDE Scripts',status: 'pending' },
      { id: 'review',           name: 'Review All Outputs',      status: 'pending' },
      { id: 'promote',          name: 'Promote to Workflow',     status: 'pending' },
    ],
    files: [
      { path: 'manifest.json', role: 'manifest', produced_by: 'init' },
    ],
    errors: [],
  };

  writeFile(path.join(artifactDir, 'manifest.json'), JSON.stringify(manifest, null, 2) + '\n');

  // ── Output ──────────────────────────────────────────────────────────────────
  // Print the artifact dir path — the agent reads this to know where to write.
  const relDir = path.relative(projectRoot, artifactDir);
  console.log('');
  log.success(`Artifact run initialized`);
  console.log(`  ${chalk.gray('Workflow:')} ${workflowName}`);
  console.log(`  ${chalk.gray('Run ID:')}   ${runId}`);
  console.log(`  ${chalk.gray('Dir:')}      ${chalk.cyan(relDir)}`);
  console.log('');
  // Machine-readable line the agent can parse
  console.log(`ARTIFACT_DIR=${relDir}`);
  console.log('');
};
