import { DEFAULT_QUEUE, getBoss } from '../queue'
import { handlers, isJobName } from './handlers'

/** Thin DELIVERY — dequeue → handlers[name](args) */

export async function registerWorkers() {
  const boss = await getBoss()
  await boss.createQueue(DEFAULT_QUEUE)
  await boss.work(DEFAULT_QUEUE, async (jobs) => {
    for (const job of jobs) {
      const data = job.data as { name?: string; args?: unknown }
      const name = data.name
      if (!name || !isJobName(name)) {
        throw new Error(`Unknown job name: ${String(name)}`)
      }
      try {
        const result = await handlers[name](data.args ?? {})
        console.log(`[worker] ${name} ok`, result ?? '')
      } catch (err) {
        console.error(`[worker] ${name} failed:`, err)
        throw err
      }
    }
  })
}
