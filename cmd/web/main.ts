import 'dotenv/config'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { composeWebApp } from '../../app/config'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const root = path.join(__dirname, '../..')
const isProd = process.env.NODE_ENV === 'production'

const logger = isProd
  ? true
  : {
      transport: {
        target: 'pino-pretty',
        options: {
          translateTime: 'HH:MM:ss Z',
          ignore: 'pid,hostname',
        },
      },
    }

async function main() {
  const app = await composeWebApp({
    logger,
    // Generous in local/Vite so HMR assets do not trip the limiter.
    rateLimit: {
      max: isProd ? 300 : 10_000,
      timeWindow: '1 minute',
    },
    vite: { root, dev: !isProd },
  })

  const port = Number(process.env.PORT ?? 3000)
  await app.listen({ port, host: '0.0.0.0' })
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
