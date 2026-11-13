import { useState } from 'react'

import { AppShell } from '@/components/shell/app-shell'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import {
  createPost,
  deletePost,
  enqueueShout,
  updatePost,
  uploadDocument,
  type DocumentDto,
  type PostDto,
} from '@/lib/api'

export type DashboardProps = {
  email: string
  isAdmin: boolean
  posts: PostDto[]
  documents: DocumentDto[]
  documentAccept: string
  documentMaxBytes: number
}

export function Dashboard({
  email,
  isAdmin,
  posts: initialPosts,
  documents: initialDocuments,
  documentAccept,
  documentMaxBytes,
}: DashboardProps) {
  const [posts, setPosts] = useState<PostDto[]>(initialPosts)
  const [documents, setDocuments] = useState<DocumentDto[]>(initialDocuments)
  const [title, setTitle] = useState('')
  const [body, setBody] = useState('')
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editTitle, setEditTitle] = useState('')
  const [editBody, setEditBody] = useState('')
  const [shoutMessage, setShoutMessage] = useState('')
  const [flash, setFlash] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const [uploadBusy, setUploadBusy] = useState(false)
  const [workBusy, setWorkBusy] = useState(false)

  return (
    <AppShell email={email} isAdmin={isAdmin}>
      <div className="max-w-3xl space-y-10">
        <div>
          <h1 className="font-heading font-bold text-3xl tracking-tight">Dashboard</h1>
          <p className="mt-1 text-muted-foreground text-sm">
            Posts CRUD, fire-and-forget work, and document upload.
          </p>
        </div>

        {flash ? (
          <Alert>
            <AlertDescription>{flash}</AlertDescription>
          </Alert>
        ) : null}

        <section className="space-y-3">
          <h2 className="font-semibold text-lg">Posts</h2>
          <form
            className="space-y-3"
            onSubmit={async (e) => {
              e.preventDefault()
              setBusy(true)
              setFlash(null)
              try {
                const post = await createPost({ title, body })
                setPosts((prev) => [post, ...prev])
                setTitle('')
                setBody('')
                setFlash('Post created')
              } catch (err) {
                setFlash(err instanceof Error ? err.message : 'Create failed')
              } finally {
                setBusy(false)
              }
            }}
          >
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Title"
              required
            />
            <Textarea
              value={body}
              onChange={(e) => setBody(e.target.value)}
              placeholder="Body (optional)"
              rows={3}
            />
            <Button type="submit" disabled={busy} loading={busy}>
              Create post
            </Button>
          </form>
          {posts.length === 0 ? (
            <p className="text-muted-foreground text-sm">No posts yet.</p>
          ) : (
            <ul className="space-y-3">
              {posts.map((p) => (
                <li
                  key={p.id}
                  className="rounded-lg border border-border bg-card px-4 py-3 text-card-foreground"
                >
                  {editingId === p.id ? (
                    <form
                      className="space-y-2"
                      onSubmit={async (e) => {
                        e.preventDefault()
                        setBusy(true)
                        setFlash(null)
                        try {
                          const next = await updatePost(p.id, {
                            title: editTitle,
                            body: editBody,
                          })
                          setPosts((prev) =>
                            prev.map((row) => (row.id === p.id ? next : row)),
                          )
                          setEditingId(null)
                          setFlash('Post updated')
                        } catch (err) {
                          setFlash(
                            err instanceof Error ? err.message : 'Update failed',
                          )
                        } finally {
                          setBusy(false)
                        }
                      }}
                    >
                      <Input
                        value={editTitle}
                        onChange={(e) => setEditTitle(e.target.value)}
                        required
                      />
                      <Textarea
                        value={editBody}
                        onChange={(e) => setEditBody(e.target.value)}
                        rows={3}
                      />
                      <div className="flex gap-2">
                        <Button type="submit" size="sm" disabled={busy} loading={busy}>
                          Save
                        </Button>
                        <Button
                          type="button"
                          size="sm"
                          variant="outline"
                          onClick={() => setEditingId(null)}
                        >
                          Cancel
                        </Button>
                      </div>
                    </form>
                  ) : (
                    <>
                      <div className="flex flex-wrap items-start justify-between gap-2">
                        <div>
                          <p className="font-medium text-sm">{p.title}</p>
                          {p.body ? (
                            <p className="mt-1 whitespace-pre-wrap text-muted-foreground text-xs">
                              {p.body}
                            </p>
                          ) : null}
                          <p className="mt-2 text-muted-foreground text-xs">
                            {p.updatedAt}
                          </p>
                        </div>
                        <div className="flex gap-2">
                          <Button
                            type="button"
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              setEditingId(p.id)
                              setEditTitle(p.title)
                              setEditBody(p.body)
                            }}
                          >
                            Edit
                          </Button>
                          <Button
                            type="button"
                            size="sm"
                            variant="outline"
                            disabled={busy}
                            onClick={async () => {
                              setBusy(true)
                              setFlash(null)
                              try {
                                await deletePost(p.id)
                                setPosts((prev) => prev.filter((row) => row.id !== p.id))
                                setFlash('Post deleted')
                              } catch (err) {
                                setFlash(
                                  err instanceof Error
                                    ? err.message
                                    : 'Delete failed',
                                )
                              } finally {
                                setBusy(false)
                              }
                            }}
                          >
                            Delete
                          </Button>
                        </div>
                      </div>
                    </>
                  )}
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="space-y-3">
          <h2 className="font-semibold text-lg">Background work</h2>
          <p className="text-muted-foreground text-sm">
            Stupid queue — name + args, no domain row. Watch the worker log.
          </p>
          <form
            className="flex flex-col gap-3 sm:flex-row"
            onSubmit={async (e) => {
              e.preventDefault()
              setWorkBusy(true)
              setFlash(null)
              try {
                const result = await enqueueShout(shoutMessage)
                setShoutMessage('')
                setFlash(
                  `Enqueued ${result.name} (${result.jobId ?? 'ok'}) — run npm run worker`,
                )
              } catch (err) {
                setFlash(err instanceof Error ? err.message : 'Enqueue failed')
              } finally {
                setWorkBusy(false)
              }
            }}
          >
            <Input
              className="flex-1"
              value={shoutMessage}
              onChange={(e) => setShoutMessage(e.target.value)}
              placeholder="message for shout job"
              required
            />
            <Button type="submit" disabled={workBusy} loading={workBusy}>
              Enqueue shout
            </Button>
          </form>
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
              accept={documentAccept}
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
              None yet. Upload .md, .txt, or .pdf (max{' '}
              {Math.round(documentMaxBytes / (1024 * 1024))}MB).
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
