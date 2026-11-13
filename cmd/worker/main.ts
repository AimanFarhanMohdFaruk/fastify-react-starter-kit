import 'dotenv/config'
import { getBoss } from '../../app/queue'
import { registerWorkers } from '../../app/workers/dispatch'

console.log('[worker] starting…')
await getBoss()
await registerWorkers()
console.log('[worker] listening on queue default')
