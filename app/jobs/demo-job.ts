import { getBoss } from './queue'
import { runDemoJobWork, failDemoJob } from '../models/demo-job'

/** Thin job adapter */
export async function registerDemoJobWorker() {
  const boss = await getBoss()
  await boss.createQueue('demo-job')
  await boss.work('demo-job', async (jobs) => {
    for (const job of jobs) {
      const data = job.data as { jobId: string; payload: string }
      try {
        const result = await runDemoJobWork(data.jobId, data.payload)
        console.log(`[worker] processed demo-job ${data.jobId} payload=${JSON.stringify(data.payload)} → ${result}`)
      } catch (err) {
        console.error(`[worker] failed demo-job ${data.jobId}:`, err)
        await failDemoJob(data.jobId, err instanceof Error ? err.message : String(err))
        throw err
      }
    }
  })
}
