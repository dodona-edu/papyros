module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'jsdom',
  setupFiles: ["./test/SetupJest.ts"],
  moduleNameMapper: {
    "\\.(load_by_url)$": "<rootDir>/test/__mocks__/MockTar.ts"
  }
};
