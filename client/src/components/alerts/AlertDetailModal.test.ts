import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { setActivePinia, createPinia } from 'pinia'
import AlertDetailModal from './AlertDetailModal.vue'
import { useAlertStore } from '../../stores/alert.store'
import type { AlertDTO } from '../../types/alert.types'

vi.mock('../../plugins/socket', () => ({
  default: {
    emit: vi.fn(),
    on: vi.fn(),
    off: vi.fn(),
  },
}))

describe('AlertDetailModal.vue - Modal de Detalle y Resolución (TDD RED)', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.clearAllMocks()
  })

  const mockAlert: AlertDTO = {
    id: 'alert-1',
    ruleId: 'NORM-01',
    severity: 'critical',
    category: 'normative',
    serviceId: 'srv-uci-1',
    staffId: 'staff-1',
    staffName: 'Juan Pérez',
    rut: '12.345.678-9',
    positionName: 'Enfermero',
    message: 'Descanso insuficiente entre turnos (< 12h requeridas por ley)',
    context: {
      restHours: 10,
      previousExit: '20:00',
      nextEntry: '06:00',
    },
    status: 'active',
    createdAt: '2026-10-01T08:00:00.000Z',
  }

  it('no muestra el modal si showDetailModal es false', () => {
    const store = useAlertStore()
    store.showDetailModal = false
    store.selectedAlert = null

    const wrapper = mount(AlertDetailModal)
    expect(wrapper.find('.modal.show').exists()).toBe(false)
  })

  it('renderiza la información detallada de la infracción cuando el modal está abierto', async () => {
    const store = useAlertStore()
    store.selectedAlert = mockAlert
    store.showDetailModal = true

    const wrapper = mount(AlertDetailModal)

    expect(wrapper.text()).toContain('NORM-01')
    expect(wrapper.text()).toContain('Juan Pérez')
    expect(wrapper.text()).toContain('12.345.678-9')
    expect(wrapper.text()).toContain('Descanso insuficiente entre turnos')
    expect(wrapper.text()).toContain('10') // restHours
  })

  it('el botón "Marcar como Resuelta" está deshabilitado si la nota de justificación tiene menos de 5 caracteres', async () => {
    const store = useAlertStore()
    store.selectedAlert = mockAlert
    store.showDetailModal = true

    const wrapper = mount(AlertDetailModal)
    const resolveBtn = wrapper.find('[data-test="btn-resolve"]')
    const noteInput = wrapper.find('[data-test="input-resolution-note"]')

    expect(resolveBtn.attributes('disabled')).toBeDefined()

    await noteInput.setValue('abc')
    expect(resolveBtn.attributes('disabled')).toBeDefined()

    await noteInput.setValue('Autorizado por contingencia operacional')
    expect(resolveBtn.attributes('disabled')).toBeUndefined()
  })

  it('al confirmar la resolución invoca store.resolveAlert y cierra el modal', async () => {
    const store = useAlertStore()
    store.selectedAlert = mockAlert
    store.showDetailModal = true

    const resolveSpy = vi.spyOn(store, 'resolveAlert').mockResolvedValue()

    const wrapper = mount(AlertDetailModal)
    const noteInput = wrapper.find('[data-test="input-resolution-note"]')
    const resolveBtn = wrapper.find('[data-test="btn-resolve"]')

    await noteInput.setValue('Autorizado por contingencia operacional')
    await resolveBtn.trigger('click')

    expect(resolveSpy).toHaveBeenCalledWith(
      'alert-1',
      'Autorizado por contingencia operacional',
    )
    expect(store.showDetailModal).toBe(false)
    expect(store.selectedAlert).toBeNull()
  })

  it('el botón cerrar cancela y oculta el modal sin llamar a resolveAlert', async () => {
    const store = useAlertStore()
    store.selectedAlert = mockAlert
    store.showDetailModal = true

    const resolveSpy = vi.spyOn(store, 'resolveAlert')

    const wrapper = mount(AlertDetailModal)
    const closeBtn = wrapper.find('[data-test="btn-close"]')

    await closeBtn.trigger('click')

    expect(resolveSpy).not.toHaveBeenCalled()
    expect(store.showDetailModal).toBe(false)
  })
})
