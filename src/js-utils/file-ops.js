/**
 * File Operations Module
 * 
 * Provides cross-platform file operations for the Agentfile CLI
 * 
 * @module file-ops
 */

const fs = require('fs');
const path = require('path');

/**
 * Check if a path exists (file or directory)
 * @param {string} filePath - Path to check
 * @returns {boolean} True if path exists
 */
function existsSync(filePath) {
  return fs.existsSync(filePath);
}

/**
 * Ensure directory exists, create if needed
 * @param {string} dirPath - Directory path to ensure
 * @returns {object} Result with success or error
 */
function ensureDir(dirPath) {
  try {
    if (!fs.existsSync(dirPath)) {
      fs.mkdirSync(dirPath, { recursive: true });
    }
    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: {
        code: 'ERR_DIR_CREATE_FAILED',
        message: `Failed to create directory: ${error.message}`,
        details: { operation: 'ensureDir', dirPath, originalError: error.code }
      }
    };
  }
}

/**
 * Ensure directory exists, create if needed (asynchronous)
 * @param {string} dirPath - Directory path to ensure
 * @returns {Promise<object>} Result with success or error
 */
async function ensureDirAsync(dirPath) {
  const fsPromises = require('fs/promises');
  
  try {
    if (!fs.existsSync(dirPath)) {
      await fsPromises.mkdir(dirPath, { recursive: true });
    }
    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: {
        code: 'ERR_DIR_CREATE_FAILED',
        message: `Failed to create directory: ${error.message}`,
        details: { operation: 'ensureDirAsync', dirPath, originalError: error.code }
      }
    };
  }
}

/**
 * Ensure directory exists, create if needed
 * @param {string} dirPath - Directory path
 * @returns {object} Result with success or error
 */
function ensureDirectory(dirPath) {
  const dir = path.dirname(dirPath);
  try {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: {
        code: 'ERR_DIR_CREATE_FAILED',
        message: `Failed to create directory: ${error.message}`,
        details: { operation: 'ensureDirectory', dirPath: dir, originalError: error.code }
      }
    };
  }
}

/**
 * Copy a file from source to destination (synchronous)
 * @param {string} src - Source file path
 * @param {string} dest - Destination file path
 * @returns {object} Result object with success status and error details
 */
function copyFile(src, dest) {
  try {
    // Validate source file exists
    if (!fs.existsSync(src)) {
      return {
        success: false,
        error: {
          code: 'ERR_COPY_SOURCE_MISSING',
          message: `Source file does not exist: ${src}`,
          details: { operation: 'copyFile', src, dest, originalError: 'ENOENT' }
        }
      };
    }

    // Get stats to verify it's a file
    const srcStats = fs.statSync(src);
    if (!srcStats.isFile()) {
      return {
        success: false,
        error: {
          code: 'ERR_COPY_SOURCE_NOT_FILE',
          message: `Source path is not a file: ${src}`,
          details: { operation: 'copyFile', src, dest, originalError: 'EISDIR' }
        }
      };
    }

    // Ensure destination directory exists
    const dirResult = ensureDirectory(dest);
    if (!dirResult.success) {
      return dirResult;
    }

    // Copy the file
    fs.copyFileSync(src, dest);

    // Verify copy was successful by checking destination exists
    if (!fs.existsSync(dest)) {
      return {
        success: false,
        error: {
          code: 'ERR_COPY_DEST_WRITE',
          message: 'File was copied but destination file not found',
          details: { operation: 'copyFile', src, dest, originalError: 'ENOENT' }
        }
      };
    }

    return { success: true };
  } catch (error) {
    // Handle specific error codes
    let errorCode = 'ERR_COPY_UNKNOWN';
    
    if (error.code === 'EACCES' || error.code === 'EPERM') {
      errorCode = 'ERR_COPY_PERMISSION';
    } else if (error.code === 'ENOTDIR' || error.code === 'ENOENT') {
      errorCode = 'ERR_COPY_DEST_PATH';
    } else if (error.code === 'EISDIR') {
      errorCode = 'ERR_COPY_DEST_IS_DIR';
    } else if (error.code === 'EROFS') {
      errorCode = 'ERR_COPY_READONLY';
    }

    return {
      success: false,
      error: {
        code: errorCode,
        message: error.message,
        details: { operation: 'copyFile', src, dest, originalError: error.code }
      }
    };
  }
}

/**
 * Copy a file from source to destination (asynchronous)
 * @param {string} src - Source file path
 * @param {string} dest - Destination file path
 * @returns {Promise<object>} Result object with success status and error details
 */
