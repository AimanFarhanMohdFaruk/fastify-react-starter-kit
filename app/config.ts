/**
 * Web app composition — plugins + /api routes + optional Vite.
 * cmd/web and the /api test harness share this module.
 */
import Fastify, {
  type FastifyInstance,
  type FastifyServerOptions,
} from 'fastify'
import cookie from '@fastify/cookie'
import formbody from '@fastify/formbody'
import multipart from '@fastify/multipart'
import FastifyVite from '@fastify/vite'
import { registerAuthRoutes } from './controllers/auth'
import { registerDocumentRoutes } from './controllers/documents'
import { registerPostRoutes } from './controllers/posts'
import { registerWorkRoutes } from './controllers/work'
import { DOCUMENT_MAX_BYTES } from './services/upload-document'

export type ComposeWebAppOptions = {
  logger?: FastifyServerOptions['logger']
  rateLimit?: { max: number; timeWindow: string }
  /** Omit for /api-only (tests). */
  vite?: { root: string; dev: boolean }
}

export async function composeWebApp(
  opts: ComposeWebAppOptions = {},
): Promise<FastifyInstance> {
  const app = Fastify({
    logger: opts.logger ?? false,
    // Needed so rate-limit keys on the real client IP behind a reverse proxy.
    trustProxy: true,
  })

  await app.register(cookie)
  await app.register(formbody)
  await app.register(multipart, {
    limits: {
      files: 1,
      fileSize: DOCUMENT_MAX_BYTES,
    },
  })
  await app.register(import('@fastify/rate-limit'), {
    max: opts.rateLimit?.max ?? 10_000,
    timeWindow: opts.rateLimit?.timeWindow ?? '1 minute',
  })

  await registerAuthRoutes(app)
  await registerPostRoutes(app)
  await registerWorkRoutes(app)
  await registerDocumentRoutes(app)

  if (opts.vite) {
    await app.register(FastifyVite, {
      root: opts.vite.root,
      dev: opts.vite.dev,
      renderer: '@fastify/react',
    })
    await app.vite.ready()
  }

  return app
}
