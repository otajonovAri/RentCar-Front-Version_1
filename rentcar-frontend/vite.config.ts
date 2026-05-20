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
        manualChunks(id) {
          // React core + router
          if (id.includes('node_modules/react/') ||
              id.includes('node_modules/react-dom/') ||
              id.includes('node_modules/react-router-dom/') ||
              id.includes('node_modules/react-router/') ||
              id.includes('node_modules/scheduler/')) {
            return 'react-vendor'
          }

          // Ant Design — icons + core together to avoid circular deps
          if (id.includes('node_modules/antd/') ||
              id.includes('node_modules/@ant-design/')) {
            return 'antd-core'
          }

          // RC components (used internally by antd)
          if (id.includes('node_modules/rc-') ||
              id.includes('node_modules/@rc-component/')) {
            return 'antd-rc'
          }

          // CSS-in-JS (used by antd v5)
          if (id.includes('node_modules/@emotion/') ||
              id.includes('node_modules/stylis') ||
              id.includes('node_modules/cssinjs')) {
            return 'antd-cssinjs'
          }

          // State / HTTP
          if (id.includes('node_modules/zustand/')) return 'state-vendor'
          if (id.includes('node_modules/axios/'))   return 'http-vendor'

          // Date utilities
          if (id.includes('node_modules/date-fns/') ||
              id.includes('node_modules/dayjs/')) {
            return 'date-vendor'
          }

          // Form libraries
          if (id.includes('node_modules/react-hook-form/') ||
              id.includes('node_modules/@hookform/') ||
              id.includes('node_modules/zod/')) {
            return 'form-vendor'
          }
        },
      },
    },
    // antd bundle is inherently ~600-800 kB gzipped; raise limit to suppress noise
    chunkSizeWarningLimit: 1500,
  },
})
