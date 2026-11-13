/** HTTP shapes from controller DTOs (type-only — no client runtime @app). */
import type { DocumentDto } from '@app/controllers/documents/dto'
import type { PostDto } from '@app/controllers/posts/dto'

export type { DocumentDto, PostDto }

export type WorkEnqueueResult = {
  enqueued: boolean
  name: string
  jobId: string | null
}

async function handleAuth(res: Response) {
  if (res.status === 401) {
    window.location.href = '/login'
    return true
  }
  return false
}

export async function fetchPosts(): Promise<PostDto[]> {
  const res = await fetch('/api/posts', { credentials: 'include' })
  if (await handleAuth(res)) return []
  if (!res.ok) throw new Error(`Failed to load posts (${res.status})`)
  return res.json()
}

export async function createPost(input: {
  title: string
  body: string
}): Promise<PostDto> {
  const res = await fetch('/api/posts', {
    method: 'POST',
    credentials: 'include',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(input),
  })
  if (await handleAuth(res)) throw new Error('Unauthorized')
  if (!res.ok) {
    const body = await res.json().catch(() => ({}))
    throw new Error(
      typeof body?.error === 'string' ? body.error : `Create failed (${res.status})`,
    )
  }
  return res.json()
}

export async function updatePost(
  id: string,
  input: { title?: string; body?: string },
): Promise<PostDto> {
  const res = await fetch(`/api/posts/${id}`, {
    method: 'PATCH',
    credentials: 'include',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(input),
  })
  if (await handleAuth(res)) throw new Error('Unauthorized')
  if (!res.ok) {
    const body = await res.json().catch(() => ({}))
    throw new Error(
      typeof body?.error === 'string' ? body.error : `Update failed (${res.status})`,
    )
  }
  return res.json()
}

export async function deletePost(id: string): Promise<void> {
  const res = await fetch(`/api/posts/${id}`, {
    method: 'DELETE',
    credentials: 'include',
  })
  if (await handleAuth(res)) throw new Error('Unauthorized')
  if (!res.ok && res.status !== 204) {
    throw new Error(`Delete failed (${res.status})`)
  }
}

/** Fire-and-forget — no domain row; worker logs the message. */
export async function enqueueShout(message: string): Promise<WorkEnqueueResult> {
  const res = await fetch('/api/work', {
    method: 'POST',
    credentials: 'include',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ message }),
  })
  if (await handleAuth(res)) throw new Error('Unauthorized')
  if (!res.ok) {
    const body = await res.json().catch(() => ({}))
    throw new Error(
      typeof body?.error === 'string' ? body.error : `Enqueue failed (${res.status})`,
    )
  }
  return res.json()
}

export async function fetchDocuments(): Promise<DocumentDto[]> {
  const res = await fetch('/api/documents', { credentials: 'include' })
  if (await handleAuth(res)) return []
  if (!res.ok) throw new Error(`Failed to load documents (${res.status})`)
  return res.json()
}

export async function uploadDocument(file: File): Promise<DocumentDto> {
  const body = new FormData()
  body.append('file', file)
  const res = await fetch('/api/documents', {
    method: 'POST',
    credentials: 'include',
    body,
  })
  if (await handleAuth(res)) throw new Error('Unauthorized')
  if (!res.ok) {
    const payload = await res.json().catch(() => ({}))
    throw new Error(
      typeof payload?.error === 'string'
        ? payload.error
        : `Upload failed (${res.status})`,
    )
  }
  return res.json()
}
