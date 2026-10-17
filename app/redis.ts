/**
 * Redis client (infra — like app/db.ts).
 * One shared connection per Node process; lazy connect on first getRedis().
 * Controllers do not open Redis connections — models/services call getRedis().
 */
import 'dotenv/config'
import { createClient, type RedisClientType } from 'redis'

export type Redis = RedisClientType

let client: RedisClientType | null = null
let ready: Promise<RedisClientType> | null = null

function createRedisFromEnv(): RedisClientType {
  const url = process.env.REDIS_URL?.trim()
  if (!url) throw new Error('REDIS_URL is required (Redis connection string)')

  const redis = createClient({ url })
  redis.on('error', (err) => {
    console.error('[redis]', err)
  })
  return redis
}

/** Lazy singleton — connects once per process. */
export async function getRedis(): Promise<RedisClientType> {
  if (!ready) {
    if (!client) client = createRedisFromEnv()
    ready = client.connect().then(() => {
      if (!client) throw new Error('Redis client missing after connect')
      return client
    })
  }
  return ready
}

/** Tests only — swap or clear the process singleton. */
export function setRedisForTests(next: RedisClientType | null) {
  client = next
  ready = next ? Promise.resolve(next) : null
}

/** Close the process client (scripts / graceful shutdown). */
export async function closeRedis(): Promise<void> {
  const current = client
  client = null
  ready = null
  if (current?.isOpen) await current.quit()
}
