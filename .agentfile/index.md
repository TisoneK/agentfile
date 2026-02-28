# Agentfile Directory

This directory contains the command definitions and IDE configurations for the Agentfile CLI.

## Files

- `commands.json` - Command definitions and usage information
- `config.json` - Project IDE configuration (generated at init time)
- `{ide}.json` - IDE-specific marker files

## Purpose

This directory serves as the source of truth for:
- Available commands and their usage
- Configured IDEs for the project
- Command metadata used by IDE integrations

## Note

This directory is created and populated by `agentfile init`. On subsequent runs, existing files are preserved and only new files are added.
