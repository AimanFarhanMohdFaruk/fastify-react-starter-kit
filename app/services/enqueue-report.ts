import { createReport } from '../models/report'
import { getBoss } from '../jobs/queue'

/** Persist Report row + enqueue for worker */
export async function enqueueReport(userId: string, payload: string) {
  const report = await createReport(userId, payload)
  const boss = await getBoss()
  await boss.createQueue('report')
  await boss.send('report', { reportId: report.id, payload: report.payload })
  return report
}
