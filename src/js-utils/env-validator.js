/**
 * Environment Validator Module
 * 
 * Validates the execution environment for Agentfile CLI
 * Checks Node.js version and required directories
 * 
 * @module env-validator
 */

const fs = require('fs');
const path = require('path');
const fsPromises = require('fs/promises');

/**
 * Default required directories for Agentfile project
 * @private
 */
const DEFAULT_REQUIRED_DIRS = [
  '.agentfile',
  'workflows',
  'agents',
  'skills',
  'shared'
];

/**
 * Minimum Node.js version required
 * @private
 */
const MIN_NODE_VERSION = 18;

/**
 * ValidationResult interface
 * @typedef {Object} ValidationResult
 * @property {boolean} success - Whether validation passed
 * @property {Object} [error] - Error details if validation failed
 * @property {string} [error.code] - Error code
 * @property {string} [error.message] - Error message
 * @property {Object} [error.details] - Additional error details
 */

/**
 * EnvironmentInfo interface
 * @typedef {Object} EnvironmentInfo
 * @property {string} nodeVersion - Node.js version string
 * @property {number} nodeMajorVersion - Major version number
 * @property {string} platform - Operating system platform
 * @property {string} arch - System architecture
 * @property {string} cwd - Current working directory
 */

/**
 * Validate Node.js version meets minimum requirement
 * @param {string} [minimumVersion='18'] - Minimum required version
 * @returns {Promise<ValidationResult>} Version check result
 */
async function validateNodeVersion(minimumVersion = '18') {
  try {
    // Parse the minimum version
    const minMajor = parseInt(minimumVersion.replace(/^v/, ''), 10);
    
    if (isNaN(minMajor)) {
      return {
        success: false,
        error: {
          code: 'ENV_INVALID_MIN_VERSION',
          message: `Invalid minimum version specified: ${minimumVersion}`,
          details: { operation: 'validateNodeVersion', minimumVersion }
        }
      };
    }

    // Get current Node.js version
    const currentVersion = process.version;
    const currentMajor = parseInt(currentVersion.replace(/^v/, '').split('-')[0], 10);

    // Check if version meets minimum requirement
    if (currentMajor < minMajor) {
      return {
        success: false,
        error: {
          code: 'ENV_INVALID_VERSION',
          message: `Node.js version ${currentVersion} is below minimum required version v${minimumVersion}+`,
          details: {
            operation: 'validateNodeVersion',
            currentVersion,
            minimumVersion: `v${minimumVersion}+`,
            currentMajor,
            minMajor
          }
        }
      };
    }

    // Version is valid
    return {
      success: true,
      nodeVersion: currentVersion,
      nodeMajorVersion: currentMajor,
      meetsRequirement: true
    };
  } catch (error) {
    return {
      success: false,
      error: {
        code: 'ENV_VERSION_CHECK_ERROR',
        message: `Failed to validate Node.js version: ${error.message}`,
        details: { operation: 'validateNodeVersion', originalError: error.message }
      }
    };
  }
}

/**
 * Check that required directories exist
 * @param {string} [cwd=process.cwd()] - Working directory to check
 * @param {string[]} [requiredDirs] - Custom list of required directories
 * @returns {Promise<ValidationResult>} Directory check result
 */
