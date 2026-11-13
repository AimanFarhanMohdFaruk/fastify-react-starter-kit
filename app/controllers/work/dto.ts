/** HTTP shaping for fire-and-forget work enqueue. */

export type WorkEnqueueDto = {
  enqueued: true
  name: string
  jobId: string | null
}

export function workEnqueueDto(input: {
  name: string
  jobId: string | null | undefined
}): WorkEnqueueDto {
  return {
    enqueued: true,
    name: input.name,
    jobId: input.jobId ?? null,
  }
}

export function parseShoutBody(body: unknown): { message: string } {
  const obj =
    typeof body === 'object' && body !== null
      ? (body as Record<string, unknown>)
      : {}
  return {
    message: obj.message != null ? String(obj.message) : '',
  }
}
