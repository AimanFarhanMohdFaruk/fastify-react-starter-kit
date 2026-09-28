import { Link } from 'react-router'
import { useEffect, useState } from 'react'
import { useRouteContext } from '@fastify/react/client'
import type { FastifyReply, FastifyRequest } from 'fastify'

import { Container } from '@/components/layout'
import { Main } from '@/components/shell/main'
import { ThemeSelector } from '@/components/shell/theme-switch'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'

import { authClient } from '../../lib/auth-client'
import { enqueueJob, fetchJobs, type JobDto } from '../../lib/api'

type DashboardData = {
  email: string
  jobs: JobDto[]
}

const ACTIVE = new Set(['queued', 'running'])

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

export default function Dashboard() {
  const { data } = useRouteContext() as { data: DashboardData }
  const [email] = useState(data.email)
  const [jobs, setJobs] = useState<JobDto[]>(data.jobs)
  const [payload, setPayload] = useState('')
  const [flash, setFlash] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  const hasActiveJobs = jobs.some((j) => ACTIVE.has(j.status))

  useEffect(() => {
    if (!hasActiveJobs) return
    let cancelled = false
    const tick = async () => {
      try {
        const next = await fetchJobs()
        if (!cancelled) setJobs(next)
      } catch {}
    }
    void tick()
    const id = window.setInterval(() => void tick(), 1500)
    return () => {
      cancelled = true
      window.clearInterval(id)
    }
  }, [hasActiveJobs])

  return (
    <Main className="my-0 py-12">
      <Container className="space-y-8">
        <div className="flex items-start justify-between gap-4">
          <div className="space-y-2">
            <p className="font-medium text-muted-foreground text-sm">
              Dashboard · pg-boss
            </p>
            <h1 className="font-bold text-3xl tracking-tight">Hi, {email}</h1>
          </div>
          <ThemeSelector />
        </div>

        {flash ? (
          <Alert>
            <AlertDescription>{flash}</AlertDescription>
          </Alert>
        ) : null}

        <form
          className="flex flex-col gap-3 sm:flex-row"
          onSubmit={async (e) => {
            e.preventDefault()
            setBusy(true)
            setFlash(null)
            try {
              const job = await enqueueJob(payload)
              setJobs((prev) => [job, ...prev])
              setPayload('')
              setFlash('Job queued — run npm run worker in another terminal')
            } catch (err) {
              setFlash(err instanceof Error ? err.message : 'Enqueue failed')
            } finally {
              setBusy(false)
            }
          }}
        >
          <Input
            className="flex-1"
            value={payload}
            onChange={(e) => setPayload(e.target.value)}
            placeholder="job payload"
            required
          />
          <Button type="submit" disabled={busy} loading={busy}>
            Enqueue demo job
          </Button>
        </form>

        <div className="flex flex-wrap gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={async () => {
              setJobs(await fetchJobs())
            }}
          >
            Refresh
          </Button>
          <Button
            type="button"
            variant="ghost"
            onClick={async () => {
              await authClient.signOut()
              window.location.href = '/'
            }}
          >
            Log out
          </Button>
          <Button variant="link" render={<Link to="/" />}>
            Home
          </Button>
        </div>

        <div className="space-y-3">
          <h2 className="font-semibold text-lg">Jobs</h2>
          {jobs.length === 0 ? (
            <p className="text-muted-foreground text-sm">None yet.</p>
          ) : (
            <ul className="space-y-3">
              {jobs.map((j) => (
                <li
                  key={j.id}
                  className="rounded-lg border border-border bg-card px-4 py-3 text-card-foreground"
                >
                  <div className="flex items-center gap-2">
                    <Badge variant="outline">{j.status}</Badge>
                    <span className="text-sm">{j.payload}</span>
                  </div>
                  {j.result ? (
                    <p className="mt-2 text-muted-foreground text-xs">
                      {j.result}
                    </p>
                  ) : null}
                </li>
              ))}
            </ul>
          )}
        </div>
      </Container>
    </Main>
  )
}
