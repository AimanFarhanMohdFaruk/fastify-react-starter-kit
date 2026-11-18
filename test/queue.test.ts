import assert from 'node:assert/strict'
import { afterEach, beforeEach, describe, test } from 'node:test'
import { createDocument } from '../app/models/document'
import {
  setObjectStoreForTests,
  type ObjectStore,
  type PutObjectInput,
} from '../app/object-store'
import {
  createInlineAdapter,
  enqueue,
  isJobName,
  runJob,
  setQueueAdapter,
} from '../app/queue'
import { createSessionUser } from './harness/auth'
import { truncateAppTables } from './harness/db'

function memoryStore(): ObjectStore {
  const objects = new Map<string, Buffer>()
  return {
    async ensureBucket() {},
    async putObject(input: PutObjectInput) {
      if (typeof input.body === 'string') {
        objects.set(input.key, Buffer.from(input.body))
        return
      }
      if (Buffer.isBuffer(input.body) || input.body instanceof Uint8Array) {
        objects.set(input.key, Buffer.from(input.body))
        return
      }
      const chunks: Buffer[] = []
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
}

describe('queue handlers', () => {
  beforeEach(async () => {
    await truncateAppTables()
    setQueueAdapter(createInlineAdapter())
  })

  afterEach(() => {
    setQueueAdapter(null)
    setObjectStoreForTests(null)
  })

  test('isJobName accepts registered names only', () => {
    assert.equal(isJobName('shout'), true)
    assert.equal(isJobName('parse_document'), true)
    assert.equal(isJobName('nope'), false)
  })

  test('runJob shout returns shouted message', async () => {
    const result = await runJob('shout', { message: 'ping' })
    assert.deepEqual(result, { shouted: 'ping' })
  })

  test('enqueue via inline adapter runs shout and records', async () => {
    const adapter = createInlineAdapter()
    setQueueAdapter(adapter)
    await enqueue('shout', { message: 'bus' })
    assert.equal(adapter.recording.length, 1)
    assert.equal(adapter.recording[0].name, 'shout')
  })

  test('runJob parse_document marks document ready', async () => {
    const store = memoryStore()
    setObjectStoreForTests(store)

    const { user } = await createSessionUser({ email: 'queue-parse@example.com' })
    const doc = await createDocument({
      userId: user.id,
      key: `${user.id}/q.txt`,
      filename: 'q.txt',
      contentType: 'text/plain',
      byteSize: 8,
    })
    await store.putObject({
      key: doc.key,
      body: 'from-job',
      contentType: 'text/plain',
    })

    const result = await runJob('parse_document', { documentId: doc.id })
    assert.ok(result && 'status' in result)
    assert.equal(result.status, 'ready')
    assert.equal(result.extractedText, 'from-job')
  })
})
