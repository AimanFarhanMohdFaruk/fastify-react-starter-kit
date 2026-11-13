import Fastify from 'fastify'
import cookie from '@fastify/cookie'
import formbody from '@fastify/formbody'
import multipart from '@fastify/multipart'
import { registerAuthRoutes } from '../../app/controllers/auth'
import { registerDocumentRoutes } from '../../app/controllers/documents'
import { registerPostRoutes } from '../../app/controllers/posts'
import { registerWorkRoutes } from '../../app/controllers/work'
import { DOCUMENT_MAX_BYTES } from '../../app/services/upload-document'

export async function buildApiApp() {
  const app = Fastify({ logger: false })
  await app.register(cookie)
  await app.register(formbody)
  await app.register(multipart, {
    limits: {
      files: 1,
      fileSize: DOCUMENT_MAX_BYTES,
    },
  })
  await registerAuthRoutes(app)
  await registerPostRoutes(app)
  await registerWorkRoutes(app)
  await registerDocumentRoutes(app)
  return app
}
