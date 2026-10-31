import { useEffect, useState } from 'react'

import { AppShell } from '@/components/shell/app-shell'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  enqueueJob,
  fetchJobs,
  uploadDocument,
  type DocumentDto,
  type JobDto,
} from '@/lib/api'

const ACTIVE = new Set(['queued', 'running'])

export type DashboardProps = {
  email: string
  isAdmin: boolean
  jobs: JobDto[]
  documents: DocumentDto[]
}

export function Dashboard({
  email,
  isAdmin,
  jobs: initialJobs,
  documents: initialDocuments,
}: DashboardProps) {
  const [jobs, setJobs] = useState<JobDto[]>(initialJobs)
  const [documents, setDocuments] = useState<DocumentDto[]>(initialDocuments)
  const [payload, setPayload] = useState('')
  const [flash, setFlash] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const [uploadBusy, setUploadBusy] = useState(false)

  const hasActiveJobs = jobs.some((j) => ACTIVE.has(j.status))

  useEffect(() => {
    if (!hasActiveJobs) return
    let cancelled = false
    const tick = async () => {
      try {
        const next = await fetchJobs()
        if (!cancelled) setJobs(next)
      } catch {
        // keep last good list
      }
    }
    void tick()
    const id = window.setInterval(() => void tick(), 1500)
    return () => {
      cancelled = true
      window.clearInterval(id)
    }
  }, [hasActiveJobs])

  return (
    <AppShell email={email} isAdmin={isAdmin}>
      <div className="max-w-3xl space-y-10">
        <div>
          <h1 className="font-heading font-bold text-3xl tracking-tight">Dashboard</h1>
          <p className="mt-1 text-muted-foreground text-sm">
            Enqueue demo jobs and upload documents.
          </p>
        </div>

        {flash ? (
          <Alert>
            <AlertDescription>{flash}</AlertDescription>
          </Alert>
        ) : null}

        <section className="space-y-3">
          <h2 className="font-semibold text-lg">Jobs</h2>
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
                setFlash('Job queued — run npm run worker or npm run dev:all')
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
              Enqueue
            </Button>
          </form>
          {jobs.length === 0 ? (
            <p className="text-muted-foreground text-sm">No jobs yet.</p>
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
                    <p className="mt-2 text-muted-foreground text-xs">{j.result}</p>
                  ) : null}
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="space-y-3">
          <h2 className="font-semibold text-lg">Documents</h2>
          <form
            className="flex flex-col gap-3 sm:flex-row sm:items-center"
            onSubmit={async (e) => {
              e.preventDefault()
              const form = e.currentTarget
              const file = new FormData(form).get('file')
              if (!(file instanceof File) || file.size === 0 || uploadBusy) return
              setUploadBusy(true)
              setFlash(null)
              try {
                const doc = await uploadDocument(file)
                setDocuments((prev) => [doc, ...prev])
                form.reset()
                setFlash(`Uploaded ${doc.filename} (${doc.status})`)
              } catch (err) {
                setFlash(err instanceof Error ? err.message : 'Upload failed')
              } finally {
                setUploadBusy(false)
              }
            }}
          >
            <Input
              name="file"
              type="file"
              accept=".md,.markdown,.txt,.pdf,text/plain,text/markdown,application/pdf"
              disabled={uploadBusy}
              nativeInput
              className="flex-1 cursor-pointer"
            />
            <Button
              type="submit"
              variant="outline"
              disabled={uploadBusy}
              loading={uploadBusy}
            >
              Upload
            </Button>
          </form>
          {documents.length === 0 ? (
            <p className="text-muted-foreground text-sm">
              None yet. Upload .md, .txt, or .pdf (max 5MB).
            </p>
          ) : (
            <ul className="space-y-3">
              {documents.map((d) => (
                <li
                  key={d.id}
                  className="rounded-lg border border-border bg-card px-4 py-3 text-card-foreground"
                >
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge variant="outline">{d.status}</Badge>
                    <span className="font-medium text-sm">{d.filename}</span>
                  </div>
                  <p className="mt-2 text-muted-foreground text-xs">
                    {d.byteSize} B
                    {d.extractedTextLength != null
                      ? ` · ${d.extractedTextLength} chars extracted`
                      : ''}
                    {' · '}
                    {d.createdAt}
                  </p>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </AppShell>
  )
}
