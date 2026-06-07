/** @type {import('jest').Config} */
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>/src'],
  testMatch: ['**/*.test.ts'],
  testPathIgnorePatterns: ['/node_modules/', '/src/test/'],
  collectCoverageFrom: ['src/**/*.ts', '!src/index.ts'],
  // Source uses ESM-style ".js" extensions on relative imports; strip them so
  // ts-jest can resolve the corresponding ".ts" files.
  moduleNameMapper: {
    '^(\\.{1,2}/.*)\\.js$': '$1',
  },
};
