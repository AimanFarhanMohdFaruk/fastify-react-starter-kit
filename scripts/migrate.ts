import 'dotenv/config'
import { readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import postgres from 'postgres'

const url = process.env.DATABASE_URL
if (!url) throw new Error('DATABASE_URL required')

const dir = dirname(fileURLToPath(import.meta.url))
const ddl = readFileSync(join(dir, '../db/migrate/0000_init.sql'), 'utf8')
const sql = postgres(url, { max: 1 })
await sql.unsafe(ddl)
await sql.end()
console.log('Applied db/migrate/0000_init.sql')
