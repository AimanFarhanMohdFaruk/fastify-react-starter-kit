import { asc, desc, eq, sql } from 'drizzle-orm'
import { db } from '../db'
import { demoJobs, user } from './schema'

/** Admin authz + directory queries — fat model */

export type RoleBearer = {
  role?: string | null
}

export function isAdmin(user: RoleBearer): boolean {
  if (!user.role) return false
  return user.role
    .split(',')
    .map((part) => part.trim())
    .includes('admin')
}

export function requireAdmin<T extends RoleBearer>(user: T): T {
  if (!isAdmin(user)) throw new Error('Admin required')
  return user
}

export type PromoteAdminResult =
  | { status: 'promoted'; userId: string; email: string }
  | { status: 'already_admin'; userId: string; email: string }

export async function promoteUserToAdmin(email: string): Promise<PromoteAdminResult> {
  const normalized = email.trim().toLowerCase()
  if (!normalized) throw new Error('Email required')

  const [row] = await db
    .select()
    .from(user)
    .where(sql`lower(${user.email}) = ${normalized}`)
    .limit(1)
  if (!row) throw new Error('User not found')

  if (isAdmin(row)) {
    return { status: 'already_admin', userId: row.id, email: row.email }
  }

  await db.update(user).set({ role: 'admin', updatedAt: new Date() }).where(eq(user.id, row.id))
  return { status: 'promoted', userId: row.id, email: row.email }
}

export async function listUsersForAdmin() {
  return db
    .select({
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      createdAt: user.createdAt,
    })
    .from(user)
    .orderBy(asc(user.createdAt))
}

export async function getUserForAdmin(id: string) {
  const [row] = await db
    .select({
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      createdAt: user.createdAt,
    })
    .from(user)
    .where(eq(user.id, id))
    .limit(1)
  return row ?? null
}

export async function listDemoJobsForAdmin() {
  return db
    .select({
      id: demoJobs.id,
      status: demoJobs.status,
      createdAt: demoJobs.createdAt,
      userId: demoJobs.userId,
      userEmail: user.email,
    })
    .from(demoJobs)
    .innerJoin(user, eq(demoJobs.userId, user.id))
    .orderBy(desc(demoJobs.createdAt))
    .limit(100)
}

export async function getDemoJobForAdmin(id: string) {
  const [row] = await db
    .select({
      id: demoJobs.id,
      status: demoJobs.status,
      payload: demoJobs.payload,
      result: demoJobs.result,
      createdAt: demoJobs.createdAt,
      finishedAt: demoJobs.finishedAt,
      userId: demoJobs.userId,
      userEmail: user.email,
    })
    .from(demoJobs)
    .innerJoin(user, eq(demoJobs.userId, user.id))
    .where(eq(demoJobs.id, id))
    .limit(1)
  return row ?? null
}
