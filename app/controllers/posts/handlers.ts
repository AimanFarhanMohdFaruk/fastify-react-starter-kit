/**
 * Thin HTTP handlers — parse → one model → JSON.
 * Session gate lives on the route (`requireSession` in index.ts).
 * Domain errors bubble to composeWebApp setErrorHandler.
 */
import type { FastifyReply, FastifyRequest } from 'fastify'
import { NotFoundError } from '../../errors'
import {
  createPost,
  deletePostForUser,
  getPostForUser,
  listPostsForUser,
  updatePostForUser,
} from '../../models/post'
import { sessionUser } from '../auth'
import { parsePostBody, parsePostPatch, postDto } from './dto'

export async function list(req: FastifyRequest, reply: FastifyReply) {
  const rows = await listPostsForUser(sessionUser(req).id)
  return reply.send(rows.map(postDto))
}

export async function create(req: FastifyRequest, reply: FastifyReply) {
  const input = parsePostBody(req.body)
  const post = await createPost(sessionUser(req).id, input)
  return reply.code(201).send(postDto(post))
}

export async function show(req: FastifyRequest, reply: FastifyReply) {
  const { id } = req.params as { id: string }
  const post = await getPostForUser(id, sessionUser(req).id)
  if (!post) throw new NotFoundError()
  return reply.send(postDto(post))
}

export async function update(req: FastifyRequest, reply: FastifyReply) {
  const { id } = req.params as { id: string }
  const input = parsePostPatch(req.body)
  const post = await updatePostForUser(id, sessionUser(req).id, input)
  if (!post) throw new NotFoundError()
  return reply.send(postDto(post))
}

export async function destroy(req: FastifyRequest, reply: FastifyReply) {
  const { id } = req.params as { id: string }
  const deleted = await deletePostForUser(id, sessionUser(req).id)
  if (!deleted) throw new NotFoundError()
  return reply.code(204).send()
}
