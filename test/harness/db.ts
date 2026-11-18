/**
 * Test database lifecycle — Testcontainers Postgres (pgvector).
 * Never reads developer `.env` DATABASE_URL for destructive resets.
 *
 * Pattern (same idea as Go `dbcleaner` / Rails test config):
 * - Harness owns `TEST_DATABASE_URL` (test-only URI).
 * - `DATABASE_URL` is mirrored so app modules keep working.
 * - Truncate refuses unless `TEST_DATABASE_URL` is set and names `kit_test`.
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
/** Database name owned by Testcontainers — truncate refuses any other. */
export const TEST_DATABASE_NAME = 'kit_test'

let container: StartedPostgreSqlContainer | null = null

export function databaseUrlFile() {
  return urlFile
}

/**
 * Refuse URLs that are not the harness test database (e.g. Compose `starter_kit`).
 * Go’s dbcleaner does the same for Truncation/Deletion: name must look like a test DB.
 */
export function assertTestDatabaseUrl(url: string) {
  let parsed: URL
  try {
    parsed = new URL(url)
  } catch {
    throw new Error('TEST_DATABASE_URL is not a valid URL — refuse truncate')
  }

  if (parsed.protocol !== 'postgres:' && parsed.protocol !== 'postgresql:') {
    throw new Error(
      `TEST_DATABASE_URL protocol must be postgres(ql) — refuse truncate (got ${parsed.protocol})`,
    )
  }

  const dbName = decodeURIComponent(parsed.pathname.replace(/^\//, ''))
  if (!dbName || dbName !== TEST_DATABASE_NAME) {
    throw new Error(
      `Refusing truncate: database "${dbName || '(none)'}" is not the test database "${TEST_DATABASE_NAME}"`,
    )
  }
}

/** Resolve the test-owned URI. Prefer TEST_DATABASE_URL; never fall back silently to ambient DATABASE_URL. */
export function requireTestDatabaseUrl() {
  const url = process.env.TEST_DATABASE_URL
  if (!url) {
    throw new Error(
      'TEST_DATABASE_URL not set — refuse truncate (call startTestDatabase / applyTestEnv; do not use ambient DATABASE_URL alone)',
    )
  }
  assertTestDatabaseUrl(url)

  const appUrl = process.env.DATABASE_URL
  if (appUrl && appUrl !== url) {
    throw new Error(
      'DATABASE_URL does not match TEST_DATABASE_URL — refuse truncate',
    )
  }

  return url
}

/** Apply harness env. Call before importing `app/db` or auth. */
export function applyTestEnv(databaseUrl: string) {
  assertTestDatabaseUrl(databaseUrl)
  delete process.env.DATABASE_URL
  delete process.env.TEST_DATABASE_URL
  // Test-owned URI first; mirror into DATABASE_URL for app modules (db.ts, queue, …).
  process.env.TEST_DATABASE_URL = databaseUrl
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
    .withDatabase(TEST_DATABASE_NAME)
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
  const url = requireTestDatabaseUrl()
  const sql = postgres(url, { max: 1 })
  try {
    await sql`
      TRUNCATE TABLE documents, posts, session, account, verification, "user" RESTART IDENTITY CASCADE
    `
  } finally {
    await sql.end()
  }
}
