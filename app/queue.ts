import { PgBoss } from 'pg-boss'
import { shout } from './services/shout'

/**
 * Stupid bus — client, typed registry, enqueue, and consumer.
 * Add a job = add one `handlers` entry; call `enqueue('name', args)`.
 */

export const DEFAULT_QUEUE = 'default'

export const handlers = {
  shout,
} as const

export type Jobs = typeof handlers
export type JobName = keyof Jobs
export type JobArgs<N extends JobName> = Parameters<Jobs[N]>[0]

export function isJobName(name: string): name is JobName {
  return Object.hasOwn(handlers, name)
}

export async function runJob<N extends JobName>(name: N, args: JobArgs<N>) {
  return handlers[name](args)
}

let boss: PgBoss | null = null

export async function getBoss() {
  if (boss) return boss
  const url = process.env.DATABASE_URL
  if (!url) throw new Error('DATABASE_URL required')
  boss = new PgBoss(url)
  await boss.start()
  await boss.createQueue(DEFAULT_QUEUE)
  return boss
}

/** Enqueue work by name — no domain row required. */
export async function enqueue<N extends JobName>(name: N, args: JobArgs<N>) {
  if (!isJobName(name)) throw new Error(`Unknown job name: ${String(name)}`)
  const client = await getBoss()
  return client.send(DEFAULT_QUEUE, { name, args })
}

/** Boot the pg-boss consumer — call from cmd/worker only. */
export async function registerWorkers() {
  const client = await getBoss()
  await client.work(DEFAULT_QUEUE, async (jobs) => {
    for (const job of jobs) {
      const data = job.data as { name?: string; args?: unknown }
      const name = data.name
      if (!name || !isJobName(name)) {
        throw new Error(`Unknown job name: ${String(name)}`)
      }
      try {
        const result = await runJob(name, data.args as JobArgs<typeof name>)
        console.log(`[worker] ${name} ok`, result ?? '')
      } catch (err) {
        console.error(`[worker] ${name} failed:`, err)
        throw err
      }
    }
  })
}
