import { composeWebApp } from '../../app/config'

/** Controllers only — no Vite. */
export async function buildApiApp() {
  return composeWebApp({
    logger: false,
    rateLimit: { max: 10_000, timeWindow: '1 minute' },
  })
}
