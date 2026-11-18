import { useRouteContext } from '@fastify/react/client'
import type { FastifyReply, FastifyRequest } from 'fastify'
import type { AdminPostsListData } from '@app/controllers/admin/loaders'

import { AdminForbidden } from '@/components/screen/admin/admin-shell'
import { AdminPostsList } from '@/components/screen/admin/posts'

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
  const { data } = useRouteContext() as { data: AdminPostsListData }
  if ('forbidden' in data && data.forbidden) return <AdminForbidden />
  if (!('posts' in data)) return null
  return <AdminPostsList posts={data.posts} />
}
