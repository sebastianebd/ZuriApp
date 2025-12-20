import { test, expect } from '@playwright/test'

test.describe('User Management', () => {
  test.beforeEach(async ({ page }) => {
    // Login as Admin before each test
    await page.goto('/')
    // Ensure app is hydrated (prevents native form submit race condition)
    await page.waitForLoadState('networkidle')
    await page.fill('input[type="text"]', '11596065-2')
    await page.fill('input[type="password"]', '9f4e14')
    await page.click('button[type="submit"]')
    // Verify successful login by checking redirect to /app/user
    // Increased timeout for slower environments/browsers
    await expect(page).toHaveURL(/\/app\/user/, { timeout: 15000 })
  })

  test('should navigate to Users page', async ({ page }) => {
    // Navigate using title attribute which is safer (works even if collapsed)
    await page.locator('a[title="Usuarios"]').click()
    await expect(page).toHaveURL(/ver_usuarios/)
    await expect(page.locator('h4:has-text("Gestión de Usuarios")')).toBeVisible()
  })

  test('should open Create User modal', async ({ page }) => {
    // Direct navigation is safer for this specific test
    await page.goto('/app/ver_usuarios')

    // Wait for the button to be attached to DOM
    const createBtn = page.locator('button', { hasText: 'Crear Usuario' })
    await createBtn.waitFor({ state: 'visible', timeout: 10000 })
    await createBtn.click()

    await expect(page.locator('.modal')).toBeVisible()
    // Match uppercase text found in UI
    await expect(page.locator('.modal-title')).toContainText(/CREAR NUEVO USUARIO/i)
  })
})
