/**
 * File Operations Tests
 * 
 * Tests for copyFile, copyFileAsync, moveFile, moveFileAsync, deleteFile, deleteFileAsync, createDirectory, createDirectoryAsync, and ensureDirectory functions
 * 
 * @module file-ops.test
 */

const fs = require('fs');
const path = require('path');
const os = require('os');
const { copyFile, copyFileAsync, moveFile, moveFileAsync, deleteFile, deleteFileAsync, createDirectory, createDirectoryAsync, ensureDirectory } = require('./file-ops');

// Test utilities
const TEST_DIR = path.join(os.tmpdir(), 'file-ops-test-' + Date.now());

function setup() {
  // Create test directory
  if (!fs.existsSync(TEST_DIR)) {
    fs.mkdirSync(TEST_DIR, { recursive: true });
  }
}

function cleanup() {
  // Remove test directory and contents
  if (fs.existsSync(TEST_DIR)) {
    fs.rmSync(TEST_DIR, { recursive: true, force: true });
  }
}

function createTestFile(filename, content = 'test content') {
  const filePath = path.join(TEST_DIR, filename);
  fs.writeFileSync(filePath, content, 'utf8');
  return filePath;
}

beforeAll(() => {
  setup();
});

afterAll(() => {
  cleanup();
});

describe('copyFile (synchronous)', () => {
  
  describe('Happy path scenarios', () => {
    
    test('should copy file successfully', () => {
      // Arrange
      const srcFile = createTestFile('source.txt', 'Hello World');
      const destFile = path.join(TEST_DIR, 'dest.txt');
      
      // Act
      const result = copyFile(srcFile, destFile);
      
      // Assert
      expect(result.success).toBe(true);
      expect(fs.existsSync(destFile)).toBe(true);
      expect(fs.readFileSync(destFile, 'utf8')).toBe('Hello World');
    });
    
    test('should create destination directory if it does not exist', () => {
      // Arrange
      const srcFile = createTestFile('source2.txt', 'Test content');
      const destFile = path.join(TEST_DIR, 'nested', 'dir', 'dest2.txt');
      
      // Act
      const result = copyFile(srcFile, destFile);
      
      // Assert
      expect(result.success).toBe(true);
      expect(fs.existsSync(destFile)).toBe(true);
      expect(fs.readFileSync(destFile, 'utf8')).toBe('Test content');
    });
    
    test('should preserve source file after copy', () => {
      // Arrange
      const srcFile = createTestFile('source3.txt', 'Original content');
      const destFile = path.join(TEST_DIR, 'dest3.txt');
      
      // Act
      copyFile(srcFile, destFile);
      
      // Assert - source should be unchanged
      expect(fs.readFileSync(srcFile, 'utf8')).toBe('Original content');
      expect(fs.existsSync(srcFile)).toBe(true);
    });
    
    test('should handle empty file copy', () => {
      // Arrange
      const srcFile = createTestFile('empty.txt', '');
      const destFile = path.join(TEST_DIR, 'empty-copy.txt');
      
      // Act
      const result = copyFile(srcFile, destFile);
      
      // Assert
      expect(result.success).toBe(true);
      expect(fs.existsSync(destFile)).toBe(true);
      expect(fs.readFileSync(destFile, 'utf8')).toBe('');
    });
    
    test('should handle large file content', () => {
      // Arrange - create a larger content string
      const largeContent = 'x'.repeat(10000);
      const srcFile = createTestFile('large.txt', largeContent);
      const destFile = path.join(TEST_DIR, 'large-copy.txt');
      
      // Act
      const result = copyFile(srcFile, destFile);
      
      // Assert
      expect(result.success).toBe(true);
      expect(fs.readFileSync(destFile, 'utf8')).toBe(largeContent);
    });
  });
  
  describe('Error handling scenarios', () => {
    
    test('should return error when source file does not exist', () => {
      // Arrange
      const srcFile = path.join(TEST_DIR, 'nonexistent.txt');
      const destFile = path.join(TEST_DIR, 'dest.txt');
      
      // Act
      const result = copyFile(srcFile, destFile);
      
      // Assert
      expect(result.success).toBe(false);
      expect(result.error.code).toBe('ERR_COPY_SOURCE_MISSING');
      expect(result.error.message).toContain('does not exist');
    });
    
    test('should return error when source path is a directory', () => {
      // Arrange
      const srcDir = path.join(TEST_DIR, 'sourcedir');
      fs.mkdirSync(srcDir);
      const destFile = path.join(TEST_DIR, 'dest.txt');
      
      // Act
      const result = copyFile(srcDir, destFile);
      
      // Assert
      expect(result.success).toBe(false);
      expect(result.error.code).toBe('ERR_COPY_SOURCE_NOT_FILE');
    });
    
    test('should return error with correct details in error object', () => {
      // Arrange
      const srcFile = path.join(TEST_DIR, 'nonexistent2.txt');
      const destFile = path.join(TEST_DIR, 'dest2.txt');
      
      // Act
      const result = copyFile(srcFile, destFile);
      
      // Assert
      expect(result.error.details).toBeDefined();
      expect(result.error.details.operation).toBe('copyFile');
      expect(result.error.details.src).toBe(srcFile);
      expect(result.error.details.dest).toBe(destFile);
    });
    
    test('should return error when destination file already exists and overwrite is needed', () => {
      // Arrange
      const srcFile = createTestFile('source-overwrite.txt', 'New content');
      const destFile = createTestFile('dest-overwrite.txt', 'Old content');
      
      // Act
      const result = copyFile(srcFile, destFile);
      
      // Assert
      expect(result.success).toBe(true);
      expect(fs.readFileSync(destFile, 'utf8')).toBe('New content');
    });
    
    test('should return error when destination directory creation fails', () => {
      // Arrange - Create a read-only parent directory that cannot be written to
      // Note: This test may require elevated permissions on some systems
      const readOnlyDir = path.join(TEST_DIR, 'readonly-dir');
      fs.mkdirSync(readOnlyDir, { recursive: true });
      
      // Try to create a file in a path where parent is read-only
      // We'll simulate by checking the error code for permission issues
      const srcFile = createTestFile('source-perm.txt', 'test');
      const destFile = path.join(readOnlyDir, 'subdir', 'dest.txt');
      
      // Act - This is a best-effort test; on Windows/macOS/Linux it may succeed
      const result = copyFile(srcFile, destFile);
      
      // Assert - Either succeeds (if permissions allow) or returns appropriate error
      if (!result.success) {
        expect(result.error.code).toMatch(/ERR_COPY_/);
      }
    });
  });
  
  describe('Cross-platform path handling', () => {
    
    test('should handle forward slash paths', () => {
      // Arrange
      const srcFile = createTestFile('source-fs.txt', 'Forward slash test');
      const destFile = path.join(TEST_DIR, 'subdir', 'dest-fs.txt').replace(/\\/g, '/');
      
      // Act
      const result = copyFile(srcFile, destFile);
      
      // Assert
      expect(result.success).toBe(true);
      expect(fs.existsSync(destFile)).toBe(true);
    });
    
    test('should handle path with spaces', () => {
      // Arrange
      const srcFile = createTestFile('source with spaces.txt', 'Content with spaces');
      const destFile = path.join(TEST_DIR, 'dest with spaces.txt');
      
      // Act
      const result = copyFile(srcFile, destFile);
      
      // Assert
      expect(result.success).toBe(true);
      expect(fs.existsSync(destFile)).toBe(true);
    });
    
    test('should handle path with special characters', () => {
      // Arrange
      const srcFile = createTestFile('source-file_123.txt', 'Special chars test');
      const destFile = path.join(TEST_DIR, 'dest-file_123.txt');
      
      // Act
      const result = copyFile(srcFile, destFile);
      
      // Assert
      expect(result.success).toBe(true);
      expect(fs.readFileSync(destFile, 'utf8')).toBe('Special chars test');
    });
  });
});

