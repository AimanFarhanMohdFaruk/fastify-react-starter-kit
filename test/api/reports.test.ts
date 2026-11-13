import assert from 'node:assert/strict'
import { beforeEach, describe, test } from 'node:test'
import { createReport } from '../../app/models/report'
import { buildApiApp } from '../harness/app'
import { createSessionUser } from '../harness/auth'
import { truncateAppTables } from '../harness/db'

describe('/api/reports', () => {
  beforeEach(async () => {
    await truncateAppTables()
  })

  test('GET returns 401 without session', async () => {
    const app = await buildApiApp()
    const res = await app.inject({ method: 'GET', url: '/api/reports' })
    assert.equal(res.statusCode, 401)
    await app.close()
  })

  test('GET returns reports for session user', async () => {
    const { user, headers } = await createSessionUser({
      email: 'api@example.com',
    })
    const cookie = headers.get('cookie')
    assert.ok(cookie)
    await createReport(user.id, 'from-model')
    const app = await buildApiApp()
    const res = await app.inject({
      method: 'GET',
      url: '/api/reports',
      headers: { cookie },
    })
    assert.equal(res.statusCode, 200)
    const body = res.json()
    assert.equal(body.length, 1)
    assert.equal(body[0].payload, 'from-model')
    await app.close()
  })
})
