import { resolve } from 'node:path'
import { defineConfig } from 'vite'
import viteReact from '@vitejs/plugin-react'
import fastifyReact from '@fastify/react/plugin'
import viteFastify from '@fastify/vite/plugin'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  root: resolve(import.meta.dirname, 'client'),
  plugins: [viteReact(), fastifyReact(), viteFastify(), tailwindcss()],
  resolve: {
    alias: {
      '@': resolve(import.meta.dirname, 'client'),
      '@app': resolve(import.meta.dirname, 'app'),
    },
  },
})
