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
import { gatePage } from '../page-gate'
import {
  adminPostDetailDto,
  adminPostListDto,
  adminUserDto,
  type AdminPostDto,
  type AdminUserDto,
} from './dto'

type GateDenied = { forbidden: true } | { redirectTo: string }

export type AdminIndexData = GateDenied

export async function loadAdminIndexPage(
  req: FastifyRequest,
  reply: FastifyReply,
): Promise<AdminIndexData> {
  const gate = await gatePage(req, reply, 'admin')
  if (!gate.ok) return gate.data
  return { redirectTo: '/admin/users' }
}

export type AdminUsersListData =
  | GateDenied
  | { users: AdminUserDto[] }

export async function loadAdminUsersPage(
  req: FastifyRequest,
  reply: FastifyReply,
): Promise<AdminUsersListData> {
  const gate = await gatePage(req, reply, 'admin')
  if (!gate.ok) return gate.data
  const users = await listUsersForAdmin()
  return { users: users.map(adminUserDto) }
}

export type AdminUserDetailData =
  | GateDenied
  | { notFound: true }
  | { user: AdminUserDto }

export async function loadAdminUserPage(
  req: FastifyRequest,
  reply: FastifyReply,
): Promise<AdminUserDetailData> {
  const gate = await gatePage(req, reply, 'admin')
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
  | GateDenied
  | { posts: AdminPostDto[] }

export async function loadAdminPostsPage(
  req: FastifyRequest,
  reply: FastifyReply,
): Promise<AdminPostsListData> {
  const gate = await gatePage(req, reply, 'admin')
  if (!gate.ok) return gate.data
  const rows = await listPostsForAdmin()
  return { posts: rows.map(adminPostListDto) }
}

export type AdminPostDetailData =
  | GateDenied
  | { notFound: true }
  | { post: AdminPostDto }

export async function loadAdminPostPage(
  req: FastifyRequest,
  reply: FastifyReply,
): Promise<AdminPostDetailData> {
  const gate = await gatePage(req, reply, 'admin')
  if (!gate.ok) return gate.data

  const id = (req.params as { id?: string }).id
  if (!id) return { notFound: true }

  const row = await getPostForAdmin(id)
  if (!row) return { notFound: true }

  return { post: adminPostDetailDto(row) }
}
