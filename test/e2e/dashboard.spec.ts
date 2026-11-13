import { readFileSync } from 'node:fs'
import { expect, test } from '@playwright/test'

test('dashboard SSR + browser session posts/work APIs', async ({
  context,
  page,
}) => {
  const { applyTestEnv, databaseUrlFile, truncateAppTables } = await import(
    '../harness/db'
  )
  applyTestEnv(readFileSync(databaseUrlFile(), 'utf8').trim())

  const { createSessionUser, sessionCookiesForPlaywright } = await import(
    '../harness/auth'
  )
  const { createPost } = await import('../../app/models/post')
  await truncateAppTables()

  const { user } = await createSessionUser({
    email: 'e2e@example.com',
    name: 'E2E User',
  })
  const seeded = await createPost(user.id, {
    title: 'E2E post',
    body: 'hello',
  })
  const cookies = await sessionCookiesForPlaywright(user.id)
  await context.addCookies(cookies)

  await page.goto('/dashboard')
  await expect(page.getByText(user.email)).toBeVisible()
  await expect(page.getByText('E2E post')).toBeVisible()

  // Exercise dashboard APIs with the real session cookie (Base UI clicks are flaky).
  const created = await page.evaluate(async () => {
    const res = await fetch('/api/posts', {
      method: 'POST',
      credentials: 'include',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ title: 'E2E created', body: 'via fetch' }),
    })
    if (!res.ok) throw new Error(`create ${res.status}`)
    return res.json() as { id: string; title: string }
  })
  expect(created.title).toBe('E2E created')

  const deleted = await page.evaluate(async (id) => {
    const res = await fetch(`/api/posts/${id}`, {
      method: 'DELETE',
      credentials: 'include',
    })
    return res.status
  }, seeded.id)
  expect(deleted === 204 || deleted === 200).toBe(true)

  const work = await page.evaluate(async () => {
    const res = await fetch('/api/work', {
      method: 'POST',
      credentials: 'include',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ message: 'e2e shout' }),
    })
    if (!res.ok) throw new Error(`work ${res.status}`)
    return res.json() as {
      enqueued: boolean
      name: string
      jobId: string | null
    }
  })
  expect(work.enqueued).toBe(true)
  expect(work.name).toBe('shout')
  expect(work.jobId).toBeTruthy()

  await page.reload()
  await expect(page.getByText('E2E created')).toBeVisible()
  await expect(page.getByText('E2E post')).toHaveCount(0)
})
