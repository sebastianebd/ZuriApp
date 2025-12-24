import { test, expect } from '@playwright/test'

test.describe('User Management', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/app/ver_usuarios')

    await expect(page).toHaveURL(/ver_usuarios/)

    await page.waitForSelector('aside.is-expanded, aside', { state: 'visible' })
  })

  test('should navigate to Users page', async ({ page }) => {
    await page.locator('a[title="Usuarios"]').click()
    await expect(page).toHaveURL(/ver_usuarios/)
    await expect(page.locator('h4:has-text("Gestión de Usuarios")')).toBeVisible()
  })

  test('should open Create User modal', async ({ page }) => {
    await page.goto('/app/ver_usuarios')
    const createBtn = page.locator('button', { hasText: 'Crear Usuario' })
    await createBtn.waitFor({ state: 'visible', timeout: 10000 })
    await createBtn.click()
    await expect(page.locator('.modal')).toBeVisible()
    await expect(page.locator('.modal-title')).toContainText(/crear/i)
  })
  test('should create a new user', async ({ page }) => {
    const optionsPromise = Promise.all([
      page.waitForResponse(
        (r) => r.url().includes('/api/options/tipo-cargos') && r.status() === 200
      ),
      page.waitForResponse((r) => r.url().includes('/api/options/habilitado') && r.status() === 200)
    ]).catch(() => {})

    await page.goto('/app/ver_usuarios')
    await optionsPromise.catch(() => {})
    const createBtn = page.getByRole('button', { name: 'Crear Usuario' })
    await createBtn.waitFor({ state: 'visible' })
    await createBtn.click()
    await expect(page.locator('.modal-title')).toContainText('CREAR NUEVO USUARIO')
    await page.evaluate(() => {
      const modals = document.querySelectorAll('.modal.show')
      if (modals.length > 1) {
        for (let i = 1; i < modals.length; i++) {
          modals[i].remove()
        }
      }
    })

    const validRut = '18963546-k'

    const activeModal = page
      .locator('.modal.show')
      .filter({ hasText: 'CREAR NUEVO USUARIO' })
      .first()
    await expect(activeModal).toBeVisible()

    const rutInput = activeModal.getByPlaceholder('12.345.678-9')
    await rutInput.click()
    await rutInput.fill(validRut)
    await rutInput.blur()
    await activeModal.getByPlaceholder('Ingrese nombre').fill('Sebastian')
    await activeModal.getByPlaceholder('Ingrese apellido').fill('Echeverria')
    await activeModal.getByPlaceholder('correo@ejemplo.com').fill(`e2e-${Date.now()}@test.com`)
    await activeModal.getByPlaceholder('912345678').fill('987654321')
    await activeModal.getByPlaceholder('Calle, Número, Depto').fill('Calle Falsa 123')
    await activeModal.getByPlaceholder('Ingrese ciudad').fill('Santiago')
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
    const optionTens = page.locator('.vs__dropdown-option').filter({ hasText: /^TENS$/ })
    await optionTens.waitFor({ state: 'visible' })
    await optionTens.click()

    const selectHabilitado = activeModal
      .getByText(/^Habilitado$/)
      .locator('..')
      .getByRole('combobox')
    await selectHabilitado.click()
    const optionHab = page.locator('.vs__dropdown-option').filter({ hasText: /^HABILITADO$/ })
    await optionHab.waitFor({ state: 'visible' })
    await optionHab.click()
    await expect(page.locator('.vs__selected').filter({ hasText: /^TENS$/ })).toBeVisible()
    await expect(page.locator('.vs__selected').filter({ hasText: /^HABILITADO$/ })).toBeVisible()
    await activeModal.getByPlaceholder('Ingrese nombre').press('Enter')
    await page.waitForTimeout(500)

    const saveBtn = activeModal.locator('.btn-success')
    if ((await page.getByText('Confirmar Acción').count()) === 0) {
      await saveBtn.click({ force: true })
      await page.waitForTimeout(500)
    }

    const confirmModal = page.getByText('Confirmar Acción')
    await expect(confirmModal).toBeAttached({ timeout: 5000 })

    if (await confirmModal.isVisible()) {
      await expect(confirmModal).toBeVisible()
    }
    const responsePromise = page.waitForResponse(
      (resp) =>
        resp.request().method() === 'POST' &&
        (resp.url().includes('/users') || resp.url().includes('/api/users')) &&
        resp.status() >= 200 &&
        resp.status() < 300
    )
    await page.getByRole('button', { name: /continuar/i }).click({ force: true })
    await responsePromise
    await expect(page.getByText('Confirmar Acción')).not.toBeVisible({ timeout: 10000 })
    await expect(page.locator('.modal')).not.toBeVisible({ timeout: 10000 })
  })
})
