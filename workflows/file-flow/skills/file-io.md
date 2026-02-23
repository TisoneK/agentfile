# Skill: File I/O

## Purpose
Teach an agent how to perform safe file reading and writing operations, including existence checks, permission validation, and atomic writes.

## Instructions

### Step 1 — Check file existence
- Use filesystem `exists` or `stat` function
- Return false if file does not exist
- Handle symbolic links appropriately (follow or reject based on needs)

### Step 2 — Check file accessibility
- Verify read permission before reading
- Verify write permission before writing
- Check file is not locked by another process

### Step 3 — Read file contents
- Read file with proper encoding (UTF-8 by default)
- Handle large files with streaming if needed
- Close file handle after reading

### Step 4 — Write file atomically
- Write to temporary file first (e.g., `file.tmp`)
- Use atomic rename to final location after write completes
- This prevents partial writes on failure

### Step 5 — Verify write success
- After rename, verify file exists at target location
- Verify file size > 0
- Report any verification failures

## Examples

### Good: Atomic write
```javascript
// Write to temp file
await fs.writeFile('output.tmp', JSON.stringify(data));
// Atomic rename
await fs.rename('output.tmp', 'output.json');
// Verify
const stats = await fs.stat('output.json');
```

### Bad: Direct write (can leave partial file)
```javascript
// If this fails mid-write, output.json is corrupted
await fs.writeFile('output.json', JSON.stringify(data));
```

### Checking accessibility
| Check | How | Failure message |
|-------|-----|-----------------|
| Exists | `fs.exists(path)` | "File does not exist: {path}" |
| Readable | `fs.access(path, R_OK)` | "Cannot read: {path} - permission denied" |
| Writable | `fs.access(path, W_OK)` | "Cannot write: {path} - permission denied" |
