/** @type {import('jest').Config} */
const config = {
  preset: 'ts-jest/presets/default-esm',
  testEnvironment: 'node',
  extensionsToTreatAsEsm: ['.ts'],
  moduleNameMapper: {
    // Strip .js extensions from relative imports so Jest can resolve .ts files
    '^(\\.{1,2}/.*)\\.js$': '$1',
  },
  transform: {
    '^.+\\.tsx?$': [
      'ts-jest',
      {
        useESM: true,
        tsconfig: '<rootDir>/tsconfig.test.json',
        diagnostics: {
          // Don't fail tests on type errors — use `npm run typecheck` for that
          warnOnly: true,
        },
      },
    ],
  },
  // env.ts runs before each test file (before the test framework installs)
  setupFiles: ['<rootDir>/src/test/env.ts'],
  // setup.ts runs after Jest is installed (has access to beforeAll/afterAll)
  setupFilesAfterEnv: ['<rootDir>/src/test/setup.ts'],
  // Only scan src/ — avoids collisions with the isolate/ subdirectory
  roots: ['<rootDir>/src'],
  testMatch: ['**/__test__/**/*.test.ts', '**/__tests__/**/*.test.ts'],
  // Jest config-level alternatives to setup.ts globals that require `jest` object
  testTimeout: 15000,
  clearMocks: true,
  testPathIgnorePatterns: [
    '/node_modules/',
    '/dist/',
    // Pre-existing files with all tests commented out; exclude until activated
    'src/firestoreEvents/__test__/mirrorCustomClaims.test.ts',
    'src/modules/transactions/__test__/handleEndorsementRating.test.ts',
  ],
  coverageDirectory: 'coverage',
  collectCoverageFrom: [
    'src/**/*.ts',
    '!src/index.ts',
    '!src/test/**',
  ],
};

export default config;
