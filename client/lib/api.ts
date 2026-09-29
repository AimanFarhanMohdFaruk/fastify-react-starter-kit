export type JobDto = {
  id: string
  payload: string
  status: string
  result: string | null
  createdAt: string
}

export type DocumentDto = {
  id: string
  filename: string
  contentType: string
  byteSize: number
  status: string
  extractedTextLength?: number | null
  createdAt: string
  updatedAt: string
}

export async function fetchJobs(): Promise<JobDto[]> {
  const res = await fetch('/api/jobs', { credentials: 'include' })
  if (res.status === 401) {
    window.location.href = '/login'
    return []
  }
  if (!res.ok) {
    throw new Error(`Failed to load jobs (${res.status})`)
  }
  return res.json()
}

export async function enqueueJob(payload: string): Promise<JobDto> {
  const res = await fetch('/api/jobs', {
    method: 'POST',
    credentials: 'include',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ payload }),
  })
  if (res.status === 401) {
    window.location.href = '/login'
    throw new Error('Unauthorized')
  }
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
  if (res.status === 401) {
    window.location.href = '/login'
    return []
  }
  if (!res.ok) {
    throw new Error(`Failed to load documents (${res.status})`)
  }
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
  if (res.status === 401) {
    window.location.href = '/login'
    throw new Error('Unauthorized')
  }
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
