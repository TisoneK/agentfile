# Agentfile Coding Standards

This document outlines the coding standards and best practices for the Agentfile project.

## File Operations

### Mandatory: Use file-ops.js for All File Operations

**All file operations in the CLI must use `src/js-utils/file-ops.js` instead of the native `fs` module.**

This requirement ensures:
- Consistent error handling across all file operations
- Cross-platform compatibility
- Proper error reporting with structured error objects

#### Import Pattern

```javascript
const fileOps = require('../../../src/js-utils/file-ops');
```

#### Available Functions

| Function | Sync | Async | Description |
|----------|------|-------|-------------|
| `existsSync(path)` | ✓ | - | Check if path exists |
| `ensureDir(path)` | ✓ | ✓ | Create directory recursively |
| `ensureDirectory(path)` | ✓ | ✓ | Ensure directory for file path |
| `copyFile(src, dest)` | ✓ | ✓ | Copy file |
| `moveFile(src, dest)` | ✓ | ✓ | Move/rename file |
| `deleteFile(path)` | ✓ | ✓ | Delete file |
| `deleteDir(path)` | ✓ | ✓ | Delete directory recursively |
| `createDirectory(path)` | ✓ | ✓ | Create directory |
| `readFile(path)` | ✓ | ✓ | Read file content |
| `readdir(path)` | ✓ | ✓ | Read directory contents |
| `stat(path)` | ✓ | ✓ | Get file/directory stats |
| `writeFile(path, content)` | ✓ | ✓ | Write content to file |

#### Sync Usage (Recommended for CLI)

```javascript
// Check if file exists
if (fileOps.existsSync(path)) {
  // ...
}

// Read file
const readResult = fileOps.readFile(filePath);
if (!readResult.success) {
  throw new Error(readResult.error.message);
}
const content = readResult.content;

// Write file
const writeResult = fileOps.writeFile(filePath, content);
if (!writeResult.success) {
  throw new Error(writeResult.error.message);
}

// Copy file
const copyResult = fileOps.copyFile(src, dest);
if (!copyResult.success) {
  throw new Error(copyResult.error.message);
}

// Ensure directory exists
const dirResult = fileOps.ensureDir(dirPath);
if (!dirResult.success) {
  throw new Error(dirResult.error.message);
}
```

#### Error Handling

All file-ops functions return a result object with the following structure:

```javascript
// Success
{ success: true }

// Failure
{
  success: false,
  error: {
    code: 'ERR_CODE',
    message: 'Human-readable message',
    details: { operation: 'functionName', ... }
  }
}
```

Always check `result.success` before proceeding with the operation.

#### What NOT to Do

❌ **Never use the native `fs` module directly:**

```javascript
// WRONG - Do not use
const fs = require('fs');
fs.readFileSync(path, 'utf8');
fs.writeFileSync(path, content);
fs.mkdirSync(path, { recursive: true });
fs.copyFileSync(src, dest);
```

✅ **Always use file-ops.js:**

```javascript
// CORRECT - Use file-ops
const fileOps = require('../../../src/js-utils/file-ops');
const result = fileOps.readFile(path);
// check result.success and get result.content
```

## Code Style

- Use strict mode
- Use ES6+ features (const, let, arrow functions)
- Use async/await for asynchronous operations where appropriate
- Follow the existing code patterns in the project

## Testing

- All new functionality should have unit tests
- Use Jest as the testing framework
- Test error paths as well as success paths