async function copyFileAsync(src, dest) {
  try {
    // Validate source file exists
    if (!fs.existsSync(src)) {
      return {
        success: false,
        error: {
          code: 'ERR_COPY_SOURCE_MISSING',
          message: `Source file does not exist: ${src}`,
          details: { operation: 'copyFileAsync', src, dest, originalError: 'ENOENT' }
        }
      };
    }

    // Get stats to verify it's a file
    const srcStats = fs.statSync(src);
    if (!srcStats.isFile()) {
      return {
        success: false,
        error: {
          code: 'ERR_COPY_SOURCE_NOT_FILE',
          message: `Source path is not a file: ${src}`,
          details: { operation: 'copyFileAsync', src, dest, originalError: 'EISDIR' }
        }
      };
    }

    // Ensure destination directory exists using async mkdir
    const fsPromises = require('fs/promises');
    const destDir = path.dirname(dest);
    
    try {
      await fsPromises.mkdir(destDir, { recursive: true });
    } catch (dirError) {
      return {
        success: false,
        error: {
          code: 'ERR_COPY_DIR_CREATE',
          message: `Failed to create directory: ${dirError.message}`,
          details: { operation: 'copyFileAsync', destDir, originalError: dirError.code }
        }
      };
    }

    // Copy the file asynchronously
    await fsPromises.copyFile(src, dest);

    // Verify copy was successful
    if (!fs.existsSync(dest)) {
      return {
        success: false,
        error: {
          code: 'ERR_COPY_DEST_WRITE',
          message: 'File was copied but destination file not found',
          details: { operation: 'copyFileAsync', src, dest, originalError: 'ENOENT' }
        }
      };
    }

    return { success: true };
  } catch (error) {
    // Handle specific error codes
    let errorCode = 'ERR_COPY_UNKNOWN';
    
    if (error.code === 'EACCES' || error.code === 'EPERM') {
      errorCode = 'ERR_COPY_PERMISSION';
    } else if (error.code === 'ENOTDIR' || error.code === 'ENOENT') {
      errorCode = 'ERR_COPY_DEST_PATH';
    } else if (error.code === 'EISDIR') {
      errorCode = 'ERR_COPY_DEST_IS_DIR';
    } else if (error.code === 'EROFS') {
      errorCode = 'ERR_COPY_READONLY';
    }

    return {
      success: false,
      error: {
        code: errorCode,
        message: error.message,
        details: { operation: 'copyFileAsync', src, dest, originalError: error.code }
      }
    };
  }
}

/**
 * Move a file from source to destination (synchronous)
 * Uses rename for same-volume moves, falls back to copy+delete for cross-volume
 * @param {string} src - Source file path
 * @param {string} dest - Destination file path
 * @returns {object} Result object with success status and error details
 */
