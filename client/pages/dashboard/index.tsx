import { useRouteContext } from '@fastify/react/client'
import type { FastifyReply, FastifyRequest } from 'fastify'
import type { DashboardPageData } from '@app/controllers/dashboard/loaders'

import { Dashboard } from '@/components/screen/dashboard/dashboard'
import { pageRedirect } from '@/lib/page-navigation'

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
  const { data } = useRouteContext() as { data: DashboardPageData }
  const redirect = pageRedirect(data)
  if (redirect) return redirect
  if (!('email' in data)) return null
  return (
    <Dashboard
      email={data.email}
      isAdmin={data.isAdmin}
      posts={data.posts}
      documents={data.documents}
      documentAccept={data.documentAccept}
      documentMaxBytes={data.documentMaxBytes}
    />
  )
}
