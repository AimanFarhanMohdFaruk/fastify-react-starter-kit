import { betterAuth } from 'better-auth'
import { drizzleAdapter } from 'better-auth/adapters/drizzle'
import { admin, magicLink } from 'better-auth/plugins'
import { db } from '../db'
import { getMailer } from '../mail'
import { magicLinkEmail } from '../mail/templates/magic-link'
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
  secret: process.env.BETTER_AUTH_SECRET,
  baseURL: process.env.BETTER_AUTH_URL ?? process.env.APP_URL ?? 'http://localhost:3000',
  emailAndPassword: {
    enabled: true,
  },
  plugins: [
    admin({
      defaultRole: 'user',
      adminRoles: ['admin'],
    }),
    magicLink({
      sendMagicLink: async ({ email, url }) => {
        await getMailer().send(magicLinkEmail(email, url))
      },
    }),
  ],
  trustedOrigins: [process.env.APP_URL ?? 'http://localhost:3000'],
})

export type SessionUser = typeof auth.$Infer.Session.user
