// Jest configuration for agentfile JavaScript utilities
module.exports = {
  testEnvironment: 'node',
  rootDir: './src/js-utils',
  roots: ['<rootDir>'],
  testMatch: [
    '**/*.test.js',
    '**/*.spec.js'
  ],
  testPathIgnorePatterns: [
    '/node_modules/'
  ],
  collectCoverageFrom: [
    '**/*.js',
    '!**/*.test.js',
    '!**/*.spec.js'
  ],
  coverageDirectory: 'coverage',
  verbose: true,
  transformIgnorePatterns: [
    '/node_modules/(?!(inquirer|@inquirer)/)'
  ]
};
