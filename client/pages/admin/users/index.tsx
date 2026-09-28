import { useRouteContext } from '@fastify/react/client'
import type { FastifyReply, FastifyRequest } from 'fastify'

import { AdminForbidden } from '@/components/screen/admin/admin-shell'
import { AdminUsersList, type AdminUserRow } from '@/components/screen/admin/users'

type Data = { forbidden?: boolean; users?: AdminUserRow[] }

export async function getData(ctx: { req: FastifyRequest; reply: FastifyReply }) {
  const { gateAdminPage } = await import('@app/controllers/auth')
  const { listUsersForAdmin } = await import('@app/models/admin')
  const gate = await gateAdminPage(ctx.req, ctx.reply)
  if (!gate.ok) return gate.kind === 'forbidden' ? { forbidden: true } : {}
  const users = await listUsersForAdmin()
  return {
    users: users.map((u) => ({
      id: u.id,
      email: u.email,
      name: u.name,
      role: u.role,
      createdAt: u.createdAt.toISOString(),
    })),
  }
}

export function getMeta() {
  return { title: 'Admin · Users' }
}

export default function AdminUsersPage() {
  const { data } = useRouteContext() as { data: Data }
  if (data.forbidden) return <AdminForbidden />
  return <AdminUsersList users={data.users ?? []} />
}
