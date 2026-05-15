import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { fileURLToPath, URL } from 'node:url'

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  server: {
    port: 3000,
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          'react-vendor':   ['react', 'react-dom', 'react-router-dom'],
          'antd-vendor':    ['antd', '@ant-design/icons'],
          'form-vendor':    ['react-hook-form', '@hookform/resolvers', 'zod'],
          'table-vendor':   ['@tanstack/react-table'],
          'date-vendor':    ['date-fns', 'dayjs'],
          'state-vendor':   ['zustand'],
          'http-vendor':    ['axios'],
        },
      },
    },
    chunkSizeWarningLimit: 600,
  },
})
