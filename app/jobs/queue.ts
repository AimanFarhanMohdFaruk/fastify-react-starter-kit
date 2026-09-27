import { PgBoss } from 'pg-boss'

let boss: PgBoss | null = null

export async function getBoss() {
  if (boss) return boss
  const url = process.env.DATABASE_URL
  if (!url) throw new Error('DATABASE_URL required')
  boss = new PgBoss(url)
  await boss.start()
  return boss
}
