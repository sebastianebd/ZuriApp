import { test, expect } from '@playwright/test'

test.describe('Profile View', () => {
  test.beforeEach(async ({ page }) => {
    // Capture browser logs (filtered)
    page.on('console', (msg) => {
      const text = msg.text()
      if (!text.includes('Sentry Logger')) {
        console.log(`BROWSER: ${text}`)
      }
    })
    // Capture network errors
    page.on('response', (response) => {
      if (response.status() >= 400) {
        console.log(`NETWORK ERROR: ${response.status()} ${response.url()}`)
      }
    })

    // Go to profile directly (storageState handles auth)
    await page.goto('/app/user')

    // Wait for the app to hydrate and router to settle
    try {
      await expect(page).toHaveURL(/.*\/user/, { timeout: 15000 })
      await page.waitForLoadState('networkidle')
      // Debug: Check if NavBar is present
      if ((await page.locator('nav').count()) === 0) {
        console.log('NavBar not found!')
        console.log('Current URL:', page.url())
        const storage = await page.evaluate(() => JSON.stringify(window.localStorage))
        console.log('LocalStorage:', storage)
      }
    } catch (e) {
      console.log('Navigation/Wait failed. Dumping body:')
      console.log(await page.content())
      throw e
    }
  })

  test('should display user profile information', async ({ page }) => {
    // Check for "Mi Perfil" title or equivalent header
    await expect(page.locator('h4', { hasText: 'Mi Perfil' })).toBeVisible()

    // Check for User Name (from Seed) - Case insensitive or partial match
    await expect(page.locator('h4', { hasText: /Admin/i })).toBeVisible()

    // Check for Role
    await expect(
      page.locator('.user-profile-view .text-muted', { hasText: 'ADMIN-TI' }).first()
    ).toBeVisible()

    // Check for Email
    // Check for Email
    await expect(page.locator('p.info-value', { hasText: 'admin@zuriapp.cl' })).toBeVisible()
  })

  test.afterEach(async ({ page }, testInfo) => {
    if (testInfo.status !== 'passed') {
      console.log(`Test failed: ${testInfo.title}`)
      console.log('Dumping body:')
      console.log(await page.content())
    }
  })

  test('should display statistics cards', async ({ page }) => {
    await expect(page.locator('h6', { hasText: 'Total Reemplazos' })).toBeVisible()
    await expect(page.locator('h6', { hasText: 'Este Mes' })).toBeVisible()
  })
})
