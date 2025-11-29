/// <reference types="vitest" />
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  server: {
    port: 5173,
  },
  // @ts-ignore - Vitest config
  test: {
    // Only include project unit tests under `src/` and exclude Cypress specs
    include: ['src/**/*.{test,spec}.{js,ts,jsx,tsx}'],
    exclude: ['cypress/**', 'node_modules/**'],
    globals: true,
    environment: 'jsdom',
    setupFiles: './src/setupTests.ts',
    mockReset: true,
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html', 'lcov'],
    },
  },
})
