'use strict';

/**
 * Unit tests for IDE Selector
 * Tests wizard prompt generation, flag parsing, and validation
 */

const {
  parseIdeFlag,
  validateSelection,
  displayConfirmation,
  getIdeOptions,
  IDE_OPTIONS
} = require('../src/prompts/ide-selector');

describe('IDE Selector', () => {
  describe('parseIdeFlag', () => {
    test('parses single IDE from flag', () => {
      const result = parseIdeFlag('cursor');
      expect(result).toEqual(['cursor']);
    });

    test('parses multiple IDEs from comma-separated flag', () => {
      const result = parseIdeFlag('cursor,windsurf,vscode');
      expect(result).toEqual(['cursor', 'windsurf', 'vscode']);
    });

    test('filters out invalid IDEs', () => {
      const result = parseIdeFlag('cursor,invalid-ide,vscode');
      expect(result).toEqual(['cursor', 'vscode']);
    });

    test('handles empty string', () => {
      const result = parseIdeFlag('');
      expect(result).toEqual([]);
    });

    test('handles whitespace-only string', () => {
      const result = parseIdeFlag('   ');
      expect(result).toEqual([]);
    });

    test('normalizes IDE IDs to lowercase', () => {
      const result = parseIdeFlag('CURSOR,WINDSCRAFT');
      expect(result).toEqual(['cursor']); // Only cursor is valid
    });
  });

  describe('validateSelection', () => {
    test('returns true for non-empty array', () => {
      expect(validateSelection(['cursor'])).toBe(true);
      expect(validateSelection(['cursor', 'windsurf'])).toBe(true);
    });

    test('returns false for empty array', () => {
      expect(validateSelection([])).toBe(false);
    });
  });

  describe('getIdeOptions', () => {
    test('returns array of IDE options with id and name', () => {
      const options = getIdeOptions();
      expect(options).toHaveLength(6);
      expect(options[0]).toHaveProperty('id');
      expect(options[0]).toHaveProperty('name');
    });

    test('includes all required IDEs', () => {
      const options = getIdeOptions();
      const ids = options.map(o => o.id);
      expect(ids).toContain('cursor');
      expect(ids).toContain('windsurf');
      expect(ids).toContain('vscode');
      expect(ids).toContain('kilocode');
      expect(ids).toContain('github-copilot');
      expect(ids).toContain('cline');
    });
  });

  describe('IDE_OPTIONS constant', () => {
    test('has correct number of IDEs', () => {
      expect(IDE_OPTIONS).toHaveLength(6);
    });

    test('cursor and windsurf are checked by default', () => {
      const cursor = IDE_OPTIONS.find(ide => ide.id === 'cursor');
      const windsurf = IDE_OPTIONS.find(ide => ide.id === 'windsurf');
      expect(cursor.checked).toBe(true);
      expect(windsurf.checked).toBe(true);
    });

    test('other IDEs are unchecked by default', () => {
      const vscode = IDE_OPTIONS.find(ide => ide.id === 'vscode');
      expect(vscode.checked).toBe(false);
    });
  });
});
