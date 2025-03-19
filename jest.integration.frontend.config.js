export default {
    displayName: "frontend-integration",
    testEnvironment: "jest-environment-jsdom",
  
    transform: {
      "^.+\\.jsx?$": "babel-jest",
    },
  
    moduleNameMapper: {
      "\\.(css|scss)$": "identity-obj-proxy",
    },
  
    transformIgnorePatterns: ["/node_modules/(?!(styleMock\\.js)$)"],
  
    testMatch: [
      "<rootDir>/client/src/pages/**/*.integration.test.js",
      "<rootDir>/client/src/components/**/*.integration.test.js",
      "<rootDir>/client/src/context/**/*.integration.test.js",
      "<rootDir>/client/src/hooks/**/*.integration.test.js",
    ],
  
    testPathIgnorePatterns: [
        "<rootDir>/client/src/_site/",
        "<rootDir>/client/node_modules/",
      ],

    collectCoverage: true,
    collectCoverageFrom: [
      "client/src/pages/**/*.js",
      "!client/src/pages/**/*.test.js",
      "client/src/components/**/*.js",
      "!client/src/components/**/*.test.js",
      "client/src/context/**/*.js",
      "!client/src/context/**/*.test.js",
    ],
    coverageThreshold: {
        global: {
          lines: 100,
          functions: 100,
        },
      },
  
    setupFilesAfterEnv: ["<rootDir>/client/src/setupTests.js"],
  };
  