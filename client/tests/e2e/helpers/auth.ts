import { Page, expect } from '@playwright/test'

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
  // Click login button and wait for the API response
  // We accept any status here to fail fast if it's not 200, instead of waiting for timeout
  const loginResponsePromise = page.waitForResponse((resp) =>
    resp.url().includes('/api/auth/login')
  )
  await page.click('button[type="submit"]')
  const response = await loginResponsePromise

  if (response.status() !== 200) {
    console.error(`Login failed with status ${response.status()}`)
  }
  expect(response.status()).toBe(200)

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
