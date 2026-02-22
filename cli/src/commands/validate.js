'use strict';

const fs    = require('fs');
const path  = require('path');
const chalk = require('chalk');
const yaml  = require('js-yaml');
const Ajv   = require('ajv');
const { log, findProjectRoot, findWorkflow, listWorkflows } = require('../lib/utils');

module.exports = async function validate(workflowName, opts) {
  const projectRoot = findProjectRoot();
  if (!projectRoot) {
    log.error('No Agentfile project found. Run `agentfile init` first.');
    process.exit(1);
  }

  // ── Load JSON schema ────────────────────────────────────────────────────────
  const schemaPath = path.join(__dirname, '../../../schema/workflow.schema.json');
  let schema;
  try {
    schema = JSON.parse(fs.readFileSync(schemaPath, 'utf8'));
  } catch (_) {
    log.warn('workflow.schema.json not found — skipping schema validation.');
    schema = null;
  }

  const ajv = schema ? new Ajv({ allErrors: true }) : null;
  const validateSchema = ajv && schema ? ajv.compile(schema) : null;

  // ── Determine which workflows to validate ───────────────────────────────────
  const workflows = workflowName
    ? [findWorkflow(projectRoot, workflowName)].filter(Boolean)
    : listWorkflows(projectRoot, true);

  if (workflows.length === 0) {
    log.error(workflowName
      ? `Workflow "${workflowName}" not found.`
      : 'No workflows found to validate.');
    process.exit(1);
  }

  let allPassed = true;

  for (const w of workflows) {
    console.log(chalk.bold(`\n  Validating: ${chalk.cyan(w.name)}`));

    const errors   = [];
    const warnings = [];
    const passed   = [];

    // ── Parse workflow.yaml ──────────────────────────────────────────────────
    let parsed;
    try {
      const raw = fs.readFileSync(w.yaml, 'utf8');
      parsed = yaml.load(raw);
      passed.push('workflow.yaml is valid YAML');
    } catch (e) {
      errors.push(`workflow.yaml parse error: ${e.message}`);
      printResults(passed, warnings, errors);
      allPassed = false;
      continue;
    }

    // ── Schema validation ────────────────────────────────────────────────────
    if (validateSchema) {
      const valid = validateSchema(parsed);
      if (valid) {
        passed.push('workflow.yaml matches schema');
      } else {
        for (const err of validateSchema.errors) {
          errors.push(`Schema: ${err.instancePath || '/'} ${err.message}`);
        }
      }
    }

    // ── Step checks ──────────────────────────────────────────────────────────
    const steps = parsed.steps || [];
    const stepIds = new Set();

    for (const step of steps) {
      // Unique IDs
      if (stepIds.has(step.id)) {
        errors.push(`Duplicate step id: "${step.id}"`);
      } else {
        stepIds.add(step.id);
      }

      // Agent file exists
      if (step.agent) {
        const agentPath = path.join(w.path, step.agent);
        if (fs.existsSync(agentPath)) {
          passed.push(`Agent exists: ${step.agent}`);
        } else {
          errors.push(`Step "${step.id}": agent file not found: ${step.agent}`);
        }
      }

      // Skill file exists
      if (step.skill) {
        const skillPath = path.join(w.path, step.skill);
        if (fs.existsSync(skillPath)) {
          passed.push(`Skill exists: ${step.skill}`);
        } else {
          errors.push(`Step "${step.id}": skill file not found: ${step.skill}`);
        }
      }

      // Shell step scripts exist
      if (step.action === 'shell' && step.script) {
        if (step.script.bash) {
          const p = path.join(w.path, step.script.bash);
          fs.existsSync(p)
            ? passed.push(`Script exists: ${step.script.bash}`)
            : errors.push(`Step "${step.id}": bash script not found: ${step.script.bash}`);
        }
        if (step.script.pwsh) {
          const p = path.join(w.path, step.script.pwsh);
          fs.existsSync(p)
            ? passed.push(`Script exists: ${step.script.pwsh}`)
            : warnings.push(`Step "${step.id}": pwsh script not found: ${step.script.pwsh}`);
        }
      }

      // produces field
      if (!step.produces && step.action !== 'shell') {
        warnings.push(`Step "${step.id}": missing "produces" field`);
      }
    }

    // ── Run scripts present ───────────────────────────────────────────────────
    const runSh  = path.join(w.path, 'scripts', 'run.sh');
    const runPs1 = path.join(w.path, 'scripts', 'run.ps1');
    fs.existsSync(runSh)
      ? passed.push('scripts/run.sh present')
      : warnings.push('scripts/run.sh not found (reference runtime unavailable for bash)');
    fs.existsSync(runPs1)
      ? passed.push('scripts/run.ps1 present')
      : warnings.push('scripts/run.ps1 not found (reference runtime unavailable for pwsh)');

    // ── outputs gitignored ────────────────────────────────────────────────────
    const gitignore = path.join(w.path, '.gitignore');
    if (fs.existsSync(gitignore) && fs.readFileSync(gitignore, 'utf8').includes('outputs')) {
      passed.push('outputs/ is gitignored');
    } else {
      warnings.push('outputs/ is not gitignored — consider adding it');
    }

    printResults(passed, warnings, errors);
    if (errors.length > 0) allPassed = false;
  }

  // ── Summary ─────────────────────────────────────────────────────────────────
  console.log('');
  if (allPassed) {
    console.log(chalk.bold.green('  ✓ All workflows passed validation.'));
  } else {
    console.log(chalk.bold.red('  ✗ Some workflows have errors. See above.'));
    process.exit(1);
  }
  console.log('');
};

function printResults(passed, warnings, errors) {
  for (const p of passed) {
    console.log(chalk.green('    ✓'), chalk.gray(p));
  }
  for (const w of warnings) {
    console.log(chalk.yellow('    ⚠'), chalk.yellow(w));
  }
  for (const e of errors) {
    console.log(chalk.red('    ✗'), chalk.red(e));
  }

  const status = errors.length > 0
    ? chalk.bold.red('FAIL')
    : warnings.length > 0
      ? chalk.bold.yellow('PASS WITH WARNINGS')
      : chalk.bold.green('PASS');

  console.log(`\n    Status: ${status}`);
}