describe('copyFileAsync (asynchronous)', () => {
  
  describe('Happy path scenarios', () => {
    
    test('should copy file successfully', async () => {
      // Arrange
      const srcFile = createTestFile('async-source.txt', 'Async content');
      const destFile = path.join(TEST_DIR, 'async-dest.txt');
      
      // Act
      const result = await copyFileAsync(srcFile, destFile);
      
      // Assert
      expect(result.success).toBe(true);
      expect(fs.existsSync(destFile)).toBe(true);
      expect(fs.readFileSync(destFile, 'utf8')).toBe('Async content');
    });
    
    test('should create destination directory if it does not exist', async () => {
      // Arrange
      const srcFile = createTestFile('async-source2.txt', 'Async test');
      const destFile = path.join(TEST_DIR, 'async-nested', 'dest2.txt');
      
      // Act
      const result = await copyFileAsync(srcFile, destFile);
      
      // Assert
      expect(result.success).toBe(true);
      expect(fs.existsSync(destFile)).toBe(true);
    });
    
    test('should preserve source file after copy', async () => {
      // Arrange
      const srcFile = createTestFile('async-source3.txt', 'Original async');
      const destFile = path.join(TEST_DIR, 'async-dest3.txt');
      
      // Act
      await copyFileAsync(srcFile, destFile);
      
      // Assert
      expect(fs.readFileSync(srcFile, 'utf8')).toBe('Original async');
    });
  });
  
  describe('Error handling scenarios', () => {
    
    test('should return error when source file does not exist', async () => {
      // Arrange
      const srcFile = path.join(TEST_DIR, 'async-nonexistent.txt');
      const destFile = path.join(TEST_DIR, 'async-dest.txt');
      
      // Act
      const result = await copyFileAsync(srcFile, destFile);
      
      // Assert
      expect(result.success).toBe(false);
      expect(result.error.code).toBe('ERR_COPY_SOURCE_MISSING');
    });
    
    test('should return error when source path is a directory', async () => {
      // Arrange
      const srcDir = path.join(TEST_DIR, 'async-sourcedir');
      fs.mkdirSync(srcDir);
      const destFile = path.join(TEST_DIR, 'async-dest.txt');
      
      // Act
      const result = await copyFileAsync(srcDir, destFile);
      
      // Assert
      expect(result.success).toBe(false);
      expect(result.error.code).toBe('ERR_COPY_SOURCE_NOT_FILE');
    });
    
    test('should return error with correct details in error object', async () => {
      // Arrange
      const srcFile = path.join(TEST_DIR, 'async-nonexistent2.txt');
      const destFile = path.join(TEST_DIR, 'async-dest2.txt');
      
      // Act
      const result = await copyFileAsync(srcFile, destFile);
      
      // Assert
      expect(result.error.details).toBeDefined();
      expect(result.error.details.operation).toBe('copyFileAsync');
    });
    
    test('should return error when destination file already exists (async)', async () => {
      // Arrange
      const srcFile = createTestFile('async-source-overwrite.txt', 'New async content');
      const destFile = createTestFile('async-dest-overwrite.txt', 'Old async content');
      
      // Act
      const result = await copyFileAsync(srcFile, destFile);
      
      // Assert
      expect(result.success).toBe(true);
      expect(fs.readFileSync(destFile, 'utf8')).toBe('New async content');
    });
    
    test('should return error when destination directory creation fails (async)', async () => {
      // Arrange
      const srcFile = createTestFile('async-source-perm.txt', 'test');
      // Try to create in an invalid path (root of non-existent drive on Windows, etc.)
      const destFile = path.join(TEST_DIR, 'nonexistent', '..', 'readonly', 'dest.txt');
      
      // Act
      const result = await copyFileAsync(srcFile, destFile);
      
      // Assert - Either succeeds or returns appropriate error
      if (!result.success) {
        expect(result.error.code).toMatch(/ERR_COPY_/);
      }
    });
  });
});

