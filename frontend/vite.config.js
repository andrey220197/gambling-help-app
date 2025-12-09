import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/auth': 'http://localhost:8000',
      '/checkins': 'http://localhost:8000',
      '/streak': 'http://localhost:8000',
      '/articles': 'http://localhost:8000',
      '/sos': 'http://localhost:8000',
      '/tests': 'http://localhost:8000',
      '/diary': 'http://localhost:8000',
      '/money': 'http://localhost:8000',
    }
  },
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
  }
})
