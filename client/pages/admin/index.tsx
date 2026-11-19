import { useRouteContext } from '@fastify/react/client'
import type { FastifyReply, FastifyRequest } from 'fastify'
import type { AdminIndexData } from '@app/controllers/admin/loaders'

import { AdminForbidden } from '@/components/screen/admin/admin-shell'
import { pageRedirect } from '@/lib/page-navigation'

export async function getData(ctx: { req: FastifyRequest; reply: FastifyReply }) {
  const { loadAdminIndexPage } = await import('@app/controllers/admin/loaders')
  return loadAdminIndexPage(ctx.req, ctx.reply)
}

export function getMeta() {
  return { title: 'Admin' }
}

export default function AdminIndexPage() {
  const { data } = useRouteContext() as { data: AdminIndexData }
  const redirect = pageRedirect(data)
  if (redirect) return redirect
  if ('forbidden' in data && data.forbidden) return <AdminForbidden />
  return null
}
