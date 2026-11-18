import { getQueueAdapter } from './adapter'
import { isJobName, type JobArgs, type JobName } from './handlers'

/** Enqueue work by name — no domain row required. */
export async function enqueue<N extends JobName>(name: N, args: JobArgs<N>) {
  if (!isJobName(name)) throw new Error(`Unknown job name: ${String(name)}`)
  const adapter = getQueueAdapter()
  return adapter.send(name, args)
}
