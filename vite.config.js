import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  // This ensures assets load correctly on GitHub Pages or subfolders
  base: './', 
  build: {
    // Splits the libraries (like lucide-react) into their own file 
    // to prevent one giant main.js file
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('node_modules')) {
            return 'vendor';
          }
        },
      },
    },
    // Raises the warning threshold to 1000kB (1MB)
    chunkSizeWarningLimit: 1000,
  },
})
