import { useRouteContext } from '@fastify/react/client'
import type { FastifyReply, FastifyRequest } from 'fastify'

import { AdminForbidden } from '@/components/screen/admin/admin-shell'
import { AdminUserDetail } from '@/components/screen/admin/users'
import type { AdminUserDto } from '@/lib/api'

type Data = { forbidden?: boolean; user?: AdminUserDto | null; notFound?: boolean }

export async function getData(ctx: { req: FastifyRequest; reply: FastifyReply }) {
  const { gateAdminPage } = await import('@app/controllers/auth')
  const { adminUserDto } = await import('@app/controllers/admin/dto')
  const { getUserForAdmin } = await import('@app/models/admin')
  const gate = await gateAdminPage(ctx.req, ctx.reply)
  if (!gate.ok) return gate.kind === 'forbidden' ? { forbidden: true } : {}
  const id = String((ctx.req.params as { id?: string }).id ?? '')
  const user = await getUserForAdmin(id)
  if (!user) {
    ctx.reply.code(404)
    return { notFound: true }
  }
  return { user: adminUserDto(user) }
}

export function getMeta() {
  return { title: 'Admin · User' }
}

export default function AdminUserDetailPage() {
  const { data } = useRouteContext() as { data: Data }
  if (data.forbidden) return <AdminForbidden />
  if (data.notFound || !data.user) {
    return (
      <div className="flex min-h-dvh items-center justify-center text-muted-foreground text-sm">
        User not found
      </div>
    )
  }
  return <AdminUserDetail user={data.user} />
}
