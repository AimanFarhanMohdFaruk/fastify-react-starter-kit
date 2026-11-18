import { createPgBossAdapter } from './adapters/pg-boss'
import type { QueueAdapter } from './types'

let override: QueueAdapter | null = null
let defaultAdapter: QueueAdapter | null = null

/** Tests — swap delivery (e.g. createInlineAdapter()). Pass null to clear. */
export function setQueueAdapter(adapter: QueueAdapter | null) {
  override = adapter
}

export function getQueueAdapter(): QueueAdapter {
  if (override) return override
  if (!defaultAdapter) defaultAdapter = createPgBossAdapter()
  return defaultAdapter
}

/** Boot the consumer — cmd/worker only. */
export async function registerWorkers() {
  const adapter = getQueueAdapter()
  if (!adapter.work) {
    throw new Error('Queue adapter does not support work()')
  }
  await adapter.work()
}

/** Stop the active adapter(s) — optional shutdown / test teardown. */
export async function stopQueue() {
  await override?.stop?.()
  if (defaultAdapter) {
    await defaultAdapter.stop?.()
    defaultAdapter = null
  }
}
