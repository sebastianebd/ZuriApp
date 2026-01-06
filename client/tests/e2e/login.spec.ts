import { test, expect } from '@playwright/test'

test.describe('Login Flow', () => {
  test.beforeEach(async ({ page, context }) => {
    // Clear all storage before each test to ensure clean state
    await context.clearCookies()
    await page.goto('/')
    await page.evaluate(() => {
      sessionStorage.clear()
      localStorage.clear()
    })
  })

  test('should login successfully with valid credentials', async ({ page }) => {
    await page.goto('/')
    await page.waitForLoadState('networkidle')

    await page.fill('#rut', '12345678-5')
    await page.fill('input[type="password"]', '2716xD!')

    await page.click('button[type="submit"]')

    // Verify redirection away from login
    await expect(page).not.toHaveURL(/\/$/, { timeout: 15000 })

    // Verify user name appears in navbar (indicates successful login and layout change)
    await expect(page.locator('nav')).toContainText('ADMIN PRINCIPAL', {
      timeout: 10000
    })
  })

  test('should show error with invalid credentials', async ({ page }) => {
    await page.goto('/')
    await page.waitForLoadState('networkidle')

    // Use a RUT that doesn't exist in the database
    await page.fill('#rut', '99999999-9')
    await page.fill('input[type="password"]', 'wrongpassword')

    await page.click('button[type="submit"]')

    // Verify we stay on login page (root path)
    await expect(page).toHaveURL(/\/$/, { timeout: 5000 })

    // Verify error message appears
    const errorMessage = page.locator('.text-danger').last()
    await expect(errorMessage).toBeVisible({ timeout: 5000 })
  })
})
