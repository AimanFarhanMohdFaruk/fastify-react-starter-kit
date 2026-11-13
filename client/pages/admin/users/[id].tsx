import { useRouteContext } from '@fastify/react/client'
import type { FastifyReply, FastifyRequest } from 'fastify'

import { AdminForbidden } from '@/components/screen/admin/admin-shell'
import { AdminUserDetail } from '@/components/screen/admin/users'
import type { AdminUserDto } from '@/lib/api'

type Data = { forbidden?: boolean; user?: AdminUserDto | null; notFound?: boolean }

export async function getData(ctx: { req: FastifyRequest; reply: FastifyReply }) {
  const { loadAdminUserPage } = await import('@app/controllers/admin/loaders')
  return loadAdminUserPage(ctx.req, ctx.reply)
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
