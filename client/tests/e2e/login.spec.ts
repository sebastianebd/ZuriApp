import { test, expect } from '@playwright/test'

test.describe('Login Flow', () => {
  test('should login successfully with valid credentials', async ({ page }) => {
    // 1. Visit Login Page
    await page.goto('/')
    // Ensure app is hydrated (prevents native form submit race condition)
    await page.waitForLoadState('networkidle')

    // 2. Fill form
    await page.fill('input[type="text"]', '11596065-2') // Use a valid test user RUT
    await page.fill('input[type="password"]', '9f4e14') // Assume this is a test password

    // 3. Submit
    await page.click('button[type="submit"]')

    // 4. Verify Redirection (Dashboard or similar)
    // Note: Adjust URL based on actual redirect - /app/user is the default landing
    await expect(page).toHaveURL(/\/app\/user/, { timeout: 15000 })

    // 5. Verify User name in Navbar (using the new logging logic as reference)
    // await expect(page.locator('.navbar')).toContainText('ENRIQUE DIAZ');
  })

  test('should show error with invalid credentials', async ({ page }) => {
    await page.goto('/')
    await page.fill('input[type="text"]', '12345678-9')
    await page.fill('input[type="password"]', 'wrongpassword')
    await page.click('button[type="submit"]')

    // Verify error toast or message
    // Adjust selector based on your UI library (e.g., swal2-popup)
    // await expect(page.locator('.swal2-title')).toContainText('Error');
  })
})
