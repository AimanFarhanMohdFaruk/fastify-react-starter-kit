import { PgBoss } from 'pg-boss'

/** Process infra — pg-boss client (peer of db / mail). Stupid bus: name + args. */

export const DEFAULT_QUEUE = 'default'

let boss: PgBoss | null = null

export async function getBoss() {
  if (boss) return boss
  const url = process.env.DATABASE_URL
  if (!url) throw new Error('DATABASE_URL required')
  boss = new PgBoss(url)
  await boss.start()
  return boss
}

/** Enqueue work by name — no domain row required. */
export async function enqueue<T extends Record<string, unknown>>(
  name: string,
  args: T,
) {
  const client = await getBoss()
  await client.createQueue(DEFAULT_QUEUE)
  const id = await client.send(DEFAULT_QUEUE, { name, args })
  return id
}
