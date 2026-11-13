import { and, desc, eq } from 'drizzle-orm'
import { randomUUID } from 'node:crypto'
import { db } from '../db'
import { posts } from './schema'

/** Fat model — Post aggregate + persistence (CRUD demo) */

export async function createPost(
  userId: string,
  input: { title: string; body?: string },
) {
  const title = input.title.trim()
  if (!title) throw new Error('Title required')
  const body = (input.body ?? '').trim()
  const id = randomUUID()
  const [row] = await db
    .insert(posts)
    .values({ id, userId, title, body })
    .returning()
  return row
}

export async function listPostsForUser(userId: string) {
  return db
    .select()
    .from(posts)
    .where(eq(posts.userId, userId))
    .orderBy(desc(posts.createdAt))
    .limit(50)
}

export async function getPostForUser(id: string, userId: string) {
  const [row] = await db
    .select()
    .from(posts)
    .where(and(eq(posts.id, id), eq(posts.userId, userId)))
    .limit(1)
  return row ?? null
}

export async function updatePostForUser(
  id: string,
  userId: string,
  input: { title?: string; body?: string },
) {
  const existing = await getPostForUser(id, userId)
  if (!existing) return null

  const title =
    input.title !== undefined ? input.title.trim() : existing.title
  if (!title) throw new Error('Title required')
  const body =
    input.body !== undefined ? input.body.trim() : existing.body

  const [row] = await db
    .update(posts)
    .set({ title, body, updatedAt: new Date() })
    .where(and(eq(posts.id, id), eq(posts.userId, userId)))
    .returning()
  return row ?? null
}

export async function deletePostForUser(id: string, userId: string) {
  const [row] = await db
    .delete(posts)
    .where(and(eq(posts.id, id), eq(posts.userId, userId)))
    .returning({ id: posts.id })
  return row ?? null
}
