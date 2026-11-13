import { eq, desc } from 'drizzle-orm'
import { randomUUID } from 'node:crypto'
import { db } from '../db'
import { reports } from './schema'

/** Fat model — Report aggregate + persistence */

export async function createReport(userId: string, payload: string) {
  const trimmed = payload.trim()
  if (!trimmed) throw new Error('Payload required')
  const id = randomUUID()
  const [row] = await db
    .insert(reports)
    .values({ id, userId, payload: trimmed, status: 'queued' })
    .returning()
  return row
}

export async function listReportsForUser(userId: string) {
  return db
    .select()
    .from(reports)
    .where(eq(reports.userId, userId))
    .orderBy(desc(reports.createdAt))
    .limit(20)
}

export async function runReportWork(id: string, payload: string) {
  await db.update(reports).set({ status: 'running' }).where(eq(reports.id, id))
  await new Promise((r) => setTimeout(r, 1500))
  const result = `Processed: ${payload.toUpperCase()} @ ${new Date().toISOString()}`
  await db
    .update(reports)
    .set({ status: 'done', result, finishedAt: new Date() })
    .where(eq(reports.id, id))
  return result
}

export async function failReport(id: string, message: string) {
  await db
    .update(reports)
    .set({ status: 'failed', result: message, finishedAt: new Date() })
    .where(eq(reports.id, id))
}