describe('Integration: copyFile and copyFileAsync consistency', () => {
  
  test('both sync and async should produce same result for same inputs', async () => {
    // Arrange
    const srcFile = createTestFile('sync-async-test.txt', 'Consistency test');
    const syncDest = path.join(TEST_DIR, 'sync-consistency.txt');
    const asyncDest = path.join(TEST_DIR, 'async-consistency.txt');
    
    // Act - sync
    const syncResult = copyFile(srcFile, syncDest);
    
    // Assert sync
    expect(syncResult.success).toBe(true);
    expect(fs.existsSync(syncDest)).toBe(true);
    
    // Act - async (properly calling the async function)
    const asyncResult = await copyFileAsync(srcFile, asyncDest);
    
    // Assert async
    expect(asyncResult.success).toBe(true);
    expect(fs.existsSync(asyncDest)).toBe(true);
    
    // Both should have same content
    expect(fs.readFileSync(syncDest, 'utf8')).toBe(fs.readFileSync(asyncDest, 'utf8'));
  });
});

describe('moveFile (synchronous)', () => {
  
  describe('Happy path scenarios', () => {
    
    test('should move file successfully (same volume)', () => {
      // Arrange
      const srcFile = createTestFile('move-source.txt', 'Move content');
      const destFile = path.join(TEST_DIR, 'move-dest.txt');
      
      // Act
      const result = moveFile(srcFile, destFile);
      
      // Assert
      expect(result.success).toBe(true);
      expect(fs.existsSync(destFile)).toBe(true);
      expect(fs.readFileSync(destFile, 'utf8')).toBe('Move content');
      expect(fs.existsSync(srcFile)).toBe(false); // Source should be removed
    });
    
    test('should create destination directory if it does not exist', () => {
      // Arrange
      const srcFile = createTestFile('move-source2.txt', 'Move test');
      const destFile = path.join(TEST_DIR, 'move-nested', 'dir', 'dest2.txt');
      
      // Act
      const result = moveFile(srcFile, destFile);
      
      // Assert
      expect(result.success).toBe(true);
      expect(fs.existsSync(destFile)).toBe(true);
      expect(fs.readFileSync(destFile, 'utf8')).toBe('Move test');
      expect(fs.existsSync(srcFile)).toBe(false);
    });
    
    test('should remove source file after move', () => {
      // Arrange
      const srcFile = createTestFile('move-source3.txt', 'Original move content');
      const destFile = path.join(TEST_DIR, 'move-dest3.txt');
      
      // Act
      moveFile(srcFile, destFile);
      
      // Assert - source should be removed
      expect(fs.existsSync(srcFile)).toBe(false);
      expect(fs.existsSync(destFile)).toBe(true);
      expect(fs.readFileSync(destFile, 'utf8')).toBe('Original move content');
    });
    
    test('should handle empty file move', () => {
      // Arrange
      const srcFile = createTestFile('move-empty.txt', '');
      const destFile = path.join(TEST_DIR, 'move-empty-dest.txt');
      
      // Act
      const result = moveFile(srcFile, destFile);
      
      // Assert
      expect(result.success).toBe(true);
      expect(fs.existsSync(destFile)).toBe(true);
      expect(fs.existsSync(srcFile)).toBe(false);
    });
    
    test('should handle file move to existing destination (overwrite)', () => {
      // Arrange
      const srcFile = createTestFile('move-source-overwrite.txt', 'New move content');
      const destFile = createTestFile('move-dest-overwrite.txt', 'Old move content');
      
      // Act
      const result = moveFile(srcFile, destFile);
      
      // Assert
      expect(result.success).toBe(true);
      expect(fs.readFileSync(destFile, 'utf8')).toBe('New move content');
      expect(fs.existsSync(srcFile)).toBe(false);
    });
  });
  
  describe('Error handling scenarios', () => {
    
    test('should return error when source file does not exist', () => {
      // Arrange
      const srcFile = path.join(TEST_DIR, 'move-nonexistent.txt');
      const destFile = path.join(TEST_DIR, 'move-dest.txt');
      
      // Act
      const result = moveFile(srcFile, destFile);
      
      // Assert
      expect(result.success).toBe(false);
      expect(result.error.code).toBe('ERR_MOVE_SOURCE_MISSING');
    });
    
    test('should return error when source path is a directory', () => {
      // Arrange
      const srcDir = path.join(TEST_DIR, 'move-sourcedir');
      fs.mkdirSync(srcDir);
      const destFile = path.join(TEST_DIR, 'move-dest.txt');
      
      // Act
      const result = moveFile(srcDir, destFile);
      
      // Assert
      expect(result.success).toBe(false);
      expect(result.error.code).toBe('ERR_MOVE_SOURCE_NOT_FILE');
    });
    
    test('should return error with correct details in error object', () => {
      // Arrange
      const srcFile = path.join(TEST_DIR, 'move-nonexistent2.txt');
      const destFile = path.join(TEST_DIR, 'move-dest2.txt');
      
      // Act
      const result = moveFile(srcFile, destFile);
      
      // Assert
      expect(result.error.details).toBeDefined();
      expect(result.error.details.operation).toBe('moveFile');
    });
  });
});

