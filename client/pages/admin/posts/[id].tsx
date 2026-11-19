import { useRouteContext } from '@fastify/react/client'
import type { FastifyReply, FastifyRequest } from 'fastify'
import type { AdminPostDetailData } from '@app/controllers/admin/loaders'

import { AdminForbidden } from '@/components/screen/admin/admin-shell'
import { AdminPostDetail } from '@/components/screen/admin/posts'
import { pageRedirect } from '@/lib/page-navigation'

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
  const { data } = useRouteContext() as { data: AdminPostDetailData }
  const redirect = pageRedirect(data)
  if (redirect) return redirect
  if ('forbidden' in data && data.forbidden) return <AdminForbidden />
  if ('notFound' in data && data.notFound) {
    return <p className="p-8 text-muted-foreground text-sm">Post not found</p>
  }
  if (!('post' in data)) return null
  return <AdminPostDetail post={data.post} />
}
