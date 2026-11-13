/**
 * Admin page loaders — gate + query + dto for getData.
 * Pages dynamic-import one function; keep route modules presentation-thin.
 */
import type { FastifyReply, FastifyRequest } from 'fastify'
import {
  getPostForAdmin,
  getUserForAdmin,
  listPostsForAdmin,
  listUsersForAdmin,
} from '../../models/admin'
import { gateAdminPage } from '../auth'
import {
  adminPostDetailDto,
  adminPostListDto,
  adminUserDto,
  type AdminPostDto,
  type AdminUserDto,
} from './dto'

type ForbiddenOrEmpty = { forbidden: true } | Record<string, never>

async function gateOrDeny(
  req: FastifyRequest,
  reply: FastifyReply,
): Promise<{ ok: true } | { ok: false; data: ForbiddenOrEmpty }> {
  const gate = await gateAdminPage(req, reply)
  if (gate.ok) return { ok: true }
  return {
    ok: false,
    data: gate.kind === 'forbidden' ? { forbidden: true } : {},
  }
}

export type AdminIndexData = ForbiddenOrEmpty

export async function loadAdminIndexPage(
  req: FastifyRequest,
  reply: FastifyReply,
): Promise<AdminIndexData> {
  const gate = await gateOrDeny(req, reply)
  if (!gate.ok) return gate.data
  reply.redirect('/admin/users')
  return {}
}

export type AdminUsersListData =
  | { forbidden: true }
  | { users: AdminUserDto[] }
  | Record<string, never>

export async function loadAdminUsersPage(
  req: FastifyRequest,
  reply: FastifyReply,
): Promise<AdminUsersListData> {
  const gate = await gateOrDeny(req, reply)
  if (!gate.ok) return gate.data
  const users = await listUsersForAdmin()
  return { users: users.map(adminUserDto) }
}

export type AdminUserDetailData =
  | { forbidden: true }
  | { notFound: true }
  | { user: AdminUserDto }
  | Record<string, never>

export async function loadAdminUserPage(
  req: FastifyRequest,
  reply: FastifyReply,
): Promise<AdminUserDetailData> {
  const gate = await gateOrDeny(req, reply)
  if (!gate.ok) return gate.data

  const id = String((req.params as { id?: string }).id ?? '')
  const user = await getUserForAdmin(id)
  if (!user) {
    reply.code(404)
    return { notFound: true }
  }
  return { user: adminUserDto(user) }
}

export type AdminPostsListData =
  | { forbidden: true }
  | { posts: AdminPostDto[] }
  | Record<string, never>

export async function loadAdminPostsPage(
  req: FastifyRequest,
  reply: FastifyReply,
): Promise<AdminPostsListData> {
  const gate = await gateOrDeny(req, reply)
  if (!gate.ok) return gate.data
  const rows = await listPostsForAdmin()
  return { posts: rows.map(adminPostListDto) }
}

export type AdminPostDetailData =
  | { forbidden: true }
  | { notFound: true }
  | { post: AdminPostDto }
  | Record<string, never>

export async function loadAdminPostPage(
  req: FastifyRequest,
  reply: FastifyReply,
): Promise<AdminPostDetailData> {
  const gate = await gateOrDeny(req, reply)
  if (!gate.ok) return gate.data

  const id = (req.params as { id?: string }).id
  if (!id) return { notFound: true }

  const row = await getPostForAdmin(id)
  if (!row) return { notFound: true }

  return { post: adminPostDetailDto(row) }
}
