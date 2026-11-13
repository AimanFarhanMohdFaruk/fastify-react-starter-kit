import assert from 'node:assert/strict'
import { eq } from 'drizzle-orm'
import { beforeEach, describe, test } from 'node:test'
import { db } from '../../app/db'
import { user } from '../../app/models/schema'
import { buildApiApp } from '../harness/app'
import { createSessionUser } from '../harness/auth'
import { truncateAppTables } from '../harness/db'

describe('banned session', () => {
  beforeEach(async () => {
    await truncateAppTables()
  })

  test('banned user gets 401 on private /api', async (t) => {
    const { user: sessionUser, headers } = await createSessionUser({
      email: 'banned@example.com',
    })
    const cookie = headers.get('cookie')
    assert.ok(cookie)

    await db
      .update(user)
      .set({ banned: true, updatedAt: new Date() })
      .where(eq(user.id, sessionUser.id))

    const app = await buildApiApp()
    t.after(() => app.close())

    const res = await app.inject({
      method: 'GET',
      url: '/api/posts',
      headers: { cookie },
    })
    assert.equal(res.statusCode, 401)
  })

  test('expired ban still allows /api', async (t) => {
    const { user: sessionUser, headers } = await createSessionUser({
      email: 'unbanned@example.com',
    })
    const cookie = headers.get('cookie')
    assert.ok(cookie)

    await db
      .update(user)
      .set({
        banned: true,
        banExpires: new Date(Date.now() - 60_000),
        updatedAt: new Date(),
      })
      .where(eq(user.id, sessionUser.id))

    const app = await buildApiApp()
    t.after(() => app.close())

    const res = await app.inject({
      method: 'GET',
      url: '/api/posts',
      headers: { cookie },
    })
    assert.equal(res.statusCode, 200)
  })
})
