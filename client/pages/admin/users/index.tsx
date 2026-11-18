import { useRouteContext } from '@fastify/react/client'
import type { FastifyReply, FastifyRequest } from 'fastify'
import type { AdminUsersListData } from '@app/controllers/admin/loaders'

import { AdminForbidden } from '@/components/screen/admin/admin-shell'
import { AdminUsersList } from '@/components/screen/admin/users'

export async function getData(ctx: { req: FastifyRequest; reply: FastifyReply }) {
  const { loadAdminUsersPage } = await import('@app/controllers/admin/loaders')
  return loadAdminUsersPage(ctx.req, ctx.reply)
}

export function getMeta() {
  return { title: 'Admin · Users' }
}

export default function AdminUsersPage() {
  const { data } = useRouteContext() as { data: AdminUsersListData }
  if ('forbidden' in data && data.forbidden) return <AdminForbidden />
  if (!('users' in data)) return null
  return <AdminUsersList users={data.users} />
}
