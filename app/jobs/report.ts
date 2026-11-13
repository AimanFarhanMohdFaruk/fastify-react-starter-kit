import { getBoss } from './queue'
import { runReportWork, failReport } from '../models/report'

/** Thin job adapter — dequeue → model */
export async function registerReportWorker() {
  const boss = await getBoss()
  await boss.createQueue('report')
  await boss.work('report', async (jobs) => {
    for (const job of jobs) {
      const data = job.data as { reportId: string; payload: string }
      try {
        const result = await runReportWork(data.reportId, data.payload)
        console.log(
          `[worker] processed report ${data.reportId} payload=${JSON.stringify(data.payload)} → ${result}`,
        )
      } catch (err) {
        console.error(`[worker] failed report ${data.reportId}:`, err)
        await failReport(
          data.reportId,
          err instanceof Error ? err.message : String(err),
        )
        throw err
      }
    }
  })
}
