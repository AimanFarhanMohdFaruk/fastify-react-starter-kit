import 'dotenv/config'
import { registerReportWorker } from '../../app/jobs/report'
import { getBoss } from '../../app/jobs/queue'

console.log('[worker] starting…')
await getBoss()
await registerReportWorker()
console.log('[worker] listening on queue report')
