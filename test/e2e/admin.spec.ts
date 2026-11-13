import { readFileSync } from 'node:fs'
import { expect, test } from '@playwright/test'

test('admin sees users + posts; non-admin gets 403', async ({ browser }) => {
  const { applyTestEnv, databaseUrlFile, truncateAppTables } = await import(
    '../harness/db'
  )
  applyTestEnv(readFileSync(databaseUrlFile(), 'utf8').trim())

  const { createSessionUser, sessionCookiesForPlaywright } = await import(
    '../harness/auth'
  )
  const { promoteUserToAdmin } = await import('../../app/models/admin')
  const { createPost } = await import('../../app/models/post')
  await truncateAppTables()

  const admin = await createSessionUser({
    email: 'admin-e2e@example.com',
    name: 'Admin E2E',
  })
  await promoteUserToAdmin(admin.user.email)
  await createPost(admin.user.id, {
    title: 'Admin listed post',
    body: 'body',
  })

  const member = await createSessionUser({
    email: 'member-e2e@example.com',
    name: 'Member E2E',
  })

  const adminContext = await browser.newContext()
  await adminContext.addCookies(await sessionCookiesForPlaywright(admin.user.id))
  const adminPage = await adminContext.newPage()

  await adminPage.goto('/admin/users')
  await expect(adminPage.getByRole('heading', { name: 'Users' })).toBeVisible()
  await expect(adminPage.getByText('admin-e2e@example.com')).toBeVisible()

  await adminPage.goto('/admin/posts')
  await expect(adminPage.getByRole('heading', { name: 'Posts' })).toBeVisible()
  await expect(adminPage.getByText('Admin listed post')).toBeVisible()
  await adminContext.close()

  const memberContext = await browser.newContext()
  await memberContext.addCookies(await sessionCookiesForPlaywright(member.user.id))
  const memberPage = await memberContext.newPage()

  const usersRes = await memberPage.goto('/admin/users')
  expect(usersRes?.status()).toBe(403)
  await expect(memberPage.getByText('Admin access required')).toBeVisible()

  const postsRes = await memberPage.goto('/admin/posts')
  expect(postsRes?.status()).toBe(403)
  await expect(memberPage.getByText('Admin access required')).toBeVisible()
  await memberContext.close()
})
