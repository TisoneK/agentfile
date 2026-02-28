'use strict';

const inquirer = require('inquirer').createPromptModule();

// Available IDEs (as per story requirements)
const IDE_OPTIONS = [
  { id: 'cursor', name: 'Cursor', checked: true },
  { id: 'windsurf', name: 'Windsurf', checked: true },
  { id: 'vscode', name: 'VS Code', checked: false },
  { id: 'kilocode', name: 'KiloCode', checked: false },
  { id: 'github-copilot', name: 'GitHub Copilot', checked: false },
  { id: 'cline', name: 'Cline', checked: false },
];

/**
 * Interactive IDE selector prompt using inquirer
 * @param {string[]} [existingIdes] - Previously selected IDEs to pre-check
 * @param {Object} [options] - Options for the selector
 * @param {boolean} [options.uninstallMode] - If true, show installed status but start unchecked
 * @returns {Promise<string[]>} Array of selected IDE IDs
 */
async function promptIdeSelector(existingIdes = [], options = {}) {
  const { uninstallMode = false } = options;
  console.log('\n  Select your IDE(s) for this project:\n');
  
  // Get installed IDEs to show (Installed) status
  const { getInstalledIdes } = require('../installers');
  const cwd = process.cwd();
  const installedIdes = getInstalledIdes(cwd);
  
  // For uninstall mode: start with none checked, show installed status
  // For install mode: check configured IDEs, disable installed ones (they're already installed)
  const checkedMap = (uninstallMode || existingIdes.length === 0) 
    ? {}
    : existingIdes.reduce((acc, id) => { acc[id] = true; return acc; }, {});

  try {
    const answers = await inquirer([
      {
        type: 'checkbox',
        name: 'ides',
        message: 'Which IDEs do you use?',
        choices: (() => {
        const choices = IDE_OPTIONS.map(ide => {
          const isInstalled = installedIdes.includes(ide.id);
          let name = ide.name;
          let checked = false;
          let disabled = false;
          
          if (isInstalled) {
            name = `${ide.name} (Installed)`;
            if (uninstallMode) {
              // Uninstall mode: show installed but unchecked so user can select to uninstall
              checked = false;
              disabled = false;
            } else {
              // Install mode: already installed = checked and disabled
              checked = true;
              disabled = true;
            }
          } else if (checkedMap[ide.id]) {
            checked = true;
          } else if (uninstallMode) {
            // Uninstall mode: disable uninstalled IDEs (can't uninstall what's not installed)
            disabled = true;
          }
          
          return {
            name: name,
            value: ide.id,
            checked: checked,
            disabled: disabled,
            installed: isInstalled, // Add for sorting
          };
        });
        
        // In uninstall mode, sort installed IDEs first
        if (uninstallMode) {
          choices.sort((a, b) => {
            if (a.installed && !b.installed) return -1; // a comes first
            if (!a.installed && b.installed) return 1;  // b comes first
            return 0; // maintain original order
          });
        }
        
        return choices;
      })(),
        validate: function(answer) {
          if (answer.length < 1) {
            return 'You must select at least one IDE.';
          }
          return true;
        },
      },
    ]);

    return answers.ides;
  } catch (error) {
    if (error.name === 'ExitPromptError') {
      console.log('\n  Cancelled.');
      process.exit(0);
    }
    throw error;
  }
}

/**
 * Parse IDEs from command-line flag
 * @param {string} ideArg - Comma-separated IDE IDs (e.g., "cursor,windsurf")
 * @returns {string[]} Array of validated IDE IDs
 */
function parseIdeFlag(ideArg) {
  if (!ideArg || ideArg.trim() === '') {
    return [];
  }

  const requested = ideArg.split(',').map(id => id.trim().toLowerCase());
  const validIds = IDE_OPTIONS.map(ide => ide.id);
  const validRequested = requested.filter(id => validIds.includes(id));
  const invalidIds = requested.filter(id => !validIds.includes(id));
  
  // Warn about invalid IDEs
  if (invalidIds.length > 0) {
    console.log(chalk ? `\n  ${chalk.yellow('Warning:')} Invalid IDE(s) ignored: ${invalidIds.join(', ')}` : `\n  Warning: Invalid IDE(s) ignored: ${invalidIds.join(', ')}`);
    console.log(chalk ? `  Valid options: ${validIds.join(', ')}\n` : `  Valid options: ${validIds.join(', ')}\n`);
  }

  return validRequested;
}

/**
 * Validate IDE selection
 * @param {string[]} selectedIdeIds 
 * @returns {boolean}
 */
function validateSelection(selectedIdeIds) {
  return selectedIdeIds.length > 0;
}

/**
 * Display confirmation message
 * @param {string[]} selectedIdeIds 
 */
function displayConfirmation(selectedIdeIds) {
  const ideNames = selectedIdeIds
    .map(id => IDE_OPTIONS.find(ide => ide.id === id)?.name || id)
    .join(', ');
  
  console.log(`\n  Selected IDEs: ${ideNames}\n`);
}

/**
 * Get all available IDE options
 * @returns {Array<{id: string, name: string}>}
 */
function getIdeOptions() {
  return IDE_OPTIONS.map(ide => ({ id: ide.id, name: ide.name }));
}

module.exports = {
  promptIdeSelector,
  parseIdeFlag,
  validateSelection,
  displayConfirmation,
  getIdeOptions,
  IDE_OPTIONS,
};
