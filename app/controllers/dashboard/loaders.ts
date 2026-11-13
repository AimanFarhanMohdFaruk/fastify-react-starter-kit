/**
 * Dashboard page loader — session + seed lists via *Dto.
 */
import type { FastifyReply, FastifyRequest } from 'fastify'
import { isAdmin } from '../../models/admin'
import { listDocumentsForUser } from '../../models/document'
import { listPostsForUser } from '../../models/post'
import {
  DOCUMENT_ACCEPT,
  DOCUMENT_MAX_BYTES,
} from '../../services/upload-document'
import { getSessionUser } from '../auth'
import { documentDto, type DocumentDto } from '../documents/dto'
import { postDto, type PostDto } from '../posts/dto'

export type DashboardPageData =
  | Record<string, never>
  | {
      email: string
      isAdmin: boolean
      posts: PostDto[]
      documents: DocumentDto[]
      documentAccept: string
      documentMaxBytes: number
    }

export async function loadDashboardPage(
  req: FastifyRequest,
  reply: FastifyReply,
): Promise<DashboardPageData> {
  const user = await getSessionUser(req)
  if (!user) {
    reply.redirect('/login')
    return {}
  }

  const [postRows, docs] = await Promise.all([
    listPostsForUser(user.id),
    listDocumentsForUser(user.id),
  ])

  return {
    email: user.email,
    isAdmin: isAdmin(user),
    documentAccept: DOCUMENT_ACCEPT,
    documentMaxBytes: DOCUMENT_MAX_BYTES,
    posts: postRows.map(postDto),
    documents: docs.map(documentDto),
  }
}
