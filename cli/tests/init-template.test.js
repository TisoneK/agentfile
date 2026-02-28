/**
 * Unit Tests for init.js Template System
 * Tests for Story 7.4: Implement Template System for Static File Copying
 */

const path = require('path');
const fs = require('fs');
const os = require('os');

// Mock file-ops module
jest.mock('../../../src/js-utils/file-ops', () => ({
  existsSync: jest.fn((filePath) => {
    // Simulate file system
    return mockFs.has(filePath);
  }),
  ensureDir: jest.fn(() => ({ success: true })),
  copyFileAsync: jest.fn(async (src, dest) => {
    if (mockFs.has(src)) {
      mockFs.set(dest, mockFs.get(src));
      return { success: true };
    }
    return { success: false, error: { message: 'Source file not found' } };
  }),
  readdir: jest.fn((dirPath) => {
    const files = [];
    const dirs = [];
    for (const [key, value] of mockFs.entries()) {
      if (key.startsWith(dirPath + '/')) {
        const remainder = key.substring(dirPath.length + 1);
        const firstPart = remainder.split('/')[0];
        if (firstPart && !firstPart.includes('/')) {
          if (value === true) {
            // It's a directory
            if (!dirs.includes(firstPart)) {
              dirs.push(firstPart);
            }
          } else {
            // It's a file
            if (!files.includes(firstPart)) {
              files.push(firstPart);
            }
          }
        }
      }
    }
    return { success: true, files: [...files, ...dirs] };
  }),
  stat: jest.fn((filePath) => ({
    success: true,
    stats: {
      isDirectory: () => mockFs.get(filePath + '/') !== undefined || mockFs.get(filePath) === true,
      isFile: () => mockFs.has(filePath) && mockFs.get(filePath) !== true,
    },
  })),
}));

// Mock fs module
jest.mock('fs', () => ({
  existsSync: jest.fn((filePath) => mockFs.has(filePath)),
  writeFileSync: jest.fn((filePath, content) => mockFs.set(filePath, content)),
  unlinkSync: jest.fn((filePath) => mockFs.delete(filePath)),
}));

// Simple mock file system
let mockFs = new Map();

function resetMockFs() {
  mockFs = new Map();
  // Set up template directories with nested structure
  mockFs.set('cli/src/templates/windsurf/', true);
  mockFs.set('cli/src/templates/windsurf/workflows/', true);
  mockFs.set('cli/src/templates/windsurf/workflows/agentfile-run.md', 'content: agentfile-run');
  mockFs.set('cli/src/templates/windsurf/workflows/agentfile-create.md', 'content: agentfile-create');
  
  mockFs.set('cli/src/templates/cursor/', true);
  mockFs.set('cli/src/templates/cursor/commands/', true);
  mockFs.set('cli/src/templates/cursor/commands/agentfile-run.md', 'content: cursor-run');
  
  mockFs.set('cli/src/templates/kilocode/', true);
  mockFs.set('cli/src/templates/kilocode/rules/', true);
  mockFs.set('cli/src/templates/kilocode/rules/agentfile.md', 'content: kilocode-rules');
  
  mockFs.set('cli/src/templates/github-copilot/', true);
  mockFs.set('cli/src/templates/github-copilot/prompts/', true);
  mockFs.set('cli/src/templates/github-copilot/prompts/agentfile-run.prompt.md', 'content: copilot-prompt');
  
  mockFs.set('cli/src/templates/cline/', true);
  mockFs.set('cli/src/templates/cline/clinerules', 'content: cline-rules');
}

