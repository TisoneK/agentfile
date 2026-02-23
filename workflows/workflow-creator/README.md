# Workflow Creator

A comprehensive workflow that helps you create new Agentfile workflows by guiding you through the design process and generating all necessary files.

## Purpose
This workflow assists in creating new Agentfile workflows by:
- Analyzing your requirements
- Designing the workflow structure
- Generating agents, skills, and scripts
- Creating the workflow.yaml configuration
- Setting up proper directory structure

## Structure
- **4 Agents**: analyst.md, architect.md, generator.md, reviewer.md
- **8 Skills**: Various generation and design skills
- **Dual Scripts**: IDE instructions + CLI runtime scripts
- **Multiple Steps**: Analysis → Design → Generation → Review

## Usage

### IDE Execution
```
/agentfile:create security-scanner I need a workflow that analyzes code for security vulnerabilities
```

**IDE Processing Instructions:**
1. This workflow uses `execution.preferred: "ide"` 
2. Load agents from `agents/*.md` as system prompts
3. Load skills from `skills/*.md` as context
4. Execute steps sequentially using your LLM
5. **NEVER** execute scripts - use IDE instructions from `scripts/ide/`
6. Process input directly as text requirements
7. Follow detailed steps in `scripts/ide/instructions.md` and `scripts/ide/steps.md`

### CLI Execution
```bash
agentfile run workflow-creator --input "I need a workflow that analyzes code for security vulnerabilities"
```

## Input
A description of the workflow you want to create, including:
- Purpose and goals
- Required agents and skills
- Input/output requirements
- Any specific constraints or preferences

## Output
- Complete workflow directory structure
- `workflow.yaml` configuration file
- Agent definitions in `agents/` directory
- Skill definitions in `skills/` directory
- Scripts in `scripts/` directory (if needed)
- README.md documentation

## Example
Input: `/agentfile:create pr-reviewer Create a workflow that reviews pull requests for code quality, security, and performance issues`
Output: A complete `pr-reviewer` workflow with agents for analysis, security scanning, and reporting.

## Key Features
- **Comprehensive**: Handles entire workflow creation process
- **Interactive**: Asks clarifying questions to refine requirements
- **Best Practices**: Follows Agentfile conventions and patterns
- **Multi-Platform**: Generates both Bash and PowerShell scripts
- **Quality Focused**: Includes review step to ensure quality
- **Educational**: Provides explanations for generated components
