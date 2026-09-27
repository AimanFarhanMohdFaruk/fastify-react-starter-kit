import { eq, desc } from 'drizzle-orm'
import { randomUUID } from 'node:crypto'
import { db } from '../db'
import { demoJobs } from './schema'

/** Fat model — job domain + persistence */

export async function createDemoJob(userId: string, payload: string) {
  const trimmed = payload.trim()
  if (!trimmed) throw new Error('Payload required')
  const id = randomUUID()
  const [row] = await db
    .insert(demoJobs)
    .values({ id, userId, payload: trimmed, status: 'queued' })
    .returning()
  return row
}

export async function listDemoJobsForUser(userId: string) {
  return db
    .select()
    .from(demoJobs)
    .where(eq(demoJobs.userId, userId))
    .orderBy(desc(demoJobs.createdAt))
    .limit(20)
}

export async function runDemoJobWork(id: string, payload: string) {
  await db.update(demoJobs).set({ status: 'running' }).where(eq(demoJobs.id, id))
  await new Promise((r) => setTimeout(r, 1500))
  const result = `Processed: ${payload.toUpperCase()} @ ${new Date().toISOString()}`
  await db
    .update(demoJobs)
    .set({ status: 'done', result, finishedAt: new Date() })
    .where(eq(demoJobs.id, id))
  return result
}

export async function failDemoJob(id: string, message: string) {
  await db
    .update(demoJobs)
    .set({ status: 'failed', result: message, finishedAt: new Date() })
    .where(eq(demoJobs.id, id))
}
