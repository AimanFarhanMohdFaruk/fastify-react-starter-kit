import { runJob, type JobArgs, type JobName } from '../handlers'
import type { QueueAdapter } from '../types'

export type InlineJobRecord = {
  name: JobName
  args: unknown
}

export type InlineAdapter = QueueAdapter & {
  readonly recording: InlineJobRecord[]
}

/**
 * Test adapter — `send` runs the job immediately and records the call.
 * Use via `setQueueAdapter(createInlineAdapter())`.
 */
export function createInlineAdapter(): InlineAdapter {
  const recording: InlineJobRecord[] = []

  return {
    recording,
    async send(name, args) {
      recording.push({ name, args })
      await runJob(name, args as JobArgs<typeof name>)
      return null
    },
  }
}
