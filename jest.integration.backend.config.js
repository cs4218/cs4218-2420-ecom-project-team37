export default {
  displayName: "backend-integration",
  testEnvironment: "node",

  testMatch: [
    "<rootDir>/controllers/**/*.integration.test.js",
    "<rootDir>/middlewares/**/*.integration.test.js",
    "<rootDir>/helpers/**/*.integration.test.js",
    "<rootDir>/config/**/*.integration.test.js"
  ],

  collectCoverage: true,
  collectCoverageFrom: [
    "controllers/**/*.js",
    "!controllers/**/*.test.js",
    "!controllers/**/*.integration.test.js",
    "middlewares/**/*.js",
    "!middlewares/**/*.test.js",
    "!middlewares/**/*.integration.test.js",
    "helpers/**/*.js",
    "!helpers/**/*.test.js",
    "!helpers/**/*.integration.test.js",
    "config/**/*.js",
    "!config/**/*.test.js",
    "!config/**/*.integration.test.js",
  ],
  coverageThreshold: {
    global: {
      lines: 0,
      functions: 0,
    },
  },
};
