import assert from 'node:assert/strict'
import { beforeEach, describe, test } from 'node:test'
import {
  getReportForAdmin,
  getUserForAdmin,
  isAdmin,
  listReportsForAdmin,
  listUsersForAdmin,
  promoteUserToAdmin,
  requireAdmin,
} from '../../app/models/admin'
import { createReport } from '../../app/models/report'
import { createSessionUser } from '../harness/auth'
import { truncateAppTables } from '../harness/db'

describe('isAdmin', () => {
  test('true when role is admin', () => {
    assert.equal(isAdmin({ role: 'admin' }), true)
  })

  test('false when role is user or missing', () => {
    assert.equal(isAdmin({ role: 'user' }), false)
    assert.equal(isAdmin({ role: null }), false)
    assert.equal(isAdmin({}), false)
  })

  test('true when admin appears in comma-separated roles', () => {
    assert.equal(isAdmin({ role: 'user,admin' }), true)
  })
})

describe('requireAdmin', () => {
  test('throws when not admin', () => {
    assert.throws(() => requireAdmin({ role: 'user' }), /Admin required/)
  })

  test('returns user when admin', () => {
    const user = { id: '1', role: 'admin' }
    assert.equal(requireAdmin(user), user)
  })
})

describe('promoteUserToAdmin', () => {
  beforeEach(async () => {
    await truncateAppTables()
  })

  test('promotes existing user by email', async () => {
    const { user } = await createSessionUser({ email: 'to-admin@example.com' })
    const result = await promoteUserToAdmin('to-admin@example.com')
    assert.equal(result.status, 'promoted')
    assert.equal(result.userId, user.id)

    const listed = await listUsersForAdmin()
    const row = listed.find((u) => u.id === user.id)
    assert.ok(row)
    assert.equal(row.role, 'admin')
  })

  test('is idempotent when already admin', async () => {
    await createSessionUser({ email: 'again@example.com' })
    await promoteUserToAdmin('again@example.com')
    const second = await promoteUserToAdmin('again@example.com')
    assert.equal(second.status, 'already_admin')
  })

  test('rejects unknown email', async () => {
    await assert.rejects(() => promoteUserToAdmin('missing@example.com'), /User not found/)
  })
})

describe('admin directory queries', () => {
  beforeEach(async () => {
    await truncateAppTables()
  })

  test('listUsersForAdmin returns all users', async () => {
    await createSessionUser({ email: 'a@example.com', name: 'A' })
    await createSessionUser({ email: 'b@example.com', name: 'B' })
    const users = await listUsersForAdmin()
    assert.equal(users.length, 2)
    assert.ok(users.every((u) => u.email && u.name && u.role && u.createdAt))
  })

  test('getUserForAdmin returns detail fields', async () => {
    const { user } = await createSessionUser({ email: 'detail@example.com', name: 'Detail' })
    const row = await getUserForAdmin(user.id)
    assert.ok(row)
    assert.equal(row.email, 'detail@example.com')
    assert.equal(row.name, 'Detail')
    assert.equal(row.id, user.id)
  })

  test('listReportsForAdmin includes reports from all users', async () => {
    const a = await createSessionUser({ email: 'owner-a@example.com' })
    const b = await createSessionUser({ email: 'owner-b@example.com' })
    const reportA = await createReport(a.user.id, 'from-a')
    const reportB = await createReport(b.user.id, 'from-b')

    const rows = await listReportsForAdmin()
    assert.equal(rows.length, 2)
    const emails = new Set(rows.map((r) => r.userEmail))
    assert.ok(emails.has('owner-a@example.com'))
    assert.ok(emails.has('owner-b@example.com'))
    assert.ok(rows.some((r) => r.id === reportA.id))
    assert.ok(rows.some((r) => r.id === reportB.id))
  })

  test('getReportForAdmin returns payload and user email', async () => {
    const { user } = await createSessionUser({ email: 'report-owner@example.com' })
    const report = await createReport(user.id, 'secret-payload')
    const row = await getReportForAdmin(report.id)
    assert.ok(row)
    assert.equal(row.payload, 'secret-payload')
    assert.equal(row.userEmail, 'report-owner@example.com')
    assert.equal(row.userId, user.id)
  })
})
