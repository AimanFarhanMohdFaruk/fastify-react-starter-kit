import { useRouteContext } from '@fastify/react/client'
import type { FastifyReply, FastifyRequest } from 'fastify'

import { AdminForbidden } from '@/components/screen/admin/admin-shell'
import {
  AdminPostDetail,
  type AdminPostRow,
} from '@/components/screen/admin/posts'

type Data = {
  forbidden?: boolean
  post?: AdminPostRow | null
  notFound?: boolean
}

export async function getData(ctx: {
  req: FastifyRequest
  reply: FastifyReply
}) {
  const { gateAdminPage } = await import('@app/controllers/auth')
  const user = await gateAdminPage(ctx.req, ctx.reply)
  if (!user) return { forbidden: true }

  const id = (ctx.req.params as { id?: string }).id
  if (!id) return { notFound: true }

  const { getPostForAdmin } = await import('@app/models/admin')
  const row = await getPostForAdmin(id)
  if (!row) return { notFound: true }

  return {
    post: {
      id: row.id,
      title: row.title,
      body: row.body,
      createdAt: row.createdAt.toISOString(),
      updatedAt: row.updatedAt.toISOString(),
      userId: row.userId,
      userEmail: row.userEmail,
    },
  }
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
