/**
 * CLI Parser Module Tests
 * @module cli-parser.test
 */

const { parseCommand, parseArguments, detectUnknownCommand } = require('./cli-parser');

jest.setTimeout(5000);

// Helper to build a full argv array the way Node.js provides it
const argv = (...parts) => ['node', 'agentfile', ...parts];


// ─── parseCommand ────────────────────────────────────────────────────────────

describe('parseCommand', () => {

  // Input validation
  it('rejects non-array input', async () => {
    const r = await parseCommand('run');
    expect(r.success).toBe(false);
    expect(r.error.code).toBe('CLI_PARSE_ERROR');
  });

  it('rejects null input', async () => {
    const r = await parseCommand(null);
    expect(r.success).toBe(false);
    expect(r.error.code).toBe('CLI_PARSE_ERROR');
  });

  // Empty / no command
  it('returns null command when no args are provided', async () => {
    const r = await parseCommand(argv());
    expect(r.success).toBe(true);
    expect(r.command).toBeNull();
    expect(r.subcommand).toBeNull();
    expect(r.args).toEqual([]);
    expect(r.options).toEqual({});
  });

  // Valid top-level commands
  it.each(['run', 'init', 'validate', 'create', 'list', 'help', 'version', 'approve', 'promote'])(
    'accepts valid command: %s',
    async (cmd) => {
      const r = await parseCommand(argv(cmd));
      expect(r.success).toBe(true);
      expect(r.command).toBe(cmd);
    }
  );

  // Unknown commands
  it('rejects an unknown command', async () => {
    const r = await parseCommand(argv('explode'));
    expect(r.success).toBe(false);
    expect(r.error.code).toBe('CLI_UNKNOWN_COMMAND');
  });

  it('includes suggestions when the typo is close to a real command', async () => {
    const r = await parseCommand(argv('rnu')); // close to 'run'
    expect(r.success).toBe(false);
    expect(r.error.details.suggestions.length).toBeGreaterThan(0);
  });

  // Subcommands
  it('parses a valid subcommand', async () => {
    const r = await parseCommand(argv('create', 'agent'));
    expect(r.success).toBe(true);
    expect(r.command).toBe('create');
    expect(r.subcommand).toBe('agent');
  });

  it('treats an unrecognised subcommand as a positional arg', async () => {
    const r = await parseCommand(argv('create', 'robot'));
    expect(r.success).toBe(true);
    expect(r.subcommand).toBeNull();
    expect(r.args).toContain('robot');
  });

  it('parses all valid create subcommands', async () => {
    for (const sub of ['agent', 'module', 'workflow', 'story']) {
      const r = await parseCommand(argv('create', sub));
      expect(r.subcommand).toBe(sub);
    }
  });

  // Positional args
  it('collects positional args after the command', async () => {
    const r = await parseCommand(argv('run', 'workflow-a', 'workflow-b'));
    expect(r.success).toBe(true);
    expect(r.args).toEqual(['workflow-a', 'workflow-b']);
  });

  // Long flags
  it('parses a boolean long flag (--verbose)', async () => {
    const r = await parseCommand(argv('run', '--verbose'));
    expect(r.options).toEqual({ verbose: true });
  });

  it('parses a long flag with = syntax (--name=foo)', async () => {
    const r = await parseCommand(argv('run', '--name=my-workflow'));
    expect(r.options).toEqual({ name: 'my-workflow' });
  });

  it('parses a long flag with space-separated value (--name foo)', async () => {
    const r = await parseCommand(argv('run', '--name', 'my-workflow'));
    expect(r.options).toEqual({ name: 'my-workflow' });
  });

  it('handles = sign inside the value (--name=a=b)', async () => {
    const r = await parseCommand(argv('run', '--name=a=b'));
    expect(r.options.name).toBe('a=b');
  });

  // Short flags
  it('parses a boolean short flag (-v)', async () => {
    const r = await parseCommand(argv('run', '-v'));
    expect(r.options).toEqual({ v: true });
  });

  it('parses a short flag with space-separated value (-n foo)', async () => {
    const r = await parseCommand(argv('run', '-n', 'my-workflow'));
    expect(r.options).toEqual({ n: 'my-workflow' });
  });

  // Quoted values
  it('strips double quotes from a positional arg', async () => {
    const r = await parseCommand(argv('run', '"hello world"'));
    expect(r.args).toEqual(['hello world']);
  });

  it('strips single quotes from a positional arg', async () => {
    const r = await parseCommand(argv('run', "'hello world'"));
    expect(r.args).toEqual(['hello world']);
  });

  // Mixed args
  it('separates positional args from flags in a mixed input', async () => {
    const r = await parseCommand(argv('run', 'wf1', '--verbose', 'wf2', '-n', 'test'));
    expect(r.success).toBe(true);
    expect(r.args).toEqual(['wf1', 'wf2']);
    expect(r.options).toEqual({ verbose: true, n: 'test' });
  });

  // rawArgs
  it('preserves rawArgs exactly as supplied (minus node/script)', async () => {
    const r = await parseCommand(argv('run', '--verbose', 'wf1'));
    expect(r.rawArgs).toEqual(['run', '--verbose', 'wf1']);
  });

  // Help command
  it('returns help info for general help', async () => {
    const r = await parseCommand(argv('help'));
    expect(r.success).toBe(true);
    expect(r.command).toBe('help');
    expect(r.help).toBeDefined();
    expect(r.help).toContain('run');
  });

  it('returns help info for specific command', async () => {
    const r = await parseCommand(argv('help', 'run'));
    expect(r.success).toBe(true);
    expect(r.command).toBe('help');
    expect(r.subcommand).toBe('run');
    expect(r.help).toBe('run <workflow> [options]    Run a workflow');
  });
});