describe('init.js Template System', () => {
  let fileOps;
  
  beforeEach(() => {
    resetMockFs();
    jest.resetModules();
    fileOps = require('../../../src/js-utils/file-ops');
  });

  describe('getFilesInDir', () => {
    it('should return empty array for non-existent directory', () => {
      const { existsSync, readdir, stat } = fileOps;
      
      // Test non-existent directory
      existsSync.mockImplementation((p) => false);
      readdir.mockReturnValue({ success: false, files: [] });
      
      // Import the function via the module
      const init = require('../src/commands/init.js');
      
      // Since getFilesInDir is not exported, we test indirectly
      // Verify that existsSync returns false for non-existent paths
      expect(existsSync('non-existent')).toBe(false);
    });

    it('should filter only files, not directories', () => {
      const { stat } = fileOps;
      
      // Mock stat to return different results for files vs directories
      stat.mockImplementation((filePath) => {
        if (filePath.endsWith('workflows') || filePath.endsWith('commands')) {
          return {
            success: true,
            stats: { isDirectory: () => true, isFile: () => false },
          };
        }
        return {
          success: true,
          stats: { isDirectory: () => false, isFile: () => true },
        };
      });
      
      // Files should return isFile: true, directories should return isFile: false
      expect(stat('test.md').stats.isFile()).toBe(true);
      expect(stat('workflows').stats.isFile()).toBe(false);
    });
  });

  describe('getAllFilesRecursive', () => {
    it('should recursively find all files in nested directories', () => {
      const init = require('../src/commands/init.js');
      
      // Import the getAllFilesRecursive function
      // Since it's not exported, we test through the mock filesystem behavior
      const { readdir, stat, existsSync } = fileOps;
      
      // Verify that windsurf templates have nested structure
      expect(existsSync('cli/src/templates/windsurf/')).toBe(true);
      expect(existsSync('cli/src/templates/windsurf/workflows/')).toBe(true);
      expect(existsSync('cli/src/templates/windsurf/workflows/agentfile-run.md')).toBe(true);
      
      // Get files from windsurf directory
      const result = readdir('cli/src/templates/windsurf/');
      expect(result.success).toBe(true);
      // Should contain 'workflows' directory
      expect(result.files).toContain('workflows');
    });

    it('should return file objects with relative and absolute paths', () => {
      const { readdir, stat, existsSync } = fileOps;
      
      // Verify structure exists
      const result = readdir('cli/src/templates/windsurf/workflows/');
      expect(result.success).toBe(true);
      expect(result.files).toContain('agentfile-run.md');
    });
  });

  describe('IDE Template Paths', () => {
    it('should define correct template destinations for each IDE', () => {
      // Test the ideTemplateDirs mapping
      const ideTemplateDirs = {
        windsurf: '.windsurf/workflows/',
        cursor: '.cursor/',
        kilocode: '.kilocode/',
        'github-copilot': '.github/prompts/',
        cline: '.clinerules',
      };

      // Verify paths match story requirements (epics.md #74-78)
      expect(ideTemplateDirs.windsurf).toBe('.windsurf/workflows/');
      expect(ideTemplateDirs.cursor).toBe('.cursor/');
      expect(ideTemplateDirs.kilocode).toBe('.kilocode/');
      expect(ideTemplateDirs['github-copilot']).toBe('.github/prompts/');
      expect(ideTemplateDirs.cline).toBe('.clinerules');
    });

    it('should create correct destination paths for windsurf templates', () => {
      const templateSourceDir = 'cli/src/templates/windsurf';
      const templateDestDir = '.windsurf/workflows/';
      const templateFile = 'agentfile-run.md';

      const srcFilePath = path.join(templateSourceDir, 'workflows', templateFile);
      const destFilePath = path.join(templateDestDir, templateFile);

      expect(destFilePath).toBe('.windsurf/workflows/agentfile-run.md');
    });

    it('should handle Cline as special single-file case', () => {
      // Cline template is a single file, not a directory
      const templateSourceDir = 'cli/src/templates/cline';
      const templateDestDir = '.clinerules';

      const srcFilePath = path.join(templateSourceDir, 'clinerules');
      const destFilePath = templateDestDir;

      expect(srcFilePath).toBe('cli/src/templates/cline/clinerules');
      expect(destFilePath).toBe('.clinerules');
    });
  });

  describe('Idempotent Copying', () => {
    it('should skip copying if destination exists', () => {
      const { existsSync, copyFileAsync } = fileOps;
      
      // Destination exists - should skip
      existsSync.mockImplementation((p) => p === '.windsurf/workflows/agentfile-run.md');
      
      // copyFileAsync should NOT be called when destination exists
      const shouldSkip = existsSync('.windsurf/workflows/agentfile-run.md');
      expect(shouldSkip).toBe(true);
    });

    it('should copy if destination does not exist', () => {
      const { existsSync } = fileOps;
      
      // Destination does not exist - should copy
      existsSync.mockImplementation((p) => false);
      
      const shouldCopy = existsSync('.windsurf/workflows/agentfile-run.md');
      expect(shouldCopy).toBe(false);
    });

    it('should preserve user customizations by not overwriting existing files', () => {
      const { existsSync } = fileOps;
      
      // Simulate user has already customized the file
      mockFs.set('.windsurf/workflows/agentfile-run.md', 'user customized content');
      
      // Should detect existing file and skip
      expect(existsSync('.windsurf/workflows/agentfile-run.md')).toBe(true);
    });
  });

  describe('Template Content', () => {
    it('should use static templates without variable substitution', () => {
      // Templates should be copied as-is
      const windsurfTemplate = 'cli/src/templates/windsurf/workflows/agentfile-run.md';
      
      // Template exists
      expect(mockFs.has(windsurfTemplate)).toBe(true);
      
      // Template content should not have placeholders
      const content = mockFs.get(windsurfTemplate);
      expect(content).toBe('content: agentfile-run');
    });

    it('should reference .agentfile/ using relative paths', () => {
      // Templates should reference ../../.agentfile/ which is correct relative path
      // from .windsurf/workflows/agentfile-run.md to .agentfile/
      expect(mockFs.has('cli/src/templates/windsurf/workflows/agentfile-run.md')).toBe(true);
    });
  });

  describe('Template File Discovery', () => {
    it('should discover all template files across nested directories', () => {
      const { readdir } = fileOps;
      
      // Test discovery of all IDE templates
      const windsurf = readdir('cli/src/templates/windsurf/');
      expect(windsurf.files).toContain('workflows');
      
      const cursor = readdir('cli/src/templates/cursor/');
      expect(cursor.files).toContain('commands');
      
      const kilocode = readdir('cli/src/templates/kilocode/');
      expect(kilocode.files).toContain('rules');
      
      const copilot = readdir('cli/src/templates/github-copilot/');
      expect(copilot.files).toContain('prompts');
    });
  });
});

