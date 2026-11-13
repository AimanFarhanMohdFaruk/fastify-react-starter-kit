import { useRouteContext } from '@fastify/react/client'
import type { FastifyReply, FastifyRequest } from 'fastify'

import { Dashboard } from '@/components/screen/dashboard/dashboard'
import type { DocumentDto, PostDto } from '@/lib/api'

type DashboardData = {
  email: string
  isAdmin: boolean
  posts: PostDto[]
  documents: DocumentDto[]
  documentAccept: string
  documentMaxBytes: number
}

export async function getData(ctx: {
  req: FastifyRequest
  reply: FastifyReply
}) {
  const { loadDashboardPage } = await import('@app/controllers/dashboard/loaders')
  return loadDashboardPage(ctx.req, ctx.reply)
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
      posts={data.posts}
      documents={data.documents ?? []}
      documentAccept={data.documentAccept}
      documentMaxBytes={data.documentMaxBytes}
    />
  )
}
