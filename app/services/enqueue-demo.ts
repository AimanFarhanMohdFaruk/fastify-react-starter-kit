import { createDemoJob } from '../models/demo-job'
import { getBoss } from '../jobs/queue'

/** Persist row + enqueue for worker */
export async function enqueueDemoJob(userId: string, payload: string) {
  const job = await createDemoJob(userId, payload)
  const boss = await getBoss()
  await boss.createQueue('demo-job')
  await boss.send('demo-job', { jobId: job.id, payload: job.payload })
  return job
}
