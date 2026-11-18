/** HTTP shapes from controller DTOs (type-only — no client runtime @app). */
import type { AdminPostDto, AdminUserDto } from '@app/controllers/admin/dto'
import type { DocumentDto } from '@app/controllers/documents/dto'
import type { PostDto } from '@app/controllers/posts/dto'
import type { WorkEnqueueDto } from '@app/controllers/work/dto'

export type { AdminPostDto, AdminUserDto, DocumentDto, PostDto, WorkEnqueueDto }

export class ApiError extends Error {
  constructor(
    readonly status: number,
    message: string,
  ) {
    super(message)
    this.name = 'ApiError'
  }
}

async function request<T>(path: string, init: RequestInit = {}): Promise<T> {
  const res = await fetch(path, { credentials: 'include', ...init })

  if (res.status === 401) {
    window.location.href = '/login'
    throw new ApiError(401, 'Unauthorized')
  }

  if (res.status === 204) return undefined as T

  if (!res.ok) {
    const body = await res.json().catch(() => ({}))
    throw new ApiError(
      res.status,
      typeof body?.error === 'string'
        ? body.error
        : `Request failed (${res.status})`,
    )
  }

  return res.json() as Promise<T>
}

export function fetchDocuments(): Promise<DocumentDto[]> {
  return request<DocumentDto[]>('/api/documents')
}

export function createPost(input: {
  title: string
  body: string
}): Promise<PostDto> {
  return request<PostDto>('/api/posts', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(input),
  })
}

export function updatePost(
  id: string,
  input: { title?: string; body?: string },
): Promise<PostDto> {
  return request<PostDto>(`/api/posts/${id}`, {
    method: 'PATCH',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(input),
  })
}

export function deletePost(id: string): Promise<void> {
  return request<void>(`/api/posts/${id}`, { method: 'DELETE' })
}

/** Fire-and-forget — no domain row; worker logs the message. */
export function enqueueShout(message: string): Promise<WorkEnqueueDto> {
  return request<WorkEnqueueDto>('/api/work', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ message }),
  })
}

export function uploadDocument(file: File): Promise<DocumentDto> {
  const body = new FormData()
  body.append('file', file)
  return request<DocumentDto>('/api/documents', { method: 'POST', body })
}