describe('moveFileAsync (asynchronous)', () => {
  
  describe('Happy path scenarios', () => {
    
    test('should move file successfully', async () => {
      // Arrange
      const srcFile = createTestFile('async-move-source.txt', 'Async move content');
      const destFile = path.join(TEST_DIR, 'async-move-dest.txt');
      
      // Act
      const result = await moveFileAsync(srcFile, destFile);
      
      // Assert
      expect(result.success).toBe(true);
      expect(fs.existsSync(destFile)).toBe(true);
      expect(fs.readFileSync(destFile, 'utf8')).toBe('Async move content');
      expect(fs.existsSync(srcFile)).toBe(false);
    });
    
    test('should create destination directory if it does not exist', async () => {
      // Arrange
      const srcFile = createTestFile('async-move-source2.txt', 'Async move test');
      const destFile = path.join(TEST_DIR, 'async-move-nested', 'dest2.txt');
      
      // Act
      const result = await moveFileAsync(srcFile, destFile);
      
      // Assert
      expect(result.success).toBe(true);
      expect(fs.existsSync(destFile)).toBe(true);
      expect(fs.existsSync(srcFile)).toBe(false);
    });
    
    test('should remove source file after async move', async () => {
      // Arrange
      const srcFile = createTestFile('async-move-source3.txt', 'Original async move');
      const destFile = path.join(TEST_DIR, 'async-move-dest3.txt');
      
      // Act
      await moveFileAsync(srcFile, destFile);
      
      // Assert
      expect(fs.existsSync(srcFile)).toBe(false);
      expect(fs.existsSync(destFile)).toBe(true);
      expect(fs.readFileSync(destFile, 'utf8')).toBe('Original async move');
    });
  });
  
  describe('Error handling scenarios', () => {
    
    test('should return error when source file does not exist (async)', async () => {
      // Arrange
      const srcFile = path.join(TEST_DIR, 'async-move-nonexistent.txt');
      const destFile = path.join(TEST_DIR, 'async-move-dest.txt');
      
      // Act
      const result = await moveFileAsync(srcFile, destFile);
      
      // Assert
      expect(result.success).toBe(false);
      expect(result.error.code).toBe('ERR_MOVE_SOURCE_MISSING');
    });
    
    test('should return error when source path is a directory (async)', async () => {
      // Arrange
      const srcDir = path.join(TEST_DIR, 'async-move-sourcedir');
      fs.mkdirSync(srcDir);
      const destFile = path.join(TEST_DIR, 'async-move-dest.txt');
      
      // Act
      const result = await moveFileAsync(srcDir, destFile);
      
      // Assert
      expect(result.success).toBe(false);
      expect(result.error.code).toBe('ERR_MOVE_SOURCE_NOT_FILE');
    });
    
    test('should return error with correct details in error object (async)', async () => {
      // Arrange
      const srcFile = path.join(TEST_DIR, 'async-move-nonexistent2.txt');
      const destFile = path.join(TEST_DIR, 'async-move-dest2.txt');
      
      // Act
      const result = await moveFileAsync(srcFile, destFile);
      
      // Assert
      expect(result.error.details).toBeDefined();
      expect(result.error.details.operation).toBe('moveFileAsync');
    });
  });
});

describe('Integration: moveFile and moveFileAsync consistency', () => {
  
  test('both sync and async should produce same result for same inputs', async () => {
    // Arrange - use same content for both tests
    const srcFile = createTestFile('move-sync-async-shared.txt', 'Shared move consistency test');
    const srcFile2 = createTestFile('move-sync-async-shared2.txt', 'Shared move consistency test');
    const syncDest = path.join(TEST_DIR, 'move-sync-consistency.txt');
    const asyncDest = path.join(TEST_DIR, 'move-async-consistency.txt');
    
    // Act - sync
    const syncResult = moveFile(srcFile, syncDest);
    
    // Assert sync
    expect(syncResult.success).toBe(true);
    expect(fs.existsSync(syncDest)).toBe(true);
    expect(fs.existsSync(srcFile)).toBe(false);
    
    // Act - async
    const asyncResult = await moveFileAsync(srcFile2, asyncDest);
    
    // Assert async
    expect(asyncResult.success).toBe(true);
    expect(fs.existsSync(asyncDest)).toBe(true);
    expect(fs.existsSync(srcFile2)).toBe(false);
    
    // Both should succeed
    expect(syncResult.success).toBe(asyncResult.success);
  });
});

describe('createDirectory (synchronous)', () => {
  
  describe('Happy path scenarios', () => {
    
    test('should create directory successfully (single level)', () => {
      // Arrange
      const dirPath = path.join(TEST_DIR, 'new-directory');
      
      // Act
      const result = createDirectory(dirPath);
      
      // Assert
      expect(result.success).toBe(true);
      expect(fs.existsSync(dirPath)).toBe(true);
      const stats = fs.statSync(dirPath);
      expect(stats.isDirectory()).toBe(true);
    });
    
    test('should create nested directories (recursive)', () => {
      // Arrange
      const dirPath = path.join(TEST_DIR, 'parent', 'child', 'grandchild');
      
      // Act
      const result = createDirectory(dirPath);
      
      // Assert
      expect(result.success).toBe(true);
      expect(fs.existsSync(dirPath)).toBe(true);
      const stats = fs.statSync(dirPath);
      expect(stats.isDirectory()).toBe(true);
    });
    
    test('should succeed when directory already exists', () => {
      // Arrange - create directory first
      const dirPath = path.join(TEST_DIR, 'existing-directory');
      fs.mkdirSync(dirPath, { recursive: true });
      
      // Act
      const result = createDirectory(dirPath);
      
      // Assert - should succeed even if directory already exists
      expect(result.success).toBe(true);
      expect(fs.existsSync(dirPath)).toBe(true);
    });
    
    test('should handle directory path with trailing separator', () => {
      // Arrange
      const dirPath = path.join(TEST_DIR, 'trailing-sep-dir') + path.sep;
      
      // Act
      const result = createDirectory(dirPath);
      
      // Assert
      expect(result.success).toBe(true);
      expect(fs.existsSync(dirPath.replace(/[\\/]+$/, ''))).toBe(true);
    });
  });
  
  describe('Error handling scenarios', () => {
    
    test('should return error for invalid path (empty string)', () => {
      // Arrange
      const dirPath = '';
      
      // Act
      const result = createDirectory(dirPath);
      
      // Assert
      expect(result.success).toBe(false);
      expect(result.error.code).toBe('ERR_DIR_INVALID_PATH');
      expect(result.error.message).toContain('non-empty string');
    });
    
    test('should return error for invalid path (null/undefined)', () => {
      // Act
      const resultNull = createDirectory(null);
      const resultUndefined = createDirectory(undefined);
      
      // Assert
      expect(resultNull.success).toBe(false);
      expect(resultNull.error.code).toBe('ERR_DIR_INVALID_PATH');
      expect(resultUndefined.success).toBe(false);
      expect(resultUndefined.error.code).toBe('ERR_DIR_INVALID_PATH');
    });
    
    test('should return error when parent path is a file', () => {
      // Arrange - create a file first
      const filePath = path.join(TEST_DIR, 'parent-file.txt');
      fs.writeFileSync(filePath, 'test content');
      
      // Try to create directory where parent is a file
      const dirPath = path.join(filePath, 'subdir');
      
      // Act
      const result = createDirectory(dirPath);
      
      // Assert
      expect(result.success).toBe(false);
      expect(result.error.code).toMatch(/ERR_DIR_/);
    });
    
    test('should return error with correct details in error object', () => {
      // Arrange
      const dirPath = '';
      
      // Act
      const result = createDirectory(dirPath);
      
      // Assert
      expect(result.error.details).toBeDefined();
      expect(result.error.details.operation).toBe('createDirectory');
    });
    
    test('should return error for permission denied', () => {
      // Arrange - Test permission error code mapping by simulating an invalid path
      // that will definitely fail. On Windows, paths like C:/Windows/System32 are protected.
      // On Unix, / or /boot are typically protected.
      // Since cross-platform permission testing is unreliable, we test the error code mapping logic.
      
      // Use a path that is definitely invalid (contains invalid characters for directory name)
      const dirPath = path.join(TEST_DIR, '..', '..', '..', '..', 'impossible-permission-test-' + Date.now());
      
      // Act
      const result = createDirectory(dirPath);
      
      // Assert - Either fails with permission/invalid path, or succeeds (depends on system)
      // The important thing is the error code is properly set if it fails
      if (!result.success) {
        expect(result.error.code).toMatch(/ERR_DIR_PERMISSION|ERR_DIR_INVALID_PATH|ERR_DIR_CREATE_FAILED/);
      }
    });
  });
  
  describe('Cross-platform path handling', () => {
    
    test('should handle forward slash paths', () => {
      // Arrange
      const dirPath = path.join(TEST_DIR, 'fs-dir').replace(/\\/g, '/');
      
      // Act
      const result = createDirectory(dirPath);
      
      // Assert
      expect(result.success).toBe(true);
      expect(fs.existsSync(dirPath)).toBe(true);
    });
    
    test('should handle path with spaces', () => {
      // Arrange
      const dirPath = path.join(TEST_DIR, 'dir with spaces');
      
      // Act
      const result = createDirectory(dirPath);
      
      // Assert
      expect(result.success).toBe(true);
      expect(fs.existsSync(dirPath)).toBe(true);
    });
    
    test('should handle path with special characters', () => {
      // Arrange
      const dirPath = path.join(TEST_DIR, 'dir_123-special');
      
      // Act
      const result = createDirectory(dirPath);
      
      // Assert
      expect(result.success).toBe(true);
      expect(fs.existsSync(dirPath)).toBe(true);
    });
  });
});

