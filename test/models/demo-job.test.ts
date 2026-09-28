import assert from 'node:assert/strict'
import { beforeEach, describe, test } from 'node:test'
import { createDemoJob, listDemoJobsForUser } from '../../app/models/demo-job'
import { createSessionUser } from '../harness/auth'
import { truncateAppTables } from '../harness/db'

describe('demo-job model', () => {
  beforeEach(async () => {
    await truncateAppTables()
  })

  test('createDemoJob persists queued job for user', async () => {
    const { user } = await createSessionUser({ email: 'model@example.com' })
    const job = await createDemoJob(user.id, '  hello  ')
    assert.equal(job.payload, 'hello')
    assert.equal(job.status, 'queued')
    assert.equal(job.userId, user.id)

    const listed = await listDemoJobsForUser(user.id)
    assert.equal(listed.length, 1)
    assert.equal(listed[0].id, job.id)
  })

  test('createDemoJob rejects empty payload', async () => {
    const { user } = await createSessionUser()
    await assert.rejects(() => createDemoJob(user.id, '   '), /Payload required/)
  })
})
