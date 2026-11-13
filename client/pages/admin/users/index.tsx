import { useRouteContext } from '@fastify/react/client'
import type { FastifyReply, FastifyRequest } from 'fastify'

import { AdminForbidden } from '@/components/screen/admin/admin-shell'
import { AdminUsersList } from '@/components/screen/admin/users'
import type { AdminUserDto } from '@/lib/api'

type Data = { forbidden?: boolean; users?: AdminUserDto[] }

export async function getData(ctx: { req: FastifyRequest; reply: FastifyReply }) {
  const { gateAdminPage } = await import('@app/controllers/auth')
  const { adminUserDto } = await import('@app/controllers/admin/dto')
  const { listUsersForAdmin } = await import('@app/models/admin')
  const gate = await gateAdminPage(ctx.req, ctx.reply)
  if (!gate.ok) return gate.kind === 'forbidden' ? { forbidden: true } : {}
  const users = await listUsersForAdmin()
  return { users: users.map(adminUserDto) }
}

export function getMeta() {
  return { title: 'Admin · Users' }
}

export default function AdminUsersPage() {
  const { data } = useRouteContext() as { data: Data }
  if (data.forbidden) return <AdminForbidden />
  return <AdminUsersList users={data.users ?? []} />
}
