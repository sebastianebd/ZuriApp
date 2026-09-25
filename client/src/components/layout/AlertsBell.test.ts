import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { setActivePinia, createPinia } from 'pinia'
import AlertsBell from './AlertsBell.vue'
import { useAlertStore } from '../../stores/alert.store'
import type { AlertDTO } from '../../types/alert.types'

vi.mock('../../plugins/socket', () => ({
  default: {
    emit: vi.fn(),
    on: vi.fn(),
    off: vi.fn(),
  },
}))

describe('AlertsBell.vue - Campana de Notificaciones (TDD RED)', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.clearAllMocks()
  })

  const mockAlertCritical: AlertDTO = {
    id: 'alert-crit-1',
    ruleId: 'NORM-01',
    severity: 'critical',
    category: 'normative',
    serviceId: 'srv-uci-1',
    message: 'Descanso insuficiente entre turnos (< 12h)',
    context: { restHours: 10 },
    status: 'active',
    createdAt: '2026-10-01T08:00:00.000Z',
  }

  const mockAlertMedium: AlertDTO = {
    id: 'alert-med-1',
    ruleId: 'OPS-01',
    severity: 'medium',
    category: 'operational',
    serviceId: 'srv-uci-1',
    message: 'Déficit de dotación diurna de enfermera',
    context: { deficit: 1 },
    status: 'active',
    createdAt: '2026-10-01T09:00:00.000Z',
  }

  it('muestra el badge con el conteo de no leídas y clase crítica si hay alertas críticas', async () => {
    const store = useAlertStore()
    store.alerts = [mockAlertCritical, mockAlertMedium]
    store.unreadCount = 2
    store.countsBySeverity = { critical: 1, high: 0, medium: 1 }

    const wrapper = mount(AlertsBell)

    const badge = wrapper.find('[data-test="alerts-badge"]')
    expect(badge.exists()).toBe(true)
    expect(badge.text()).toBe('2')
    expect(badge.classes()).toContain('bg-danger')
    expect(badge.classes()).toContain('pulse')
  })

  it('no muestra badge si unreadCount es 0', async () => {
    const store = useAlertStore()
    store.alerts = []
    store.unreadCount = 0
    store.countsBySeverity = { critical: 0, high: 0, medium: 0 }

    const wrapper = mount(AlertsBell)

    const badge = wrapper.find('[data-test="alerts-badge"]')
    expect(badge.exists()).toBe(false)
  })

  it('muestra estado vacío cuando no hay alertas registradas', async () => {
    const store = useAlertStore()
    store.alerts = []
    store.unreadCount = 0

    const wrapper = mount(AlertsBell)

    expect(wrapper.find('[data-test="empty-alerts"]').exists()).toBe(true)
    expect(wrapper.text()).toContain('No hay alertas activas')
  })

  it('al hacer clic en el botón "Enterado" ejecuta acknowledgeAlert en el store', async () => {
    const store = useAlertStore()
    store.alerts = [mockAlertCritical]
    store.unreadCount = 1
    store.countsBySeverity = { critical: 1, high: 0, medium: 0 }

    const ackSpy = vi.spyOn(store, 'acknowledgeAlert').mockResolvedValue()

    const wrapper = mount(AlertsBell)

    const ackBtn = wrapper.find('[data-test="btn-acknowledge"]')
    expect(ackBtn.exists()).toBe(true)

    await ackBtn.trigger('click')

    expect(ackSpy).toHaveBeenCalledWith('alert-crit-1')
  })

  it('al hacer clic en un ítem de alerta abre el modal seteando selectedAlert', async () => {
    const store = useAlertStore()
    store.alerts = [mockAlertCritical]
    store.unreadCount = 1

    const wrapper = mount(AlertsBell)

    const alertItem = wrapper.find('[data-test="alert-item"]')
    expect(alertItem.exists()).toBe(true)

    await alertItem.trigger('click')

    expect(store.selectedAlert).toEqual(mockAlertCritical)
    expect(store.showDetailModal).toBe(true)
  })

  it('al hacer clic en el botón de la campana se ejecuta fetchAlerts para refrescar las alertas', async () => {
    const store = useAlertStore()
    const fetchSpy = vi.spyOn(store, 'fetchAlerts').mockResolvedValue()

    const wrapper = mount(AlertsBell)
    const bellBtn = wrapper.find('.alerts-bell-btn')
    expect(bellBtn.exists()).toBe(true)

    await bellBtn.trigger('click')

    expect(fetchSpy).toHaveBeenCalled()
  })
})
