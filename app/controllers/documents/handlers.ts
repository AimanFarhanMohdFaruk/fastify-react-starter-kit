/**
 * Thin HTTP handlers — parse → one model or service → JSON.
 * Session gate lives on the route (`requireSession` in index.ts).
 */
import type { FastifyReply, FastifyRequest } from 'fastify'
import { sessionUser } from '../auth'
import {
  getDocumentForUser,
  listDocumentsForUser,
} from '../../models/document'
import {
  uploadDocument,
  UploadDocumentError,
} from '../../services/upload-document'
import { documentDto } from './dto'

export async function create(req: FastifyRequest, reply: FastifyReply) {
  const file = await req.file()
  if (!file) return reply.code(400).send({ error: 'file required' })

  try {
    const doc = await uploadDocument(sessionUser(req).id, {
      filename: file.filename,
      contentType: file.mimetype,
      body: file.file,
    })
    return reply.code(201).send(documentDto(doc))
  } catch (err) {
    if (err instanceof UploadDocumentError) {
      return reply.code(400).send({ error: err.message, kind: err.kind })
    }
    const message = err instanceof Error ? err.message : 'Upload failed'
    req.log.error({ err }, 'document upload failed')
    return reply.code(500).send({ error: message })
  }
}

export async function list(req: FastifyRequest, reply: FastifyReply) {
  const docs = await listDocumentsForUser(sessionUser(req).id)
  return reply.send(docs.map(documentDto))
}

export async function show(req: FastifyRequest, reply: FastifyReply) {
  const { id } = req.params as { id: string }
  const doc = await getDocumentForUser(id, sessionUser(req).id)
  if (!doc) return reply.code(404).send({ error: 'Not found' })
  return reply.send(documentDto(doc))
}
