import { useRouteContext } from '@fastify/react/client'
import type { FastifyReply, FastifyRequest } from 'fastify'

import { AdminForbidden } from '@/components/screen/admin/admin-shell'
import { AdminJobsList, type AdminJobRow } from '@/components/screen/admin/jobs'

type Data = { forbidden?: boolean; jobs?: AdminJobRow[] }

export async function getData(ctx: { req: FastifyRequest; reply: FastifyReply }) {
  const { gateAdminPage } = await import('@app/controllers/auth')
  const { listDemoJobsForAdmin } = await import('@app/models/admin')
  const gate = await gateAdminPage(ctx.req, ctx.reply)
  if (!gate.ok) return gate.kind === 'forbidden' ? { forbidden: true } : {}
  const jobs = await listDemoJobsForAdmin()
  return {
    jobs: jobs.map((j) => ({
      id: j.id,
      status: j.status,
      createdAt: j.createdAt.toISOString(),
      userId: j.userId,
      userEmail: j.userEmail,
    })),
  }
}

export function getMeta() {
  return { title: 'Admin · Jobs' }
}

export default function AdminJobsPage() {
  const { data } = useRouteContext() as { data: Data }
  if (data.forbidden) return <AdminForbidden />
  return <AdminJobsList jobs={data.jobs ?? []} />
}
