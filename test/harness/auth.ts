import { betterAuth } from 'better-auth'
import { drizzleAdapter } from 'better-auth/adapters/drizzle'
import { magicLink, testUtils } from 'better-auth/plugins'
import { db } from '../../app/db'
import * as schema from '../../app/models/schema'
import { TEST_APP_URL, TEST_AUTH_SECRET } from './db'

/**
 * Test-only Better Auth instance with `testUtils()`.
 * Shares DB + secret with prod `app/models/auth` so cookies work with `getSessionUser`.
 */
export const testAuth = betterAuth({
  database: drizzleAdapter(db, {
    provider: 'pg',
    schema: {
      user: schema.user,
      session: schema.session,
      account: schema.account,
      verification: schema.verification,
    },
  }),
  secret: TEST_AUTH_SECRET,
  baseURL: TEST_APP_URL,
  emailAndPassword: { enabled: true },
  plugins: [
    magicLink({
      sendMagicLink: async () => {},
    }),
    testUtils(),
  ],
  trustedOrigins: [TEST_APP_URL],
})

export async function getTestHelpers() {
  const ctx = await testAuth.$context
  if (!ctx.test) throw new Error('testUtils() missing on testAuth')
  return ctx.test
}

export async function createSessionUser(overrides?: { email?: string; name?: string }) {
  const helpers = await getTestHelpers()
  const user = helpers.createUser({
    email: overrides?.email ?? `user-${crypto.randomUUID()}@example.com`,
    name: overrides?.name ?? 'Test User',
    emailVerified: true,
  })
  await helpers.saveUser(user)
  const { headers, cookies } = await helpers.login({ userId: user.id })
  return { user, headers, cookies, helpers }
}

/** Playwright-shaped cookies via Better Auth `getCookies` (preferred E2E path). */
export async function sessionCookiesForPlaywright(userId: string) {
  const helpers = await getTestHelpers()
  return helpers.getCookies({ userId, domain: '127.0.0.1' })
}