function moveFile(src, dest) {
  try {
    // Validate source file exists
    if (!fs.existsSync(src)) {
      return {
        success: false,
        error: {
          code: 'ERR_MOVE_SOURCE_MISSING',
          message: `Source file does not exist: ${src}`,
          details: { operation: 'moveFile', src, dest, originalError: 'ENOENT' }
        }
      };
    }

    // Get stats to verify it's a file
    const srcStats = fs.statSync(src);
    if (!srcStats.isFile()) {
      return {
        success: false,
        error: {
          code: 'ERR_MOVE_SOURCE_NOT_FILE',
          message: `Source path is not a file: ${src}`,
          details: { operation: 'moveFile', src, dest, originalError: 'EISDIR' }
        }
      };
    }

    // Ensure destination directory exists
    const dirResult = ensureDirectory(dest);
    if (!dirResult.success) {
      return dirResult;
    }

    // Check if move is cross-volume
    const srcRoot = path.parse(src).root;
    const destRoot = path.parse(dest).root;

    if (srcRoot !== destRoot) {
      // Cross-volume move: use copy + delete
      const copyResult = copyFile(src, dest);
      if (!copyResult.success) {
        return {
          success: false,
          error: {
            code: 'ERR_MOVE_CROSS_VOLUME_COPY',
            message: `Cross-volume move failed during copy: ${copyResult.error?.message || 'Unknown error'}`,
            details: { operation: 'moveFile', src, dest, phase: 'copy', originalError: copyResult.error }
          }
        };
      }

      // Copy succeeded, now delete source
      const deleteResult = deleteFile(src);
      if (!deleteResult.success) {
        // Rollback: remove dest if delete failed
        deleteFile(dest);
        return {
          success: false,
          error: {
            code: 'ERR_MOVE_CROSS_VOLUME_DELETE',
            message: `Cross-volume move failed during source deletion: ${deleteResult.error?.message || 'Unknown error'}`,
            details: { operation: 'moveFile', src, dest, phase: 'delete', rollback: 'completed', originalError: deleteResult.error }
          }
        };
      }

      // Verify move was successful
      if (fs.existsSync(src)) {
        return {
          success: false,
          error: {
            code: 'ERR_MOVE_SOURCE_STILL_EXISTS',
            message: 'Source file still exists after move operation',
            details: { operation: 'moveFile', src, dest, originalError: 'EXDEV' }
          }
        };
      }

      if (!fs.existsSync(dest)) {
        return {
          success: false,
          error: {
            code: 'ERR_MOVE_DEST_MISSING',
            message: 'Destination file does not exist after move',
            details: { operation: 'moveFile', src, dest, originalError: 'ENOENT' }
          }
        };
      }

      return { success: true };
    }

    // Same volume: use rename
    try {
      fs.renameSync(src, dest);
    } catch (renameError) {
      // If rename fails (e.g., EXDEV for cross-device), fallback to copy+delete
      if (renameError.code === 'EXDEV') {
        const copyResult = copyFile(src, dest);
        if (!copyResult.success) {
          return {
            success: false,
            error: {
              code: 'ERR_MOVE_CROSS_VOLUME_COPY',
              message: `Move failed during copy: ${copyResult.error?.message || 'Unknown error'}`,
              details: { operation: 'moveFile', src, dest, phase: 'copy', originalError: copyResult.error }
            }
          };
        }

        const deleteResult = deleteFile(src);
        if (!deleteResult.success) {
          deleteFile(dest);
          return {
            success: false,
            error: {
              code: 'ERR_MOVE_CROSS_VOLUME_DELETE',
              message: `Move failed during source deletion: ${deleteResult.error?.message || 'Unknown error'}`,
              details: { operation: 'moveFile', src, dest, phase: 'delete', rollback: 'completed', originalError: deleteResult.error }
            }
          };
        }

        return { success: true };
      }
      throw renameError;
    }

    // Verify move was successful
    if (fs.existsSync(src)) {
      return {
        success: false,
        error: {
          code: 'ERR_MOVE_SOURCE_STILL_EXISTS',
          message: 'Source file still exists after move operation',
          details: { operation: 'moveFile', src, dest, originalError: 'EXDEV' }
        }
      };
    }

    if (!fs.existsSync(dest)) {
      return {
        success: false,
        error: {
          code: 'ERR_MOVE_DEST_MISSING',
          message: 'Destination file does not exist after move',
          details: { operation: 'moveFile', src, dest, originalError: 'ENOENT' }
        }
      };
    }

    return { success: true };
  } catch (error) {
    let errorCode = 'ERR_MOVE_UNKNOWN';

    if (error.code === 'EACCES' || error.code === 'EPERM') {
      errorCode = 'ERR_MOVE_PERMISSION';
    } else if (error.code === 'ENOENT') {
      errorCode = 'ERR_MOVE_SOURCE_MISSING';
    } else if (error.code === 'EISDIR') {
      errorCode = 'ERR_MOVE_DEST_IS_DIR';
    } else if (error.code === 'EROFS') {
      errorCode = 'ERR_MOVE_READONLY';
    } else if (error.code === 'EXDEV') {
      errorCode = 'ERR_MOVE_CROSS_VOLUME';
    }

    return {
      success: false,
      error: {
        code: errorCode,
        message: error.message,
        details: { operation: 'moveFile', src, dest, originalError: error.code }
      }
    };
  }
}

/**
 * Move a file from source to destination (asynchronous)
 * Uses rename for same-volume moves, falls back to copy+delete for cross-volume
 * @param {string} src - Source file path
 * @param {string} dest - Destination file path
 * @returns {Promise<object>} Result object with success status and error details
 */
