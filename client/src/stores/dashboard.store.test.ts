import { setActivePinia, createPinia } from 'pinia'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { useDashboardStore } from './dashboard.store'
import * as DashboardService from '../services/dashboard.service'
import socket from '../plugins/socket'

vi.mock('../services/dashboard.service', () => ({
  getServiceKPIs: vi.fn(),
  updateServiceStaffing: vi.fn(),
}))

vi.mock('../composables/useApi', () => ({
  useApiPrivate: vi.fn(() => ({})),
}))

vi.mock('../plugins/socket', () => ({
  default: {
    emit: vi.fn(),
    on: vi.fn(),
    off: vi.fn(),
  },
}))

describe('Dashboard Store (TDD RED)', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    localStorage.clear()
    vi.clearAllMocks()
  })

  it('debería inicializar el store con valores por defecto', () => {
    const store = useDashboardStore()
    expect(store.selectedServiceId).toBe('')
    expect(store.kpiData).toBeNull()
    expect(store.loading).toBe(false)
    expect(store.error).toBeNull()
    expect(store.showStaffingModal).toBe(false)
  })

  it('setSelectedService debería guardar en localStorage y solicitar KPIs', async () => {
    const store = useDashboardStore()
    const mockData = {
      period: { month: 10, year: 2026 },
      service: { id: 'srv-uci', name: 'UCI', canEditStaffing: true },
      summary: { totalReplacements: 8, replacementRate: 4.2 },
    }
    vi.mocked(DashboardService.getServiceKPIs).mockResolvedValue({
      success: true,
      data: mockData as any,
    })

    await store.setSelectedService('srv-uci')

    expect(store.selectedServiceId).toBe('srv-uci')
    expect(localStorage.getItem('zuriapp_preferred_service')).toBe('srv-uci')
    expect(DashboardService.getServiceKPIs).toHaveBeenCalled()
    expect(store.kpiData).toEqual(mockData)
  })

  it('setSelectedService debería gestionar las salas de Socket.io (leave y join)', async () => {
    const store = useDashboardStore()
    store.selectedServiceId = 'srv-old'

    vi.mocked(DashboardService.getServiceKPIs).mockResolvedValue({
      success: true,
      data: {} as any,
    })

    await store.setSelectedService('srv-new')

    expect(socket.emit).toHaveBeenCalledWith('leave:service', 'srv-old')
    expect(socket.emit).toHaveBeenCalledWith('join:service', 'srv-new')
  })

  it('initSocketListeners debería suscribir el evento dashboard:invalidated y recargar datos', async () => {
    const store = useDashboardStore()
    store.selectedServiceId = 'srv-uci'

    let socketCallback: (data: { serviceId: string }) => void = () => {}
    vi.mocked(socket.on).mockImplementation((event: string, cb: any): any => {
      if (event === 'dashboard:invalidated') {
        socketCallback = cb
      }
      return socket as any
    })

    store.initSocketListeners()

    expect(socket.on).toHaveBeenCalledWith('dashboard:invalidated', expect.any(Function))

    // Simular recepción de evento de WebSocket
    vi.mocked(DashboardService.getServiceKPIs).mockResolvedValue({
      success: true,
      data: { summary: { totalReplacements: 15 } } as any,
    })

    await socketCallback({ serviceId: 'srv-uci' })

    expect(DashboardService.getServiceKPIs).toHaveBeenCalled()
  })

  it('saveStaffing debería llamar a updateServiceStaffing, refrescar datos y cerrar modal', async () => {
    const store = useDashboardStore()
    store.selectedServiceId = 'srv-uci'
    store.showStaffingModal = true

    const payload = {
      dotacion_minima: [{ positionId: 'pos-1', minimo_dia: 2, minimo_noche: 1 }],
      umbrales_cobertura: { verde: 95, amarillo: 85 },
    }

    vi.mocked(DashboardService.updateServiceStaffing).mockResolvedValue({
      success: true,
      data: {},
    })
    vi.mocked(DashboardService.getServiceKPIs).mockResolvedValue({
      success: true,
      data: { summary: { totalReplacements: 5 } } as any,
    })

    await store.saveStaffing(payload)

    expect(DashboardService.updateServiceStaffing).toHaveBeenCalledWith(
      expect.anything(),
      'srv-uci',
      payload,
    )
    expect(store.showStaffingModal).toBe(false)
  })

  it('fetchKPIs debería pasar el parámetro refresh a DashboardService.getServiceKPIs', async () => {
    const store = useDashboardStore()
    store.selectedServiceId = 'srv-test'

    vi.mocked(DashboardService.getServiceKPIs).mockResolvedValue({
      success: true,
      data: {} as any,
    })

    await store.fetchKPIs(undefined, undefined, undefined, true)

    expect(DashboardService.getServiceKPIs).toHaveBeenCalledWith(
      expect.anything(),
      'srv-test',
      expect.any(Number),
      expect.any(Number),
      true,
    )
  })
})
