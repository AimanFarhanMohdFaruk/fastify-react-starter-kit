import { useRouteContext } from '@fastify/react/client'
import type { FastifyReply, FastifyRequest } from 'fastify'

import { Dashboard } from '@/components/screen/dashboard/dashboard'
import type { DocumentDto, JobDto } from '@/lib/api'

type DashboardData = {
  email: string
  isAdmin: boolean
  jobs: JobDto[]
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
  const { listDemoJobsForUser } = await import('@app/models/demo-job')
  const { listDocumentsForUser } = await import('@app/models/document')
  const { jobDto } = await import('@app/controllers/jobs/dto')
  const { documentDto } = await import('@app/controllers/documents/dto')
  const { DOCUMENT_ACCEPT, DOCUMENT_MAX_BYTES } = await import(
    '@app/services/upload-document'
  )
  const user = await getSessionUser(ctx.req)
  if (!user) {
    ctx.reply.redirect('/login')
    return {}
  }
  const [jobs, docs] = await Promise.all([
    listDemoJobsForUser(user.id),
    listDocumentsForUser(user.id),
  ])
  return {
    email: user.email,
    isAdmin: isAdmin(user),
    documentAccept: DOCUMENT_ACCEPT,
    documentMaxBytes: DOCUMENT_MAX_BYTES,
    jobs: jobs.map(jobDto),
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
      jobs={data.jobs}
      documents={data.documents ?? []}
      documentAccept={data.documentAccept}
      documentMaxBytes={data.documentMaxBytes}
    />
  )
}
