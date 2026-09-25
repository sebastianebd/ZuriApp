import { setActivePinia, createPinia } from 'pinia'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { usePortalStore } from './portal.store'
import portalService from '@/services/portal.service'
import socket from '@/plugins/socket'
import type { PwaUserProfile, PwaOpenOfferItem } from '@/types/portal.types'

vi.mock('@/services/portal.service', () => ({
  default: {
    requestOtp: vi.fn(),
    verifyOtp: vi.fn(),
    getMe: vi.fn(),
    logout: vi.fn(),
    getHome: vi.fn(),
    getShifts: vi.fn(),
    confirmShift: vi.fn(),
    reportUnavailable: vi.fn(),
    downloadAdvancePdf: vi.fn(),
    downloadCartolaPdf: vi.fn(),
    downloadReplacementVoucherPdf: vi.fn(),
    updatePreferences: vi.fn(),
    getOpenOffers: vi.fn(),
    getMyApplications: vi.fn(),
    applyToOffer: vi.fn(),
    withdrawApplication: vi.fn(),
  },
}))

vi.mock('@/plugins/socket', () => ({
  default: {
    connected: false,
    connect: vi.fn(),
    emit: vi.fn(),
    on: vi.fn(),
    off: vi.fn(),
  },
}))

describe('portal.store.ts - Notificaciones de Convocatorias en Bolsa (TDD RED)', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    localStorage.clear()
    vi.clearAllMocks()
  })

  const mockHonorario: PwaUserProfile = {
    id: 'staff-hon-1',
    rut: '12.345.678-9',
    firstName: 'Juan',
    lastName: 'Pérez',
    fullName: 'Juan Pérez',
    phone: '+56912345678',
    email: 'juan@hospital.cl',
    contractType: 'HONORARIO',
    positionName: 'Tens',
    estamento: 'TECNICO',
  }

  const mockOffer: PwaOpenOfferItem = {
    id: 'offer-999',
    serviceId: 'srv-urgencia',
    serviceName: 'Urgencias Adulto',
    positionId: 'pos-tens',
    positionName: 'Tens',
    tipo_turno: 'Cuarto Turno',
    fecha_inicio: '2026-10-01',
    fecha_termino: '2026-10-15',
    expiresAt: '2026-09-30T23:59:59Z',
    createdAt: '2026-09-24T10:00:00Z',
    alreadyApplied: false,
  }

  it('no sincroniza avisos de bolsa si el usuario NO es honorario', async () => {
    const store = usePortalStore()
    store.user = { ...mockHonorario, contractType: 'PLANTA' }

    await store.syncOpenOffersNotifications()

    expect(portalService.getOpenOffers).not.toHaveBeenCalled()
  })

  it('sincroniza avisos de bolsa para honorarios agregando notificación no leída', async () => {
    vi.mocked(portalService.getOpenOffers).mockResolvedValueOnce([mockOffer])

    const store = usePortalStore()
    store.user = mockHonorario

    await store.syncOpenOffersNotifications()

    expect(portalService.getOpenOffers).toHaveBeenCalledTimes(1)
    const offerNotif = store.notifications.find((n) => n.id === 'notif-offer-offer-999')
    expect(offerNotif).toBeDefined()
    expect(offerNotif?.type).toBe('offer_published')
    expect(offerNotif?.title).toBe('Nueva Convocatoria en Bolsa')
    expect(offerNotif?.message).toContain('Tens')
    expect(offerNotif?.message).toContain('Urgencias Adulto')
    expect(offerNotif?.acknowledged).toBe(false)
  })

  it('no agrega la notificación si ya fue eliminada por el usuario previamente', async () => {
    localStorage.setItem('portal_deleted_notifs', JSON.stringify(['notif-offer-offer-999']))
    vi.mocked(portalService.getOpenOffers).mockResolvedValueOnce([mockOffer])

    const store = usePortalStore()
    store.user = mockHonorario

    await store.syncOpenOffersNotifications()

    const offerNotif = store.notifications.find((n) => n.id === 'notif-offer-offer-999')
    expect(offerNotif).toBeUndefined()
  })

  it('escucha el evento socket "offer:created" y dispara la sincronización automáticamente', async () => {
    const socketOnHandlers: Record<string, Function> = {}
    vi.mocked(socket.on).mockImplementation((event: string, cb: any) => {
      socketOnHandlers[event] = cb
      return socket as any
    })
    vi.mocked(portalService.getOpenOffers).mockResolvedValueOnce([mockOffer])

    const store = usePortalStore()
    store.user = mockHonorario

    store.setupSocketListeners()

    expect(socket.connect).toHaveBeenCalled()
    expect(socket.on).toHaveBeenCalledWith('offer:created', expect.any(Function))

    // Simular evento socket 'offer:created'
    await socketOnHandlers['offer:created']()

    expect(portalService.getOpenOffers).toHaveBeenCalled()
    expect(store.notifications.some((n) => n.id === 'notif-offer-offer-999')).toBe(true)
  })

  it('escucha el evento socket "offer:awarded" para el usuario logueado, crea notificación en la campana y refresca home y turnos', async () => {
    const socketOnHandlers: Record<string, Function> = {}
    vi.mocked(socket.on).mockImplementation((event: string, cb: any) => {
      socketOnHandlers[event] = cb
      return socket as any
    })

    const store = usePortalStore()
    store.user = mockHonorario
    store.setupSocketListeners()

    expect(socket.on).toHaveBeenCalledWith('offer:awarded', expect.any(Function))

    // Simular evento socket 'offer:awarded'
    await socketOnHandlers['offer:awarded']({
      offerId: 'offer-999',
      replacementId: 'rep-1234',
      staffId: mockHonorario.id,
      serviceName: 'Urgencias Adulto',
      tipo_turno: 'Cuarto Turno',
      message: '¡Felicitaciones! Has sido adjudicado/a para el reemplazo en Urgencias Adulto (Cuarto Turno).',
    })

    // Debe existir una notificación no leída de tipo replacement_assigned en la campana
    const awardedNotif = store.notifications.find((n) => n.type === 'replacement_assigned' && n.title === '¡Turno Adjudicado!')
    expect(awardedNotif).toBeDefined()
    expect(awardedNotif?.acknowledged).toBe(false)
    expect(awardedNotif?.message).toContain('Urgencias Adulto')

    // Debe disparar el refresco de getHome
    expect(portalService.getHome).toHaveBeenCalled()
  })
})
