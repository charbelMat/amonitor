/** @type {import('jest').Config} */
module.exports = {
  testEnvironment: 'jsdom',
  transform: {
    '^.+\\.tsx?$': ['ts-jest', { tsconfig: 'tsconfig.json', isolatedModules: true }],
  },
  moduleNameMapper: {
    '\\.(css|less|scss)$': '<rootDir>/src/test/styleMock.cjs',
  },
  setupFilesAfterEnv: ['<rootDir>/src/test/setupTests.ts'],
};
