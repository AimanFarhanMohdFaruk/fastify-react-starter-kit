import { useRouteContext } from '@fastify/react/client'
import type { FastifyReply, FastifyRequest } from 'fastify'

import { AdminForbidden } from '@/components/screen/admin/admin-shell'
import {
  AdminReportsList,
  type AdminReportRow,
} from '@/components/screen/admin/reports'

type Data = { forbidden?: boolean; reports?: AdminReportRow[] }

export async function getData(ctx: {
  req: FastifyRequest
  reply: FastifyReply
}) {
  const { gateAdminPage } = await import('@app/controllers/auth')
  const { listReportsForAdmin } = await import('@app/models/admin')
  const gate = await gateAdminPage(ctx.req, ctx.reply)
  if (!gate.ok) return { forbidden: true }
  const rows = await listReportsForAdmin()
  return {
    reports: rows.map((r) => ({
      id: r.id,
      status: r.status,
      createdAt: r.createdAt.toISOString(),
      userId: r.userId,
      userEmail: r.userEmail,
    })),
  }
}

export function getMeta() {
  return { title: 'Admin · Reports' }
}

export default function AdminReportsPage() {
  const { data } = useRouteContext() as { data: Data }
  if (data.forbidden) return <AdminForbidden />
  return <AdminReportsList reports={data.reports ?? []} />
}
