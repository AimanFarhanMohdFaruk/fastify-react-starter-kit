import assert from 'node:assert/strict'
import { Readable } from 'node:stream'
import { afterEach, beforeEach, describe, test } from 'node:test'
import type { ObjectStore, PutObjectInput } from '../../app/object-store'
import { setObjectStoreForTests } from '../../app/object-store'
import { listDocumentsForUser } from '../../app/models/document'
import {
  createInlineAdapter,
  setQueueAdapter,
} from '../../app/queue'
import { parseDocument } from '../../app/services/parse-document'
import {
  sanitizeFilename,
  uploadDocument,
  UploadDocumentError,
} from '../../app/services/upload-document'
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
    setQueueAdapter(createInlineAdapter())
  })

  afterEach(() => {
    setQueueAdapter(null)
    setObjectStoreForTests(null)
  })

  test('sanitizeFilename strips path segments', () => {
    assert.equal(sanitizeFilename('../../etc/passwd'), 'passwd')
    assert.equal(sanitizeFilename('a/b/notes.md'), 'notes.md')
  })

  test('streams bytes, enqueues parse via inline adapter, marks ready', async () => {
    const { user } = await createSessionUser({ email: 'upload-svc@example.com' })
    const { store, objects } = memoryStore()
    setObjectStoreForTests(store)

    const doc = await uploadDocument(
      user.id,
      {
        filename: 'kit.md',
        contentType: 'text/markdown',
        body: Readable.from(['# Hello']),
      },
      { objectStore: store },
    )

    assert.equal(doc.status, 'uploaded')
    const listed = await listDocumentsForUser(user.id)
    assert.equal(listed.length, 1)
    assert.equal(listed[0].status, 'ready')
    assert.equal(listed[0].extractedText, '# Hello')
    assert.equal(listed[0].filename, 'kit.md')
    assert.equal(listed[0].byteSize, Buffer.byteLength('# Hello'))
    assert.ok(listed[0].key.startsWith(`${user.id}/`))
    assert.equal(objects.get(listed[0].key)?.toString('utf8'), '# Hello')
  })

  test('PDF parse with injected parsePdf after upload-only', async () => {
    const { user } = await createSessionUser({ email: 'upload-pdf@example.com' })
    const { store } = memoryStore()

    const doc = await uploadDocument(
      user.id,
      {
        filename: 'spec.pdf',
        contentType: 'application/pdf',
        body: Readable.from([Buffer.from('%PDF-fake')]),
      },
      { objectStore: store, enqueueParse: false },
    )

    assert.equal(doc.status, 'uploaded')
    assert.equal(doc.contentType, 'application/pdf')

    const ready = await parseDocument(
      { documentId: doc.id },
      {
        objectStore: store,
        parsePdf: async () => ({
          pages: [{ text: 'Page one' }, { text: 'Page two' }],
        }),
      },
    )
    assert.equal(ready.status, 'ready')
    assert.equal(ready.extractedText, 'Page one\nPage two')
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
          { objectStore: store, enqueueParse: false },
        ),
      (err: unknown) =>
        err instanceof UploadDocumentError && err.kind === 'unsupported_type',
    )
  })
})
