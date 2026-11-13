import assert from 'node:assert/strict'
import { beforeEach, describe, test } from 'node:test'
import {
  createPost,
  deletePostForUser,
  getPostForUser,
  listPostsForUser,
  updatePostForUser,
} from '../../app/models/post'
import { createSessionUser } from '../harness/auth'
import { truncateAppTables } from '../harness/db'

describe('post model', () => {
  beforeEach(async () => {
    await truncateAppTables()
  })

  test('createPost persists for user', async () => {
    const { user } = await createSessionUser({ email: 'post@example.com' })
    const post = await createPost(user.id, { title: '  Hello  ', body: ' body ' })
    assert.equal(post.title, 'Hello')
    assert.equal(post.body, 'body')
    assert.equal(post.userId, user.id)
    const listed = await listPostsForUser(user.id)
    assert.equal(listed.length, 1)
  })

  test('createPost rejects empty title', async () => {
    const { user } = await createSessionUser()
    await assert.rejects(() => createPost(user.id, { title: '   ' }), /Title required/)
  })

  test('update and delete scoped to owner', async () => {
    const owner = await createSessionUser({ email: 'owner@example.com' })
    const other = await createSessionUser({ email: 'other@example.com' })
    const post = await createPost(owner.user.id, { title: 'One', body: 'a' })

    const updated = await updatePostForUser(post.id, owner.user.id, {
      title: 'Two',
      body: 'b',
    })
    assert.ok(updated)
    assert.equal(updated.title, 'Two')

    assert.equal(await updatePostForUser(post.id, other.user.id, { title: 'Nope' }), null)
    assert.equal(await getPostForUser(post.id, other.user.id), null)

    assert.equal(await deletePostForUser(post.id, other.user.id), null)
    const deleted = await deletePostForUser(post.id, owner.user.id)
    assert.ok(deleted)
    assert.equal(await getPostForUser(post.id, owner.user.id), null)
  })
})
