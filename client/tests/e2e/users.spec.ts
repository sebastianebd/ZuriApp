import { test, expect } from '@playwright/test'
import { generateRut } from '@fdograph/rut-utilities'

test.describe('User Management', () => {
  test.beforeEach(async ({ page }) => {
    // Login before each test
    const { login } = await import('./helpers/auth')
    await login(page)

    // Navigate to users page
    await page.goto('/app/personal/staff')
    await page.waitForLoadState('networkidle')
  })

  test('should navigate to Users page', async ({ page }) => {
    await page.locator('a[title="Funcionarios"]').click()
    await expect(page).toHaveURL(/personal\/staff/)
    await expect(page.locator('h4:has-text("Gestión de Usuarios")')).toBeVisible()
  })

  test('should open Create User modal', async ({ page }) => {
    await page.goto('/app/personal/staff')
    const createBtn = page.locator('button', { hasText: 'Crear Usuario' })
    await createBtn.waitFor({ state: 'visible', timeout: 10000 })
    await createBtn.click()
    await expect(page.locator('.modal')).toBeVisible()
    await expect(page.locator('.modal-title')).toContainText(/Nuevo Usuario/i)
  })
  test('should create a new user', async ({ page }) => {
    await page.goto('/app/personal/staff')
    await page.waitForLoadState('networkidle') // Wait for all network requests including options
    await page.waitForTimeout(500) // Small buffer for Firefox

    const createBtn = page.getByRole('button', { name: 'Crear Usuario' })
    await createBtn.waitFor({ state: 'visible', timeout: 10000 })
    await createBtn.click()
    await expect(page.locator('.modal-title')).toContainText('Nuevo Usuario')
    await page.evaluate(() => {
      const modals = document.querySelectorAll('.modal.show')
      if (modals.length > 1) {
        for (let i = 1; i < modals.length; i++) {
          modals[i].remove()
        }
      }
    })

    const validRut = generateRut()

    const activeModal = page.locator('.modal.show').filter({ hasText: 'Nuevo Usuario' }).first()
    await expect(activeModal).toBeVisible()

    const rutInput = activeModal.getByPlaceholder('12.345.678-9')
    await rutInput.click()
    await rutInput.fill(validRut)
    await rutInput.blur()
    await activeModal.getByPlaceholder('Ej: Sebastián').fill('Sebastian')
    await activeModal.getByPlaceholder('Ej: Barría').fill('Echeverria')
    await activeModal.getByPlaceholder('correo@ejemplo.com').fill(`e2e-${Date.now()}@test.com`)

    // Generate unique Chilean phone number (9 + 8 random digits)
    const randomPhone = '9' + Math.floor(10000000 + Math.random() * 90000000).toString()
    await activeModal.getByPlaceholder('912345678').fill(randomPhone)
    await activeModal.getByPlaceholder('Calle, Número').fill('Calle Falsa 123')
    await activeModal.getByPlaceholder('Ej: Santiago').fill('Santiago')
    const fechaInput = activeModal.getByPlaceholder('Seleccione fecha')
    await fechaInput.click()
    // Wait for v-calendar popover
    await page.locator('.vc-popover-content').waitFor({ state: 'visible', timeout: 5000 })
    // Click a specific day (e.g., 15)
    await page.locator('.vc-popover-content .vc-day-content').filter({ hasText: /^15$/ }).first().click()
    await page.waitForTimeout(300)
    await page.waitForTimeout(300)

    const selectCargo = activeModal
      .getByText('Cargo Físico (Position)')
      .locator('..')
      .getByRole('combobox')
    await selectCargo.click({ force: true })
    await page.waitForSelector('.vs__dropdown-menu', { state: 'visible', timeout: 5000 })
    const cargoOption = activeModal.locator('.vs__dropdown-option').first()
    await cargoOption.waitFor({ state: 'visible' })
    await cargoOption.click()

    const selectRole = activeModal
      .getByText('Rol (Perfil de Acceso)')
      .locator('..')
      .getByRole('combobox')
    await selectRole.click({ force: true })
    await page.waitForSelector('.vs__dropdown-menu', { state: 'visible', timeout: 5000 })
    const roleOption = activeModal.locator('.vs__dropdown-option').first()
    await roleOption.waitFor({ state: 'visible' })
    await roleOption.click()

    const selectContrato = activeModal
      .getByText(/^Tipo Contrato$/)
      .locator('..')
      .getByRole('combobox')
    await selectContrato.click({ force: true })
    await page.waitForSelector('.vs__dropdown-menu', { state: 'visible', timeout: 5000 })
    const contratoOption = activeModal.locator('.vs__dropdown-option').first()
    await contratoOption.waitFor({ state: 'visible' })
    await contratoOption.click()

    // Habilitado is now a switch, assert its state
    await expect(activeModal.getByText('Habilitado', { exact: true })).toBeVisible()
    await page.waitForTimeout(500)

    const saveBtn = activeModal.getByRole('button', { name: /Guardar Usuario/i })
    await saveBtn.click()

    // Wait for Confirmation Modal
    const confirmModalTitle = page.getByText('Confirmar Acción', { exact: true })
    await expect(confirmModalTitle).toBeVisible({ timeout: 5000 })
    await expect(page.getByText('¿Seguro que deseas crear este usuario?')).toBeVisible()

    const responsePromise = page.waitForResponse(
      (resp) =>
        resp.request().method() === 'POST' &&
        (resp.url().includes('/users') || resp.url().includes('/api/users') || resp.url().includes('/staff'))
    )

    // Click "Sí, Continuar"
    await page.getByRole('button', { name: 'Sí, Continuar' }).click()

    const resp = await responsePromise
    if (!resp.ok()) {
      console.error('API Error:', resp.status(), await resp.text())
    }
    expect(resp.ok()).toBeTruthy()
    await expect(page.getByText('¿Seguro que deseas crear este usuario?')).not.toBeVisible({
      timeout: 10000
    })

    await expect(page.locator('.modal')).not.toBeVisible({ timeout: 10000 })
  })
})