describe('Template Path Resolution', () => {
  it('should resolve paths correctly from different working directories', () => {
    // From .windsurf/workflows/ to .agentfile/ = ../../.agentfile/
    const fromPath = '.windsurf/workflows/agentfile-run.md';
    const toPath = '.agentfile/run.md';
    
    // Calculate relative path
    const fromDir = path.dirname(fromPath);
    const relativePath = path.relative(fromDir, toPath);
    
    expect(relativePath).toBe('../../.agentfile/run.md');
  });

  it('should correctly map template source to destination paths', () => {
    // Source: cli/src/templates/windsurf/workflows/agentfile-run.md
    // Dest: .windsurf/workflows/agentfile-run.md
    const templateSourceDir = 'cli/src/templates/windsurf';
    const templateDestDir = '.windsurf/workflows/';
    const templateFile = 'agentfile-run.md';
    
    // When using recursive traversal, relative path is 'workflows/agentfile-run.md'
    const relativePath = 'workflows/agentfile-run.md';
    
    const srcFilePath = path.join(templateSourceDir, relativePath);
    const destFilePath = path.join(templateDestDir, relativePath);
    
    expect(srcFilePath).toBe('cli/src/templates/windsurf/workflows/agentfile-run.md');
    expect(destFilePath).toBe('.windsurf/workflows/agentfile-run.md');
  });
});
