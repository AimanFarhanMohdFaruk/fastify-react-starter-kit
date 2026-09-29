import Fastify from 'fastify'
import cookie from '@fastify/cookie'
import formbody from '@fastify/formbody'
import multipart from '@fastify/multipart'
import { registerAuthRoutes } from '../../app/controllers/auth'
import { registerDocumentRoutes } from '../../app/controllers/documents'
import { registerJobRoutes } from '../../app/controllers/jobs'

export async function buildApiApp() {
  const app = Fastify({ logger: false })
  await app.register(cookie)
  await app.register(formbody)
  await app.register(multipart, {
    limits: {
      files: 1,
      fileSize: 5 * 1024 * 1024,
    },
  })
  await registerAuthRoutes(app)
  await registerJobRoutes(app)
  await registerDocumentRoutes(app)
  return app
}
