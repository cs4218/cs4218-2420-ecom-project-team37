# E-commerce website
CI link example for Milestone 1: [URL link](https://github.com/cs4218/cs4218-2420-ecom-project-team37/actions/runs/13746921697/job/38442985014)

## Instructions

To install the project dependencies, run this command in your terminal:

```bash
npm install
```

To run the application in development mode, execute:

```bash
npm run dev
```

To run both frontend and backend tests, execute:

```bash
npm run test
```

Below are the commands to run the tests independently:

```bash
npm run test:frontend
npm run test:backend
```

Below are the commands to run the integration tests independently:

```bash
npm run test:frontend-integration
npm run test:backend-integration
```

Below are the commands to run the playwright tests:
```bash
npx playwright test
```


Below are the commands to generate sonarqube coverage:
```bash
1. npm run test (This will generate frontend and backend lcov.info)
2. npm run coverage (This will merge the frontend and backend coverage)
3. npm run sonarqube (This will generate sonarqube coverage)
```