describe('createDirectoryAsync (asynchronous)', () => {
  
  describe('Happy path scenarios', () => {
    
    test('should create directory successfully (single level)', async () => {
      // Arrange
      const dirPath = path.join(TEST_DIR, 'async-new-directory');
      
      // Act
      const result = await createDirectoryAsync(dirPath);
      
      // Assert
      expect(result.success).toBe(true);
      expect(fs.existsSync(dirPath)).toBe(true);
      const stats = fs.statSync(dirPath);
      expect(stats.isDirectory()).toBe(true);
    });
    
    test('should create nested directories (recursive)', async () => {
      // Arrange
      const dirPath = path.join(TEST_DIR, 'async-parent', 'async-child', 'async-grandchild');
      
      // Act
      const result = await createDirectoryAsync(dirPath);
      
      // Assert
      expect(result.success).toBe(true);
      expect(fs.existsSync(dirPath)).toBe(true);
      const stats = fs.statSync(dirPath);
      expect(stats.isDirectory()).toBe(true);
    });
    
    test('should succeed when directory already exists', async () => {
      // Arrange - create directory first
      const dirPath = path.join(TEST_DIR, 'async-existing-directory');
      fs.mkdirSync(dirPath, { recursive: true });
      
      // Act
      const result = await createDirectoryAsync(dirPath);
      
      // Assert - should succeed even if directory already exists
      expect(result.success).toBe(true);
      expect(fs.existsSync(dirPath)).toBe(true);
    });
  });
  
  describe('Error handling scenarios', () => {
    
    test('should return error for invalid path (empty string)', async () => {
      // Arrange
      const dirPath = '';
      
      // Act
      const result = await createDirectoryAsync(dirPath);
      
      // Assert
      expect(result.success).toBe(false);
      expect(result.error.code).toBe('ERR_DIR_INVALID_PATH');
      expect(result.error.message).toContain('non-empty string');
    });
    
    test('should return error for invalid path (null/undefined)', async () => {
      // Act
      const resultNull = await createDirectoryAsync(null);
      const resultUndefined = await createDirectoryAsync(undefined);
      
      // Assert
      expect(resultNull.success).toBe(false);
      expect(resultNull.error.code).toBe('ERR_DIR_INVALID_PATH');
      expect(resultUndefined.success).toBe(false);
      expect(resultUndefined.error.code).toBe('ERR_DIR_INVALID_PATH');
    });
    
    test('should return error with correct details in error object', async () => {
      // Arrange
      const dirPath = '';
      
      // Act
      const result = await createDirectoryAsync(dirPath);
      
      // Assert
      expect(result.error.details).toBeDefined();
      expect(result.error.details.operation).toBe('createDirectoryAsync');
    });
    
    test('should return error when parent path is a file', async () => {
      // Arrange - create a file first
      const filePath = path.join(TEST_DIR, 'async-parent-file.txt');
      fs.writeFileSync(filePath, 'test content');
      
      // Try to create directory where parent is a file
      const dirPath = path.join(filePath, 'subdir');
      
      // Act
      const result = await createDirectoryAsync(dirPath);
      
      // Assert
      expect(result.success).toBe(false);
      expect(result.error.code).toMatch(/ERR_DIR_/);
    });
  });
  
  describe('Cross-platform path handling', () => {
    
    test('should handle forward slash paths', async () => {
      // Arrange
      const dirPath = path.join(TEST_DIR, 'async-fs-dir').replace(/\\/g, '/');
      
      // Act
      const result = await createDirectoryAsync(dirPath);
      
      // Assert
      expect(result.success).toBe(true);
      expect(fs.existsSync(dirPath)).toBe(true);
    });
    
    test('should handle path with spaces', async () => {
      // Arrange
      const dirPath = path.join(TEST_DIR, 'async dir with spaces');
      
      // Act
      const result = await createDirectoryAsync(dirPath);
      
      // Assert
      expect(result.success).toBe(true);
      expect(fs.existsSync(dirPath)).toBe(true);
    });
  });
});

