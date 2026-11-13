import Fastify from 'fastify'
import cookie from '@fastify/cookie'
import formbody from '@fastify/formbody'
import multipart from '@fastify/multipart'
import { registerAuthRoutes } from '../../app/controllers/auth'
import { registerDocumentRoutes } from '../../app/controllers/documents'
import { registerPostRoutes } from '../../app/controllers/posts'
import { registerWorkRoutes } from '../../app/controllers/work'
import { DOCUMENT_MAX_BYTES } from '../../app/services/upload-document'

/** Controllers only — no Vite. Keep plugins in sync with `cmd/web/main.ts`. */
export async function buildApiApp() {
  const app = Fastify({ logger: false, trustProxy: true })
  await app.register(cookie)
  await app.register(formbody)
  await app.register(multipart, {
    limits: {
      files: 1,
      fileSize: DOCUMENT_MAX_BYTES,
    },
  })
  await app.register(import('@fastify/rate-limit'), {
    max: 10_000,
    timeWindow: '1 minute',
  })
  await registerAuthRoutes(app)
  await registerPostRoutes(app)
  await registerWorkRoutes(app)
  await registerDocumentRoutes(app)
  return app
}
