import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// Port server media lokal (server/media-server.mjs)
const MEDIA_TARGET = process.env.MEDIA_TARGET ?? 'http://127.0.0.1:5179'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      // Frontend memanggil /media/... dan Vite meneruskannya ke server media.
      // Dengan begini tidak perlu CORS, dan CSP tetap 'self'.
      '/media': {
        target: MEDIA_TARGET,
        changeOrigin: true,
        rewrite: (p) => p.replace(/^\/media/, ''),
      },
    },
  },
})
