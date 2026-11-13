import { useRouteContext } from '@fastify/react/client'
import type { FastifyReply, FastifyRequest } from 'fastify'

import { AdminForbidden } from '@/components/screen/admin/admin-shell'

type Data = { forbidden?: boolean }

export async function getData(ctx: { req: FastifyRequest; reply: FastifyReply }) {
  const { loadAdminIndexPage } = await import('@app/controllers/admin/loaders')
  return loadAdminIndexPage(ctx.req, ctx.reply)
}

export function getMeta() {
  return { title: 'Admin' }
}

export default function AdminIndexPage() {
  const { data } = useRouteContext() as { data: Data }
  if (data.forbidden) return <AdminForbidden />
  return null
}
