import { shout } from '../services/shout'

/**
 * Job registry — source of truth for names + args.
 * Add a job = add one entry here; enqueue() and the worker both key off this map.
 */
export const handlers = {
  shout,
} as const

export type Jobs = typeof handlers
export type JobName = keyof Jobs
export type JobArgs<N extends JobName> = Parameters<Jobs[N]>[0]

export function isJobName(name: string): name is JobName {
  return Object.hasOwn(handlers, name)
}
