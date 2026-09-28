import { useRouteContext } from '@fastify/react/client'
import type { FastifyReply, FastifyRequest } from 'fastify'

import { Dashboard } from '@/components/screen/dashboard/dashboard'
import type { JobDto } from '@/lib/api'

type DashboardData = {
  email: string
  jobs: JobDto[]
}

export async function getData(ctx: {
  req: FastifyRequest
  reply: FastifyReply
}) {
  const { getSessionUser } = await import('@app/controllers/auth')
  const { listDemoJobsForUser } = await import('@app/models/demo-job')
  const user = await getSessionUser(ctx.req)
  if (!user) {
    ctx.reply.redirect('/login')
    return {}
  }
  const jobs = await listDemoJobsForUser(user.id)
  return {
    email: user.email,
    jobs: jobs.map((j) => ({
      id: j.id,
      payload: j.payload,
      status: j.status,
      result: j.result,
      createdAt: j.createdAt.toISOString(),
    })),
  }
}

export function getMeta() {
  return { title: 'Dashboard' }
}

export default function DashboardPage() {
  const { data } = useRouteContext() as { data: DashboardData }
  return <Dashboard email={data.email} jobs={data.jobs} />
}
