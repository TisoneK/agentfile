/**
 * CLI Parser Module
 * 
 * Provides command parsing for agentfile CLI
 * 
 * @module cli-parser
 */

/**
 * Valid agentfile commands
 * @private
 */
const VALID_COMMANDS = [
  'run',
  'init',
  'validate',
  'create',
  'list',
  'help',
  'version',
  'approve',
  'promote'
];

/**
 * Help text for each command
 * @private
 */
const COMMAND_HELP = {
  'run': 'run <workflow> [options]    Run a workflow',
  'init': 'init [options]            Initialize a new project',
  'validate': 'validate <target> [options]  Validate a workflow or story',
  'create': 'create <type> <name>    Create an agent, module, workflow, or story',
  'list': 'list [type]               List available workflows or agents',
  'help': 'help [command]            Show help for a command',
  'version': 'version                 Show version information',
  'approve': 'approve <step>          Approve a workflow step',
  'promote': 'promote <workflow>     Promote a workflow to production'
};

/**
 * Valid subcommands per command
 * @private
 */
const VALID_SUBCOMMANDS = {
  'create': ['agent', 'module', 'workflow', 'story'],
  'validate': ['create-story', 'workflow'],
  'run': ['workflow']
};

/**
 * Parse CLI arguments from process.argv
 * @param {string[]} [args=process.argv] - Arguments to parse (defaults to process.argv)
 * @returns {Promise<object>} Parsed command result
 */
async function parseCommand(args = process.argv) {
  // Validate args
  if (!Array.isArray(args)) {
    return {
      success: false,
      error: {
        code: 'CLI_PARSE_ERROR',
        message: 'Arguments must be an array',
        details: { operation: 'parseCommand', expectedType: 'array', receivedType: typeof args }
      }
    };
  }

  // Require explicit args - process.argv can cause issues in test environments
  if (args.length === 0 || (args === process.argv && args.length > 0 && !args[0].includes('node'))) {
    // If args looks like it might be process.argv without proper node path, require explicit array
    if (args === process.argv && args.length > 0) {
      return {
        success: false,
        error: {
          code: 'CLI_PARSE_ERROR',
          message: 'Explicit arguments array required. Do not use process.argv directly.',
          details: { operation: 'parseCommand', hint: 'Pass process.argv.slice(2) instead of process.argv' }
        }
      };
    }
  }

  // Skip first two elements (node and script path)
  const rawArgs = args.slice(2);
  const rawArgsOriginal = [...rawArgs];

  // Handle empty arguments
  if (rawArgs.length === 0) {
    return {
      success: true,
      command: null,
      subcommand: null,
      args: [],
      options: {},
      rawArgs: rawArgsOriginal
    };
  }

  // Parse command and subcommand
  const command = rawArgs[0];
  
  // Check if command is valid
  if (!VALID_COMMANDS.includes(command)) {
    return detectUnknownCommand(command, VALID_COMMANDS);
  }

  // Handle help command specially - return help info in response
  if (command === 'help') {
    const helpTarget = rawArgs[1];
    let helpMessage = '';
    
    if (helpTarget && COMMAND_HELP[helpTarget]) {
      helpMessage = COMMAND_HELP[helpTarget];
    } else if (!helpTarget) {
      helpMessage = Object.values(COMMAND_HELP).join('\n');
    }
    
    return {
      success: true,
      command: 'help',
      subcommand: helpTarget || null,
      args: helpTarget && !COMMAND_HELP[helpTarget] ? [helpTarget] : [],
      options: {},
      rawArgs: rawArgsOriginal,
      help: helpMessage
    };
  }

  // Check for subcommand
  let subcommand = null;
  let argIndex = 1;

  if (rawArgs.length > 1) {
    const potentialSubcommand = rawArgs[1];
    const validSubcommands = VALID_SUBCOMMANDS[command];
    if (validSubcommands && validSubcommands.includes(potentialSubcommand)) {
      subcommand = potentialSubcommand;
      argIndex = 2;
    }
  }

  // Get remaining args after command/subcommand
  const remainingArgs = rawArgs.slice(argIndex);
  
  // Parse remaining args into positional args and options
  const parsed = parseRemainingArgs(remainingArgs);
  if (!parsed.success) {
    return parsed;
  }

  return {
    success: true,
    command,
    subcommand,
    args: parsed.args,
    options: parsed.options,
    rawArgs: rawArgsOriginal
  };
}

