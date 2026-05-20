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

          // Ant Design — ALL in one chunk to prevent circular init errors
          // (antd, @ant-design/icons, rc-*, @rc-component, cssinjs are tightly coupled)
          if (id.includes('node_modules/antd/') ||
              id.includes('node_modules/@ant-design/') ||
              id.includes('node_modules/rc-') ||
              id.includes('node_modules/@rc-component/') ||
              id.includes('node_modules/@emotion/') ||
              id.includes('node_modules/stylis') ||
              id.includes('node_modules/cssinjs')) {
            return 'antd-vendor'
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
    // antd v5 bundle is inherently large (~1.1 MB); raise limit to avoid noise
    chunkSizeWarningLimit: 1500,
  },
})
