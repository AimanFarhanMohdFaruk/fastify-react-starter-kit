import { useRouteContext } from '@fastify/react/client'
import type { FastifyReply, FastifyRequest } from 'fastify'

import { AdminForbidden } from '@/components/screen/admin/admin-shell'
import {
  AdminPostsList,
  type AdminPostRow,
} from '@/components/screen/admin/posts'

type Data = { forbidden?: boolean; posts?: AdminPostRow[] }

export async function getData(ctx: {
  req: FastifyRequest
  reply: FastifyReply
}) {
  const { gateAdminPage } = await import('@app/controllers/auth')
  const user = await gateAdminPage(ctx.req, ctx.reply)
  if (!user) return { forbidden: true }

  const { listPostsForAdmin } = await import('@app/models/admin')
  const rows = await listPostsForAdmin()
  return {
    posts: rows.map((r) => ({
      id: r.id,
      title: r.title,
      createdAt: r.createdAt.toISOString(),
      userId: r.userId,
      userEmail: r.userEmail,
    })),
  }
}

export function getMeta() {
  return { title: 'Admin · Posts' }
}

export default function AdminPostsPage() {
  const { data } = useRouteContext() as { data: Data }
  if (data.forbidden) return <AdminForbidden />
  return <AdminPostsList posts={data.posts ?? []} />
}
