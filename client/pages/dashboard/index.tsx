import { useRouteContext } from '@fastify/react/client'
import type { FastifyReply, FastifyRequest } from 'fastify'

import { Dashboard } from '@/components/screen/dashboard/dashboard'
import type { DocumentDto, ReportDto } from '@/lib/api'

type DashboardData = {
  email: string
  isAdmin: boolean
  reports: ReportDto[]
  documents: DocumentDto[]
  documentAccept: string
  documentMaxBytes: number
}

export async function getData(ctx: {
  req: FastifyRequest
  reply: FastifyReply
}) {
  const { getSessionUser } = await import('@app/controllers/auth')
  const { isAdmin } = await import('@app/models/admin')
  const { listReportsForUser } = await import('@app/models/report')
  const { listDocumentsForUser } = await import('@app/models/document')
  const { reportDto } = await import('@app/controllers/reports/dto')
  const { documentDto } = await import('@app/controllers/documents/dto')
  const { DOCUMENT_ACCEPT, DOCUMENT_MAX_BYTES } = await import(
    '@app/services/upload-document'
  )
  const user = await getSessionUser(ctx.req)
  if (!user) {
    ctx.reply.redirect('/login')
    return {}
  }
  const [reportRows, docs] = await Promise.all([
    listReportsForUser(user.id),
    listDocumentsForUser(user.id),
  ])
  return {
    email: user.email,
    isAdmin: isAdmin(user),
    documentAccept: DOCUMENT_ACCEPT,
    documentMaxBytes: DOCUMENT_MAX_BYTES,
    reports: reportRows.map(reportDto),
    documents: docs.map(documentDto),
  }
}

export function getMeta() {
  return { title: 'Dashboard' }
}

export default function DashboardPage() {
  const { data } = useRouteContext() as { data: DashboardData }
  return (
    <Dashboard
      email={data.email}
      isAdmin={data.isAdmin}
      reports={data.reports}
      documents={data.documents ?? []}
      documentAccept={data.documentAccept}
      documentMaxBytes={data.documentMaxBytes}
    />
  )
}
