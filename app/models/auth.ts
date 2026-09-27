import { betterAuth } from 'better-auth'
import { drizzleAdapter } from 'better-auth/adapters/drizzle'
import { magicLink } from 'better-auth/plugins'
import { db } from '../db'
import * as schema from './schema'

export const auth = betterAuth({
  database: drizzleAdapter(db, {
    provider: 'pg',
    schema: {
      user: schema.user,
      session: schema.session,
      account: schema.account,
      verification: schema.verification,
    },
  }),
  emailAndPassword: {
    enabled: true,
  },
  plugins: [
    magicLink({
      sendMagicLink: async ({ email, url }) => {
        // Dev transport — swap for a real provider later (STACK.md fog)
        console.log(`[magic-link] ${email} → ${url}`)
      },
    }),
  ],
  trustedOrigins: [process.env.APP_URL ?? 'http://localhost:3000'],
})

export type SessionUser = typeof auth.$Infer.Session.user
