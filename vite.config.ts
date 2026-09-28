import { resolve } from 'node:path'
import { defineConfig } from 'vite'
import viteReact from '@vitejs/plugin-react'
import fastifyReact from '@fastify/react/plugin'
import viteFastify from '@fastify/vite/plugin'
import tailwindcss from '@tailwindcss/vite'
import { appServerOnly } from './vite.app-server-only'

const appRoot = resolve(import.meta.dirname, 'app')

export default defineConfig({
  root: resolve(import.meta.dirname, 'client'),
  plugins: [
    viteReact(),
    appServerOnly(appRoot),
    fastifyReact(),
    viteFastify(),
    tailwindcss(),
  ],
  resolve: {
    alias: {
      '@': resolve(import.meta.dirname, 'client'),
      '@app': appRoot,
    },
  },
})
