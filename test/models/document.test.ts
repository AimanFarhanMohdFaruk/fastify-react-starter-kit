import assert from 'node:assert/strict'
import { beforeEach, describe, test } from 'node:test'
import {
  createDocument,
  getDocumentForUser,
  listDocumentsForUser,
} from '../../app/models/document'
import { createSessionUser } from '../harness/auth'
import { truncateAppTables } from '../harness/db'

describe('document model', () => {
  beforeEach(async () => {
    await truncateAppTables()
  })

  test('createDocument persists uploaded metadata for user', async () => {
    const { user } = await createSessionUser({ email: 'doc-model@example.com' })
    const doc = await createDocument({
      userId: user.id,
      key: `${user.id}/abc-notes.md`,
      filename: 'notes.md',
      contentType: 'text/markdown',
      byteSize: 42,
    })
    assert.equal(doc.status, 'uploaded')
    assert.equal(doc.userId, user.id)
    assert.equal(doc.filename, 'notes.md')
    assert.equal(doc.byteSize, 42)
    assert.equal(doc.extractedText, null)

    const listed = await listDocumentsForUser(user.id)
    assert.equal(listed.length, 1)
    assert.equal(listed[0].id, doc.id)
  })

  test('getDocumentForUser returns null for foreign user', async () => {
    const owner = await createSessionUser({ email: 'doc-owner@example.com' })
    const other = await createSessionUser({ email: 'doc-other@example.com' })
    const doc = await createDocument({
      userId: owner.user.id,
      key: `${owner.user.id}/x-secret.txt`,
      filename: 'secret.txt',
      contentType: 'text/plain',
      byteSize: 3,
    })

    assert.equal((await getDocumentForUser(doc.id, owner.user.id))?.id, doc.id)
    assert.equal(await getDocumentForUser(doc.id, other.user.id), null)
  })

  test('createDocument rejects empty filename', async () => {
    const { user } = await createSessionUser()
    await assert.rejects(
      () =>
        createDocument({
          userId: user.id,
          key: 'k',
          filename: '  ',
          contentType: 'text/plain',
          byteSize: 1,
        }),
      /Filename required/,
    )
  })
})
