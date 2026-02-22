'use strict';

const fs   = require('fs');
const path = require('path');
const chalk = require('chalk');

// ── Logging ───────────────────────────────────────────────────────────────────
const log = {
  info:    (msg) => console.log(chalk.cyan('  ℹ'), msg),
  success: (msg) => console.log(chalk.green('  ✓'), msg),
  warn:    (msg) => console.log(chalk.yellow('  ⚠'), msg),
  error:   (msg) => console.log(chalk.red('  ✗'), msg),
  step:    (msg) => console.log(chalk.bold('\n  ▶'), chalk.white(msg)),
  dim:     (msg) => console.log(chalk.gray('   ', msg)),
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
      fs.existsSync(path.join(dir, 'workflows')) ||
      fs.existsSync(path.join(dir, 'SPEC.md'))
    ) {
      return dir;
    }
    const parent = path.dirname(dir);
    if (parent === dir) return null; // reached filesystem root
    dir = parent;
  }
}

/**
 * Find workflows directory — checks for `workflows/` in project root.
 */
function findWorkflowsDir(projectRoot) {
  const dir = path.join(projectRoot, 'workflows');
  return fs.existsSync(dir) ? dir : null;
}

// ── Workflow discovery ────────────────────────────────────────────────────────

/**
 * List all workflows (directories containing a workflow.yaml).
 */
function listWorkflows(projectRoot, includeExamples = false) {
  const results = [];

  const scanDir = (dir, prefix = '') => {
    if (!fs.existsSync(dir)) return;
    for (const entry of fs.readdirSync(dir)) {
      const full = path.join(dir, entry);
      if (fs.statSync(full).isDirectory()) {
        const yamlPath = path.join(full, 'workflow.yaml');
        if (fs.existsSync(yamlPath)) {
          results.push({
            name:   prefix ? `${prefix}/${entry}` : entry,
            path:   full,
            yaml:   yamlPath,
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
  return all.find(w => w.name === name || w.name === `workflows/${name}` || path.basename(w.path) === name) || null;
}

// ── File helpers ──────────────────────────────────────────────────────────────

function readFile(filePath) {
  return fs.readFileSync(filePath, 'utf8');
}

function writeFile(filePath, content) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, content, 'utf8');
}

function copyDir(src, dest) {
  fs.mkdirSync(dest, { recursive: true });
  for (const entry of fs.readdirSync(src)) {
    const srcPath  = path.join(src, entry);
    const destPath = path.join(dest, entry);
    if (fs.statSync(srcPath).isDirectory()) {
      copyDir(srcPath, destPath);
    } else {
      fs.copyFileSync(srcPath, destPath);
    }
  }
}

module.exports = {
  log,
  findProjectRoot,
  findWorkflowsDir,
  listWorkflows,
  findWorkflow,
  readFile,
  writeFile,
  copyDir,
};
