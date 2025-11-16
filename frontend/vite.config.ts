/// <reference types="vitest" />
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    // Vite server optimizer inline config for deps. Use optimizer.include
    // which is accepted by Vite server options to force pre-bundling.
    // Note: some TS types may not list optimizer directly; this is fine at runtime.
    optimizer: {
      web: {
        include: ['react', 'react-dom', 'react/jsx-runtime', '@testing-library/react']
      }
    }
  },
  test: {
    // Only include project unit tests under `src/` and exclude Cypress specs
    include: ['src/**/*.{test,spec}.{js,ts,jsx,tsx}'],
    exclude: ['cypress/**', 'node_modules/**'],
    globals: true,
    environment: 'jsdom',
    setupFiles: './src/setupTests.ts',
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html', 'lcov'],
    },
  },
})
