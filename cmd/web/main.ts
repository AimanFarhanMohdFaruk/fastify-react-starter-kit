import 'dotenv/config'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import Fastify from 'fastify'
import cookie from '@fastify/cookie'
import formbody from '@fastify/formbody'
import FastifyVite from '@fastify/vite'
import { registerAuthRoutes } from '../../app/controllers/auth'
import { registerJobRoutes } from '../../app/controllers/jobs'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const root = path.join(__dirname, '../..')
const isProd = process.env.NODE_ENV === 'production'

const logger = isProd
  ? true
  : {
      transport: {
        target: 'pino-pretty',
        options: {
          translateTime: 'HH:MM:ss Z',
          ignore: 'pid,hostname',
        },
      },
    }

async function main() {
  const app = Fastify({ logger })

  await app.register(cookie)
  await app.register(formbody)

  await registerAuthRoutes(app)
  await registerJobRoutes(app)

  await app.register(FastifyVite, {
    root,
    dev: !isProd,
    renderer: '@fastify/react',
  })

  await app.vite.ready()

  const port = Number(process.env.PORT ?? 3000)
  await app.listen({ port, host: '0.0.0.0' })
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
