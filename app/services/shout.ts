/** Demo job body — no domain record; just side effects (log). */

import { ValidationError } from '../errors'

export type ShoutArgs = {
  message: string
  userId?: string
}

/** Single message invariant — HTTP enqueue and worker both use this. */
export function parseShoutMessage(message: string): string {
  const trimmed = message.trim()
  if (!trimmed) throw new ValidationError('Message required')
  return trimmed
}

export async function shout(args: ShoutArgs) {
  const message = parseShoutMessage(args.message)
  await new Promise((r) => setTimeout(r, 1000))
  const who = args.userId ? ` user=${args.userId}` : ''
  console.log(`[shout]${who} ${message}`)
  return { shouted: message }
}
