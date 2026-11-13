import { useRouteContext } from '@fastify/react/client'
import type { FastifyReply, FastifyRequest } from 'fastify'

import { AdminForbidden } from '@/components/screen/admin/admin-shell'
import {
  AdminReportDetail,
  type AdminReportRow,
} from '@/components/screen/admin/reports'

type Data = { forbidden?: boolean; report?: AdminReportRow | null; notFound?: boolean }

export async function getData(ctx: {
  req: FastifyRequest
  reply: FastifyReply
  params: { id: string }
}) {
  const { gateAdminPage } = await import('@app/controllers/auth')
  const { getReportForAdmin } = await import('@app/models/admin')
  const gate = await gateAdminPage(ctx.req, ctx.reply)
  if (!gate.ok) return { forbidden: true }
  const { id } = ctx.params
  const row = await getReportForAdmin(id)
  if (!row) return { notFound: true }
  return {
    report: {
      id: row.id,
      status: row.status,
      payload: row.payload,
      result: row.result,
      createdAt: row.createdAt.toISOString(),
      finishedAt: row.finishedAt?.toISOString() ?? null,
      userId: row.userId,
      userEmail: row.userEmail,
    },
  }
}

export function getMeta() {
  return { title: 'Admin · Report' }
}

export default function AdminReportDetailPage() {
  const { data } = useRouteContext() as { data: Data }
  if (data.forbidden) return <AdminForbidden />
  if (data.notFound || !data.report) {
    return (
      <p className="p-8 text-muted-foreground text-sm">Report not found</p>
    )
  }
  return <AdminReportDetail report={data.report} />
}
