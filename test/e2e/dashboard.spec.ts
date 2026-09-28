import { readFileSync } from 'node:fs'
import { expect, test } from '@playwright/test'

test('authenticated user sees dashboard email', async ({ context, page }) => {
  const { applyTestEnv, databaseUrlFile, truncateAppTables } = await import(
    '../harness/db'
  )
  applyTestEnv(readFileSync(databaseUrlFile(), 'utf8').trim())

  const { createSessionUser, sessionCookiesForPlaywright } = await import(
    '../harness/auth'
  )
  await truncateAppTables()

  const { user } = await createSessionUser({
    email: 'e2e@example.com',
    name: 'E2E User',
  })
  const cookies = await sessionCookiesForPlaywright(user.id)
  await context.addCookies(cookies)

  await page.goto('/dashboard')
  await expect(page.getByText(user.email)).toBeVisible()
})
