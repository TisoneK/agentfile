'use strict';

const chalk = require('chalk');
const { log } = require('../lib/utils');

// IDE configurations
const IDE_CONFIGS = {
  cursor: {
    name: 'Cursor',
    instructions: `# Agentfile Integration for Cursor

Add this to your Cursor rules file (.cursor/rules):

\`\`\`markdown
# Agentfile Workflow Integration
When you see /agentfile-run:<workflow-name>, execute the workflow:

1. Read workflows/<workflow-name>/workflow.yaml to understand steps
2. Load agent definitions from workflows/<workflow-name>/agents/*.md as system prompts
3. Load skill instructions from workflows/<workflow-name>/skills/*.md into user prompt context
4. Execute each step sequentially using the provided input
5. Follow the exact output format specified in each agent file

Example execution:
- User: "/agentfile-run:code-reviewer\\nInput: src/components/Button.js"
- You: Load workflow.yaml, become the code reviewer agent, apply code analysis skills, review the file
\`\`\`

## Usage Examples
\`\`\`
/agentfile-run:hello-world
Input: recursion

/agentfile-run:code-reviewer  
Input: src/auth.js

/agentfile-run:slash-demo
Input: artificial intelligence
\`\`\``,
    location: `.cursor/rules`,
    notes: 'Restart Cursor after adding the rules'
  },

  windsurf: {
    name: 'Windsurf',
    instructions: `# Agentfile Integration for Windsurf

Add this to your Windsurf cascade or rules file:

\`\`\`markdown
# Agentfile Workflow Integration
When you see /agentfile-run:<workflow-name>, execute the workflow:

1. Read workflows/<workflow-name>/workflow.yaml to understand steps
2. Load agent definitions from workflows/<workflow-name>/agents/*.md as system prompts
3. Load skill instructions from workflows/<workflow-name>/skills/*.md into user prompt context
4. Execute each step sequentially using the provided input
5. Follow the exact output format specified in each agent file

## Usage Examples
/agentfile-run:hello-world
Input: recursion

/agentfile-run:code-reviewer
Input: src/components/Button.js
\`\`\``,
    location: 'Windsurf settings or cascade rules',
    notes: 'Check Windsurf documentation for exact rules file location'
  },

  copilot: {
    name: 'GitHub Copilot',
    instructions: `# Agentfile Integration for GitHub Copilot

Add this to your GitHub Copilot workspace instructions:

\`\`\`markdown
# Agentfile Workflow Integration
When you see /agentfile-run:<workflow-name>, execute the workflow:

1. Read workflows/<workflow-name>/workflow.yaml to understand steps
2. Load agent definitions from workflows/<workflow-name>/agents/*.md as system prompts
3. Load skill instructions from workflows/<workflow-name>/skills/*.md into user prompt context
4. Execute each step sequentially using the provided input
5. Follow the exact output format specified in each agent file

## Usage Examples
/agentfile-run:hello-world
Input: recursion
\`\`\``,
    location: 'GitHub Copilot workspace instructions',
    notes: 'Settings → Workspace → Instructions'
  },

  claude: {
    name: 'Claude Code',
    instructions: `# Agentfile Integration for Claude Code

Use this command to enable Agentfile workflows:

\`\`\`bash
claude "When you see /agentfile-run:<workflow-name>, execute the workflow by reading workflows/<workflow-name>/workflow.yaml, loading agents and skills, and running steps sequentially with the provided input."
\`\`\`

Or add to your Claude Code configuration:

\`\`\`markdown
# Agentfile Workflow Integration
When you see /agentfile-run:<workflow-name>, execute the workflow:

1. Read workflows/<workflow-name>/workflow.yaml to understand steps
2. Load agent definitions from workflows/<workflow-name>/agents/*.md as system prompts
3. Load skill instructions from workflows/<workflow-name>/skills/*.md into user prompt context
4. Execute each step sequentially using the provided input
5. Follow the exact output format specified in each agent file
\`\`\``,
    location: 'Claude Code configuration or command line',
    notes: 'Use the claude command or update your config file'
  },

  cline: {
    name: 'Cline',
    instructions: `# Agentfile Integration for Cline

Add this to your Cline system prompt:

\`\`\`markdown
# Agentfile Workflow Integration
When you see /agentfile-run:<workflow-name>, execute the workflow:

1. Read workflows/<workflow-name>/workflow.yaml to understand steps
2. Load agent definitions from workflows/<workflow-name>/agents/*.md as system prompts
3. Load skill instructions from workflows/<workflow-name>/skills/*.md into user prompt context
4. Execute each step sequentially using the provided input
5. Follow the exact output format specified in each agent file

## Usage Examples
/agentfile-run:hello-world
Input: recursion
\`\`\``,
    location: 'Cline system prompt',
    notes: 'Settings → Custom Instructions'
  },

  roo: {
    name: 'Roo',
    instructions: `# Agentfile Integration for Roo

Add this to your Roo system prompt:

\`\`\`markdown
# Agentfile Workflow Integration
When you see /agentfile-run:<workflow-name>, execute the workflow:

1. Read workflows/<workflow-name>/workflow.yaml to understand steps
2. Load agent definitions from workflows/<workflow-name>/agents/*.md as system prompts
3. Load skill instructions from workflows/<workflow-name>/skills/*.md into user prompt context
4. Execute each step sequentially using the provided input
5. Follow the exact output format specified in each agent file

## Usage Examples
/agentfile-run:hello-world
Input: recursion
\`\`\``,
    location: 'Roo system prompt',
    notes: 'Settings → System Prompt'
  }
};

module.exports = async function setupIde(ideName) {
  const ide = ideName ? ideName.toLowerCase() : null;
  
  if (!ide) {
    console.log(chalk.bold.cyan('\n  Agentfile IDE Setup'));
    console.log(chalk.gray('  Generate integration instructions for your IDE\n'));
    
    console.log(chalk.bold('\n  Supported IDEs:'));
    Object.keys(IDE_CONFIGS).forEach(key => {
      const config = IDE_CONFIGS[key];
      console.log(`  ${chalk.cyan(key.padEnd(10))} - ${config.name}`);
    });
    
    console.log(chalk.bold('\n  Usage:'));
    console.log(`  ${chalk.gray('agentfile setup-ide <ide-name>')}`);
    console.log(chalk.gray('\n  Example: agentfile setup-ide cursor'));
    return;
  }
  
  const config = IDE_CONFIGS[ide];
  if (!config) {
    log.error(`IDE "${ideName}" not supported.`);
    log.info('Supported IDEs: ' + Object.keys(IDE_CONFIGS).join(', '));
    process.exit(1);
  }
  
  console.log(chalk.bold.cyan(`\n  ${config.name} Integration`));
  console.log(chalk.gray(`  Location: ${config.location}\n`));
  
  console.log(chalk.bold('  Instructions:'));
  console.log(config.instructions);
  
  if (config.notes) {
    console.log(chalk.bold('\n  Notes:'));
    console.log(chalk.gray(`  ${config.notes}`));
  }
  
  console.log(chalk.bold('\n  Usage Examples:'));
  console.log(chalk.gray('  /agentfile-run:hello-world'));
  console.log(chalk.gray('  Input: recursion'));
  console.log('');
  console.log(chalk.gray('  /agentfile-run:code-reviewer'));
  console.log(chalk.gray('  Input: src/components/Button.js'));
  console.log('');
  
  console.log(chalk.green('\n  ✓ Setup complete! Start using slash commands in your IDE.'));
};
