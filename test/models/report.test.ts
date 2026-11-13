import assert from 'node:assert/strict'
import { beforeEach, describe, test } from 'node:test'
import { createReport, listReportsForUser } from '../../app/models/report'
import { createSessionUser } from '../harness/auth'
import { truncateAppTables } from '../harness/db'

describe('report model', () => {
  beforeEach(async () => {
    await truncateAppTables()
  })

  test('createReport persists queued report for user', async () => {
    const { user } = await createSessionUser({ email: 'model@example.com' })
    const report = await createReport(user.id, '  hello  ')
    assert.equal(report.payload, 'hello')
    assert.equal(report.status, 'queued')
    assert.equal(report.userId, user.id)
    const listed = await listReportsForUser(user.id)
    assert.equal(listed.length, 1)
  })

  test('createReport rejects empty payload', async () => {
    const { user } = await createSessionUser()
    await assert.rejects(() => createReport(user.id, '   '), /Payload required/)
  })
})
