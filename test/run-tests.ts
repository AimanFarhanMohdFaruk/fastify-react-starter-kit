/**
 * Bootstrap: start Testcontainers DB, then spawn node:test with the harness env.
 * Uses --test-force-exit so open pools cannot hang the process.
 */
import { spawnSync } from 'node:child_process'
import { readdirSync } from 'node:fs'
import { join } from 'node:path'
import { startTestDatabase, stopTestDatabase } from './harness/db'

function collectTests(dir: string): string[] {
  const out: string[] = []
  for (const name of readdirSync(dir, { withFileTypes: true })) {
    const p = join(dir, name.name)
    if (name.isDirectory()) out.push(...collectTests(p))
    else if (name.name.endsWith('.test.ts')) out.push(p)
  }
  return out
}

await startTestDatabase()

const files = collectTests(join(import.meta.dirname, '.'))
const result = spawnSync(
  process.execPath,
  [
    '--import',
    'tsx',
    '--test',
    '--test-force-exit',
    '--test-isolation=none',
    ...files,
  ],
  {
    stdio: 'inherit',
    env: process.env,
  },
)

await stopTestDatabase()
process.exit(result.status === null ? 1 : result.status)
