import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import path from 'node:path'

export default defineConfig({
  plugins: [react(), tailwindcss()],
  root: '.',
  resolve: {
    alias: {
      '@': path.resolve('web'),
    },
  },
  build: {
    outDir: 'build/client',
    emptyOutDir: true,
    rollupOptions: {
      input: path.resolve('index.html'),
    },
  },
  server: {
    middlewareMode: true,
  },
  appType: 'custom',
})
