'use strict';

const path = require('path');
const chalk = require('chalk');
const fileOps = require('../../../src/js-utils/file-ops');
const { log, findProjectRoot, writeFile, copyDir } = require('../lib/utils');

// ── promote ────────────────────────────────────────────────────────────────────
// Validates a completed artifact run, assembles the clean canonical workflow
// directory, archives the staging run, and writes workflow_status.json.
//
// Usage:
//   agentfile promote [artifact-run-dir]
//
// If no path given, auto-detects the most recent artifact run under artifacts/.
// Pure file I/O — no shell, no API key required.
// ──────────────────────────────────────────────────────────────────────────────

module.exports = async function promote(artifactRunDir, opts) {
  const projectRoot = findProjectRoot();
  if (!projectRoot) {
    log.error('No Agentfile project found. Run `agentfile init` first.');
    process.exit(1);
  }

  // ── Resolve artifact run directory ─────────────────────────────────────────
  let runDir = artifactRunDir
    ? path.resolve(artifactRunDir)
    : autoDetectRun(projectRoot);

  if (!runDir) {
    log.error('No artifact run found. Pass a path: agentfile promote artifacts/<workflow>/<run-id>');
    process.exit(1);
  }

  if (!fileOps.existsSync(runDir)) {
    log.error(`Artifact run directory not found: ${runDir}`);
    process.exit(1);
  }

  // ── Read manifest ───────────────────────────────────────────────────────────
  const manifestPath = path.join(runDir, 'manifest.json');
  if (!fileOps.existsSync(manifestPath)) {
    log.error(`manifest.json not found in ${runDir}`);
    process.exit(1);
  }

  let manifest;
  try {
    const readResult = fileOps.readFile(manifestPath);
    if (!readResult.success) {
      log.error(`Failed to read manifest.json: ${readResult.error.message}`);
      process.exit(1);
    }
    manifest = JSON.parse(readResult.content);
  } catch (e) {
    log.error(`Failed to parse manifest.json: ${e.message}`);
    process.exit(1);
  }

  const workflowName = manifest.workflow;
  const runId        = manifest.run_id;

  if (!workflowName) { log.error("manifest.json missing 'workflow' field."); process.exit(1); }
  if (!runId)        { log.error("manifest.json missing 'run_id' field.");   process.exit(1); }

  // Validate manifest status
  if (manifest.status !== 'validated') {
    log.error(`Manifest status is "${manifest.status}", expected "validated". Run validation first.`);
    process.exit(1);
  }

  log.step(`Promoting: ${chalk.bold(workflowName)} (run: ${runId})`);

  // ── Validate required artifacts ─────────────────────────────────────────────
  log.info('Validating artifact set...');
  const missing = [];
  for (const f of ['01-clarification.md', '02-design.md', '03-workflow.yaml', '07-review.md']) {
    if (!fileOps.existsSync(path.join(runDir, f))) missing.push(f);
  }
  const agentsDir = path.join(runDir, '04-agents');
  const agentFilesResult = fileOps.existsSync(agentsDir) ? fileOps.readdir(agentsDir) : { success: false };
  const agentFiles = agentFilesResult.success 
    ? agentFilesResult.files.filter(f => f.endsWith('.md') && f !== '_all.md')
    : [];
  if (agentFiles.length === 0) missing.push('04-agents/<role>.md (none found)');

  if (missing.length > 0) {
    log.error('Missing required artifacts:');
    for (const f of missing) log.dim(`  - ${f}`);
    process.exit(1);
  }
  log.success('All required artifacts present');

  // ── Check for name collision ────────────────────────────────────────────────
  const targetDir  = path.join(projectRoot, 'workflows', workflowName);
  const archiveDir = path.join(projectRoot, 'outputs', workflowName, runId, 'build');

  if (fileOps.existsSync(targetDir)) {
    if (!opts.force) {
      log.error(`workflows/${workflowName} already exists. Use --force to overwrite.`);
      process.exit(1);
    }
    log.warn(`Overwriting existing workflows/${workflowName}`);
    // Use deleteDir to properly remove the directory tree
    const deleteResult = fileOps.deleteDir(targetDir);
    if (!deleteResult.success) {
      log.error(`Failed to delete existing workflow directory: ${deleteResult.error.message}`);
      process.exit(1);
    }
  }

  // ── Assemble clean canonical workflow folder ────────────────────────────────
  // ONLY final deliverables cross the factory→shipped boundary.
  // No manifest.json, no numbered prefixes, no _all.md bundles, no design docs.
  log.step(`Assembling workflows/${workflowName}/`);

  for (const d of ['agents', 'skills', 'scripts/utils', 'scripts/cli', 'scripts/ide', 'outputs']) {
    const dirResult = fileOps.ensureDir(path.join(targetDir, d));
    if (!dirResult.success) {
      log.error(`Failed to create directory: ${dirResult.error.message}`);
      process.exit(1);
    }
  }

  // workflow.yaml — strip numbered prefix
  const copyResult1 = fileOps.copyFile(
    path.join(runDir, '03-workflow.yaml'),
    path.join(targetDir, 'workflow.yaml')
  );
  if (!copyResult1.success) {
    log.error(`Failed to copy workflow.yaml: ${copyResult1.error.message}`);
    process.exit(1);
  }
  log.success('workflow.yaml');

  // Agents
  const agentsAllPath = path.join(agentsDir, '_all.md');
  if (agentFiles.length > 0) {
    for (const f of agentFiles) {
      const copyResult = fileOps.copyFile(path.join(agentsDir, f), path.join(targetDir, 'agents', f));
      if (!copyResult.success) {
        log.error(`Failed to copy agent file ${f}: ${copyResult.error.message}`);
        process.exit(1);
      }
    }
    log.success(`agents/ (${agentFiles.length} files)`);
  } else if (fileOps.existsSync(agentsAllPath)) {
    parseDelimited(agentsAllPath, targetDir);
    log.success('agents/ (extracted from bundle)');
  } else {
    log.error('No agent files found in 04-agents/');
    process.exit(1);
  }

  // Skills
  const skillsDir     = path.join(runDir, '05-skills');
  const skillsAllPath = path.join(skillsDir, '_all.md');
  const skillFilesResult = fileOps.existsSync(skillsDir) ? fileOps.readdir(skillsDir) : { success: false };
  const skillFiles = skillFilesResult.success
    ? skillFilesResult.files.filter(f => f.endsWith('.md') && f !== '_all.md')
    : [];
  if (skillFiles.length > 0) {
    for (const f of skillFiles) {
      const copyResult = fileOps.copyFile(path.join(skillsDir, f), path.join(targetDir, 'skills', f));
      if (!copyResult.success) {
        log.error(`Failed to copy skill file ${f}: ${copyResult.error.message}`);
        process.exit(1);
      }
    }
    log.success(`skills/ (${skillFiles.length} files)`);
  } else if (fileOps.existsSync(skillsAllPath)) {
    parseDelimited(skillsAllPath, targetDir);
    log.success('skills/ (extracted from bundle)');
  }

  // Scripts — utils
  const utilsDir = path.join(runDir, '06-scripts', 'utils');
  if (fileOps.existsSync(utilsDir)) {
    copyDir(utilsDir, path.join(targetDir, 'scripts', 'utils'));
    log.success('scripts/utils/');
  }

  // Scripts — cli
  const cliDir = path.join(runDir, '06-scripts', 'cli');
  if (fileOps.existsSync(cliDir)) {
    copyDir(cliDir, path.join(targetDir, 'scripts', 'cli'));
    log.success('scripts/cli/');
  }

  // Scripts — ide
  const ideDir = path.join(runDir, '06-scripts', 'ide');
  if (fileOps.existsSync(ideDir)) {
    copyDir(ideDir, path.join(targetDir, 'scripts', 'ide'));
    log.success('scripts/ide/');
  }

  // Scripts — _all.md bundle fallback
  const scriptsAllPath = path.join(runDir, '06-scripts', '_all.md');
  if (fileOps.existsSync(scriptsAllPath)) {
    parseDelimited(scriptsAllPath, targetDir);
    log.success('scripts/ (extracted from bundle)');
  }

  // README from scripts if present
  const scriptsReadme = path.join(runDir, '06-scripts', 'README.md');
  if (fileOps.existsSync(scriptsReadme)) {
    const copyResult = fileOps.copyFile(scriptsReadme, path.join(targetDir, 'scripts', 'README.md'));
    if (copyResult.success) {
      log.success('scripts/README.md');
    }
  }

  // .gitignore
  const gitignoreResult = fileOps.writeFile(path.join(targetDir, '.gitignore'), 'outputs/\n');
  if (gitignoreResult.success) {
    log.success('.gitignore');
  }

  // ── Verify no factory files leaked ─────────────────────────────────────────
  const forbidden = ['manifest.json', '01-clarification.md', '02-design.md', '07-review.md'];
  for (const f of forbidden) {
    const leaked = path.join(targetDir, f);
    if (fileOps.existsSync(leaked)) {
      const deleteResult = fileOps.deleteFile(leaked);
      if (deleteResult.success) {
        log.warn(`⚠ Leaked factory file removed: ${f}`);
      } else {
        log.warn(`⚠ Failed to remove leaked factory file: ${f} - ${deleteResult.error.message}`);
      }
    }
  }

  // ── Write workflow_status.json ──────────────────────────────────────────────
  const now = new Date().toISOString();
  writeFile(path.join(targetDir, 'workflow_status.json'), JSON.stringify({
    workflow:      workflowName,
    registered_at: now,
    source_run_id: runId,
    archive:       `outputs/${workflowName}/${runId}/build`,
  }, null, 2) + '\n');
  log.success('workflow_status.json');

  // ── Archive artifact run ────────────────────────────────────────────────────
  log.step(`Archiving to outputs/${workflowName}/${runId}/build/`);
  const archiveDirResult = fileOps.ensureDir(archiveDir);
  if (!archiveDirResult.success) {
    log.error(`Failed to create archive directory: ${archiveDirResult.error.message}`);
    process.exit(1);
  }
  copyDir(runDir, archiveDir);

  // Update manifest in archive
  manifest.status                        = 'registered';
  manifest.updated_at                    = now;
  manifest.phases                        = manifest.phases || {};
  manifest.phases.promotion              = { status: 'completed', completed_at: now };
  manifest.phases.archival               = { status: 'completed', completed_at: now };
  manifest.promotion                     = {
    target:       `workflows/${workflowName}`,
    promoted_at:  now,
    archive_path: `outputs/${workflowName}/${runId}/build`,
  };
  const manifestWriteResult = fileOps.writeFile(
    path.join(archiveDir, 'manifest.json'),
    JSON.stringify(manifest, null, 2) + '\n'
  );
  if (!manifestWriteResult.success) {
    log.error(`Failed to write manifest.json in archive: ${manifestWriteResult.error.message}`);
    process.exit(1);
  }
  log.success('manifest.json updated in archive (status: registered)');

  // ── Remove staging directory ────────────────────────────────────────────────
  const deleteResult = fileOps.deleteDir(runDir);
  if (!deleteResult.success) {
    log.warn(`Failed to remove staging directory: ${deleteResult.error.message}`);
  }
  const parent = path.dirname(runDir);
  if (fileOps.existsSync(parent)) {
    const parentReadResult = fileOps.readdir(parent);
    if (parentReadResult.success && parentReadResult.files.length === 0) {
      fileOps.deleteDir(parent);
    }
  }

  // ── Summary ─────────────────────────────────────────────────────────────────
  console.log('');
  console.log(chalk.bold.green('  ╔══════════════════════════════════════════════════════╗'));
  console.log(chalk.bold.green('  ║  ✅ Promotion complete                               ║'));
  console.log(chalk.bold.green('  ╚══════════════════════════════════════════════════════╝'));
  console.log('');
  console.log(`  Workflow:   ${chalk.bold(workflowName)}`);
  console.log(`  Run ID:     ${runId}`);
  console.log('');
  console.log(`  Registered: ${chalk.cyan(`workflows/${workflowName}`)}`);
  console.log(`  Archived:   ${chalk.gray(`outputs/${workflowName}/${runId}/build`)}`);
  console.log('');
  console.log('  Next steps:');
  console.log(chalk.cyan(`    agentfile run ${workflowName} --input "<input>"`));
  console.log(chalk.cyan(`    agentfile list`));
  console.log('');
};

