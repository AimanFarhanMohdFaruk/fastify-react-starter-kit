import assert from 'node:assert/strict'
import { beforeEach, describe, test } from 'node:test'
import { createPost } from '../../app/models/post'
import { buildApiApp } from '../harness/app'
import { createSessionUser } from '../harness/auth'
import { truncateAppTables } from '../harness/db'

describe('/api/posts', () => {
  beforeEach(async () => {
    await truncateAppTables()
  })

  test('GET returns 401 without session', async () => {
    const app = await buildApiApp()
    const res = await app.inject({ method: 'GET', url: '/api/posts' })
    assert.equal(res.statusCode, 401)
    await app.close()
  })

  test('CRUD for session user', async () => {
    const { user, headers } = await createSessionUser({
      email: 'api-post@example.com',
    })
    const cookie = headers.get('cookie')
    assert.ok(cookie)

    const app = await buildApiApp()

    const created = await app.inject({
      method: 'POST',
      url: '/api/posts',
      headers: { cookie, 'content-type': 'application/json' },
      payload: { title: 'Hello', body: 'world' },
    })
    assert.equal(created.statusCode, 201, created.body)
    const post = created.json() as { id: string; title: string; body: string }
    assert.equal(post.title, 'Hello')
    assert.equal(post.body, 'world')

    const listed = await app.inject({
      method: 'GET',
      url: '/api/posts',
      headers: { cookie },
    })
    assert.equal(listed.statusCode, 200)
    assert.equal(listed.json().length, 1)

    const shown = await app.inject({
      method: 'GET',
      url: `/api/posts/${post.id}`,
      headers: { cookie },
    })
    assert.equal(shown.statusCode, 200)
    assert.equal(shown.json().id, post.id)

    const patched = await app.inject({
      method: 'PATCH',
      url: `/api/posts/${post.id}`,
      headers: { cookie, 'content-type': 'application/json' },
      payload: { title: 'Updated' },
    })
    assert.equal(patched.statusCode, 200)
    assert.equal(patched.json().title, 'Updated')
    assert.equal(patched.json().body, 'world')

    const foreign = await createSessionUser({ email: 'foreign@example.com' })
    const foreignCookie = foreign.headers.get('cookie')
    assert.ok(foreignCookie)
    const denied = await app.inject({
      method: 'GET',
      url: `/api/posts/${post.id}`,
      headers: { cookie: foreignCookie },
    })
    assert.equal(denied.statusCode, 404)

    // ensure model row still owned by original user
    const owned = await createPost(user.id, { title: 'extra' })
    assert.ok(owned)

    const deleted = await app.inject({
      method: 'DELETE',
      url: `/api/posts/${post.id}`,
      headers: { cookie },
    })
    assert.equal(deleted.statusCode, 204)

    await app.close()
  })
})
