import assert from 'node:assert/strict'
import { beforeEach, describe, test } from 'node:test'
import { buildApiApp } from '../harness/app'
import { createSessionUser } from '../harness/auth'
import { truncateAppTables } from '../harness/db'

describe('/api/work', () => {
  beforeEach(async () => {
    await truncateAppTables()
  })

  test('POST returns 401 without session', async () => {
    const app = await buildApiApp()
    const res = await app.inject({
      method: 'POST',
      url: '/api/work',
      headers: { 'content-type': 'application/json' },
      payload: { message: 'hi' },
    })
    assert.equal(res.statusCode, 401)
    await app.close()
  })

  test('POST rejects empty message', async () => {
    const { headers } = await createSessionUser({ email: 'work@example.com' })
    const cookie = headers.get('cookie')
    assert.ok(cookie)
    const app = await buildApiApp()
    const res = await app.inject({
      method: 'POST',
      url: '/api/work',
      headers: { cookie, 'content-type': 'application/json' },
      payload: { message: '  ' },
    })
    assert.equal(res.statusCode, 400)
    await app.close()
  })
})