// ── Auto-detect most recent artifact run ───────────────────────────────────────
function autoDetectRun(projectRoot) {
  const artifactsDir = path.join(projectRoot, 'artifacts');
  if (!fileOps.existsSync(artifactsDir)) return null;

  let best = null;
  let bestDate = null;

  const parseRunId = (runId) => {
    // Convert YYYY-MM-DDTHH-MM-SS to Date object
    // Example: 2026-02-23T20-53-47 -> 2026-02-23T20:53:47Z
    const [datePart, timePart] = runId.split('T');
    if (!datePart || !timePart) return new Date(0); // Invalid format
    const [year, month, day] = datePart.split('-');
    const [hour, minute, second] = timePart.split('-');
    const date = new Date(Date.UTC(year, month - 1, day, hour, minute, second));
    return isNaN(date.getTime()) ? new Date(0) : date;
  };

  const compareDates = (a, b) => {
    // Compare dates properly: nulls last, then by time
    if (a === null && b === null) return 0;
    if (a === null) return 1;
    if (b === null) return -1;
    return a.getTime() - b.getTime();
  };

  try {
    const artifactsReadResult = fileOps.readdir(artifactsDir);
    if (!artifactsReadResult.success) return null;
    
    for (const entry of artifactsReadResult.files) {
      const wfDir = path.join(artifactsDir, entry);
      // Skip files - only process directories
      const wfStatResult = fileOps.stat(wfDir);
      if (!wfStatResult.success || !wfStatResult.stats.isDirectory()) continue;

      const runReadResult = fileOps.readdir(wfDir);
      if (!runReadResult.success) continue;
      
      for (const run of runReadResult.files) {
        const runPath = path.join(wfDir, run);
        // Skip files - only process directories
        const runStatResult = fileOps.stat(runPath);
        if (!runStatResult.success || !runStatResult.stats.isDirectory()) continue;
        
        const mPath  = path.join(runPath, 'manifest.json');
        // Skip builds and invalid entries
        if (fileOps.existsSync(mPath) && !runPath.includes('/build/') && !runPath.includes('\\build\\')) {
          const runDate = parseRunId(run);
          if (compareDates(runDate, bestDate) > 0) {
            bestDate = runDate;
            best = runPath;
          }
        }
      }
    }
  } catch (err) {
    log.error(`Error scanning artifacts directory: ${err.message}`);
    return null;
  }
  if (best) log.info(`Auto-detected: ${path.relative(projectRoot, best)}`);
  return best;
}

