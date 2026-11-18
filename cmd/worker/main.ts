import 'dotenv/config'
import { registerWorkers } from '../../app/queue'

console.log('[worker] starting…')
await registerWorkers()
console.log('[worker] listening on queue default')