async function moveFileAsync(src, dest) {
  const fsPromises = require('fs/promises');
  
  try {
    // Validate source file exists
    if (!fs.existsSync(src)) {
      return {
        success: false,
        error: {
          code: 'ERR_MOVE_SOURCE_MISSING',
          message: `Source file does not exist: ${src}`,
          details: { operation: 'moveFileAsync', src, dest, originalError: 'ENOENT' }
        }
      };
    }

    // Get stats to verify it's a file
    const srcStats = fs.statSync(src);
    if (!srcStats.isFile()) {
      return {
        success: false,
        error: {
          code: 'ERR_MOVE_SOURCE_NOT_FILE',
          message: `Source path is not a file: ${src}`,
          details: { operation: 'moveFileAsync', src, dest, originalError: 'EISDIR' }
        }
      };
    }

    // Ensure destination directory exists using async mkdir
    const destDir = path.dirname(dest);
    try {
      await fsPromises.mkdir(destDir, { recursive: true });
    } catch (dirError) {
      return {
        success: false,
        error: {
          code: 'ERR_MOVE_DIR_CREATE',
          message: `Failed to create directory: ${dirError.message}`,
          details: { operation: 'moveFileAsync', destDir, originalError: dirError.code }
        }
      };
    }

    // Check if move is cross-volume
    const srcRoot = path.parse(src).root;
    const destRoot = path.parse(dest).root;

    if (srcRoot !== destRoot) {
      // Cross-volume move: use copy + delete
      const copyResult = copyFile(src, dest);
      if (!copyResult.success) {
        return {
          success: false,
          error: {
            code: 'ERR_MOVE_CROSS_VOLUME_COPY',
            message: `Cross-volume move failed during copy: ${copyResult.error?.message || 'Unknown error'}`,
            details: { operation: 'moveFileAsync', src, dest, phase: 'copy', originalError: copyResult.error }
          }
        };
      }

      // Copy succeeded, now delete source
      const deleteResult = deleteFile(src);
      if (!deleteResult.success) {
        deleteFile(dest);
        return {
          success: false,
          error: {
            code: 'ERR_MOVE_CROSS_VOLUME_DELETE',
            message: `Cross-volume move failed during source deletion: ${deleteResult.error?.message || 'Unknown error'}`,
            details: { operation: 'moveFileAsync', src, dest, phase: 'delete', rollback: 'completed', originalError: deleteResult.error }
          }
        };
      }

      // Verify move was successful
      if (fs.existsSync(src)) {
        return {
          success: false,
          error: {
            code: 'ERR_MOVE_SOURCE_STILL_EXISTS',
            message: 'Source file still exists after move operation',
            details: { operation: 'moveFileAsync', src, dest, originalError: 'EXDEV' }
          }
        };
      }

      if (!fs.existsSync(dest)) {
        return {
          success: false,
          error: {
            code: 'ERR_MOVE_DEST_MISSING',
            message: 'Destination file does not exist after move',
            details: { operation: 'moveFileAsync', src, dest, originalError: 'ENOENT' }
          }
        };
      }

      return { success: true };
    }

    // Same volume: use rename
    try {
      await fsPromises.rename(src, dest);
    } catch (renameError) {
      // If rename fails (e.g., EXDEV for cross-device), fallback to copy+delete
      if (renameError.code === 'EXDEV') {
        const copyResult = copyFile(src, dest);
        if (!copyResult.success) {
          return {
            success: false,
            error: {
              code: 'ERR_MOVE_CROSS_VOLUME_COPY',
              message: `Move failed during copy: ${copyResult.error?.message || 'Unknown error'}`,
              details: { operation: 'moveFileAsync', src, dest, phase: 'copy', originalError: copyResult.error }
            }
          };
        }

        const deleteResult = deleteFile(src);
        if (!deleteResult.success) {
          deleteFile(dest);
          return {
            success: false,
            error: {
              code: 'ERR_MOVE_CROSS_VOLUME_DELETE',
              message: `Move failed during source deletion: ${deleteResult.error?.message || 'Unknown error'}`,
              details: { operation: 'moveFileAsync', src, dest, phase: 'delete', rollback: 'completed', originalError: deleteResult.error }
            }
          };
        }

        return { success: true };
      }
      throw renameError;
    }

    // Verify move was successful
    if (fs.existsSync(src)) {
      return {
        success: false,
        error: {
          code: 'ERR_MOVE_SOURCE_STILL_EXISTS',
          message: 'Source file still exists after move operation',
          details: { operation: 'moveFileAsync', src, dest, originalError: 'EXDEV' }
        }
      };
    }

    if (!fs.existsSync(dest)) {
      return {
        success: false,
        error: {
          code: 'ERR_MOVE_DEST_MISSING',
          message: 'Destination file does not exist after move',
          details: { operation: 'moveFileAsync', src, dest, originalError: 'ENOENT' }
        }
      };
    }

    return { success: true };
  } catch (error) {
    let errorCode = 'ERR_MOVE_UNKNOWN';

    if (error.code === 'EACCES' || error.code === 'EPERM') {
      errorCode = 'ERR_MOVE_PERMISSION';
    } else if (error.code === 'ENOENT') {
      errorCode = 'ERR_MOVE_SOURCE_MISSING';
    } else if (error.code === 'EISDIR') {
      errorCode = 'ERR_MOVE_DEST_IS_DIR';
    } else if (error.code === 'EROFS') {
      errorCode = 'ERR_MOVE_READONLY';
    } else if (error.code === 'EXDEV') {
      errorCode = 'ERR_MOVE_CROSS_VOLUME';
    }

    return {
      success: false,
      error: {
        code: errorCode,
        message: error.message,
        details: { operation: 'moveFileAsync', src, dest, originalError: error.code }
      }
    };
  }
}

/**
 * Delete a file (synchronous)
 * @param {string} filePath - File path to delete
 * @returns {object} Result object with success status and error details
 */