/**
 * Detect unknown command and generate helpful error message
 * @private
 * @param {string} command - The unknown command
 * @param {string[]} validCommands - List of valid commands
 * @returns {object} Error result
 */
function detectUnknownCommand(command, validCommands) {
  // Find similar commands for suggestions
  const suggestions = findSimilarCommands(command, validCommands);
  
  let message = `Unknown command: '${command}'`;
  if (suggestions.length > 0) {
    message += `. Did you mean: ${suggestions.join(', ')}?`;
  } else {
    message += `. Available commands: ${validCommands.join(', ')}`;
  }

  return {
    success: false,
    error: {
      code: 'CLI_UNKNOWN_COMMAND',
      message,
      details: {
        command,
        validCommands,
        suggestions
      }
    }
  };
}

/**
 * Find similar commands using simple string matching
 * @private
 * @param {string} input - Input command
 * @param {string[]} commands - Valid commands
 * @returns {string[]} Similar commands
 */
function findSimilarCommands(input, commands) {
  if (!input || input.length < 3) return [];
  
  const inputLower = input.toLowerCase();
  
  return commands
    .filter(cmd => {
      // Same first letter
      if (cmd[0] === inputLower[0]) return true;
      // Contains input as substring
      if (cmd.includes(inputLower)) return true;
      // Levenshtein distance check for similar length
      if (Math.abs(cmd.length - input.length) <= 2) {
        return calculateLevenshteinDistance(cmd, inputLower) <= 2;
      }
      return false;
    })
    .slice(0, 3);
}

/**
 * Calculate Levenshtein distance between two strings
 * @private
 * @param {string} a - First string
 * @param {string} b - Second string
 * @returns {number} Distance
 */
function calculateLevenshteinDistance(a, b) {
  const matrix = [];
  
  for (let i = 0; i <= b.length; i++) {
    matrix[i] = [i];
  }
  
  for (let j = 0; j <= a.length; j++) {
    matrix[0][j] = j;
  }
  
  for (let i = 1; i <= b.length; i++) {
    for (let j = 1; j <= a.length; j++) {
      if (b.charAt(i - 1) === a.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1,
          matrix[i][j - 1] + 1,
          matrix[i - 1][j] + 1
        );
      }
    }
  }
  
  return matrix[b.length][a.length];
}

// Flags that commonly expect values
const VALUE_FLAGS = ['name', 'output', 'config', 'file', 'n', 'o', 'c', 'f'];

/**
 * Parse remaining arguments into positional args and options
 * @private
 * @param {string[]} args - Arguments to parse
 * @returns {object} Parsed result with args and options
 */
