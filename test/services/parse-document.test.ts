import assert from 'node:assert/strict'
import { beforeEach, describe, test } from 'node:test'
import { createDocument } from '../../app/models/document'
import type { ObjectStore } from '../../app/object-store'
import { parseDocument } from '../../app/services/parse-document'
import { createSessionUser } from '../harness/auth'
import { truncateAppTables } from '../harness/db'

describe('parseDocument', () => {
  beforeEach(async () => {
    await truncateAppTables()
  })

  test('marks text docs ready with extracted text', async () => {
    const { user } = await createSessionUser({ email: 'parse-text@example.com' })
    const doc = await createDocument({
      userId: user.id,
      key: `${user.id}/a.txt`,
      filename: 'a.txt',
      contentType: 'text/plain',
      byteSize: 5,
    })

    const store: ObjectStore = {
      async ensureBucket() {},
      async putObject() {},
      async getObjectText() {
        return 'hello'
      },
      async getObjectBytes() {
        return new Uint8Array()
      },
    }

    const parsed = await parseDocument(doc, { objectStore: store })
    assert.equal(parsed.status, 'ready')
    assert.equal(parsed.extractedText, 'hello')
  })

  test('marks PDF ready using parsePdf', async () => {
    const { user } = await createSessionUser({ email: 'parse-pdf@example.com' })
    const doc = await createDocument({
      userId: user.id,
      key: `${user.id}/a.pdf`,
      filename: 'a.pdf',
      contentType: 'application/pdf',
      byteSize: 10,
    })

    const store: ObjectStore = {
      async ensureBucket() {},
      async putObject() {},
      async getObjectText() {
        return ''
      },
      async getObjectBytes() {
        return new Uint8Array([1, 2, 3])
      },
    }

    const parsed = await parseDocument(doc, {
      objectStore: store,
      parsePdf: async () => ({ pages: [{ text: 'From PDF' }] }),
    })
    assert.equal(parsed.status, 'ready')
    assert.equal(parsed.extractedText, 'From PDF')
  })

  test('marks failed when store throws', async () => {
    const { user } = await createSessionUser({ email: 'parse-fail@example.com' })
    const doc = await createDocument({
      userId: user.id,
      key: `${user.id}/missing.txt`,
      filename: 'missing.txt',
      contentType: 'text/plain',
      byteSize: 1,
    })

    const store: ObjectStore = {
      async ensureBucket() {},
      async putObject() {},
      async getObjectText() {
        throw new Error('missing')
      },
      async getObjectBytes() {
        throw new Error('missing')
      },
    }

    const parsed = await parseDocument(doc, { objectStore: store })
    assert.equal(parsed.status, 'failed')
    assert.equal(parsed.extractedText, null)
  })
})