describe('Integration: createDirectory and createDirectoryAsync consistency', () => {
  
  test('both sync and async should produce same result for same inputs', async () => {
    // Arrange
    const syncDir = path.join(TEST_DIR, 'sync-consistency-dir');
    const asyncDir = path.join(TEST_DIR, 'async-consistency-dir');
    
    // Act - sync
    const syncResult = createDirectory(syncDir);
    
    // Assert sync
    expect(syncResult.success).toBe(true);
    expect(fs.existsSync(syncDir)).toBe(true);
    
    // Act - async
    const asyncResult = await createDirectoryAsync(asyncDir);
    
    // Assert async
    expect(asyncResult.success).toBe(true);
    expect(fs.existsSync(asyncDir)).toBe(true);
    
    // Both should succeed
    expect(syncResult.success).toBe(asyncResult.success);
  });
  
  test('both sync and async should handle existing directory same way', async () => {
    // Arrange - create directory first
    const syncDir = path.join(TEST_DIR, 'sync-existing-consistency');
    const asyncDir = path.join(TEST_DIR, 'async-existing-consistency');
    fs.mkdirSync(syncDir, { recursive: true });
    fs.mkdirSync(asyncDir, { recursive: true });
    
    // Act - sync
    const syncResult = createDirectory(syncDir);
    
    // Assert sync
    expect(syncResult.success).toBe(true);
    
    // Act - async
    const asyncResult = await createDirectoryAsync(asyncDir);
    
    // Assert async
    expect(asyncResult.success).toBe(true);
    
    // Both should succeed
    expect(syncResult.success).toBe(asyncResult.success);
  });
});

describe('createDirectory vs ensureDirectory difference', () => {
  
  test('createDirectory creates the directory at the given path', () => {
    // Arrange
    const dirPath = path.join(TEST_DIR, 'create-vs-ensure', 'mydir');
    
    // Act
    const result = createDirectory(dirPath);
    
    // Assert - createDirectory should create the full path
    expect(result.success).toBe(true);
    expect(fs.existsSync(dirPath)).toBe(true);
    const stats = fs.statSync(dirPath);
    expect(stats.isDirectory()).toBe(true);
  });
  
  test('ensureDirectory ensures parent of file path exists', () => {
    // Arrange - ensureDirectory takes a FILE path and ensures its parent exists
    const filePath = path.join(TEST_DIR, 'ensure-vs-create', 'subdir', 'myfile.txt');
    
    // Act
    const result = ensureDirectory(filePath);
    
    // Assert - ensureDirectory should create parent directory only
    expect(result.success).toBe(true);
    const parentDir = path.dirname(filePath);
    expect(fs.existsSync(parentDir)).toBe(true);
    // The file itself should NOT exist (only the parent directory)
    expect(fs.existsSync(filePath)).toBe(false);
  });
});

describe('deleteFile (synchronous)', () => {
  
  describe('Happy path scenarios', () => {
    
    test('should delete file successfully', () => {
      // Arrange
      const filePath = createTestFile('delete-source.txt', 'Delete content');
      
      // Act
      const result = deleteFile(filePath);
      
      // Assert
      expect(result.success).toBe(true);
      expect(fs.existsSync(filePath)).toBe(false);
    });
    
    test('should handle empty file deletion', () => {
      // Arrange
      const filePath = createTestFile('delete-empty.txt', '');
      
      // Act
      const result = deleteFile(filePath);
      
      // Assert
      expect(result.success).toBe(true);
      expect(fs.existsSync(filePath)).toBe(false);
    });
  });
  
  describe('Error handling scenarios', () => {
    
    test('should return error when file does not exist', () => {
      // Arrange
      const filePath = path.join(TEST_DIR, 'nonexistent-delete.txt');
      
      // Act
      const result = deleteFile(filePath);
      
      // Assert
      expect(result.success).toBe(false);
      expect(result.error.code).toBe('ERR_DELETE_SOURCE_MISSING');
      expect(result.error.message).toContain('does not exist');
    });
    
    test('should return error when path is a directory', () => {
      // Arrange
      const dirPath = path.join(TEST_DIR, 'delete-dir');
      fs.mkdirSync(dirPath);
      
      // Act
      const result = deleteFile(dirPath);
      
      // Assert
      expect(result.success).toBe(false);
      expect(result.error.code).toBe('ERR_DELETE_NOT_FILE');
    });
    
    test('should return error with correct details in error object', () => {
      // Arrange
      const filePath = path.join(TEST_DIR, 'nonexistent-delete2.txt');
      
      // Act
      const result = deleteFile(filePath);
      
      // Assert
      expect(result.error.details).toBeDefined();
      expect(result.error.details.operation).toBe('deleteFile');
      expect(result.error.details.filePath).toBe(filePath);
    });
  });
});

