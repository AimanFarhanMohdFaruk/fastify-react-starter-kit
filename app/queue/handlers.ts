import { parseDocument } from '../services/parse-document'
import { shout } from '../services/shout'

/**
 * Job registry — add a job = add one entry; call `enqueue('name', args)`.
 */
export const handlers = {
  shout,
  parse_document: parseDocument,
} as const

export type Jobs = typeof handlers
export type JobName = keyof Jobs
export type JobArgs<N extends JobName> = Parameters<Jobs[N]>[0]

export function isJobName(name: string): name is JobName {
  return Object.hasOwn(handlers, name)
}

export async function runJob<N extends JobName>(name: N, args: JobArgs<N>) {
  const handler = handlers[name] as (
    args: JobArgs<N>,
  ) => ReturnType<(typeof handlers)[N]>
  return handler(args)
}
