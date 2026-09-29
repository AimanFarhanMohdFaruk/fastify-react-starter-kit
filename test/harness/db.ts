/**
 * Test database lifecycle — Testcontainers Postgres (pgvector).
 * Never reads developer `.env` DATABASE_URL.
 */
import { writeFileSync, mkdirSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import {
  PostgreSqlContainer,
  type StartedPostgreSqlContainer,
} from '@testcontainers/postgresql'
import { drizzle } from 'drizzle-orm/postgres-js'
import { migrate } from 'drizzle-orm/postgres-js/migrator'
import postgres from 'postgres'

const root = join(dirname(fileURLToPath(import.meta.url)), '../..')
const urlFile = join(root, 'test/.database-url')
const migrationsFolder = join(root, 'db/migrate')

/** Stable secrets for the test process — not from `.env`. */
export const TEST_AUTH_SECRET = 'test-better-auth-secret-min-32-chars!!'
export const TEST_APP_URL = 'http://127.0.0.1:3000'

let container: StartedPostgreSqlContainer | null = null

export function databaseUrlFile() {
  return urlFile
}

/** Apply harness env. Call before importing `app/db` or auth. */
export function applyTestEnv(databaseUrl: string) {
  delete process.env.DATABASE_URL
  process.env.DATABASE_URL = databaseUrl
  process.env.BETTER_AUTH_SECRET = TEST_AUTH_SECRET
  process.env.APP_URL = TEST_APP_URL
  process.env.BETTER_AUTH_URL = TEST_APP_URL
  process.env.PORT = process.env.PORT ?? '3000'
}

export async function startTestDatabase() {
  if (container) {
    applyTestEnv(container.getConnectionUri())
    return container.getConnectionUri()
  }

  container = await new PostgreSqlContainer('pgvector/pgvector:pg18')
    .withDatabase('kit_test')
    .withUsername('kit')
    .withPassword('kit')
    .start()

  const uri = container.getConnectionUri()
  applyTestEnv(uri)

  mkdirSync(dirname(urlFile), { recursive: true })
  writeFileSync(urlFile, uri, 'utf8')

  const sql = postgres(uri, { max: 1 })
  const db = drizzle(sql)
  await migrate(db, { migrationsFolder })
  // vector extension is in the initial migration; ensure it exists if migrate order differs
  await sql`CREATE EXTENSION IF NOT EXISTS vector`
  await sql.end()

  return uri
}

export async function stopTestDatabase() {
  if (container) {
    await container.stop()
    container = null
  }
}

export async function truncateAppTables() {
  const url = process.env.DATABASE_URL
  if (!url) throw new Error('DATABASE_URL not set — startTestDatabase first')
  const sql = postgres(url, { max: 1 })
  try {
    await sql`
      TRUNCATE TABLE documents, demo_jobs, session, account, verification, "user" RESTART IDENTITY CASCADE
    `
  } finally {
    await sql.end()
  }
}
