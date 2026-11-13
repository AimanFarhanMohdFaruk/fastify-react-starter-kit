import { useRouteContext } from '@fastify/react/client'
import type { FastifyReply, FastifyRequest } from 'fastify'

import { AdminForbidden } from '@/components/screen/admin/admin-shell'
import { AdminPostDetail } from '@/components/screen/admin/posts'
import type { AdminPostDto } from '@/lib/api'

type Data = {
  forbidden?: boolean
  post?: AdminPostDto | null
  notFound?: boolean
}

export async function getData(ctx: {
  req: FastifyRequest
  reply: FastifyReply
}) {
  const { loadAdminPostPage } = await import('@app/controllers/admin/loaders')
  return loadAdminPostPage(ctx.req, ctx.reply)
}

export function getMeta() {
  return { title: 'Admin · Post' }
}

export default function AdminPostDetailPage() {
  const { data } = useRouteContext() as { data: Data }
  if (data.forbidden) return <AdminForbidden />
  if (data.notFound || !data.post) {
    return <p className="p-8 text-muted-foreground text-sm">Post not found</p>
  }
  return <AdminPostDetail post={data.post} />
}
