/**
 * Starts Testcontainers DB (if needed), then boots `cmd/web` for Playwright.
 * Env is harness-owned — not loaded from developer `.env` DATABASE_URL.
 */
import { startTestDatabase } from './harness/db'

await startTestDatabase()
await import('../cmd/web/main')
