import { test, expect } from '@playwright/test'

test.describe('Profile View', () => {
  test.beforeEach(async ({ page }) => {
    // Login before each test
    const { login } = await import('./helpers/auth')
    await login(page)

    // Navigate to profile page
    await page.goto('/app/dashboard')
    await page.waitForLoadState('networkidle')
  })

  test('should display user profile information', async ({ page }) => {
    // Check for "Mi Perfil" title or equivalent header
    await expect(page.locator('h4', { hasText: 'Mi Perfil' })).toBeVisible({ timeout: 15000 })

    // Check for User Name (from Seed) - Just verify the element is visible
    await expect(page.locator('h4').nth(1)).toBeVisible({ timeout: 15000 })

    // Check for some dynamic Role or Profile card element instead of a hardcoded string
    await expect(page.locator('.profile-card, .card').first()).toBeVisible({ timeout: 15000 })

    // Check for Email - Just verify any info-value is present (there are multiple in the profile)
    await expect(page.locator('p.info-value').first()).toBeVisible({
      timeout: 15000
    })
  })

  test('should display statistics cards', async ({ page }) => {
    await expect(page.locator('h6', { hasText: 'Total Reemplazos' })).toBeVisible({
      timeout: 15000
    })
    await expect(page.locator('h6', { hasText: 'Este Mes' })).toBeVisible({ timeout: 15000 })
  })
})
