/**
 * Shell Bridge Tests
 * Tests for Story 1.3: Set Up Basic Testing Infrastructure
 * 
 * These tests verify the shell-bridge utility module functionality.
 */

const fs = require('fs');
const path = require('path');
const shellBridge = require('../compatibility/shell-bridge');

// Get project root (go up two levels from src/js-utils/ to get to project root)
const projectRoot = path.resolve(__dirname, '..', '..');

describe('Shell Bridge Tests', () => {
  
  describe('Task 1: Platform Detection', () => {
    
    test('isWindows returns boolean based on platform', () => {
      const result = shellBridge.isWindows();
      expect(typeof result).toBe('boolean');
      // On Windows, should be true; on Unix, should be false
      const isWindows = process.platform === 'win32';
      expect(result).toBe(isWindows);
    });
    
  });
  
  describe('Task 2: Path Conversion', () => {
    
    test('toPlatformPath converts Unix paths on Windows', () => {
      const unixPath = 'src/js-utils/file-ops.js';
      const result = shellBridge.toPlatformPath(unixPath);
      
      if (process.platform === 'win32') {
        expect(result).toBe('src\\js-utils\\file-ops.js');
      } else {
        expect(result).toBe(unixPath);
      }
    });
    
    test('toPlatformPath handles empty paths', () => {
      const result = shellBridge.toPlatformPath('');
      expect(result).toBe('');
    });
    
  });
  
  describe('Task 3: Shell Command Execution', () => {
    
    test('execShell can execute a simple command', async () => {
      const result = await shellBridge.execShell('echo test');
      expect(result).toHaveProperty('success');
      expect(result).toHaveProperty('stdout');
      expect(result).toHaveProperty('stderr');
      expect(result).toHaveProperty('exitCode');
    }, 10000);
    
    test('execShell handles non-existent commands gracefully', async () => {
      const result = await shellBridge.execShell('nonexistent-command-xyz-123');
      expect(result.success).toBe(false);
      expect(result.exitCode).not.toBe(0);
    }, 10000);
    
  });
  
});
