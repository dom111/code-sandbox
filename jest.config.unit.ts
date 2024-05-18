export default {
  testMatch: ['**/tests/unit/**/*.test.ts'],
  preset: 'ts-jest',
  transformIgnorePatterns: ['^.+\\.js$'],
  moduleNameMapper: {
    '^(\\.\\.)$': '../index',
  },
};