function deleteFile(filePath) {
  try {
    // Validate file exists
    if (!fs.existsSync(filePath)) {
      return {
        success: false,
        error: {
          code: 'ERR_DELETE_SOURCE_MISSING',
          message: `File does not exist: ${filePath}`,
          details: { operation: 'deleteFile', filePath, originalError: 'ENOENT' }
        }
      };
    }

    // Get stats to verify it's a file
    const stats = fs.statSync(filePath);
    if (!stats.isFile()) {
      return {
        success: false,
        error: {
          code: 'ERR_DELETE_NOT_FILE',
          message: `Path is not a file: ${filePath}`,
          details: { operation: 'deleteFile', filePath, originalError: 'EISDIR' }
        }
      };
    }

    // Delete the file
    fs.unlinkSync(filePath);

    // Verify deletion
    if (fs.existsSync(filePath)) {
      return {
        success: false,
        error: {
          code: 'ERR_DELETE_FAILED',
          message: 'File deletion failed - file still exists after operation',
          details: { operation: 'deleteFile', filePath, originalError: 'EACCES' }
        }
      };
    }

    return { success: true };
  } catch (error) {
    let errorCode = 'ERR_DELETE_UNKNOWN';

    if (error.code === 'EACCES' || error.code === 'EPERM') {
      errorCode = 'ERR_DELETE_PERMISSION';
    } else if (error.code === 'ENOENT') {
      errorCode = 'ERR_DELETE_SOURCE_MISSING';
    } else if (error.code === 'EISDIR') {
      errorCode = 'ERR_DELETE_NOT_FILE';
    } else if (error.code === 'EROFS') {
      errorCode = 'ERR_DELETE_READONLY';
    }

    return {
      success: false,
      error: {
        code: errorCode,
        message: error.message,
        details: { operation: 'deleteFile', filePath, originalError: error.code }
      }
    };
  }
}

/**
 * Delete a file (asynchronous)
 * @param {string} filePath - File path to delete
 * @returns {Promise<object>} Result object with success status and error details
 */
async function deleteFileAsync(filePath) {
  const fsPromises = require('fs/promises');
  
  try {
    // Validate file exists
    if (!fs.existsSync(filePath)) {
      return {
        success: false,
        error: {
          code: 'ERR_DELETE_SOURCE_MISSING',
          message: `File does not exist: ${filePath}`,
          details: { operation: 'deleteFileAsync', filePath, originalError: 'ENOENT' }
        }
      };
    }

    // Get stats to verify it's a file
    const stats = fs.statSync(filePath);
    if (!stats.isFile()) {
      return {
        success: false,
        error: {
          code: 'ERR_DELETE_NOT_FILE',
          message: `Path is not a file: ${filePath}`,
          details: { operation: 'deleteFileAsync', filePath, originalError: 'EISDIR' }
        }
      };
    }

    // Delete the file asynchronously
    await fsPromises.unlink(filePath);

    // Verify deletion
    if (fs.existsSync(filePath)) {
      return {
        success: false,
        error: {
          code: 'ERR_DELETE_FAILED',
          message: 'File deletion failed - file still exists after operation',
          details: { operation: 'deleteFileAsync', filePath, originalError: 'EACCES' }
        }
      };
    }

    return { success: true };
  } catch (error) {
    let errorCode = 'ERR_DELETE_UNKNOWN';

    if (error.code === 'EACCES' || error.code === 'EPERM') {
      errorCode = 'ERR_DELETE_PERMISSION';
    } else if (error.code === 'ENOENT') {
      errorCode = 'ERR_DELETE_SOURCE_MISSING';
    } else if (error.code === 'EISDIR') {
      errorCode = 'ERR_DELETE_NOT_FILE';
    } else if (error.code === 'EROFS') {
      errorCode = 'ERR_DELETE_READONLY';
    }

    return {
      success: false,
      error: {
        code: errorCode,
        message: error.message,
        details: { operation: 'deleteFileAsync', filePath, originalError: error.code }
      }
    };
  }
}

/**
 * Create a directory recursively (synchronous)
 * Uses fs.mkdirSync with recursive option to create parent directories as needed
 * @param {string} dirPath - Directory path to create
 * @returns {object} Result object with success status and error details
 */
function createDirectory(dirPath) {
  try {
    // Validate input
    if (!dirPath || typeof dirPath !== 'string') {
      return {
        success: false,
        error: {
          code: 'ERR_DIR_INVALID_PATH',
          message: 'Directory path must be a non-empty string',
          details: { operation: 'createDirectory', dirPath }
        }
      };
    }

    // Create the directory recursively
    fs.mkdirSync(dirPath, { recursive: true });

    // Verify directory was created
    if (!fs.existsSync(dirPath)) {
      return {
        success: false,
        error: {
          code: 'ERR_DIR_CREATE_FAILED',
          message: 'Directory was not created',
          details: { operation: 'createDirectory', dirPath }
        }
      };
    }

    // Verify it's actually a directory
    const stats = fs.statSync(dirPath);
    if (!stats.isDirectory()) {
      return {
        success: false,
        error: {
          code: 'ERR_DIR_CREATE_FAILED',
          message: 'Path exists but is not a directory',
          details: { operation: 'createDirectory', dirPath }
        }
      };
    }

    return { success: true };
  } catch (error) {
    // Handle specific error codes
    let errorCode = 'ERR_DIR_CREATE_FAILED';

    if (error.code === 'EEXIST') {
      // Directory already exists - this is actually a success case
      // But we need to verify it's actually a directory
      try {
        const stats = fs.statSync(dirPath);
        if (stats.isDirectory()) {
          return { success: true };
        }
        // Path exists but is not a directory
        errorCode = 'ERR_DIR_NOT_EMPTY';
      } catch (statError) {
        errorCode = 'ERR_DIR_CREATE_FAILED';
      }
    } else if (error.code === 'EACCES' || error.code === 'EPERM') {
      errorCode = 'ERR_DIR_PERMISSION';
    } else if (error.code === 'ENOENT') {
      errorCode = 'ERR_DIR_INVALID_PATH';
    } else if (error.code === 'EROFS') {
      errorCode = 'ERR_DIR_PERMISSION';
    }

    return {
      success: false,
      error: {
        code: errorCode,
        message: error.message,
        details: { operation: 'createDirectory', dirPath, originalError: error.code }
      }
    };
  }
}

