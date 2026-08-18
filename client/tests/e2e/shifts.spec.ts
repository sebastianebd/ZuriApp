import { test, expect } from '@playwright/test'

test.describe('Shifts Management', () => {
  test.beforeEach(async ({ page }) => {
    // Login flow using helper
    const { login } = await import('./helpers/auth')
    await login(page)
  })

  test('should navigate to shifts view and check basic elements', async ({ page }) => {
    await page.goto('/app/operaciones/turnos')
    await page.waitForLoadState('networkidle')

    // Check Header Text
    await expect(page.getByText('Grilla de Turnos')).toBeVisible({ timeout: 10000 })

    // Check Service Filter presence (v-select component)
    const serviceFilter = page.locator('.custom-v-select').first()
    await expect(serviceFilter).toBeVisible()

    // Check "Asignar Planta" button is visible
    await expect(page.getByRole('button', { name: /Asignar Planta/i })).toBeVisible()
  })

  test('should open assignment modal with v-select user field', async ({ page }) => {
    await page.goto('/app/operaciones/turnos')
    await page.waitForLoadState('networkidle')

    // Open Assignment Modal
    await page.click('button:has-text("Asignar Planta")')
    await expect(page.getByText('Asignar Turno Planta')).toBeVisible()

    // Check that the user selection v-select is visible
    // The component uses class "IStaff-select-planta"
    const userSelect = page.locator('.IStaff-select-planta')
    await expect(userSelect).toBeVisible({ timeout: 5000 })

    // Verify the label is present
    await expect(page.getByText('Funcionario (PLANTA)')).toBeVisible()

    // Check for Service field (use exact match to avoid sidebar link)
    await expect(page.getByText('Servicio', { exact: true })).toBeVisible()

    // Check for Turn Type field
    await expect(page.getByText('Tipo de Turno')).toBeVisible()

    // Check for Date fields
    await expect(page.getByText('Fecha Inicio')).toBeVisible()
    await expect(page.getByText('Fecha Término')).toBeVisible()
  })
})
