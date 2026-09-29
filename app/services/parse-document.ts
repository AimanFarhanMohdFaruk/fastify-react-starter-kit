import { createRequire } from 'node:module'
import type { Document } from '../models/schema'
import { markDocumentFailed, markDocumentReady } from '../models/document'
import { getObjectStore, type ObjectStore } from '../object-store'

const require = createRequire(import.meta.url)
const parsePdf = require('parse-pdf') as (
  content: Buffer | Uint8Array,
) => Promise<{ pages: { text: string }[] }>

export type ParsePdfFn = typeof parsePdf

export type ParseDocumentDeps = {
  objectStore?: ObjectStore
  parsePdf?: ParsePdfFn
}

async function extractText(doc: Document, deps: ParseDocumentDeps): Promise<string> {
  const store = deps.objectStore ?? getObjectStore()
  const contentType = doc.contentType.toLowerCase()

  if (
    contentType === 'text/plain' ||
    contentType === 'text/markdown' ||
    contentType === 'text/x-markdown'
  ) {
    return store.getObjectText(doc.key)
  }

  if (contentType === 'application/pdf') {
    const bytes = await store.getObjectBytes(doc.key)
    const parse = deps.parsePdf ?? parsePdf
    const result = await parse(Buffer.from(bytes))
    return result.pages.map((p) => p.text).join('\n').trim()
  }

  throw new Error(`Unsupported content type for parse: ${doc.contentType}`)
}

/** Pull text from object store into documents.extractedText (ready | failed). */
export async function parseDocument(doc: Document, deps: ParseDocumentDeps = {}) {
  try {
    const text = await extractText(doc, deps)
    const ready = await markDocumentReady(doc.id, text)
    return ready ?? doc
  } catch {
    const failed = await markDocumentFailed(doc.id)
    return failed ?? doc
  }
}
