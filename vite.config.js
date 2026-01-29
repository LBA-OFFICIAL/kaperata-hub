import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  // Setting the build target to es2020 ensures compatibility 
  // with modern JavaScript features like import.meta used in the app.
  build: {
    target: 'es2020'
  },
  server: {
    port: 3000,
    open: true
  }
})
