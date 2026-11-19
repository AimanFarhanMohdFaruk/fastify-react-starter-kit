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
import { documentDto, type DocumentDto } from '../documents/dto'
import { gatePage } from '../page-gate'
import { postDto, type PostDto } from '../posts/dto'

export type DashboardPageData =
  | { redirectTo: string }
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
  const gate = await gatePage(req, reply, 'signedIn')
  if (!gate.ok) return gate.data

  const [postRows, docs] = await Promise.all([
    listPostsForUser(gate.user.id),
    listDocumentsForUser(gate.user.id),
  ])

  return {
    email: gate.user.email,
    isAdmin: isAdmin(gate.user),
    documentAccept: DOCUMENT_ACCEPT,
    documentMaxBytes: DOCUMENT_MAX_BYTES,
    posts: postRows.map(postDto),
    documents: docs.map(documentDto),
  }
}
