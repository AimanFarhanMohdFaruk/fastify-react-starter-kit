import { PgBoss } from 'pg-boss'
import { isJobName, runJob, type JobArgs } from '../handlers'
import type { QueueAdapter } from '../types'

export const DEFAULT_QUEUE = 'default'

/**
 * pg-boss adapter — start-once, send, work, stop.
 * Lifecycle lives here; callers use enqueue / registerWorkers.
 */
export function createPgBossAdapter(): QueueAdapter {
  let boss: PgBoss | null = null
  let starting: Promise<PgBoss> | null = null

  async function getBoss(): Promise<PgBoss> {
    if (boss) return boss
    if (!starting) {
      starting = (async () => {
        const url = process.env.DATABASE_URL
        if (!url) throw new Error('DATABASE_URL required')
        const client = new PgBoss(url)
        await client.start()
        await client.createQueue(DEFAULT_QUEUE)
        boss = client
        return client
      })().finally(() => {
        starting = null
      })
    }
    return starting
  }

  return {
    async send(name, args) {
      const client = await getBoss()
      return client.send(DEFAULT_QUEUE, { name, args })
    },

    async work() {
      const client = await getBoss()
      await client.work(DEFAULT_QUEUE, async (jobs) => {
        for (const job of jobs) {
          const data = job.data as { name?: string; args?: unknown }
          const name = data.name
          if (!name || !isJobName(name)) {
            throw new Error(`Unknown job name: ${String(name)}`)
          }
          try {
            const result = await runJob(
              name,
              data.args as JobArgs<typeof name>,
            )
            console.log(`[worker] ${name} ok`, result ?? '')
          } catch (err) {
            console.error(`[worker] ${name} failed:`, err)
            throw err
          }
        }
      })
    },

    async stop() {
      if (!boss) return
      const client = boss
      boss = null
      await client.stop()
    },
  }
}
