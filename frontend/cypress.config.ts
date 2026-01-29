import { defineConfig } from 'cypress'

export default defineConfig({
  e2e: {
    baseUrl: 'http://localhost:5173',
    specPattern: 'cypress/integration/**/*.{js,ts}',
    reporter: 'junit',
    reporterOptions: {
      mochaFile: 'results/e2e-results-[hash].xml',
      toConsole: true,
    },
  },
  video: true,
  fixturesFolder: 'cypress/fixtures'
})
