import { test, expect } from '@playwright/test'
import { generateRut } from '@fdograph/rut-utilities'

test.describe('User Management', () => {
  test.beforeEach(async ({ page }) => {
    // Login before each test
    const { login } = await import('./helpers/auth')
    await login(page)

    // Navigate to users page
    await page.goto('/app/personal/funcionarios')
    await page.waitForLoadState('networkidle')
  })

  test('should navigate to Users page', async ({ page }) => {
    await page.locator('a[title="Funcionarios"]').click()
    await expect(page).toHaveURL(/personal\/funcionarios/)
    await expect(page.locator('h4:has-text("Gestión de Usuarios")')).toBeVisible()
  })

  test('should open Create User modal', async ({ page }) => {
    await page.goto('/app/personal/funcionarios')
    const createBtn = page.locator('button', { hasText: 'Crear Usuario' })
    await createBtn.waitFor({ state: 'visible', timeout: 10000 })
    await createBtn.click()
    await expect(page.locator('.modal')).toBeVisible()
    await expect(page.locator('.modal-title')).toContainText(/Nuevo Usuario/i)
  })
  test('should create a new user', async ({ page }) => {
    await page.goto('/app/personal/funcionarios')
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
    await fechaInput.evaluate((el) => el.removeAttribute('readonly'))
    await fechaInput.click()
    await fechaInput.fill('15/12/2025')
    await fechaInput.press('Enter')
    await fechaInput.blur()
    await page.keyboard.press('Escape')
    await page.waitForTimeout(300)

    const selectCargo = activeModal
      .getByText(/^Cargo$/)
      .locator('..')
      .getByRole('combobox')
    await selectCargo.click({ force: true })

    // Wait for dropdown menu to open
    await page.waitForSelector('.vs__dropdown-menu', { state: 'visible', timeout: 5000 })

    const optionTens = page.locator('.vs__dropdown-option').filter({ hasText: /^TENS$/ })
    await optionTens.waitFor({ state: 'visible' })
    await optionTens.click()

    const selectContrato = activeModal
      .getByText(/^Tipo Contrato$/)
      .locator('..')
      .getByRole('combobox')
    await selectContrato.click()
    const optionPlanta = page.locator('.vs__dropdown-option').filter({ hasText: /^PLANTA$/ })
    await optionPlanta.waitFor({ state: 'visible' })
    await optionPlanta.click()

    const selectHabilitado = activeModal
      .getByText(/^Estado Inicial$/)
      .locator('..')
      .getByRole('combobox')
    await selectHabilitado.click()
    const optionHab = page.locator('.vs__dropdown-option').filter({ hasText: /^HABILITADO$/ })
    await optionHab.waitFor({ state: 'visible' })
    await optionHab.click()
    await expect(page.locator('.vs__selected').filter({ hasText: /^TENS$/ })).toBeVisible()
    await expect(page.locator('.vs__selected').filter({ hasText: /^HABILITADO$/ })).toBeVisible()
    await activeModal.getByPlaceholder('Ej: Sebastián').press('Enter')
    await page.waitForTimeout(500)

    const saveBtn = activeModal.locator('.btn-primary')
    await saveBtn.click()

    // Wait for Confirmation Modal
    const confirmModalTitle = page.getByText('Confirmar Acción', { exact: true })
    await expect(confirmModalTitle).toBeVisible({ timeout: 5000 })
    await expect(page.getByText('¿Seguro que deseas crear este usuario?')).toBeVisible()

    const responsePromise = page.waitForResponse(
      (resp) =>
        resp.request().method() === 'POST' &&
        (resp.url().includes('/users') || resp.url().includes('/api/users')) &&
        resp.status() >= 200 &&
        resp.status() < 300
    )

    // Click "Sí, Continuar"
    await page.getByRole('button', { name: 'Sí, Continuar' }).click()

    await responsePromise
    await expect(page.getByText('¿Seguro que deseas crear este usuario?')).not.toBeVisible({
      timeout: 10000
    })

    await expect(page.locator('.modal')).not.toBeVisible({ timeout: 10000 })
  })
})