// ─── parseArguments ──────────────────────────────────────────────────────────

describe('parseArguments', () => {

  it('rejects non-array input', async () => {
    const r = await parseArguments('oops');
    expect(r.success).toBe(false);
    expect(r.error.code).toBe('CLI_INVALID_ARGS');
  });

  it('handles an empty array', async () => {
    const r = await parseArguments([]);
    expect(r.success).toBe(true);
    expect(r.args).toEqual([]);
    expect(r.options).toEqual({});
  });

  it('separates positional args from flags', async () => {
    const r = await parseArguments(['wf1', '--verbose', 'wf2', '-n', 'test']);
    expect(r.success).toBe(true);
    expect(r.args).toEqual(['wf1', 'wf2']);
    expect(r.options).toEqual({ verbose: true, n: 'test' });
  });

  it('parses only flags with no positional args', async () => {
    const r = await parseArguments(['--dry-run', '--output=json']);
    expect(r.success).toBe(true);
    expect(r.args).toEqual([]);
    expect(r.options['dry-run']).toBe(true);
    expect(r.options.output).toBe('json');
  });

  it('parses only positional args with no flags', async () => {
    const r = await parseArguments(['alpha', 'beta', 'gamma']);
    expect(r.success).toBe(true);
    expect(r.args).toEqual(['alpha', 'beta', 'gamma']);
    expect(r.options).toEqual({});
  });
});


// ─── detectUnknownCommand ────────────────────────────────────────────────────

describe('detectUnknownCommand', () => {
  const validCmds = ['run', 'init', 'validate', 'create', 'help'];

  it('always returns success: false', () => {
    const r = detectUnknownCommand('anything', validCmds);
    expect(r.success).toBe(false);
  });

  it('sets error code to CLI_UNKNOWN_COMMAND', () => {
    const r = detectUnknownCommand('xyz', validCmds);
    expect(r.error.code).toBe('CLI_UNKNOWN_COMMAND');
  });

  it('echoes the unknown command in error details', () => {
    const r = detectUnknownCommand('xyz', validCmds);
    expect(r.error.details.command).toBe('xyz');
  });

  it('suggests "run" when input is "rnu"', () => {
    const r = detectUnknownCommand('rnu', validCmds);
    expect(r.error.details.suggestions).toContain('run');
  });

  it('suggests "init" when input is "iint"', () => {
    const r = detectUnknownCommand('iint', validCmds);
    expect(r.error.details.suggestions).toContain('init');
  });

  it('returns an empty suggestions array for a completely unrelated input', () => {
    // "zz" is too short (< 3 chars) to trigger similarity checks
    const r = detectUnknownCommand('zz', validCmds);
    expect(r.error.details.suggestions).toEqual([]);
  });

  it('includes the full list of valid commands in details', () => {
    const r = detectUnknownCommand('oops', validCmds);
    expect(r.error.details.validCommands).toEqual(validCmds);
  });
});
