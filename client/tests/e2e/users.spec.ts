import { test, expect } from '@playwright/test'

test.describe('User Management', () => {
  test.beforeEach(async ({ page }) => {
    // Login as Admin before each test
    await page.goto('/login')
    await page.fill('input[type="text"]', '11596065-2')
    await page.fill('input[type="password"]', 'password123')
    await page.click('button[type="submit"]')
    await expect(page).toHaveURL('/')
  })

  test('should navigate to Users page', async ({ page }) => {
    // Navigate to Users
    await page.click('a[href="/usuarios"]') // Adjust selector based on Sidebar
    await expect(page).toHaveURL('/usuarios')
    await expect(page.locator('h1')).toContainText('Gestión de Usuarios')
  })

  test('should open Create User modal', async ({ page }) => {
    await page.goto('/usuarios')
    await page.click('button.btn-primary') // "Nuevo Usuario" button
    await expect(page.locator('.modal')).toBeVisible()
    await expect(page.locator('.modal-title')).toContainText('Registrar Nuevo Usuario')
  })
})
