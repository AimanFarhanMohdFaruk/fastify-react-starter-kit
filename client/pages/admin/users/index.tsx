import { useRouteContext } from '@fastify/react/client'
import type { FastifyReply, FastifyRequest } from 'fastify'

import { AdminForbidden } from '@/components/screen/admin/admin-shell'
import { AdminUsersList } from '@/components/screen/admin/users'
import type { AdminUserDto } from '@/lib/api'

type Data = { forbidden?: boolean; users?: AdminUserDto[] }

export async function getData(ctx: { req: FastifyRequest; reply: FastifyReply }) {
  const { loadAdminUsersPage } = await import('@app/controllers/admin/loaders')
  return loadAdminUsersPage(ctx.req, ctx.reply)
}

export function getMeta() {
  return { title: 'Admin · Users' }
}

export default function AdminUsersPage() {
  const { data } = useRouteContext() as { data: Data }
  if (data.forbidden) return <AdminForbidden />
  return <AdminUsersList users={data.users ?? []} />
}
