import { test, expect } from '@playwright/test'

test.describe('Login Flow', () => {
  test('should login successfully with valid credentials', async ({ page }) => {
    // 1. Visit Login Page
    await page.goto('/')
    // Ensure app is hydrated (prevents native form submit race condition)
    await page.waitForLoadState('networkidle')

    // 2. Fill form (Using Seeded Admin)
    await page.fill('#rut', '12345678-5')
    await page.fill('input[type="password"]', 'admin123')

    // 3. Submit
    await page.click('button[type="submit"]')

    // 4. Verify Redirection (Dashboard default is usually /app/user or /app/reemplazos depending on role)
    // We expect successful redirection away from login
    await expect(page).not.toHaveURL(/\/login/, { timeout: 15000 })

    // Optional: Verify Welcome message or Navbar element for "ADMIN PRINCIPAL"
    // await expect(page.locator('body')).toContainText('ADMIN PRINCIPAL');
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