// ── Parse ##FILE: ... ##END## delimited bundle ─────────────────────────────────
function parseDelimited(sourceFile, baseDir) {
  let lines;
  try {
    const readResult = fileOps.readFile(sourceFile);
    if (!readResult.success) {
      log.error(`Failed to read bundle file ${sourceFile}: ${readResult.error.message}`);
      process.exit(1);
    }
    lines = readResult.content.split('\n');
  } catch (err) {
    log.error(`Failed to read bundle file ${sourceFile}: ${err.message}`);
    process.exit(1);
  }

  let currentFile = null;
  let buffer = [];

  const flush = () => {
    if (!currentFile || buffer.length === 0) return;
    const target = path.join(baseDir, currentFile);
    try {
      const dirResult = fileOps.ensureDirectory(target);
      if (!dirResult.success) {
        log.error(`Failed to create directory for ${currentFile}: ${dirResult.error.message}`);
        process.exit(1);
      }
      const writeResult = fileOps.writeFile(target, buffer.join('\n'));
      if (!writeResult.success) {
        log.error(`Failed to write ${currentFile}: ${writeResult.error.message}`);
        process.exit(1);
      }
      log.dim(`  + ${currentFile}`);
    } catch (writeErr) {
      log.error(`Failed to write ${currentFile}: ${writeErr.message}`);
      process.exit(1);
    }
  };

  for (const line of lines) {
    const fileMatch = line.match(/^=?##FILE:\s+(.+)##$/);
    if (fileMatch) {
      flush();
      currentFile = fileMatch[1].trim();
      buffer = [];
    } else if (line === '##END##') {
      flush();
      currentFile = null;
      buffer = [];
    } else if (currentFile) {
      buffer.push(line);
    }
  }
  flush();
}
