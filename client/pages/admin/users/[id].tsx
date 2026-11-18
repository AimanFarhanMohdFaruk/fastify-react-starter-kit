import { useRouteContext } from '@fastify/react/client'
import type { FastifyReply, FastifyRequest } from 'fastify'
import type { AdminUserDetailData } from '@app/controllers/admin/loaders'

import { AdminForbidden } from '@/components/screen/admin/admin-shell'
import { AdminUserDetail } from '@/components/screen/admin/users'

export async function getData(ctx: { req: FastifyRequest; reply: FastifyReply }) {
  const { loadAdminUserPage } = await import('@app/controllers/admin/loaders')
  return loadAdminUserPage(ctx.req, ctx.reply)
}

export function getMeta() {
  return { title: 'Admin · User' }
}

export default function AdminUserDetailPage() {
  const { data } = useRouteContext() as { data: AdminUserDetailData }
  if ('forbidden' in data && data.forbidden) return <AdminForbidden />
  if ('notFound' in data && data.notFound) {
    return (
      <div className="flex min-h-dvh items-center justify-center text-muted-foreground text-sm">
        User not found
      </div>
    )
  }
  if (!('user' in data)) return null
  return <AdminUserDetail user={data.user} />
}
