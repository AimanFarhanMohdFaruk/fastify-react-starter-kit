import assert from 'node:assert/strict'
import { Readable } from 'node:stream'
import { beforeEach, describe, test } from 'node:test'
import type { ObjectStore, PutObjectInput } from '../../app/object-store'
import { listDocumentsForUser } from '../../app/models/document'
import { sanitizeFilename, uploadDocument } from '../../app/services/upload-document'
import { createSessionUser } from '../harness/auth'
import { truncateAppTables } from '../harness/db'

function memoryStore() {
  const objects = new Map<string, Buffer>()
  const store: ObjectStore = {
    async ensureBucket() {},
    async putObject(input: PutObjectInput) {
      const chunks: Buffer[] = []
      if (typeof input.body === 'string') {
        objects.set(input.key, Buffer.from(input.body))
        return
      }
      if (Buffer.isBuffer(input.body) || input.body instanceof Uint8Array) {
        objects.set(input.key, Buffer.from(input.body))
        return
      }
      await new Promise<void>((resolve, reject) => {
        input.body.on('data', (c: Buffer) => chunks.push(c))
        input.body.on('end', () => {
          objects.set(input.key, Buffer.concat(chunks))
          resolve()
        })
        input.body.on('error', reject)
      })
    },
    async getObjectText(key) {
      const buf = objects.get(key)
      if (!buf) throw new Error('missing')
      return buf.toString('utf8')
    },
    async getObjectBytes(key) {
      const buf = objects.get(key)
      if (!buf) throw new Error('missing')
      return new Uint8Array(buf)
    },
  }
  return { store, objects }
}

describe('uploadDocument', () => {
  beforeEach(async () => {
    await truncateAppTables()
  })

  test('sanitizeFilename strips path segments', () => {
    assert.equal(sanitizeFilename('../../etc/passwd'), 'passwd')
    assert.equal(sanitizeFilename('a/b/notes.md'), 'notes.md')
  })

  test('streams bytes to object store, creates row, and parses text', async () => {
    const { user } = await createSessionUser({ email: 'upload-svc@example.com' })
    const { store, objects } = memoryStore()

    const doc = await uploadDocument(
      user.id,
      {
        filename: 'kit.md',
        contentType: 'text/markdown',
        body: Readable.from(['# Hello']),
      },
      { objectStore: store },
    )

    assert.equal(doc.status, 'ready')
    assert.equal(doc.extractedText, '# Hello')
    assert.equal(doc.filename, 'kit.md')
    assert.equal(doc.byteSize, Buffer.byteLength('# Hello'))
    assert.ok(doc.key.startsWith(`${user.id}/`))
    assert.equal(objects.get(doc.key)?.toString('utf8'), '# Hello')

    const listed = await listDocumentsForUser(user.id)
    assert.equal(listed.length, 1)
  })

  test('parses PDF via injected parsePdf', async () => {
    const { user } = await createSessionUser({ email: 'upload-pdf@example.com' })
    const { store } = memoryStore()

    const doc = await uploadDocument(
      user.id,
      {
        filename: 'spec.pdf',
        contentType: 'application/pdf',
        body: Readable.from([Buffer.from('%PDF-fake')]),
      },
      {
        objectStore: store,
        parsePdf: async () => ({ pages: [{ text: 'Page one' }, { text: 'Page two' }] }),
      },
    )

    assert.equal(doc.status, 'ready')
    assert.equal(doc.contentType, 'application/pdf')
    assert.equal(doc.extractedText, 'Page one\nPage two')
  })

  test('rejects disallowed content types', async () => {
    const { user } = await createSessionUser({ email: 'upload-bad@example.com' })
    const { store } = memoryStore()
    await assert.rejects(
      () =>
        uploadDocument(
          user.id,
          {
            filename: 'x.bin',
            contentType: 'application/octet-stream',
            body: Readable.from(['x']),
          },
          { objectStore: store },
        ),
      /Only text\/plain/,
    )
  })
})
