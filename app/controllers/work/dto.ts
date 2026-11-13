/** HTTP shaping for fire-and-forget work enqueue. */

export function parseShoutBody(body: unknown): { message: string } {
  const obj =
    typeof body === 'object' && body !== null
      ? (body as Record<string, unknown>)
      : {}
  return {
    message: obj.message != null ? String(obj.message) : '',
  }
}
