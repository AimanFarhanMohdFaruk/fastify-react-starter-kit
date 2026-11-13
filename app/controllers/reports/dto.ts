/**
 * HTTP shaping for reports — not domain types.
 * /api handlers and page getData both call reportDto — one JSON shape.
 */
import { listReportsForUser } from '../../models/report'

type ReportRow = Awaited<ReturnType<typeof listReportsForUser>>[number]

export type ReportDto = {
  id: string
  payload: string
  status: string
  result: string | null
  createdAt: string
}

export function reportDto(report: ReportRow): ReportDto {
  return {
    id: report.id,
    payload: report.payload,
    status: report.status,
    result: report.result,
    createdAt: report.createdAt.toISOString(),
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
