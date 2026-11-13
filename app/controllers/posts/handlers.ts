/**
 * Thin HTTP handlers — parse → one model → JSON.
 * Session gate lives on the route (`requireSession` in index.ts).
 */
import type { FastifyReply, FastifyRequest } from 'fastify'
import { sessionUser } from '../auth'
import {
  createPost,
  deletePostForUser,
  getPostForUser,
  listPostsForUser,
  updatePostForUser,
} from '../../models/post'
import { parsePostBody, parsePostPatch, postDto } from './dto'

export async function list(req: FastifyRequest, reply: FastifyReply) {
  const rows = await listPostsForUser(sessionUser(req).id)
  return reply.send(rows.map(postDto))
}

export async function create(req: FastifyRequest, reply: FastifyReply) {
  const input = parsePostBody(req.body)
  try {
    const post = await createPost(sessionUser(req).id, input)
    return reply.code(201).send(postDto(post))
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Create failed'
    return reply.code(400).send({ error: message })
  }
}

export async function show(req: FastifyRequest, reply: FastifyReply) {
  const { id } = req.params as { id: string }
  const post = await getPostForUser(id, sessionUser(req).id)
  if (!post) return reply.code(404).send({ error: 'Not found' })
  return reply.send(postDto(post))
}

export async function update(req: FastifyRequest, reply: FastifyReply) {
  const { id } = req.params as { id: string }
  const input = parsePostPatch(req.body)
  try {
    const post = await updatePostForUser(id, sessionUser(req).id, input)
    if (!post) return reply.code(404).send({ error: 'Not found' })
    return reply.send(postDto(post))
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Update failed'
    return reply.code(400).send({ error: message })
  }
}

export async function destroy(req: FastifyRequest, reply: FastifyReply) {
  const { id } = req.params as { id: string }
  const deleted = await deletePostForUser(id, sessionUser(req).id)
  if (!deleted) return reply.code(404).send({ error: 'Not found' })
  return reply.code(204).send()
}
