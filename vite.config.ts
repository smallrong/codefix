import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import viteCompression from 'vite-plugin-compression'
import path from 'path'

export default defineConfig({
  plugins: [
    vue(),
    viteCompression({
      algorithm: 'gzip',
      deleteOriginFile: false,
      threshold: 10240,
      ext: '.gz',
      verbose: true,
      disable: false,
      filter: /\.(js|css|json|txt|html|ico|svg)(\?.*)?$/i,
    })
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src')
    }
  }
}) 