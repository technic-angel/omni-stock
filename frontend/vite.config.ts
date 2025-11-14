import { defineConfig } from 'vite'

// NOTE: @vitejs/plugin-react can improve HMR and JSX handling. It caused an
// esbuild/require ESM import issue in this environment; to keep the dev server
// start fast for smoke testing we omit the plugin. Add it back if your node
// runtime and plugin versions are compatible.
export default defineConfig({
  plugins: [],
  server: {
    port: 5173
  }
})
