'use strict';

const path = require('path');
const { existsSync, ensureDir, ensureDirectory, copyFile, copyFileAsync, readdir, readFileAsync, stat } = require('../../../src/js-utils/file-ops');
const chalk = require('chalk');
const { log, writeFile } = require('../lib/utils');
const { promptIdeSelector, parseIdeFlag, validateSelection, displayConfirmation, getIdeOptions } = require('../prompts/ide-selector');
const { installIdes } = require('../installers');

/**
 * Resolve the target directory path from command arguments
 * Supports: agentfile init, agentfile init ., agentfile init --here, agentfile init /path
 * @param {string|undefined} argsPath - Path argument from CLI
 * @param {boolean} hereFlag - Whether --here flag was provided
 * @returns {string} Resolved absolute path
 */
function resolveInitPath(argsPath, hereFlag) {
  // Priority: --here flag > "." path > explicit path > cwd
  if (hereFlag || !argsPath || argsPath === '.') {
    return process.cwd();
  }
  // If explicit path provided, resolve it to absolute path
  return path.resolve(argsPath);
}

/**
 * Validate that the target directory exists and is accessible/writable
 * @param {string} targetPath - Path to validate
 * @returns {object} Result with success or error
 */
function validateTargetDirectory(targetPath) {
  // Check if path exists
  if (!existsSync(targetPath)) {
    return {
      success: false,
      error: {
        code: 'ERR_DIR_NOT_EXIST',
        message: `Directory does not exist: ${targetPath}`,
        details: { operation: 'validateTargetDirectory', targetPath }
      }
    };
  }

  // Check if it's a directory using stat
  const statResult = stat(targetPath);
  if (!statResult.success || !statResult.stats.isDirectory()) {
    return {
      success: false,
      error: {
        code: 'ERR_NOT_A_DIRECTORY',
        message: `Path is not a directory: ${targetPath}`,
        details: { operation: 'validateTargetDirectory', targetPath }
      }
    };
  }

  // Check if writable (try to create a test file)
  const testFile = path.join(targetPath, `.agentfile-write-test-${Date.now()}`);
  try {
    const { writeFileSync, unlinkSync } = require('fs');
    writeFileSync(testFile, 'test');
    unlinkSync(testFile);
    return { success: true };
  } catch (writeError) {
    return {
      success: false,
      error: {
        code: 'ERR_DIR_NOT_WRITABLE',
        message: `Directory is not writable: ${targetPath}`,
        details: { operation: 'validateTargetDirectory', targetPath, originalError: writeError.code }
      }
    };
  }
}

/**
 * Check if .agentfile/ directory exists and has been initialized
 * @param {string} cwd - Current working directory
 * @returns {boolean} True if agentfile has been initialized
 */
function isAgentfileInitialized(cwd) {
  const agentfileDir = path.join(cwd, '.agentfile');
  const configPath = path.join(agentfileDir, 'config.json');
  return existsSync(agentfileDir) && existsSync(configPath);
}

/**
 * Get list of files in a directory (non-recursive, only direct files)
 * @param {string} dirPath - Directory path
 * @returns {string[]} Array of file names
 */
function getFilesInDir(dirPath) {
  if (!existsSync(dirPath)) {
    return [];
  }
  const result = readdir(dirPath);
  if (!result.success) {
    return [];
  }
  // Filter to only files (not directories)
  return result.files.filter(file => {
    const statResult = stat(path.join(dirPath, file));
    return statResult.success && statResult.stats.isFile();
  });
}

/**
 * Get all files recursively from a directory and its subdirectories
 * Returns array of objects with {relativePath, absolutePath}
 * @param {string} dirPath - Directory path to search
 * @param {string} basePath - Base path for calculating relative paths
 * @returns {Array} Array of {relativePath, absolutePath} objects
 */
function getAllFilesRecursive(dirPath, basePath = dirPath) {
  const files = [];
  if (!existsSync(dirPath)) {
    return files;
  }
  
  const result = readdir(dirPath);
  if (!result.success) {
    return files;
  }
  
  for (const file of result.files) {
    const fullPath = path.join(dirPath, file);
    const statResult = stat(fullPath);
    
    if (statResult.success && statResult.stats.isDirectory()) {
      // Recursively process subdirectory
      const subFiles = getAllFilesRecursive(fullPath, basePath);
      files.push(...subFiles);
    } else if (statResult.success && statResult.stats.isFile()) {
      // Calculate relative path from base directory
      const relativePath = path.relative(basePath, fullPath);
      files.push({
        relativePath: relativePath,
        absolutePath: fullPath
      });
    }
  }
  
  return files;
}