async function checkRequiredDirectories(cwd = process.cwd(), requiredDirs = null) {
  try {
    // Use provided required dirs or defaults
    const dirsToCheck = requiredDirs || DEFAULT_REQUIRED_DIRS;
    
    // Validate cwd
    if (!cwd || typeof cwd !== 'string') {
      return {
        success: false,
        error: {
          code: 'ENV_INVALID_CWD',
          message: 'Invalid working directory specified',
          details: { operation: 'checkRequiredDirectories', cwd, expectedType: 'string' }
        }
      };
    }

    // Check if cwd exists
    if (!fs.existsSync(cwd)) {
      return {
        success: false,
        error: {
          code: 'ENV_CWD_NOT_FOUND',
          message: `Working directory does not exist: ${cwd}`,
          details: { operation: 'checkRequiredDirectories', cwd }
        }
      };
    }

    // Check each required directory
    const missingDirs = [];
    const existingDirs = [];

    for (const dir of dirsToCheck) {
      const dirPath = path.join(cwd, dir);
      
      if (fs.existsSync(dirPath)) {
        const stats = fs.statSync(dirPath);
        if (stats.isDirectory()) {
          existingDirs.push(dir);
        } else {
          // Exists but is not a directory
          missingDirs.push({
            dir,
            reason: 'exists but is not a directory',
            path: dirPath
          });
        }
      } else {
        missingDirs.push({
          dir,
          reason: 'does not exist',
          path: dirPath
        });
      }
    }

    // If there are missing directories, return error
    if (missingDirs.length > 0) {
      const missingDirNames = missingDirs.map(d => d.dir);
      const fixSuggestions = missingDirs.map(d => {
        if (d.reason === 'does not exist') {
          return `Create directory: ${d.dir}`;
        }
        return `Fix: ${d.dir} (${d.reason})`;
      });

      return {
        success: false,
        error: {
          code: 'ENV_MISSING_DIR',
          message: `Missing required directories: ${missingDirNames.join(', ')}`,
          details: {
            operation: 'checkRequiredDirectories',
            cwd,
            missingDirectories: missingDirs,
            fixSuggestions
          }
        }
      };
    }

    // All directories exist
    return {
      success: true,
      checkedDirectories: dirsToCheck,
      existingDirectories: existingDirs,
      cwd
    };
  } catch (error) {
    return {
      success: false,
      error: {
        code: 'ENV_DIR_CHECK_ERROR',
        message: `Failed to check required directories: ${error.message}`,
        details: { operation: 'checkRequiredDirectories', cwd, originalError: error.message }
      }
    };
  }
}

/**
 * Validate the execution environment
 * @param {Object} options - Validation options
 * @param {string} [options.cwd] - Working directory to validate (defaults to process.cwd())
 * @param {boolean} [options.checkNodeVersion=true] - Whether to check Node.js version
 * @param {boolean} [options.checkDirectories=true] - Whether to check required directories
 * @param {string[]} [options.requiredDirectories] - Custom list of required directories
 * @returns {Promise<ValidationResult>} Validation result
 */
async function validateEnvironment(options = {}) {
  const {
    cwd = process.cwd(),
    checkNodeVersion = true,
    checkDirectories = true,
    requiredDirectories = null
  } = options;

  try {
    const validationResults = {
      nodeVersion: null,
      directories: null
    };

    // Validate Node.js version if requested
    if (checkNodeVersion) {
      const versionResult = await validateNodeVersion(String(MIN_NODE_VERSION));
      
      if (!versionResult.success) {
        return {
          success: false,
          error: versionResult.error,
          validationType: 'node-version'
        };
      }
      
      validationResults.nodeVersion = {
        valid: true,
        version: versionResult.nodeVersion,
        majorVersion: versionResult.nodeMajorVersion
      };
    }

    // Check required directories if requested
    if (checkDirectories) {
      const dirResult = await checkRequiredDirectories(cwd, requiredDirectories);
      
      if (!dirResult.success) {
        return {
          success: false,
          error: dirResult.error,
          validationType: 'directories'
        };
      }
      
      validationResults.directories = {
        valid: true,
        checked: dirResult.checkedDirectories,
        existing: dirResult.existingDirectories,
        cwd: dirResult.cwd
      };
    }

    // All validations passed
    return {
      success: true,
      validations: validationResults,
      validatedAt: new Date().toISOString()
    };
  } catch (error) {
    return {
      success: false,
      error: {
        code: 'ENV_VALIDATION_ERROR',
        message: `Environment validation failed: ${error.message}`,
        details: { operation: 'validateEnvironment', options, originalError: error.message }
      }
    };
  }
}

/**
 * Get environment info for debugging
 * @returns {Promise<EnvironmentInfo>} Environment information
 */
async function getEnvironmentInfo() {
  try {
    return {
      nodeVersion: process.version,
      nodeMajorVersion: parseInt(process.version.replace(/^v/, '').split('-')[0], 10),
      platform: process.platform,
      arch: process.arch,
      cwd: process.cwd(),
      env: {
        NODE_ENV: process.env.NODE_ENV,
        HOME: process.env.HOME,
        USERPROFILE: process.env.USERPROFILE
      }
    };
  } catch (error) {
    return {
      success: false,
      error: {
        code: 'ENV_INFO_ERROR',
        message: `Failed to get environment info: ${error.message}`,
        details: { operation: 'getEnvironmentInfo', originalError: error.message }
      }
    };
  }
}

module.exports = {
  validateEnvironment,
  validateNodeVersion,
  checkRequiredDirectories,
  getEnvironmentInfo,
  MIN_NODE_VERSION,
  DEFAULT_REQUIRED_DIRS
};
