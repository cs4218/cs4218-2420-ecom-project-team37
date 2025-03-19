export default {
  // display name
  displayName: "backend",

  // when testing backend
  testEnvironment: "node",

  // which test to run
  testMatch: ["<rootDir>/controllers/*.unit.test.js", "<rootDir>/middlewares/*.unit.test.js", "<rootDir>/helpers/*.unit.test.js", "<rootDir>/config/*.unit.test.js"],

  // jest code coverage
  collectCoverage: true,
  collectCoverageFrom: [
    "controllers/**/*.js",
    "!controllers/**/*.test.js",
    // "!controllers/**/*.integration.test.js", 
    "middlewares/**/*.js",
    "!middlewares/**/*.test.js",
    // "!middlewares/**/*.integration.test.js", 
    "helpers/**/*.js",
    "!helpers/**/*.test.js",
    // "!helpers/**/*.integration.test.js",
    "config/**/*.js",
    "!config/**/*.test.js",
    // "!config/**/*.integration.test.js", 
  ],
  coverageThreshold: {
    global: {
      lines: 0,
      functions: 0,
    },
  },
};