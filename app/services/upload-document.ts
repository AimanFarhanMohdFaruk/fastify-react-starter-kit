import { randomUUID } from 'node:crypto'
import { Transform, type Readable } from 'node:stream'
import { createDocument } from '../models/document'
import { getObjectStore, type ObjectStore } from '../object-store'
import { parseDocument, type ParseDocumentDeps } from './parse-document'

const ALLOWED_CONTENT_TYPES = new Set([
  'text/plain',
  'text/markdown',
  'text/x-markdown',
  'application/pdf',
])

const MAX_BYTES = 5 * 1024 * 1024

export type UploadFileInput = {
  filename: string
  contentType: string
  body: Readable
}

export type UploadDocumentDeps = ParseDocumentDeps & {
  objectStore?: ObjectStore
  /** When false, skip parse after upload (tests that only care about PutObject). Default true. */
  parse?: boolean
}

export function sanitizeFilename(name: string): string {
  const base = name.replace(/\\/g, '/').split('/').pop() ?? 'file'
  const cleaned = base.replace(/[^\w.\-+() ]+/g, '_').trim().slice(0, 180)
  return cleaned || 'file'
}

export function resolveContentType(filename: string, contentType: string): string {
  const trimmed = contentType.trim().toLowerCase()
  if (ALLOWED_CONTENT_TYPES.has(trimmed)) return trimmed
  const lower = filename.toLowerCase()
  if (lower.endsWith('.md') || lower.endsWith('.markdown')) return 'text/markdown'
  if (lower.endsWith('.txt')) return 'text/plain'
  if (lower.endsWith('.pdf')) return 'application/pdf'
  return trimmed
}

function assertAllowed(contentType: string) {
  if (!ALLOWED_CONTENT_TYPES.has(contentType)) {
    throw new Error('Only text/plain, markdown, and PDF uploads are supported')
  }
}

/** Count bytes while forwarding the upload stream to the object store. */
function countingTransform(): { stream: Transform; getByteSize: () => number } {
  let byteSize = 0
  const stream = new Transform({
    transform(chunk, _enc, cb) {
      const buf = Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk)
      byteSize += buf.length
      if (byteSize > MAX_BYTES) {
        cb(new Error(`File exceeds ${MAX_BYTES} byte limit`))
        return
      }
      cb(null, buf)
    },
  })
  return { stream, getByteSize: () => byteSize }
}

/**
 * Stream file bytes to the object store, persist a documents row, then parse text.
 * Orphan objects are possible if the DB insert fails after PutObject (acceptable for v1).
 */
export async function uploadDocument(
  userId: string,
  file: UploadFileInput,
  deps: UploadDocumentDeps = {},
) {
  const filename = sanitizeFilename(file.filename)
  const contentType = resolveContentType(filename, file.contentType)
  assertAllowed(contentType)

  const id = randomUUID()
  const key = `${userId}/${id}-${filename}`
  const store = deps.objectStore ?? getObjectStore()

  const { stream, getByteSize } = countingTransform()
  const pipeline = file.body.pipe(stream)
  await store.putObject({ key, body: pipeline, contentType })

  const doc = await createDocument({
    userId,
    key,
    filename,
    contentType,
    byteSize: getByteSize(),
    status: 'uploaded',
  })

  if (deps.parse === false) return doc
  return parseDocument(doc, deps)
}
