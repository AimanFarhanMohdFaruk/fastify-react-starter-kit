/**
 * Stupid bus — typed registry, enqueue, and consumer.
 * Add a job = add one `handlers` entry; call `enqueue('name', args)`.
 * Delivery: pg-boss (prod) or inline adapter (tests via setQueueAdapter).
 */
export {
  handlers,
  isJobName,
  runJob,
  type JobArgs,
  type JobName,
  type Jobs,
} from './handlers'
export { enqueue } from './enqueue'
export {
  getQueueAdapter,
  registerWorkers,
  setQueueAdapter,
  stopQueue,
} from './adapter'
export type { QueueAdapter } from './types'
export { createInlineAdapter, type InlineAdapter } from './adapters/inline'
export { DEFAULT_QUEUE } from './adapters/pg-boss'
