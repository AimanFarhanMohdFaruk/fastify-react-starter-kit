import type { FastifyInstance, FastifyRequest } from 'fastify'
import { auth } from '../models/auth'

/** Convert Fastify request to Fetch API Request for Better Auth. */
export async function toAuthRequest(req: FastifyRequest) {
  const host = req.headers.host ?? 'localhost:3000'
  const url = new URL(req.url, `http://${host}`)
  const headers = new Headers()
  for (const [key, value] of Object.entries(req.headers)) {
    if (value === undefined) continue
    if (Array.isArray(value)) value.forEach((v) => headers.append(key, v))
    else headers.set(key, value)
  }
  const method = req.method.toUpperCase()
  const init: RequestInit = { method, headers }
  if (method !== 'GET' && method !== 'HEAD') {
    init.body = typeof req.body === 'string' ? req.body : JSON.stringify(req.body ?? {})
    if (!headers.has('content-type')) headers.set('content-type', 'application/json')
  }
  return new Request(url, init)
}

export async function getSessionUser(req: FastifyRequest) {
  const session = await auth.api.getSession({ headers: fromFastifyHeaders(req) })
  return session?.user ?? null
}

function fromFastifyHeaders(req: FastifyRequest) {
  const headers = new Headers()
  for (const [key, value] of Object.entries(req.headers)) {
    if (value === undefined) continue
    if (Array.isArray(value)) value.forEach((v) => headers.append(key, v))
    else headers.set(key, value)
  }
  return headers
}

export async function registerAuthRoutes(app: FastifyInstance) {
  app.route({
    method: ['GET', 'POST'],
    url: '/api/auth/*',
    config: {
      // Tighter than the global web limit — auth endpoints are brute-force targets.
      rateLimit: {
        max: 30,
        timeWindow: '1 minute',
      },
    },
    async handler(req, reply) {
      const request = await toAuthRequest(req)
      const response = await auth.handler(request)
      reply.status(response.status)
      response.headers.forEach((value, key) => {
        reply.header(key, value)
      })
      const text = await response.text()
      return reply.send(text || null)
    },
  })
}
