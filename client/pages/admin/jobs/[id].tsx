import { useRouteContext } from '@fastify/react/client'
import type { FastifyReply, FastifyRequest } from 'fastify'

import { AdminForbidden } from '@/components/screen/admin/admin-shell'
import { AdminJobDetail, type AdminJobRow } from '@/components/screen/admin/jobs'

type Data = { forbidden?: boolean; job?: AdminJobRow | null; notFound?: boolean }

export async function getData(ctx: { req: FastifyRequest; reply: FastifyReply }) {
  const { gateAdminPage } = await import('@app/controllers/auth')
  const { getDemoJobForAdmin } = await import('@app/models/admin')
  const gate = await gateAdminPage(ctx.req, ctx.reply)
  if (!gate.ok) return gate.kind === 'forbidden' ? { forbidden: true } : {}
  const id = String((ctx.req.params as { id?: string }).id ?? '')
  const job = await getDemoJobForAdmin(id)
  if (!job) {
    ctx.reply.code(404)
    return { notFound: true }
  }
  return {
    job: {
      id: job.id,
      status: job.status,
      createdAt: job.createdAt.toISOString(),
      finishedAt: job.finishedAt?.toISOString() ?? null,
      userId: job.userId,
      userEmail: job.userEmail,
      payload: job.payload,
      result: job.result,
    },
  }
}

export function getMeta() {
  return { title: 'Admin · Job' }
}

export default function AdminJobDetailPage() {
  const { data } = useRouteContext() as { data: Data }
  if (data.forbidden) return <AdminForbidden />
  if (data.notFound || !data.job) {
    return (
      <div className="flex min-h-dvh items-center justify-center text-muted-foreground text-sm">
        Job not found
      </div>
    )
  }
  return <AdminJobDetail job={data.job} />
}
