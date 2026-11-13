import { shout, type ShoutArgs } from '../services/shout'

/** name → service. Queue stays stupid; add entries here when growing work. */

export const handlers = {
  shout: (args: unknown) => shout(args as ShoutArgs),
} as const

export type JobName = keyof typeof handlers

export function isJobName(name: string): name is JobName {
  return name in handlers
}
