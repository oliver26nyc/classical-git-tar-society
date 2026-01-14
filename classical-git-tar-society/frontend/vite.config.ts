import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],

  // --- ADD THIS SECTION ---
  define: {
    // This polyfills the `global` variable, which some libraries expect
    global: 'globalThis',
  },
  resolve: {
    alias: {
      // This tells Vite to use the 'buffer' package when libraries import 'buffer'
      buffer: 'buffer/',
    },
  },
  // ------------------------
})
