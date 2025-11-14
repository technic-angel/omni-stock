import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// Re-enable @vitejs/plugin-react now that this package is running in an
// ESM-compatible package context (frontend/package.json includes "type": "module").
// This restores improved HMR and JSX transforms.
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173
  }
})
