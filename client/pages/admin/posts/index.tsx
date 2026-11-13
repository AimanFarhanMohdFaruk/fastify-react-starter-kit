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
  const { loadAdminPostsPage } = await import('@app/controllers/admin/loaders')
  return loadAdminPostsPage(ctx.req, ctx.reply)
}

export function getMeta() {
  return { title: 'Admin · Posts' }
}

export default function AdminPostsPage() {
  const { data } = useRouteContext() as { data: Data }
  if (data.forbidden) return <AdminForbidden />
  return <AdminPostsList posts={data.posts ?? []} />
}