/**
 * Create a directory recursively (asynchronous)
 * Uses fs.promises.mkdir with recursive option to create parent directories as needed
 * @param {string} dirPath - Directory path to create
 * @returns {Promise<object>} Result object with success status and error details
 */
async function createDirectoryAsync(dirPath) {
  const fsPromises = require('fs/promises');
  
  try {
    // Validate input
    if (!dirPath || typeof dirPath !== 'string') {
      return {
        success: false,
        error: {
          code: 'ERR_DIR_INVALID_PATH',
          message: 'Directory path must be a non-empty string',
          details: { operation: 'createDirectoryAsync', dirPath }
        }
      };
    }

    // Create the directory recursively
    await fsPromises.mkdir(dirPath, { recursive: true });

    // Verify directory was created
    if (!fs.existsSync(dirPath)) {
      return {
        success: false,
        error: {
          code: 'ERR_DIR_CREATE_FAILED',
          message: 'Directory was not created',
          details: { operation: 'createDirectoryAsync', dirPath }
        }
      };
    }

    // Verify it's actually a directory
    const stats = fs.statSync(dirPath);
    if (!stats.isDirectory()) {
      return {
        success: false,
        error: {
          code: 'ERR_DIR_CREATE_FAILED',
          message: 'Path exists but is not a directory',
          details: { operation: 'createDirectoryAsync', dirPath }
        }
      };
    }

    return { success: true };
  } catch (error) {
    // Handle specific error codes
    let errorCode = 'ERR_DIR_CREATE_FAILED';

    if (error.code === 'EEXIST') {
      // Directory already exists - this is actually a success case
      try {
        const stats = fs.statSync(dirPath);
        if (stats.isDirectory()) {
          return { success: true };
        }
        errorCode = 'ERR_DIR_NOT_EMPTY';
      } catch (statError) {
        errorCode = 'ERR_DIR_CREATE_FAILED';
      }
    } else if (error.code === 'EACCES' || error.code === 'EPERM') {
      errorCode = 'ERR_DIR_PERMISSION';
    } else if (error.code === 'ENOENT') {
      errorCode = 'ERR_DIR_INVALID_PATH';
    } else if (error.code === 'EROFS') {
      errorCode = 'ERR_DIR_PERMISSION';
    }

    return {
      success: false,
      error: {
        code: errorCode,
        message: error.message,
        details: { operation: 'createDirectoryAsync', dirPath, originalError: error.code }
      }
    };
  }
}

/**
 * Read a file (synchronous)
 * @param {string} filePath - File path to read
 * @param {string} encoding - File encoding (default: utf8)
 * @returns {object} Result object with success status and content or error details
 */
function readFile(filePath, encoding = 'utf8') {
  try {
    const content = fs.readFileSync(filePath, encoding);
    return { success: true, content };
  } catch (error) {
    let errorCode = 'ERR_READ_FAILED';

    if (error.code === 'ENOENT') {
      errorCode = 'ERR_FILE_NOT_FOUND';
    } else if (error.code === 'EACCES' || error.code === 'EPERM') {
      errorCode = 'ERR_PERMISSION_DENIED';
    }

    return {
      success: false,
      error: {
        code: errorCode,
        message: error.message,
        details: { operation: 'readFile', filePath, originalError: error.code }
      }
    };
  }
}

/**
 * Read a file (asynchronous)
 * @param {string} filePath - File path to read
 * @param {string} encoding - File encoding (default: utf8)
 * @returns {Promise<object>} Result object with success status and content or error details
 */
async function readFileAsync(filePath, encoding = 'utf8') {
  const fsPromises = require('fs/promises');

  try {
    const content = await fsPromises.readFile(filePath, encoding);
    return { success: true, content };
  } catch (error) {
    let errorCode = 'ERR_READ_FAILED';

    if (error.code === 'ENOENT') {
      errorCode = 'ERR_FILE_NOT_FOUND';
    } else if (error.code === 'EACCES' || error.code === 'EPERM') {
      errorCode = 'ERR_PERMISSION_DENIED';
    }

    return {
      success: false,
      error: {
        code: errorCode,
        message: error.message,
        details: { operation: 'readFileAsync', filePath, originalError: error.code }
      }
    };
  }
}

