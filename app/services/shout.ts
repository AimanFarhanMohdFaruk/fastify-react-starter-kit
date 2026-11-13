/** Demo WORK — no domain record; just side effects (log). */

export type ShoutArgs = {
  message: string
  userId?: string
}

export async function shout(args: ShoutArgs) {
  const message = args.message.trim()
  if (!message) throw new Error('Message required')
  await new Promise((r) => setTimeout(r, 1000))
  const who = args.userId ? ` user=${args.userId}` : ''
  console.log(`[shout]${who} ${message}`)
  return { shouted: message }
}
