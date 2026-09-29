import { Link } from 'react-router'
import { useEffect, useState } from 'react'

import { Container } from '@/components/layout'
import { Main } from '@/components/shell/main'
import { ThemeSelector } from '@/components/shell/theme-switch'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { authClient } from '@/lib/auth-client'
import {
  enqueueJob,
  fetchDocuments,
  fetchJobs,
  uploadDocument,
  type DocumentDto,
  type JobDto,
} from '@/lib/api'

const ACTIVE = new Set(['queued', 'running'])

export type DashboardProps = {
  email: string
  jobs: JobDto[]
  documents: DocumentDto[]
}

export function Dashboard({
  email,
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
    <Main className="my-0 py-12">
      <Container className="space-y-8">
        <div className="flex items-start justify-between gap-4">
          <div className="space-y-2">
            <p className="font-medium text-muted-foreground text-sm">
              Dashboard · pg-boss · documents
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
              setFlash('Job queued — use npm run worker or npm run dev:all')
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
          <Button type="submit" variant="outline" disabled={uploadBusy} loading={uploadBusy}>
            Upload document
          </Button>
        </form>

        <div className="flex flex-wrap gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={async () => {
              const [nextJobs, nextDocs] = await Promise.all([
                fetchJobs(),
                fetchDocuments(),
              ])
              setJobs(nextJobs)
              setDocuments(nextDocs)
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
          <h2 className="font-semibold text-lg">Documents</h2>
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
                    <span className="text-sm font-medium">{d.filename}</span>
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