/**
 * Read directory contents (synchronous)
 * @param {string} dirPath - Directory path to read
 * @returns {object} Result object with success status and array of file names or error details
 */
function readdir(dirPath) {
  try {
    const files = fs.readdirSync(dirPath);
    return { success: true, files };
  } catch (error) {
    let errorCode = 'ERR_READDIR_FAILED';

    if (error.code === 'ENOENT') {
      errorCode = 'ERR_DIR_NOT_FOUND';
    } else if (error.code === 'EACCES' || error.code === 'EPERM') {
      errorCode = 'ERR_PERMISSION_DENIED';
    } else if (error.code === 'ENOTDIR') {
      errorCode = 'ERR_NOT_A_DIRECTORY';
    }

    return {
      success: false,
      error: {
        code: errorCode,
        message: error.message,
        details: { operation: 'readdir', dirPath, originalError: error.code }
      }
    };
  }
}

/**
 * Read directory contents (asynchronous)
 * @param {string} dirPath - Directory path to read
 * @returns {Promise<object>} Result object with success status and array of file names or error details
 */
async function readdirAsync(dirPath) {
  const fsPromises = require('fs/promises');

  try {
    const files = await fsPromises.readdir(dirPath);
    return { success: true, files };
  } catch (error) {
    let errorCode = 'ERR_READDIR_FAILED';

    if (error.code === 'ENOENT') {
      errorCode = 'ERR_DIR_NOT_FOUND';
    } else if (error.code === 'EACCES' || error.code === 'EPERM') {
      errorCode = 'ERR_PERMISSION_DENIED';
    } else if (error.code === 'ENOTDIR') {
      errorCode = 'ERR_NOT_A_DIRECTORY';
    }

    return {
      success: false,
      error: {
        code: errorCode,
        message: error.message,
        details: { operation: 'readdirAsync', dirPath, originalError: error.code }
      }
    };
  }
}

/**
 * Get file stats (synchronous)
 * @param {string} filePath - File path to get stats for
 * @returns {object} Result object with success status and stats or error details
 */
function stat(filePath) {
  try {
    const stats = fs.statSync(filePath);
    return { success: true, stats };
  } catch (error) {
    let errorCode = 'ERR_STAT_FAILED';

    if (error.code === 'ENOENT') {
      errorCode = 'ERR_FILE_NOT_FOUND';
    } else if (error.code === 'EACCES' || error.code === 'EPERM') {
      errorCode = 'ERR_PERMISSION_DENIED';
    }

    return {
      success: false,
      error: {
        code: errorCode,
        message: error.message,
        details: { operation: 'stat', filePath, originalError: error.code }
      }
    };
  }
}

/**
 * Get file stats (asynchronous)
 * @param {string} filePath - File path to get stats for
 * @returns {Promise<object>} Result object with success status and stats or error details
 */
async function statAsync(filePath) {
  const fsPromises = require('fs/promises');

  try {
    const stats = await fsPromises.stat(filePath);
    return { success: true, stats };
  } catch (error) {
    let errorCode = 'ERR_STAT_FAILED';

    if (error.code === 'ENOENT') {
      errorCode = 'ERR_FILE_NOT_FOUND';
    } else if (error.code === 'EACCES' || error.code === 'EPERM') {
      errorCode = 'ERR_PERMISSION_DENIED';
    }

    return {
      success: false,
      error: {
        code: errorCode,
        message: error.message,
        details: { operation: 'statAsync', filePath, originalError: error.code }
      }
    };
  }
}

/**
 * Write content to a file (synchronous)
 * @param {string} filePath - File path to write
 * @param {string} content - Content to write
 * @param {string} encoding - File encoding (default: utf8)
 * @returns {object} Result object with success status or error details
 */
function writeFile(filePath, content, encoding = 'utf8') {
  try {
    // Ensure directory exists first
    const dirResult = ensureDirectory(filePath);
    if (!dirResult.success) {
      return dirResult;
    }
    
    fs.writeFileSync(filePath, content, encoding);
    
    // Verify write was successful
    if (!fs.existsSync(filePath)) {
      return {
        success: false,
        error: {
          code: 'ERR_WRITE_FAILED',
          message: 'File was not created after write operation',
          details: { operation: 'writeFile', filePath }
        }
      };
    }
    
    return { success: true };
  } catch (error) {
    let errorCode = 'ERR_WRITE_FAILED';
    
    if (error.code === 'EACCES' || error.code === 'EPERM') {
      errorCode = 'ERR_PERMISSION_DENIED';
    } else if (error.code === 'ENOENT') {
      errorCode = 'ERR_DIR_NOT_FOUND';
    } else if (error.code === 'EISDIR') {
      errorCode = 'ERR_IS_DIRECTORY';
    } else if (error.code === 'EROFS') {
      errorCode = 'ERR_READONLY_FILESYSTEM';
    }
    
    return {
      success: false,
      error: {
        code: errorCode,
        message: error.message,
        details: { operation: 'writeFile', filePath, originalError: error.code }
      }
    };
  }
}

