import { useRouteContext } from '@fastify/react/client'
import type { FastifyReply, FastifyRequest } from 'fastify'

import { AdminForbidden } from '@/components/screen/admin/admin-shell'

type Data = { forbidden?: boolean }

export async function getData(ctx: { req: FastifyRequest; reply: FastifyReply }) {
  const { gateAdminPage } = await import('@app/controllers/auth')
  const gate = await gateAdminPage(ctx.req, ctx.reply)
  if (!gate.ok) return gate.kind === 'forbidden' ? { forbidden: true } : {}
  ctx.reply.redirect('/admin/users')
  return {}
}

export function getMeta() {
  return { title: 'Admin' }
}

export default function AdminIndexPage() {
  const { data } = useRouteContext() as { data: Data }
  if (data.forbidden) return <AdminForbidden />
  return null
}
