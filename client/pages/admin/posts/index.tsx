import { useRouteContext } from '@fastify/react/client'
import type { FastifyReply, FastifyRequest } from 'fastify'

import { AdminForbidden } from '@/components/screen/admin/admin-shell'
import { AdminPostsList } from '@/components/screen/admin/posts'
import type { AdminPostDto } from '@/lib/api'

type Data = { forbidden?: boolean; posts?: AdminPostDto[] }

export async function getData(ctx: {
  req: FastifyRequest
  reply: FastifyReply
}) {
  const { gateAdminPage } = await import('@app/controllers/auth')
  const { adminPostListDto } = await import('@app/controllers/admin/dto')
  const { listPostsForAdmin } = await import('@app/models/admin')
  const gate = await gateAdminPage(ctx.req, ctx.reply)
  if (!gate.ok) return gate.kind === 'forbidden' ? { forbidden: true } : {}

  const rows = await listPostsForAdmin()
  return { posts: rows.map(adminPostListDto) }
}

export function getMeta() {
  return { title: 'Admin · Posts' }
}

export default function AdminPostsPage() {
  const { data } = useRouteContext() as { data: Data }
  if (data.forbidden) return <AdminForbidden />
  return <AdminPostsList posts={data.posts ?? []} />
}
