/**
 * Thin HTTP handlers — parse → one model or service → JSON.
 * Session gate lives on the route (`requireSession` in index.ts).
 * Domain errors bubble to composeWebApp setErrorHandler.
 */
import type { FastifyReply, FastifyRequest } from 'fastify'
import { NotFoundError, ValidationError } from '../../errors'
import {
  getDocumentForUser,
  listDocumentsForUser,
} from '../../models/document'
import { uploadDocument } from '../../services/upload-document'
import { sessionUser } from '../auth'
import { documentDto } from './dto'

export async function create(req: FastifyRequest, reply: FastifyReply) {
  const file = await req.file()
  if (!file) throw new ValidationError('file required')

  const doc = await uploadDocument(sessionUser(req).id, {
    filename: file.filename,
    contentType: file.mimetype,
    body: file.file,
  })
  return reply.code(201).send(documentDto(doc))
}

export async function list(req: FastifyRequest, reply: FastifyReply) {
  const docs = await listDocumentsForUser(sessionUser(req).id)
  return reply.send(docs.map(documentDto))
}

export async function show(req: FastifyRequest, reply: FastifyReply) {
  const { id } = req.params as { id: string }
  const doc = await getDocumentForUser(id, sessionUser(req).id)
  if (!doc) throw new NotFoundError()
  return reply.send(documentDto(doc))
}
