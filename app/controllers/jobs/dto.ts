/**
 * HTTP shaping for jobs — not domain types.
 * Keep request/response mapping here; models stay pure.
 */
import { listDemoJobsForUser } from '../../models/demo-job'

type JobRow = Awaited<ReturnType<typeof listDemoJobsForUser>>[number]

export function jobDto(job: JobRow) {
  return {
    id: job.id,
    payload: job.payload,
    status: job.status,
    result: job.result,
    createdAt: job.createdAt.toISOString(),
  }
}

export function parseCreateBody(body: unknown): { payload: string } {
  const payload =
    typeof body === 'object' &&
    body !== null &&
    'payload' in body &&
    body.payload != null
      ? String((body as { payload: unknown }).payload)
      : ''
  return { payload }
}
