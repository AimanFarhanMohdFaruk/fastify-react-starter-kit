import assert from 'node:assert/strict'
import { afterEach, beforeEach, describe, test } from 'node:test'
import type { ObjectStore, PutObjectInput } from '../../app/object-store'
import { setObjectStoreForTests } from '../../app/object-store'
import { buildApiApp } from '../harness/app'
import { createSessionUser } from '../harness/auth'
import { truncateAppTables } from '../harness/db'

function memoryStore(): ObjectStore {
  const objects = new Map<string, Buffer>()
  return {
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
}

function multipartPayload(filename: string, contentType: string, body: string) {
  const boundary = '----TestBoundary7MA4YWxkTrZu0gW'
  const payload = [
    `--${boundary}`,
    `Content-Disposition: form-data; name="file"; filename="${filename}"`,
    `Content-Type: ${contentType}`,
    '',
    body,
    `--${boundary}--`,
    '',
  ].join('\r\n')
  return {
    payload,
    contentType: `multipart/form-data; boundary=${boundary}`,
  }
}

describe('/api/documents', () => {
  beforeEach(async () => {
    await truncateAppTables()
    setObjectStoreForTests(memoryStore())
  })

  afterEach(() => {
    setObjectStoreForTests(null)
  })

  test('POST returns 401 without session', async (t) => {
    const app = await buildApiApp()
    t.after(() => app.close())
    const { payload, contentType } = multipartPayload('a.txt', 'text/plain', 'hi')
    const res = await app.inject({
      method: 'POST',
      url: '/api/documents',
      headers: { 'content-type': contentType },
      payload,
    })
    assert.equal(res.statusCode, 401)
  })

  test('upload list and get own document', async (t) => {
    const { headers } = await createSessionUser({ email: 'api-doc@example.com' })
    const cookie = headers.get('cookie')
    assert.ok(cookie)

    const app = await buildApiApp()
    t.after(() => app.close())

    const { payload, contentType } = multipartPayload('notes.md', 'text/markdown', '# Kit')
    const created = await app.inject({
      method: 'POST',
      url: '/api/documents',
      headers: { cookie, 'content-type': contentType },
      payload,
    })
    assert.equal(created.statusCode, 201, created.body)
    const doc = created.json() as {
      id: string
      filename: string
      status: string
      byteSize: number
    }
    assert.equal(doc.filename, 'notes.md')
    assert.equal(doc.status, 'ready')
    assert.equal(doc.byteSize, Buffer.byteLength('# Kit'))

    const listed = await app.inject({
      method: 'GET',
      url: '/api/documents',
      headers: { cookie },
    })
    assert.equal(listed.statusCode, 200)
    const listBody = listed.json() as Array<{ id: string }>
    assert.equal(listBody.length, 1)
    assert.equal(listBody[0].id, doc.id)

    const got = await app.inject({
      method: 'GET',
      url: `/api/documents/${doc.id}`,
      headers: { cookie },
    })
    assert.equal(got.statusCode, 200)
    assert.equal((got.json() as { id: string }).id, doc.id)
  })

  test('GET returns 404 for foreign document', async (t) => {
    const owner = await createSessionUser({ email: 'doc-api-owner@example.com' })
    const other = await createSessionUser({ email: 'doc-api-other@example.com' })
    const ownerCookie = owner.headers.get('cookie')
    const otherCookie = other.headers.get('cookie')
    assert.ok(ownerCookie && otherCookie)

    const app = await buildApiApp()
    t.after(() => app.close())

    const { payload, contentType } = multipartPayload('secret.txt', 'text/plain', 'nope')
    const created = await app.inject({
      method: 'POST',
      url: '/api/documents',
      headers: { cookie: ownerCookie, 'content-type': contentType },
      payload,
    })
    assert.equal(created.statusCode, 201)
    const doc = created.json() as { id: string }

    const got = await app.inject({
      method: 'GET',
      url: `/api/documents/${doc.id}`,
      headers: { cookie: otherCookie },
    })
    assert.equal(got.statusCode, 404)
  })
})