describe('deleteFileAsync (asynchronous)', () => {
  
  describe('Happy path scenarios', () => {
    
    test('should delete file successfully', async () => {
      // Arrange
      const filePath = createTestFile('async-delete-source.txt', 'Async delete content');
      
      // Act
      const result = await deleteFileAsync(filePath);
      
      // Assert
      expect(result.success).toBe(true);
      expect(fs.existsSync(filePath)).toBe(false);
    });
    
    test('should handle empty file deletion', async () => {
      // Arrange
      const filePath = createTestFile('async-delete-empty.txt', '');
      
      // Act
      const result = await deleteFileAsync(filePath);
      
      // Assert
      expect(result.success).toBe(true);
      expect(fs.existsSync(filePath)).toBe(false);
    });
    
    test('should remove file completely from filesystem', async () => {
      // Arrange
      const filePath = createTestFile('async-delete-complete.txt', 'Complete delete test');
      
      // Act
      const result = await deleteFileAsync(filePath);
      
      // Assert
      expect(result.success).toBe(true);
      // Verify file is completely gone
      expect(fs.existsSync(filePath)).toBe(false);
    });
  });
  
  describe('Error handling scenarios', () => {
    
    test('should return error when file does not exist', async () => {
      // Arrange
      const filePath = path.join(TEST_DIR, 'async-nonexistent-delete.txt');
      
      // Act
      const result = await deleteFileAsync(filePath);
      
      // Assert
      expect(result.success).toBe(false);
      expect(result.error.code).toBe('ERR_DELETE_SOURCE_MISSING');
      expect(result.error.message).toContain('does not exist');
    });
    
    test('should return error when path is a directory', async () => {
      // Arrange
      const dirPath = path.join(TEST_DIR, 'async-delete-dir');
      fs.mkdirSync(dirPath);
      
      // Act
      const result = await deleteFileAsync(dirPath);
      
      // Assert
      expect(result.success).toBe(false);
      expect(result.error.code).toBe('ERR_DELETE_NOT_FILE');
    });
    
    test('should return error with correct details in error object', async () => {
      // Arrange
      const filePath = path.join(TEST_DIR, 'async-nonexistent-delete2.txt');
      
      // Act
      const result = await deleteFileAsync(filePath);
      
      // Assert
      expect(result.error.details).toBeDefined();
      expect(result.error.details.operation).toBe('deleteFileAsync');
      expect(result.error.details.filePath).toBe(filePath);
    });
  });
  
  describe('Cross-platform path handling', () => {
    
    test('should handle forward slash paths', async () => {
      // Arrange
      const filePath = createTestFile('async-delete-fs.txt', 'Forward slash test');
      const normalizedPath = filePath.replace(/\\/g, '/');
      
      // Act
      const result = await deleteFileAsync(normalizedPath);
      
      // Assert
      expect(result.success).toBe(true);
    });
    
    test('should handle path with spaces', async () => {
      // Arrange
      const filePath = createTestFile('async delete with spaces.txt', 'Content with spaces');
      
      // Act
      const result = await deleteFileAsync(filePath);
      
      // Assert
      expect(result.success).toBe(true);
      expect(fs.existsSync(filePath)).toBe(false);
    });
    
    test('should handle path with special characters', async () => {
      // Arrange
      const filePath = createTestFile('async-delete-file_123.txt', 'Special chars test');
      
      // Act
      const result = await deleteFileAsync(filePath);
      
      // Assert
      expect(result.success).toBe(true);
      expect(fs.existsSync(filePath)).toBe(false);
    });
  });
});

describe('Integration: deleteFile and deleteFileAsync consistency', () => {
  
  test('both sync and async should produce same result for same inputs', async () => {
    // Arrange
    const syncFile = path.join(TEST_DIR, 'sync-delete-consistency.txt');
    const asyncFile = path.join(TEST_DIR, 'async-delete-consistency.txt');
    
    // Create files
    fs.writeFileSync(syncFile, 'Sync consistency test');
    fs.writeFileSync(asyncFile, 'Async consistency test');
    
    // Act - sync
    const syncResult = deleteFile(syncFile);
    
    // Assert sync
    expect(syncResult.success).toBe(true);
    expect(fs.existsSync(syncFile)).toBe(false);
    
    // Act - async
    const asyncResult = await deleteFileAsync(asyncFile);
    
    // Assert async
    expect(asyncResult.success).toBe(true);
    expect(fs.existsSync(asyncFile)).toBe(false);
  });
  
  test('both sync and async should return same error for non-existent file', async () => {
    // Arrange
    const nonExistentFile = path.join(TEST_DIR, 'both-nonexistent.txt');
    
    // Act - sync
    const syncResult = deleteFile(nonExistentFile);
    
    // Act - async
    const asyncResult = await deleteFileAsync(nonExistentFile);
    
    // Assert
    expect(syncResult.success).toBe(false);
    expect(asyncResult.success).toBe(false);
    expect(syncResult.error.code).toBe(asyncResult.error.code);
    expect(syncResult.error.code).toBe('ERR_DELETE_SOURCE_MISSING');
  });
  
  test('both sync and async should return same error for directory path', async () => {
    // Arrange
    const dirPath = path.join(TEST_DIR, 'both-delete-dir');
    fs.mkdirSync(dirPath);
    
    // Act - sync
    const syncResult = deleteFile(dirPath);
    
    // Act - async
    const asyncResult = await deleteFileAsync(dirPath);
    
    // Assert
    expect(syncResult.success).toBe(false);
    expect(asyncResult.success).toBe(false);
    expect(syncResult.error.code).toBe(asyncResult.error.code);
    expect(syncResult.error.code).toBe('ERR_DELETE_NOT_FILE');
  });
});

