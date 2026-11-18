import type { JobArgs, JobName } from './handlers'

/** Delivery seam — pg-boss in prod, inline/recording in tests. */
export type QueueAdapter = {
  send<N extends JobName>(
    name: N,
    args: JobArgs<N>,
  ): Promise<string | null | undefined>
  /** Boot the consumer — pg-boss only; call from cmd/worker. */
  work?: () => Promise<void>
  stop?: () => Promise<void>
}
