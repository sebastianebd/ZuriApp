import { setActivePinia, createPinia } from 'pinia'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { useAlertStore } from './alert.store'
import * as AlertService from '../services/alert.service'
import socket from '../plugins/socket'
import type { AlertDTO } from '../types/alert.types'

vi.mock('../services/alert.service', () => ({
  getAlerts: vi.fn(),
  acknowledgeAlert: vi.fn(),
  resolveAlert: vi.fn(),
}))

vi.mock('../composables/useApi', () => ({
  useApiPrivate: vi.fn(() => ({})),
}))

vi.mock('../plugins/socket', () => ({
  default: {
    connected: false,
    connect: vi.fn(),
    disconnect: vi.fn(),
    emit: vi.fn(),
    on: vi.fn(),
    off: vi.fn(),
  },
}))

describe('Alert Store - Pinia & WebSockets (TDD RED)', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.clearAllMocks()
  })

  const mockAlert1: AlertDTO = {
    id: 'alert-1',
    ruleId: 'NORM-01',
    severity: 'critical',
    category: 'normative',
    serviceId: 'srv-uci-1',
    message: 'Descanso insuficiente entre turnos',
    context: { restHours: 11 },
    status: 'active',
    createdAt: '2026-10-01T08:00:00.000Z',
  }

  const mockAlert2: AlertDTO = {
    id: 'alert-2',
    ruleId: 'OPS-01',
    severity: 'medium',
    category: 'operational',
    serviceId: 'srv-uci-1',
    message: 'Déficit de dotación de enfermera',
    context: { deficit: 1 },
    status: 'active',
    createdAt: '2026-10-01T09:00:00.000Z',
  }

  it('debería inicializar el store con valores por defecto', () => {
    const store = useAlertStore()
    expect(store.alerts).toEqual([])
    expect(store.unreadCount).toBe(0)
    expect(store.countsBySeverity).toEqual({ critical: 0, high: 0, medium: 0 })
    expect(store.loading).toBe(false)
    expect(store.selectedAlert).toBeNull()
    expect(store.showDetailModal).toBe(false)
  })

  it('fetchAlerts debería cargar las alertas y actualizar contadores', async () => {
    const store = useAlertStore()
    vi.mocked(AlertService.getAlerts).mockResolvedValue({
      success: true,
      data: {
        alerts: [mockAlert1, mockAlert2],
        unreadCount: 2,
        countsBySeverity: { critical: 1, high: 0, medium: 1 },
      },
    })

    await store.fetchAlerts('srv-uci-1')

    expect(AlertService.getAlerts).toHaveBeenCalled()
    expect(store.alerts.length).toBe(2)
    expect(store.unreadCount).toBe(2)
    expect(store.countsBySeverity.critical).toBe(1)
    expect(store.countsBySeverity.medium).toBe(1)
  })

  it('fetchAlerts debería consultar /api/alerts incluso si no se pasa serviceId (carga global de alertas)', async () => {
    const store = useAlertStore()
    vi.mocked(AlertService.getAlerts).mockResolvedValue({
      success: true,
      data: {
        alerts: [mockAlert1],
        unreadCount: 1,
        countsBySeverity: { critical: 1, high: 0, medium: 0 },
      },
    })

    await store.fetchAlerts()

    expect(AlertService.getAlerts).toHaveBeenCalledWith(expect.anything(), undefined)
    expect(store.alerts.length).toBe(1)
    expect(store.unreadCount).toBe(1)
  })

  it('RED: fetchAlerts() sin argumentos debe consultar alertas globales (undefined) incluso si previamente se consultó un servicio específico, evitando que desaparezcan alertas al clickear la campana', async () => {
    const store = useAlertStore()
    vi.mocked(AlertService.getAlerts).mockResolvedValue({
      success: true,
      data: {
        alerts: [mockAlert1],
        unreadCount: 1,
        countsBySeverity: { critical: 1, high: 0, medium: 0 },
      },
    })

    // Primero se consulta un servicio específico (ej: vista de turnos o dashboard)
    await store.fetchAlerts('srv-farmacia')
    expect(AlertService.getAlerts).toHaveBeenCalledWith(expect.anything(), 'srv-farmacia')

    // Luego el usuario hace clic en la campana global (que invoca fetchAlerts() sin argumentos)
    await store.fetchAlerts()

    // Debe llamar con undefined (carga global de alertas), no con 'srv-farmacia'
    expect(AlertService.getAlerts).toHaveBeenLastCalledWith(expect.anything(), undefined)
  })

  it('acknowledgeAlert debería marcar la alerta como acknowledged y decrementar unreadCount', async () => {
    const store = useAlertStore()
    store.alerts = [{ ...mockAlert1 }, { ...mockAlert2 }]
    store.unreadCount = 2

    vi.mocked(AlertService.acknowledgeAlert).mockResolvedValue({
      success: true,
      data: { ...mockAlert1, status: 'acknowledged' },
    })

    await store.acknowledgeAlert('alert-1')

    expect(AlertService.acknowledgeAlert).toHaveBeenCalledWith(expect.anything(), 'alert-1')
    const target = store.alerts.find((a) => a.id === 'alert-1')
    expect(target?.status).toBe('acknowledged')
    expect(store.unreadCount).toBe(1)
  })

  it('resolveAlert debería remover la alerta de la lista activa y recalcular contadores', async () => {
    const store = useAlertStore()
    store.alerts = [{ ...mockAlert1 }, { ...mockAlert2 }]
    store.unreadCount = 2
    store.countsBySeverity = { critical: 1, high: 0, medium: 1 }

    vi.mocked(AlertService.resolveAlert).mockResolvedValue({
      success: true,
      data: { ...mockAlert1, status: 'resolved' },
    })

    await store.resolveAlert('alert-1', 'Justificación válida de prueba')

    expect(AlertService.resolveAlert).toHaveBeenCalledWith(
      expect.anything(),
      'alert-1',
      { resolutionNote: 'Justificación válida de prueba' },
    )
    expect(store.alerts.length).toBe(1)
    expect(store.alerts[0].id).toBe('alert-2')
    expect(store.unreadCount).toBe(1)
    expect(store.countsBySeverity.critical).toBe(0)
  })

  it('initSocketListeners debería manejar alert:new, alert:acknowledged y alert:resolved reactivamente', () => {
    const store = useAlertStore()
    store.alerts = [{ ...mockAlert2 }]
    store.unreadCount = 1
    store.countsBySeverity = { critical: 0, high: 0, medium: 1 }

    // Simular registro de listeners
    const listeners: Record<string, Function> = {}
    vi.mocked(socket.on).mockImplementation((event: string, cb: any) => {
      listeners[event] = cb
      return socket as any
    })

    store.initSocketListeners()

    expect(socket.on).toHaveBeenCalledWith('alert:new', expect.any(Function))
    expect(socket.on).toHaveBeenCalledWith('alert:acknowledged', expect.any(Function))
    expect(socket.on).toHaveBeenCalledWith('alert:resolved', expect.any(Function))

    // 1. Disparar alert:new
    listeners['alert:new'](mockAlert1)
    expect(store.alerts.length).toBe(2)
    expect(store.alerts[0].id).toBe('alert-1') // Aparece al principio
    expect(store.unreadCount).toBe(2)
    expect(store.countsBySeverity.critical).toBe(1)

    // 2. Disparar alert:acknowledged
    listeners['alert:acknowledged']({ alertId: 'alert-1' })
    expect(store.alerts.find((a) => a.id === 'alert-1')?.status).toBe('acknowledged')
    expect(store.unreadCount).toBe(1)

    // 3. Disparar alert:resolved
    listeners['alert:resolved']({ alertId: 'alert-1' })
    expect(store.alerts.some((a) => a.id === 'alert-1')).toBe(false)
    expect(store.countsBySeverity.critical).toBe(0)
  })
})
