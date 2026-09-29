import { and, desc, eq } from 'drizzle-orm'
import { randomUUID } from 'node:crypto'
import { db } from '../db'
import { documents, type Document } from './schema'

export type CreateDocumentInput = {
  userId: string
  key: string
  filename: string
  contentType: string
  byteSize: number
  status?: string
}

/** Fat model — document metadata + ownership. Bytes live in the object store. */

export async function createDocument(input: CreateDocumentInput): Promise<Document> {
  const filename = input.filename.trim()
  if (!filename) throw new Error('Filename required')
  if (!input.key.trim()) throw new Error('Object key required')
  if (!Number.isFinite(input.byteSize) || input.byteSize < 0) {
    throw new Error('byteSize must be a non-negative number')
  }

  const id = randomUUID()
  const [row] = await db
    .insert(documents)
    .values({
      id,
      userId: input.userId,
      key: input.key.trim(),
      filename,
      contentType: input.contentType.trim() || 'application/octet-stream',
      byteSize: Math.trunc(input.byteSize),
      status: input.status ?? 'uploaded',
    })
    .returning()
  return row
}

export async function getDocumentForUser(id: string, userId: string) {
  const [row] = await db
    .select()
    .from(documents)
    .where(and(eq(documents.id, id), eq(documents.userId, userId)))
    .limit(1)
  return row ?? null
}

export async function listDocumentsForUser(userId: string) {
  return db
    .select()
    .from(documents)
    .where(eq(documents.userId, userId))
    .orderBy(desc(documents.createdAt))
    .limit(50)
}

export async function markDocumentReady(id: string, extractedText: string) {
  const [row] = await db
    .update(documents)
    .set({
      status: 'ready',
      extractedText,
      updatedAt: new Date(),
    })
    .where(eq(documents.id, id))
    .returning()
  return row ?? null
}

export async function markDocumentFailed(id: string) {
  const [row] = await db
    .update(documents)
    .set({
      status: 'failed',
      updatedAt: new Date(),
    })
    .where(eq(documents.id, id))
    .returning()
  return row ?? null
}