function parseRemainingArgs(args) {
  const result = {
    args: [],
    options: {}
  };

  if (!args || args.length === 0) {
    return { success: true, ...result };
  }

  let i = 0;
  while (i < args.length) {
    const arg = args[i];

    // Check for long option flags (--flag or --flag=value)
    if (arg.startsWith('--')) {
      const option = parseLongFlag(arg);
      if (option.error) {
        return {
          success: false,
          error: {
            code: 'CLI_INVALID_ARGS',
            message: option.error,
            details: { operation: 'parseRemainingArgs', arg }
          }
        };
      }
      
      if (option.hasValue) {
        result.options[option.name] = option.value;
        i++;
        continue;
      } else if (VALUE_FLAGS.includes(option.name) && i + 1 < args.length && !args[i + 1].startsWith('-')) {
        // Known value flag and next arg is the value (not a flag)
        result.options[option.name] = args[i + 1];
        i += 2;
        continue;
      } else {
        // Boolean flag
        result.options[option.name] = true;
        i++;
        continue;
      }
    }

    // Check for short option flags (-f or -f value)
    if (arg.startsWith('-')) {
      const option = parseShortFlag(arg);
      if (option.error) {
        return {
          success: false,
          error: {
            code: 'CLI_INVALID_ARGS',
            message: option.error,
            details: { operation: 'parseRemainingArgs', arg }
          }
        };
      }

      if (option.hasValue) {
        result.options[option.name] = option.value;
        i++;
        continue;
      } else if (VALUE_FLAGS.includes(option.name) && i + 1 < args.length && !args[i + 1].startsWith('-')) {
        // Known value flag and next arg is the value (not a flag)
        result.options[option.name] = args[i + 1];
        i += 2;
        continue;
      } else {
        // Boolean flag
        result.options[option.name] = true;
        i++;
        continue;
      }
    }

    // Check for quoted arguments (handles spaces within quotes)
    // This check must come AFTER option parsing to avoid consuming option values
    if (isQuoted(arg)) {
      result.args.push(extractQuotedValue(arg));
      i++;
      continue;
    }

    // Positional argument
    result.args.push(arg);
    i++;
  }

  return { success: true, ...result };
}

/**
 * Check if argument is quoted
 * @private
 * @param {string} arg - Argument to check
 * @returns {boolean} True if quoted
 */
function isQuoted(arg) {
  if (!arg || arg.length < 2) return false;
  const first = arg[0];
  const last = arg[arg.length - 1];
  return (first === '"' && last === '"') || (first === "'" && last === "'");
}

/**
 * Extract value from quoted argument
 * @private
 * @param {string} arg - Quoted argument
 * @returns {string} Unquoted value
 */
function extractQuotedValue(arg) {
  if (arg.length <= 2) return '';
  return arg.slice(1, -1);
}

/**
 * Parse long flag (--flag or --flag=value)
 * @private
 * @param {string} flag - Flag string
 * @returns {object} Parsed flag result
 */
function parseLongFlag(flag) {
  const flagStr = flag.slice(2);
  
  if (flagStr.includes('=')) {
    const [name, ...valueParts] = flagStr.split('=');
    return {
      name: name.toLowerCase(),
      value: valueParts.join('='),
      hasValue: true
    };
  }
  
  return {
    name: flagStr.toLowerCase(),
    hasValue: false
  };
}

/**
 * Parse short flag (-f or -f value)
 * @private
 * @param {string} flag - Flag string
 * @returns {object} Parsed flag result
 */
function parseShortFlag(flag) {
  const flagStr = flag.slice(1);
  
  if (flagStr.length > 1) {
    const lastChar = flagStr[flagStr.length - 1];
    if (lastChar === '=') {
      const name = flagStr.slice(0, -1);
      return { name, value: '', hasValue: true };
    }
  }
  
  return {
    name: flagStr.toLowerCase(),
    hasValue: false
  };
}

/**
 * Parse arguments array into positional args and options
 * @param {string[]} args - Arguments to parse
 * @returns {Promise<object>} Parsed result
 */
async function parseArguments(args) {
  // Validate args
  if (!Array.isArray(args)) {
    return {
      success: false,
      error: {
        code: 'CLI_INVALID_ARGS',
        message: 'Arguments must be an array',
        details: { operation: 'parseArguments', expectedType: 'array', receivedType: typeof args }
      }
    };
  }

  // Parse using the existing parser
  const parsed = parseRemainingArgs(args);
  
  if (!parsed.success) {
    return parsed;
  }

  return {
    success: true,
    args: parsed.args,
    options: parsed.options
  };
}

// Export functions
module.exports = {
  parseCommand,
  parseArguments,
  detectUnknownCommand
};
