import { DEFAULT_QUEUE, getBoss } from '../queue'
import { handlers, isJobName, type JobArgs, type JobName } from './handlers'

/** Thin DELIVERY — dequeue → handlers[name](args) */

export async function runJob<N extends JobName>(name: N, args: JobArgs<N>) {
  return handlers[name](args)
}

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
        const result = await runJob(name, data.args as JobArgs<typeof name>)
        console.log(`[worker] ${name} ok`, result ?? '')
      } catch (err) {
        console.error(`[worker] ${name} failed:`, err)
        throw err
      }
    }
  })
}
