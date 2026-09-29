import type { FastifyInstance } from 'fastify'
import { getSessionUser } from './auth'
import {
  getDocumentForUser,
  listDocumentsForUser,
} from '../models/document'
import { uploadDocument } from '../services/upload-document'

function documentDto(doc: Awaited<ReturnType<typeof listDocumentsForUser>>[number]) {
  return {
    id: doc.id,
    filename: doc.filename,
    contentType: doc.contentType,
    byteSize: doc.byteSize,
    status: doc.status,
    extractedTextLength: doc.extractedText?.length ?? null,
    createdAt: doc.createdAt.toISOString(),
    updatedAt: doc.updatedAt.toISOString(),
  }
}

export async function registerDocumentRoutes(app: FastifyInstance) {
  app.post('/api/documents', async (req, reply) => {
    const user = await getSessionUser(req)
    if (!user) return reply.code(401).send({ error: 'Unauthorized' })

    const file = await req.file()
    if (!file) return reply.code(400).send({ error: 'file required' })

    try {
      const doc = await uploadDocument(user.id, {
        filename: file.filename,
        contentType: file.mimetype,
        body: file.file,
      })
      return reply.code(201).send(documentDto(doc))
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Upload failed'
      const code =
        message.includes('Only text/plain') ||
        message.includes('Only text/plain, markdown') ||
        message.includes('exceeds')
          ? 400
          : 500
      req.log.error({ err }, 'document upload failed')
      return reply.code(code).send({ error: message })
    }
  })

  app.get('/api/documents', async (req, reply) => {
    const user = await getSessionUser(req)
    if (!user) return reply.code(401).send({ error: 'Unauthorized' })
    const docs = await listDocumentsForUser(user.id)
    return reply.send(docs.map(documentDto))
  })

  app.get('/api/documents/:id', async (req, reply) => {
    const user = await getSessionUser(req)
    if (!user) return reply.code(401).send({ error: 'Unauthorized' })
    const { id } = req.params as { id: string }
    const doc = await getDocumentForUser(id, user.id)
    if (!doc) return reply.code(404).send({ error: 'Not found' })
    return reply.send(documentDto(doc))
  })
}
