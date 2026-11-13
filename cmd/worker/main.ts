import 'dotenv/config'
import { getBoss, registerWorkers } from '../../app/queue'

console.log('[worker] starting…')
await getBoss()
await registerWorkers()
console.log('[worker] listening on queue default')
