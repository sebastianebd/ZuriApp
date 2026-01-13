import { test, expect } from '@playwright/test'

test.describe('Shifts Management', () => {
  test.beforeEach(async ({ page }) => {
    // Login flow using helper
    const { login } = await import('./helpers/auth')
    await login(page)
  })

  test('should navigate to shifts view and check for filters', async ({ page }) => {
    await page.goto('/app/operaciones/turnos')
    await page.waitForLoadState('networkidle')

    // Check Header Text
    await expect(page.getByText('Grilla de Turnos')).toBeVisible({ timeout: 10000 })

    // Check Service Filter presence
    const serviceFilter = page.locator('.custom-v-select').first()
    await expect(serviceFilter).toBeVisible()
    await expect(page.getByPlaceholder('Filtrar por Servicio')).toBeVisible()
  })

  test('should open assignment modal and user selection', async ({ page }) => {
    await page.goto('/app/operaciones/turnos')
    await page.waitForLoadState('networkidle')

    // Open Assignment Modal
    await page.click('button:has-text("Asignar Planta")')
    await expect(page.getByText('Asignar Turno Planta')).toBeVisible()

    // Open User Selection Modal (Click on the placeholder area)
    // The placeholder has text: "Click para seleccionar funcionario"
    await page.click('text=Click para seleccionar funcionario')

    // Check User Selection Modal
    // The title of TurnAssignmentUserModal is "SELECCIONAR FUNCIONARIO (PLANTA)"
    await expect(page.getByText('SELECCIONAR FUNCIONARIO (PLANTA)')).toBeVisible()

    // Check if table rows exist or "No se encontraron" message
    await expect(page.locator('.modal-body table')).toBeVisible()
  })
})
