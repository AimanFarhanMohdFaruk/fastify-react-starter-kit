import Fastify from 'fastify'
import cookie from '@fastify/cookie'
import formbody from '@fastify/formbody'
import { registerAuthRoutes } from '../../app/controllers/auth'
import { registerJobRoutes } from '../../app/controllers/jobs'

export async function buildApiApp() {
  const app = Fastify({ logger: false })
  await app.register(cookie)
  await app.register(formbody)
  await registerAuthRoutes(app)
  await registerJobRoutes(app)
  return app
}
