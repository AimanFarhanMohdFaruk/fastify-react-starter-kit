import 'dotenv/config'
import { drizzle } from 'drizzle-orm/postgres-js'
import postgres from 'postgres'
import * as schema from './models/schema'

const url = process.env.DATABASE_URL
if (!url) {
  throw new Error('DATABASE_URL is required (Postgres connection string)')
}

export const sql = postgres(url, { max: 10 })
export const db = drizzle(sql, { schema })