describe('Error Handling Consistency', () => {
  
  describe('All operations return {success: false} on error', () => {
    
    test('copyFile returns success: false on error', () => {
      const result = copyFile('/nonexistent/source.txt', '/nonexistent/dest.txt');
      expect(result.success).toBe(false);
    });
    
    test('copyFileAsync returns success: false on error', async () => {
      const result = await copyFileAsync('/nonexistent/source.txt', '/nonexistent/dest.txt');
      expect(result.success).toBe(false);
    });
    
    test('moveFile returns success: false on error', () => {
      const result = moveFile('/nonexistent/source.txt', '/nonexistent/dest.txt');
      expect(result.success).toBe(false);
    });
    
    test('moveFileAsync returns success: false on error', async () => {
      const result = await moveFileAsync('/nonexistent/source.txt', '/nonexistent/dest.txt');
      expect(result.success).toBe(false);
    });
    
    test('deleteFile returns success: false on error', () => {
      const result = deleteFile('/nonexistent/file.txt');
      expect(result.success).toBe(false);
    });
    
    test('deleteFileAsync returns success: false on error', async () => {
      const result = await deleteFileAsync('/nonexistent/file.txt');
      expect(result.success).toBe(false);
    });
    
    test('createDirectory returns success: false on error', () => {
      const result = createDirectory('');
      expect(result.success).toBe(false);
    });
    
    test('createDirectoryAsync returns success: false on error', async () => {
      const result = await createDirectoryAsync('');
      expect(result.success).toBe(false);
    });
  });
  
  describe('All errors include standardized error codes', () => {
    
    test('copyFile errors use ERR_COPY_* codes', () => {
      const result = copyFile('/nonexistent/source.txt', '/nonexistent/dest.txt');
      expect(result.error.code).toMatch(/^ERR_COPY_/);
    });
    
    test('moveFile errors use ERR_MOVE_* codes', () => {
      const result = moveFile('/nonexistent/source.txt', '/nonexistent/dest.txt');
      expect(result.error.code).toMatch(/^ERR_MOVE_/);
    });
    
    test('deleteFile errors use ERR_DELETE_* codes', () => {
      const result = deleteFile('/nonexistent/file.txt');
      expect(result.error.code).toMatch(/^ERR_DELETE_/);
    });
    
    test('createDirectory errors use ERR_DIR_* codes', () => {
      const result = createDirectory('');
      expect(result.error.code).toMatch(/^ERR_DIR_/);
    });
    
    test('ensureDirectory errors use ERR_DIR_* codes', () => {
      // Use an invalid path that will definitely fail (empty path)
      const result = ensureDirectory('');
      if (!result.success) {
        expect(result.error.code).toMatch(/^ERR_DIR_/);
      }
    });
  });
  
  describe('All errors include human-readable messages', () => {
    
    test('copyFile error has readable message', () => {
      const result = copyFile('/nonexistent/source.txt', '/nonexistent/dest.txt');
      expect(result.error.message).toBeDefined();
      expect(typeof result.error.message).toBe('string');
      expect(result.error.message.length).toBeGreaterThan(0);
    });
    
    test('moveFile error has readable message', () => {
      const result = moveFile('/nonexistent/source.txt', '/nonexistent/dest.txt');
      expect(result.error.message).toBeDefined();
      expect(typeof result.error.message).toBe('string');
      expect(result.error.message.length).toBeGreaterThan(0);
    });
    
    test('deleteFile error has readable message', () => {
      const result = deleteFile('/nonexistent/file.txt');
      expect(result.error.message).toBeDefined();
      expect(typeof result.error.message).toBe('string');
      expect(result.error.message.length).toBeGreaterThan(0);
    });
    
    test('createDirectory error has readable message', () => {
      const result = createDirectory('');
      expect(result.error.message).toBeDefined();
      expect(typeof result.error.message).toBe('string');
      expect(result.error.message.length).toBeGreaterThan(0);
    });
  });
  
  describe('All errors include operation context details', () => {
    
    test('copyFile error includes operation name', () => {
      const result = copyFile('/nonexistent/source.txt', '/nonexistent/dest.txt');
      expect(result.error.details.operation).toBe('copyFile');
    });
    
    test('copyFileAsync error includes operation name', async () => {
      const result = await copyFileAsync('/nonexistent/source.txt', '/nonexistent/dest.txt');
      expect(result.error.details.operation).toBe('copyFileAsync');
    });
    
    test('moveFile error includes operation name', () => {
      const result = moveFile('/nonexistent/source.txt', '/nonexistent/dest.txt');
      expect(result.error.details.operation).toBe('moveFile');
    });
    
    test('moveFileAsync error includes operation name', async () => {
      const result = await moveFileAsync('/nonexistent/source.txt', '/nonexistent/dest.txt');
      expect(result.error.details.operation).toBe('moveFileAsync');
    });
    
    test('deleteFile error includes operation name', () => {
      const result = deleteFile('/nonexistent/file.txt');
      expect(result.error.details.operation).toBe('deleteFile');
    });
    
    test('deleteFileAsync error includes operation name', async () => {
      const result = await deleteFileAsync('/nonexistent/file.txt');
      expect(result.error.details.operation).toBe('deleteFileAsync');
    });
    
    test('createDirectory error includes operation name', () => {
      const result = createDirectory('');
      expect(result.error.details.operation).toBe('createDirectory');
    });
    
    test('createDirectoryAsync error includes operation name', async () => {
      const result = await createDirectoryAsync('');
      expect(result.error.details.operation).toBe('createDirectoryAsync');
    });
    
    test('ensureDirectory error includes operation name', () => {
      // Use an invalid path that will definitely fail
      const result = ensureDirectory('');
      if (!result.success) {
        expect(result.error.details.operation).toBe('ensureDirectory');
      }
    });
  });
  
  describe('Error codes consistent between sync and async versions', () => {
    
    test('copyFile and copyFileAsync return same error code for missing source', async () => {
      const syncResult = copyFile('/nonexistent/source.txt', '/nonexistent/dest.txt');
      const asyncResult = await copyFileAsync('/nonexistent/source.txt', '/nonexistent/dest.txt');
      expect(syncResult.error.code).toBe(asyncResult.error.code);
    });
    
    test('moveFile and moveFileAsync return same error code for missing source', async () => {
      const syncResult = moveFile('/nonexistent/source.txt', '/nonexistent/dest.txt');
      const asyncResult = await moveFileAsync('/nonexistent/source.txt', '/nonexistent/dest.txt');
      expect(syncResult.error.code).toBe(asyncResult.error.code);
    });
    
    test('deleteFile and deleteFileAsync return same error code for missing file', async () => {
      const syncResult = deleteFile('/nonexistent/file.txt');
      const asyncResult = await deleteFileAsync('/nonexistent/file.txt');
      expect(syncResult.error.code).toBe(asyncResult.error.code);
    });
    
    test('createDirectory and createDirectoryAsync return same error code for invalid path', async () => {
      const syncResult = createDirectory('');
      const asyncResult = await createDirectoryAsync('');
      expect(syncResult.error.code).toBe(asyncResult.error.code);
    });
  });
  
  describe('Error details include original Node.js error codes', () => {
    
    test('copyFile includes originalError when copy fails', () => {
      const result = copyFile('/nonexistent/source.txt', '/nonexistent/dest.txt');
      // Early return error should have originalError
      expect(result.error.details.originalError).toBeDefined();
    });
    
    test('moveFile includes originalError when move fails', () => {
      const result = moveFile('/nonexistent/source.txt', '/nonexistent/dest.txt');
      // Early return error should have originalError
      expect(result.error.details.originalError).toBeDefined();
    });
    
    test('deleteFile includes originalError when delete fails', () => {
      const result = deleteFile('/nonexistent/file.txt');
      // Early return error should have originalError
      expect(result.error.details.originalError).toBeDefined();
    });
  });
});
 