module.exports = async function init(pathArg, opts) {
  // Resolve target directory from arguments
  const cwd = resolveInitPath(pathArg, opts.here);
  
  // Validate the target directory
  const validationResult = validateTargetDirectory(cwd);
  if (!validationResult.success) {
    log.error(validationResult.error.message);
    return;
  }
  
  const name = opts.name;
  const ideArg = opts.ide;

  // Idempotency tracking
  const idempotencyCounters = {
    preserved: 0,
    added: 0,
    templatesPreserved: 0,
    templatesAdded: 0,
  };

  // Selected IDEs (loaded from config in idempotent mode, or from user input in first-run mode)
  let selectedIdes = [];

  // ── Check for idempotent re-run ─────────────────────────────────────────────
  const agentfileInitialized = isAgentfileInitialized(cwd);
  const isIdempotentRun = agentfileInitialized;

  if (isIdempotentRun) {
    // Idempotent re-run mode
    log.step('Agentfile already initialized - running in idempotent mode');
    log.dim(`Directory: ${cwd}`);

    // Load existing IDE configuration
    const configPath = path.join(cwd, '.agentfile', 'config.json');
    const configResult = await readFileAsync(configPath);
    let existingIdes = [];
    if (configResult.success) {
      try {
        const config = JSON.parse(configResult.content);
        existingIdes = config.configured_ides || [];
      } catch (err) {
        // ignore
      }
    }
    
    // Prompt for IDE selection in idempotent mode
    console.log('\n');
    selectedIdes = await promptIdeSelector(existingIdes);
    displayConfirmation(selectedIdes);
    
    // Check if selection changed
    const changed = JSON.stringify(existingIdes.sort()) !== JSON.stringify(selectedIdes.sort());
    if (changed && existingIdes.length > 0) {
      log.success(`IDE selection updated from: ${existingIdes.join(', ')} to: ${selectedIdes.join(', ')}`);
    } else {
      log.success(`Loaded existing IDE configuration: ${selectedIdes.join(', ')}`);
    }
  } else {
    // First-time initialization
    log.step('Initializing Agentfile project');
    log.dim(`Directory: ${cwd}`);

    // ── IDE Selection ─────────────────────────────────────────────────────────────
    
    if (ideArg) {
      // Non-interactive mode: parse --ide flag
      selectedIdes = parseIdeFlag(ideArg);
      if (!validateSelection(selectedIdes)) {
        log.error('Invalid IDE(s) specified. Valid options: ' + getIdeOptions().map(o => o.id).join(', '));
        return;
      }
      log.success(`IDE(s) from command line: ${selectedIdes.join(', ')}`);
    } else {
      // Interactive mode: launch wizard
      console.log('\n');
      selectedIdes = await promptIdeSelector();
      displayConfirmation(selectedIdes);
    }

    // ── Scaffold structure ──────────────────────────────────────────────────────
    const dirs = [
      'workflows',
      'shared',
      'examples',
      'docs',
    ];

    for (const dir of dirs) {
      ensureDir(path.join(cwd, dir));
      log.success(`Created ${dir}/`);
    }

    // ── shared/project.md ─────────────────────────────────────────────────────
    writeFile(path.join(cwd, 'shared/project.md'), `# Project Convention

## Purpose
This file is injected into every agent call as part of the system prompt.
It defines the project's conventions, stack, and global rules.
It is agent-agnostic — does not reference any specific LLM provider or IDE.

## Stack
- **Workflow format**: Agentfile (YAML + Markdown)
- **Runtime scripts**: Bash + PowerShell
- **No external frameworks or SDKs required**

## Conventions
- Workflow configs: \`workflow.yaml\`
- Agents: \`agents/<role>.md\`
- Skills: \`skills/<skill-name>.md\`
- Generation artifacts: \`artifacts/<workflow-name>/<run-id>/<step-id>-<artifact>.<ext>\`
- Runtime step outputs: \`outputs/<step-id>-<artifact>.<ext>\`

## Agent Behavior
- Be concise and structured in outputs
- If something is unclear, say so explicitly — never guess
- Never invent file paths — use only paths defined in workflow.yaml
`);
    log.success('Created shared/project.md');

    // ── shared/AGENTS.md ───────────────────────────────────────────────────────
    writeFile(path.join(cwd, 'shared/AGENTS.md'), `# Global Agent Rules

These rules apply to every agent in every workflow.

1. **Stay in role.** You are the agent defined in your agent file.
2. **Output only what is asked.** If a step asks for YAML, output only valid YAML.
3. **Be explicit about uncertainty.** Say exactly what is missing — never fabricate.
4. **Produce complete outputs.** Never truncate. Never use placeholders like \`# TODO\`.
5. **Reference only real files.** Never reference a file that doesn't exist.

## Output Format Rules
- YAML must be valid and parseable
- Markdown must use consistent heading hierarchy
- Shell scripts must include a shebang line
- All scripts must be idempotent where possible
`);
    log.success('Created shared/AGENTS.md');

    // ── .gitignore ─────────────────────────────────────────────────────────────
    writeFile(path.join(cwd, '.gitignore'), `# Agentfile runtime artifacts
outputs/

# Agentfile artifact staging — run directories are transient
artifacts/**/
!artifacts/.gitkeep

# Environment files
.env
.env.local
.env.*.local

# Logs
*.log
npm-debug.log*
yarn-debug.log*
yarn-error.log*

# OS generated files
.DS_Store
.DS_Store?
._*
.Spotlight-V100
.Trashes
ehthumbs.db
Thumbs.db

# IDE files
.vscode/
.idea/
*.swp
*.swo
*~

# Node.js
node_modules/
.npm
.eslintcache

# Temporary files
*.tmp
*.temp
`);
    log.success('Created .gitignore');

    // ── agentfile.yaml (project manifest) ─────────────────────────────────────
    writeFile(path.join(cwd, 'agentfile.yaml'), `# Agentfile Project Manifest
name: ${name}
version: 1.0.0
spec: "1.0.0"

workflows_dir: workflows/
examples_dir: examples/
shared_dir: shared/
`);
    log.success('Created agentfile.yaml');

    // ── Root AGENTS.md — read by IDE agents at project open ───────────────────
    writeFile(path.join(cwd, 'AGENTS.md'), `# Agentfile Project — IDE Agent Instructions

This is an **Agentfile project**. When working in this repo, you must follow the slash command protocol below for all workflow operations. Do not improvise — the protocol is exact.

---

## Slash Command Protocol

### \`/agentfile:run <workflow-name> <args>\`
Run an existing workflow in IDE mode.

1. Read \`workflows/<workflow-name>/workflow.yaml\`
2. Read \`workflows/<workflow-name>/scripts/ide/instructions.md\` if it exists
3. Load each step's agent file as your persona, load the skill file as context
4. Execute steps sequentially using your LLM — **do not run any scripts in \`scripts/cli/\`**
5. The only scripts you may execute are in \`scripts/ide/\` (e.g. \`register.sh\`) — these are API-key-free file operations

### \`/agentfile:create <workflow-name> <description>\`
Create a new workflow using the \`workflow-creator\` pipeline.

**This is NOT a free-form task. Follow these exact steps:**

1. Set \`WORKFLOW_NAME\` = the name argument
2. Set \`WORKFLOW_REQUEST\` = \`"Create a workflow named <n>. <description>"\`
3. Read \`workflows/workflow-creator/scripts/ide/instructions.md\` — follow it exactly
4. Generate \`RUN_ID\` = current UTC timestamp \`YYYY-MM-DDTHH-MM-SS\` (e.g. \`2026-02-23T10-41-22\`).
5. Set \`ARTIFACT_DIR\` = \`artifacts/{workflow_name}/{run_id}/\`
6. Execute the full workflow-creator pipeline:
   - **Step 0 (Init):** Create \`ARTIFACT_DIR\`. Write initial \`manifest.json\` using \`skills/generate-manifest.md\`. Status: \`generating\`, all steps \`pending\`.
   - **Step 1 (Clarify):** Load \`agents/analyst.md\` + \`skills/ask-clarifying.md\`. Produce \`{ARTIFACT_DIR}/01-clarification.md\`. Update manifest. Wait for human approval.
   - **Step 2 (Design):** Load \`agents/architect.md\` + \`skills/design-workflow.md\`. Input: \`{ARTIFACT_DIR}/01-clarification.md\`. Produce \`{ARTIFACT_DIR}/02-design.md\`. Update manifest. Wait for human approval.
   - **Step 3 (Generate YAML):** Load generator + \`skills/generate-yaml.md\`. Produce \`{ARTIFACT_DIR}/03-workflow.yaml\`. Register in manifest.
   - **Step 4 (Generate Agents):** Load generator + \`skills/generate-agent.md\`. Produce \`{ARTIFACT_DIR}/04-agents/\`. Register in manifest.
   - **Step 5 (Generate Skills):** Load generator + \`skills/generate-skill.md\`. Produce \`{ARTIFACT_DIR}/05-skills/\`. Register in manifest.
   - **Step 6 (Generate Scripts):** Load generator + \`skills/generate-dual-scripts.md\`. Produce \`{ARTIFACT_DIR}/06-scripts/\`. Register in manifest.
   - **Step 7 (Review):** Load \`agents/reviewer.md\` + \`skills/review-workflow.md\`. Produce \`{ARTIFACT_DIR}/07-review.md\`. Set manifest \`status: validated\`. Wait for human approval.
   - **Step 8 (Promote):** Run \`bash workflows/workflow-creator/scripts/ide/register.sh {ARTIFACT_DIR}\` (Unix) or \`pwsh ... {ARTIFACT_DIR}\` (Windows). Promotes to \`workflows/{name}/\`, archives to \`outputs/{name}/{run_id}/build/\`. No API key needed.

**Never** create a \`.md\` file directly in \`workflows/\`. **Never** skip steps. **Never** run \`scripts/cli/\` scripts.

### \`/agentfile:list\`
Scan \`workflows/*/workflow.yaml\`. For each, read \`name\` and \`description\`. Return a formatted list. No LLM call needed.

---

## Hard Rules

- **Never create files directly in \`workflows/\`** — new workflows are always created via the \`workflow-creator\` pipeline
- **Never run shell scripts directly** — use \`agentfile\` CLI commands instead (\`init-run\`, \`promote\`, \`approve\`, etc.)
- **Always read \`scripts/ide/instructions.md\`** before executing any workflow
- **Always wait at \`gate: human-approval\` steps** — do not proceed without confirmation
- **Generation artifacts go in \`artifacts/<workflow-name>/<run-id>/\`** — never directly in \`workflows/\` or \`outputs/\`
`);
    log.success('Created AGENTS.md');

    // ── IDE rules files — pointer to AGENTS.md for each IDE ───────────────────
    const ideRulesContent = `This is an Agentfile project. Read AGENTS.md at the project root before doing anything.\nAll workflow operations use the /agentfile: slash command protocol defined there.\n`;
    writeFile(path.join(cwd, '.cursorrules'),   ideRulesContent);
    writeFile(path.join(cwd, '.windsurfrules'), ideRulesContent);
    writeFile(path.join(cwd, '.clinerules'),    ideRulesContent);
    writeFile(path.join(cwd, 'CLAUDE.md'),      ideRulesContent);
    log.success('Created IDE rules files (.cursorrules, .windsurfrules, .clinerules, CLAUDE.md)');

    // ── README ─────────────────────────────────────────────────────────────────
    writeFile(path.join(cwd, 'README.md'), `# ${name}

An [Agentfile](https://github.com/TisoneK/agentfile) project.

## Workflows

| Name | Description |
|------|-------------|
| *(none yet — run \`agentfile create <name>\` to add one)* | |

## IDEs Configured

${selectedIdes.map(id => `- ${id}`).join('\n')}

## Usage

\`\`\`bash
# Create a new workflow
agentfile create my-workflow

# Run a workflow
agentfile run my-workflow --input "your input here"

# List all workflows
agentfile list

# Validate a workflow
agentfile validate my-workflow
\`\`\`
`);
    log.success('Created README.md');
  }

  // ── .agentfile/ directory with IDE configuration (idempotent for both modes) ─
  const agentfileDir = path.join(cwd, '.agentfile');
  const agentfileExists = existsSync(agentfileDir);
  
  if (!agentfileExists) {
    ensureDir(agentfileDir);
    log.success('Created .agentfile/ directory');
  } else {
    log.step('Updating .agentfile/ directory (idempotent mode)');
  }
  
  // Copy template files from cli/src/templates/agentfile/ (idempotent)
  const templatesDir = path.join(__dirname, '..', 'templates', 'agentfile');
  let templatesAdded = 0;
  if (existsSync(templatesDir)) {
    const templateFiles = getFilesInDir(templatesDir);
    for (const file of templateFiles) {
      const srcPath = path.join(templatesDir, file);
      const destPath = path.join(agentfileDir, file);
      if (!existsSync(destPath)) {
        const result = await copyFileAsync(srcPath, destPath);
        if (!result.success) {
          log.warn(`Failed to copy template ${file}: ${result.error.message}`);
        } else {
          templatesAdded++;
        }
      }
    }
  }
  if (templatesAdded > 0) {
    log.success(`Copied ${templatesAdded} template(s)`);
  }
  
  // Store IDE configuration
  const configPath = path.join(agentfileDir, 'config.json');
  const ideConfig = {
    configured_ides: selectedIdes,
    initialized_at: new Date().toISOString(),
  };
  
  if (!existsSync(configPath)) {
    writeFile(configPath, JSON.stringify(ideConfig, null, 2));
    log.success('Created .agentfile/config.json');
    idempotencyCounters.added++;
  } else {
    // In idempotent mode, update if selection changed
    const existingConfigResult = await readFileAsync(configPath);
    let needsUpdate = true;
    if (existingConfigResult.success) {
      try {
        const existingConfig = JSON.parse(existingConfigResult.content);
        const existingIdes = existingConfig.configured_ides || [];
        if (JSON.stringify(existingIdes.sort()) === JSON.stringify(selectedIdes.sort())) {
          needsUpdate = false;
        }
      } catch (e) {
        // parse failed, update
      }
    }
    
    if (needsUpdate) {
      writeFile(configPath, JSON.stringify(ideConfig, null, 2));
      log.success('Updated .agentfile/config.json');
    } else {
      log.success('Preserved existing .agentfile/config.json');
    }
    idempotencyCounters.preserved++;
  }

  // Create IDE-specific marker files for quick detection
  // Get existing markers to compare
  const existingMarkers = [];
  for (const ideId of ['cursor', 'windsurf', 'vscode', 'kilocode', 'github-copilot', 'cline']) {
    const markerPath = path.join(agentfileDir, `${ideId}.json`);
    if (existsSync(markerPath)) {
      existingMarkers.push(ideId);
    }
  }
  
  // Determine which markers need to be added or removed
  const selectedSet = new Set(selectedIdes);
  const existingSet = new Set(existingMarkers);
  
  for (const ideId of selectedIdes) {
    const ideMarkerPath = path.join(agentfileDir, `${ideId}.json`);
    if (!existsSync(ideMarkerPath)) {
      writeFile(ideMarkerPath, JSON.stringify({ configured: true, ide: ideId }, null, 2));
      log.success(`Created IDE marker: ${ideId}.json`);
      idempotencyCounters.added++;
    } else {
      idempotencyCounters.preserved++;
    }
  }
  
  // Remove markers for unselected IDEs
  for (const ideId of existingMarkers) {
    if (!selectedSet.has(ideId)) {
      const markerPath = path.join(agentfileDir, `${ideId}.json`);
      const { unlinkSync } = require('fs');
      try {
        unlinkSync(markerPath);
        log.success(`Removed IDE marker: ${ideId}.json`);
      } catch (e) {
        // ignore
      }
    }
  }
  log.success(`IDE markers ready for: ${selectedIdes.join(', ')}`);

  // ── Install IDE wrapper files (idempotent) ───────────────────────────────────
  // Check if installation is actually complete, not just config status
  const { getInstalledIdes } = require('../installers');
  const actuallyInstalled = getInstalledIdes(cwd);
  
  // Load existing config to compare
  const existingConfigResultCheck = await readFileAsync(configPath);
  let existingIdes = [];
  if (existingConfigResultCheck.success) {
    try {
      const existingConfig = JSON.parse(existingConfigResultCheck.content);
      existingIdes = existingConfig.configured_ides || [];
    } catch (e) {
      // parse failed, treat as empty
    }
  }
  
  // Install if:
  // 1. Selection changed from existing config, OR
  // 2. Configured IDEs don't match actually installed IDEs (incomplete installation)
  const configChanged = JSON.stringify(existingIdes.sort()) !== JSON.stringify(selectedIdes.sort());
  const installationIncomplete = JSON.stringify(selectedIdes.sort()) !== JSON.stringify(actuallyInstalled.sort());
  const shouldInstall = configChanged || installationIncomplete;
  
  if (shouldInstall) {
    if (installationIncomplete && !configChanged) {
      log.step('Detected incomplete IDE installation - fixing...');
    }
    const installResult = await installIdes(cwd, agentfileDir, selectedIdes);
    if (installResult.success) {
      log.success(`IDE wrapper files updated for: ${installResult.installed.join(', ')}`);
      // Aggregate IDE idempotency counters
      if (installResult.idempotency) {
        idempotencyCounters.preserved += installResult.idempotency.preserved || 0;
        idempotencyCounters.added += installResult.idempotency.added || 0;
      }
    } else {
      log.warn(`Some IDE wrappers failed: ${installResult.failed.map(f => f.ide).join(', ')}`);
    }
  } else {
    log.success('IDE wrapper files unchanged - skipping installation');
  }

  // ── Copy IDE-specific templates (idempotent) ─────────────────────────────────
  // Only copy if selection changed
  if (configChanged) {
  // Copy templates from cli/src/templates/<ide>/ to IDE config directories
  // Only copies if destination doesn't exist (preserves user customizations)
  const ideTemplateDirs = {
    windsurf: '.windsurf/workflows/',
    cursor: '.cursor/',
    kilocode: '.kilocode/',
    'github-copilot': '.github/prompts/',
    cline: '.clinerules',  // Special case: single file destination
  };

  for (const ideId of selectedIdes) {
    const templateSourceDir = path.join(__dirname, '..', 'templates', ideId);
    const templateDestDir = ideTemplateDirs[ideId];

    if (!templateDestDir) {
      continue; // Skip unknown IDEs
    }

    // Check if template source directory exists
    if (!existsSync(templateSourceDir)) {
      log.warn(`No template directory found for ${ideId}: ${templateSourceDir}`);
      continue; // No templates for this IDE
    }

    // Handle Cline as a special case (single file destination)
    if (ideId === 'cline') {
      const srcFilePath = path.join(templateSourceDir, 'clinerules');
      const destFilePath = path.join(cwd, templateDestDir);
      
      if (existsSync(destFilePath)) {
        idempotencyCounters.templatesPreserved++;
      } else if (existsSync(srcFilePath)) {
        const copyResult = await copyFileAsync(srcFilePath, destFilePath);
        if (copyResult.success) {
          log.success(`Copied IDE template: cline/clinerules`);
          idempotencyCounters.templatesAdded++;
        } else {
          log.warn(`Failed to copy cline/clinerules: ${copyResult.error?.message}`);
        }
      }
      continue;
    }

    const destPath = path.join(cwd, templateDestDir);

    // Ensure destination directory exists
    const dirResult = ensureDir(destPath);
    if (!dirResult.success) {
      log.warn(`Failed to create directory for ${ideId}: ${dirResult.error?.message}`);
      continue;
    }

    // Copy all template files recursively (idempotent - skip if destination exists)
    try {
      const templateFiles = getAllFilesRecursive(templateSourceDir);
      for (const templateFile of templateFiles) {
        const srcFilePath = templateFile.absolutePath;
        const destFilePath = path.join(destPath, templateFile.relativePath);

        // Skip if destination already exists (preserve user customizations)
        if (existsSync(destFilePath)) {
          idempotencyCounters.templatesPreserved++;
          continue;
        }

        // Copy the file
        const copyResult = await copyFileAsync(srcFilePath, destFilePath);
        if (copyResult.success) {
          log.success(`Copied IDE template: ${ideId}/${templateFile}`);
          idempotencyCounters.templatesAdded++;
        } else {
          log.warn(`Failed to copy ${ideId}/${templateFile}: ${copyResult.error.message}`);
        }
      }
    } catch (err) {
      log.warn(`Error copying templates for ${ideId}: ${err.message}`);
    }
  }
  } // end if (selectionChanged)

  // ── Idempotency Report ───────────────────────────────────────────────────────
  if (isIdempotentRun) {
    const totalPreserved = idempotencyCounters.preserved + idempotencyCounters.templatesPreserved;
    const totalAdded = idempotencyCounters.added + idempotencyCounters.templatesAdded;

    console.log('');
    console.log(chalk.bold.blue('  Idempotent Re-Run Report'));
    console.log('');
    console.log(`  ${chalk.green('✓')} Preserved: ${chalk.cyan(totalPreserved)} files`);
    console.log(`  ${chalk.green('+')} Added: ${chalk.cyan(totalAdded)} files`);
    console.log('');

    if (totalAdded === 0) {
      console.log(chalk.bold.green('  Already up to date!'));
    }
    console.log('');
  }

  // ── Done ───────────────────────────────────────────────────────────────────
  console.log('');
  console.log(chalk.bold.green('  Project initialized successfully!'));
  console.log('');
  console.log('  Configured IDEs: ' + chalk.cyan(selectedIdes.join(', ')));
  console.log('');
  console.log('  Next steps:');
  console.log(chalk.cyan('    agentfile create my-first-workflow'));
  console.log(chalk.cyan('    agentfile list'));
  console.log('');
};
