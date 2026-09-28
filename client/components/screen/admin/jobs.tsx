import { Link } from 'react-router'

import { AdminShell } from '@/components/screen/admin/admin-shell'

export type AdminJobRow = {
  id: string
  status: string
  createdAt: string
  userId: string
  userEmail: string
  payload?: string
  result?: string | null
  finishedAt?: string | null
}

export function AdminJobsList({ jobs }: { jobs: AdminJobRow[] }) {
  return (
    <AdminShell active="jobs">
      <h1 className="font-heading text-3xl tracking-tight">Jobs</h1>
      <p className="mt-2 text-muted-foreground text-sm">Demo jobs across all users.</p>
      <div className="mt-8 overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead className="border-border border-b text-muted-foreground">
            <tr>
              <th className="py-2 pr-4 font-medium">Id</th>
              <th className="py-2 pr-4 font-medium">User</th>
              <th className="py-2 pr-4 font-medium">Status</th>
              <th className="py-2 font-medium">Created</th>
            </tr>
          </thead>
          <tbody>
            {jobs.map((j) => (
              <tr key={j.id} className="border-border border-b">
                <td className="py-3 pr-4 font-mono text-xs">
                  <Link to={`/admin/jobs/${j.id}`} className="underline-offset-4 hover:underline">
                    {j.id.slice(0, 8)}…
                  </Link>
                </td>
                <td className="py-3 pr-4">{j.userEmail}</td>
                <td className="py-3 pr-4">{j.status}</td>
                <td className="py-3 text-muted-foreground">{j.createdAt}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </AdminShell>
  )
}

export function AdminJobDetail({ job }: { job: AdminJobRow }) {
  return (
    <AdminShell active="jobs">
      <p className="text-muted-foreground text-sm">
        <Link to="/admin/jobs" className="underline-offset-4 hover:underline">
          Jobs
        </Link>
      </p>
      <h1 className="mt-2 font-mono text-xl tracking-tight sm:text-2xl">{job.id}</h1>
      <dl className="mt-8 grid gap-4 text-sm sm:grid-cols-2">
        <div>
          <dt className="text-muted-foreground">Status</dt>
          <dd className="mt-1">{job.status}</dd>
        </div>
        <div>
          <dt className="text-muted-foreground">User</dt>
          <dd className="mt-1">
            <Link
              to={`/admin/users/${job.userId}`}
              className="underline-offset-4 hover:underline"
            >
              {job.userEmail}
            </Link>
          </dd>
        </div>
        <div>
          <dt className="text-muted-foreground">User id</dt>
          <dd className="mt-1 font-mono text-xs">{job.userId}</dd>
        </div>
        <div>
          <dt className="text-muted-foreground">Created</dt>
          <dd className="mt-1">{job.createdAt}</dd>
        </div>
        <div>
          <dt className="text-muted-foreground">Finished</dt>
          <dd className="mt-1">{job.finishedAt ?? '—'}</dd>
        </div>
        <div className="sm:col-span-2">
          <dt className="text-muted-foreground">Payload</dt>
          <dd className="mt-1 whitespace-pre-wrap">{job.payload}</dd>
        </div>
        <div className="sm:col-span-2">
          <dt className="text-muted-foreground">Result</dt>
          <dd className="mt-1 whitespace-pre-wrap">{job.result ?? '—'}</dd>
        </div>
      </dl>
    </AdminShell>
  )
}
