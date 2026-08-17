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

    // Check for User Name (from Seed) - Case insensitive or partial match
    await expect(page.locator('h4', { hasText: /Admin/i })).toBeVisible({ timeout: 15000 })

    // Check for Role
    await expect(page.locator('main').getByText('INFORMATICA')).toBeVisible({
      timeout: 15000
    })

    // Check for Email
    await expect(page.locator('p.info-value', { hasText: 'admin@zuriapp.cl' })).toBeVisible({
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
