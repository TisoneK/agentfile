'use strict';

const path  = require('path');
const chalk = require('chalk');
const fileOps = require('../../../src/js-utils/file-ops');

// ── Logging ───────────────────────────────────────────────────────────────────
const log = {
  info:    (msg) => console.log(chalk.cyan('  ℹ'), msg),
  success: (msg) => console.log(chalk.green('  ✓'), msg),
  warn:    (msg) => console.log(chalk.yellow('  ⚠'), msg),
  error:   (msg) => console.log(chalk.red('  ✗'), msg),
  step:    (msg) => console.log(chalk.bold('\n  ▶'), chalk.white(msg)),
  dim:     (msg) => console.log(chalk.gray('   ', msg)),
  
  // Loader/spinner for long-running operations
  loader: null,
  startLoader: (msg) => {
    if (log.loader) return;
    const frames = ['⠋', '⠙', '⠹', '⠸', '⠼', '⠴', '⠦', '⠧', '⠇', '⠏'];
    let i = 0;
    process.stdout.write(chalk.cyan('  ') + frames[i] + ' ' + msg);
    log.loader = setInterval(() => {
      process.stdout.write('\r' + chalk.cyan('  ') + frames[i = (i + 1) % frames.length] + ' ' + msg);
    }, 80);
  },
  stopLoader: (msg) => {
    if (log.loader) {
      clearInterval(log.loader);
      log.loader = null;
      process.stdout.write('\r');
    }
    if (msg) console.log(chalk.green('  ✓'), msg);
  },
};

// ── Project root detection ────────────────────────────────────────────────────

/**
 * Find the agentfile project root by walking up from cwd
 * looking for a `workflows/` directory or `SPEC.md`.
 */
function findProjectRoot(startDir = process.cwd()) {
  let dir = startDir;
  while (true) {
    if (
      fileOps.existsSync(path.join(dir, 'workflows')) ||
      fileOps.existsSync(path.join(dir, 'SPEC.md'))
    ) {
      return dir;
    }
    const parent = path.dirname(dir);
    if (parent === dir) return null;
    dir = parent;
  }
}

/**
 * Find workflows directory.
 */
function findWorkflowsDir(projectRoot) {
  const dir = path.join(projectRoot, 'workflows');
  return fileOps.existsSync(dir) ? dir : null;
}

// ── Workflow discovery ────────────────────────────────────────────────────────

/**
 * List all workflows (directories containing a workflow.yaml).
 */
function listWorkflows(projectRoot, includeExamples = false) {
  const results = [];

  const scanDir = (dir, prefix = '') => {
    if (!fileOps.existsSync(dir)) return;
    const readdirResult = fileOps.readdir(dir);
    if (!readdirResult.success) return;
    
    for (const entry of readdirResult.files) {
      const full = path.join(dir, entry);
      const statResult = fileOps.stat(full);
      if (statResult.success && statResult.stats.isDirectory()) {
        const yamlPath = path.join(full, 'workflow.yaml');
        if (fileOps.existsSync(yamlPath)) {
          results.push({
            name: prefix ? `${prefix}/${entry}` : entry,
            path: full,
            yaml: yamlPath,
          });
        }
      }
    }
  };

  scanDir(path.join(projectRoot, 'workflows'), '');
  if (includeExamples) {
    scanDir(path.join(projectRoot, 'examples'), 'examples');
  }

  return results;
}

/**
 * Find a specific workflow by name.
 */
function findWorkflow(projectRoot, name) {
  const all = listWorkflows(projectRoot, true);
  return all.find(
    w => w.name === name || w.name === `workflows/${name}` || path.basename(w.path) === name
  ) || null;
}

// ── Execution state helpers ───────────────────────────────────────────────────

/**
 * Find the execution-state.json for a workflow run.
 * If runId is given, looks for that specific run.
 * Otherwise returns the most recent run (non-completed preferred).
 */
function findStateFile(workflowPath, runId, { anyStatus = false } = {}) {
  const outputsDir = path.join(workflowPath, 'outputs');
  if (!fileOps.existsSync(outputsDir)) return null;

  if (runId) {
    const f = path.join(outputsDir, runId, 'execution-state.json');
    return fileOps.existsSync(f) ? f : null;
  }

  const candidates = [];
  const readdirResult = fileOps.readdir(outputsDir);
  if (!readdirResult.success) return null;
  
  for (const entry of readdirResult.files) {
    const f = path.join(outputsDir, entry, 'execution-state.json');
    if (fileOps.existsSync(f)) candidates.push(f);
  }

  candidates.sort().reverse();

  if (anyStatus) return candidates[0] || null;

  // Prefer non-completed run
  return (
    candidates.find(f => {
      try { 
        const readResult = fileOps.readFile(f);
        if (!readResult.success) return false;
        return JSON.parse(readResult.content).status !== 'completed'; 
      }
      catch { return false; }
    }) || candidates[0] || null
  );
}

// ── File helpers ──────────────────────────────────────────────────────────────

function readFile(filePath) {
  const result = fileOps.readFile(filePath);
  if (!result.success) {
    throw new Error(result.error.message);
  }
  return result.content;
}

function writeFile(filePath, content) {
  const result = fileOps.writeFile(filePath, content);
  if (!result.success) {
    throw new Error(result.error.message);
  }
}

function copyDir(src, dest) {
  const dirResult = fileOps.ensureDir(dest);
  if (!dirResult.success) {
    throw new Error(dirResult.error.message);
  }
  
  const readdirResult = fileOps.readdir(src);
  if (!readdirResult.success) {
    throw new Error(readdirResult.error.message);
  }
  
  for (const entry of readdirResult.files) {
    const srcPath  = path.join(src, entry);
    const destPath = path.join(dest, entry);
    const statResult = fileOps.stat(srcPath);
    if (statResult.success && statResult.stats.isDirectory()) {
      copyDir(srcPath, destPath);
    } else {
      const copyResult = fileOps.copyFile(srcPath, destPath);
      if (!copyResult.success) {
        throw new Error(copyResult.error.message);
      }
    }
  }
}

module.exports = {
  log,
  findProjectRoot,
  findWorkflowsDir,
  listWorkflows,
  findWorkflow,
  findStateFile,
  readFile,
  writeFile,
  copyDir,
};
