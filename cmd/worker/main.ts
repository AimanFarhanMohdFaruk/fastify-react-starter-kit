import 'dotenv/config'
import { registerDemoJobWorker } from '../../app/jobs/demo-job'
import { getBoss } from '../../app/jobs/queue'

console.log('[worker] starting…')
await getBoss()
await registerDemoJobWorker()
console.log('[worker] listening on queue demo-job')
