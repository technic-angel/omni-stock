import { defineConfig } from 'cypress'

export default defineConfig({
  e2e: {
    specPattern: 'cypress/integration/**/*.{js,ts}'
  },
  video: false,
  fixturesFolder: 'cypress/fixtures'
})