/**
 * Write content to a file (asynchronous)
 * @param {string} filePath - File path to write
 * @param {string} content - Content to write
 * @param {string} encoding - File encoding (default: utf8)
 * @returns {Promise<object>} Result object with success status or error details
 */
async function writeFileAsync(filePath, content, encoding = 'utf8') {
  const fsPromises = require('fs/promises');
  
  try {
    // Ensure directory exists first
    const dirResult = await ensureDirectoryAsync(filePath);
    if (!dirResult.success) {
      return dirResult;
    }
    
    await fsPromises.writeFile(filePath, content, encoding);
    
    // Verify write was successful
    if (!fs.existsSync(filePath)) {
      return {
        success: false,
        error: {
          code: 'ERR_WRITE_FAILED',
          message: 'File was not created after write operation',
          details: { operation: 'writeFileAsync', filePath }
        }
      };
    }
    
    return { success: true };
  } catch (error) {
    let errorCode = 'ERR_WRITE_FAILED';
    
    if (error.code === 'EACCES' || error.code === 'EPERM') {
      errorCode = 'ERR_PERMISSION_DENIED';
    } else if (error.code === 'ENOENT') {
      errorCode = 'ERR_DIR_NOT_FOUND';
    } else if (error.code === 'EISDIR') {
      errorCode = 'ERR_IS_DIRECTORY';
    } else if (error.code === 'EROFS') {
      errorCode = 'ERR_READONLY_FILESYSTEM';
    }
    
    return {
      success: false,
      error: {
        code: errorCode,
        message: error.message,
        details: { operation: 'writeFileAsync', filePath, originalError: error.code }
      }
    };
  }
}

/**
 * Delete a directory recursively (synchronous)
 * @param {string} dirPath - Directory path to delete
 * @returns {object} Result object with success status and error details
 */
function deleteDir(dirPath) {
  try {
    fs.rmSync(dirPath, { recursive: true, force: true });
    return { success: true };
  } catch (error) {
    let errorCode = 'ERR_DELETE_DIR_UNKNOWN';
    
    if (error.code === 'EACCES' || error.code === 'EPERM') {
      errorCode = 'ERR_DELETE_DIR_PERMISSION';
    } else if (error.code === 'ENOENT') {
      errorCode = 'ERR_DELETE_DIR_MISSING';
    } else if (error.code === 'ENOTDIR') {
      errorCode = 'ERR_DELETE_DIR_NOT_DIR';
    } else if (error.code === 'EROFS') {
      errorCode = 'ERR_DELETE_DIR_READONLY';
    }

    return {
      success: false,
      error: {
        code: errorCode,
        message: error.message,
        details: { operation: 'deleteDir', dirPath, originalError: error.code }
      }
    };
  }
}

/**
 * Delete a directory recursively (asynchronous)
 * @param {string} dirPath - Directory path to delete
 * @returns {Promise<object>} Result object with success status and error details
 */
async function deleteDirAsync(dirPath) {
  const fsPromises = require('fs/promises');
  
  try {
    await fsPromises.rm(dirPath, { recursive: true, force: true });
    return { success: true };
  } catch (error) {
    let errorCode = 'ERR_DELETE_DIR_UNKNOWN';
    
    if (error.code === 'EACCES' || error.code === 'EPERM') {
      errorCode = 'ERR_DELETE_DIR_PERMISSION';
    } else if (error.code === 'ENOENT') {
      errorCode = 'ERR_DELETE_DIR_MISSING';
    } else if (error.code === 'ENOTDIR') {
      errorCode = 'ERR_DELETE_DIR_NOT_DIR';
    } else if (error.code === 'EROFS') {
      errorCode = 'ERR_DELETE_DIR_READONLY';
    }

    return {
      success: false,
      error: {
        code: errorCode,
        message: error.message,
        details: { operation: 'deleteDirAsync', dirPath, originalError: error.code }
      }
    };
  }
}

module.exports = {
  existsSync,
  ensureDir,
  ensureDirAsync,
  ensureDirectory,
  copyFile,
  copyFileAsync,
  moveFile,
  moveFileAsync,
  deleteFile,
  deleteFileAsync,
  deleteDir,
  deleteDirAsync,
  createDirectory,
  createDirectoryAsync,
  readFile,
  readFileAsync,
  readdir,
  readdirAsync,
  stat,
  statAsync,
  writeFile,
  writeFileAsync,
};
