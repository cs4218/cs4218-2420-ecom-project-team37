export default {
  // display name
  displayName: "backend",

  // when testing backend
  testEnvironment: "node",

  // which test to run
  testMatch: ["<rootDir>/controllers/*.test.js", "<rootDir>/middlewares/*.test.js", "<rootDir>/helpers/*.test.js", "<rootDir>/config/*.test.js"],

  // jest code coverage
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