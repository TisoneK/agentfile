/**
 * Sample test to verify Jest setup is working
 * This test verifies the Node.js project structure is properly initialized
 */

const fs = require('fs');
const path = require('path');

// Get project root (two levels up from src/js-utils/)
const projectRoot = path.resolve(__dirname, '..', '..');

describe('Project Structure Setup', () => {
  test('package.json exists and is valid', () => {
    const packageJsonPath = path.join(projectRoot, 'package.json');
    expect(fs.existsSync(packageJsonPath)).toBe(true);
    
    const pkg = require(packageJsonPath);
    expect(pkg.name).toBe('agentfile');
    expect(pkg.version).toBeDefined();
    expect(pkg.devDependencies).toHaveProperty('jest');
  });
  
  test('package.json has test script configured', () => {
    const pkg = require(path.join(projectRoot, 'package.json'));
    expect(pkg.scripts).toHaveProperty('test');
    expect(pkg.scripts.test).toContain('jest');
  });
  
  test('jest.config.js exists and is valid', () => {
    const jestConfigPath = path.join(projectRoot, 'jest.config.js');
    expect(fs.existsSync(jestConfigPath)).toBe(true);
  });
  
  test('src/js-utils directory exists', () => {
    const jsUtilsPath = path.join(projectRoot, 'src', 'js-utils');
    expect(fs.existsSync(jsUtilsPath)).toBe(true);
    expect(fs.statSync(jsUtilsPath).isDirectory()).toBe(true);
  });
  
  test('project uses CommonJS module system', () => {
    const pkg = require(path.join(projectRoot, 'package.json'));
    expect(pkg.type).toBe('commonjs');
  });
});
