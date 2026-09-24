import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    // Dev-only convenience: while React runs on :5173 and Express on :5001,
    // any fetch to "/api/..." is forwarded to the backend. This avoids
    // CORS issues and hardcoded URLs in our code.
    // In production this does NOT exist — the frontend will call the
    // deployed backend URL directly.
    proxy: {
      '/api': 'http://localhost:5001',
    },
  },
})
