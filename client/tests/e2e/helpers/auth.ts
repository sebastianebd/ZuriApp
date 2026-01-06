import { Page } from '@playwright/test'

/**
 * Performs login and waits for successful authentication
 */
export async function login(page: Page) {
  // Navigate to login page
  await page.goto('/')
  await page.waitForLoadState('networkidle')

  // Fill credentials
  await page.fill('#rut', '12345678-5')
  await page.fill('input[type="password"]', '2716xD!')

  // Click login button
  await page.click('button[type="submit"]')

  // Wait for successful redirect away from login page
  await page.waitForURL(/\/app/, { timeout: 15000 })

  // Wait for auth to be fully ready in sessionStorage
  await page.waitForFunction(
    () => {
      const auth = sessionStorage.getItem('auth')
      if (!auth) return false
      try {
        const parsed = JSON.parse(auth)
        return !!parsed.accessToken && !!parsed.authReady
      } catch {
        return false
      }
    },
    null,
    { timeout: 10000 }
  )
}
