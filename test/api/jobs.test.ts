import assert from 'node:assert/strict'
import { beforeEach, describe, test } from 'node:test'
import { createDemoJob } from '../../app/models/demo-job'
import { buildApiApp } from '../harness/app'
import { createSessionUser } from '../harness/auth'
import { truncateAppTables } from '../harness/db'

describe('/api/jobs', () => {
  beforeEach(async () => {
    await truncateAppTables()
  })

  test('GET returns 401 without session', async (t) => {
    const app = await buildApiApp()
    t.after(() => app.close())

    const res = await app.inject({ method: 'GET', url: '/api/jobs' })
    assert.equal(res.statusCode, 401)
  })

  test('GET returns jobs for session user', async (t) => {
    const { user, headers } = await createSessionUser({ email: 'api@example.com' })
    await createDemoJob(user.id, 'from-model')

    const app = await buildApiApp()
    t.after(() => app.close())

    const cookie = headers.get('cookie')
    assert.ok(cookie)

    const res = await app.inject({
      method: 'GET',
      url: '/api/jobs',
      headers: { cookie },
    })
    assert.equal(res.statusCode, 200)
    const body = res.json() as Array<{ payload: string }>
    assert.equal(body.length, 1)
    assert.equal(body[0].payload, 'from-model')
  })
})
