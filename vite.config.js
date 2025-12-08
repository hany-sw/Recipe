import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    port:5173,
    proxy: {
      // "/api"로 시작하는 요청을 자동으로 8081로 전달
      "/api": {
        target: "http://localhost:8183/api",
        changeOrigin: true,
        secure: false,
      },
    },
  },
})
