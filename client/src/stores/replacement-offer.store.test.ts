import { setActivePinia, createPinia } from 'pinia'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { useReplacementOfferStore } from './replacement-offer.store'
import socket from '../plugins/socket'

const mockApiGet = vi.fn()
const mockApiPost = vi.fn()
const mockApiPatch = vi.fn()

vi.mock('../composables/useApi', () => ({
  useApiPrivate: () => ({
    get: mockApiGet,
    post: mockApiPost,
    patch: mockApiPatch,
  }),
}))

const socketHandlers: Record<string, Function> = {}

vi.mock('../plugins/socket', () => ({
  default: {
    connected: false,
    connect: vi.fn(),
    disconnect: vi.fn(),
    emit: vi.fn(),
    on: vi.fn((event: string, handler: Function) => {
      socketHandlers[event] = handler
    }),
    off: vi.fn((event: string) => {
      delete socketHandlers[event]
    }),
  },
}))

describe('ReplacementOffer Store - Socket Granular Updates (TDD RED)', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.clearAllMocks()
    Object.keys(socketHandlers).forEach((k) => delete socketHandlers[k])
  })

  it('RED: offer:applied debe actualizar quirúrgicamente applicantsCount sin disparar fetchOffers ni activar loading (evita parpadeo/spinners)', async () => {
    const store = useReplacementOfferStore()

    // Estado inicial con una convocatoria
    store.offers = [
      {
        id: 'offer-123',
        serviceId: 'srv-1',
        serviceName: 'Urgencias',
        positionId: 'pos-1',
        positionName: 'Enfermero',
        status: 'open',
        expiresAt: new Date(Date.now() + 3600000).toISOString(),
        fecha_inicio: '2026-10-10T08:00:00.000Z',
        fecha_termino: '2026-10-10T20:00:00.000Z',
        tipo_turno: '4TO_TURNO',
        applicantsCount: 0,
      } as any,
    ]

    store.setupSocketListeners()
    expect(socketHandlers['offer:applied']).toBeDefined()

    // Simulamos la llegada del evento socket de postulación
    socketHandlers['offer:applied']({
      offerId: 'offer-123',
      applicantsCount: 1,
    })

    // El contador debe actualizarse inmediatamente en memoria
    expect(store.offers[0].applicantsCount).toBe(1)

    // No debe haber puesto loading en true (lo que provocaría spinner/parpadeo de toda la tabla)
    expect(store.loading).toBe(false)

    // No debe haber llamado a la API get /replacement-offers (fetchOffers)
    expect(mockApiGet).not.toHaveBeenCalled()
  })

  it('RED: offer:applicant_withdrawn debe descontar quirúrgicamente applicantsCount sin disparar fetchOffers ni activar loading', async () => {
    const store = useReplacementOfferStore()

    // Estado inicial con 1 postulante
    store.offers = [
      {
        id: 'offer-123',
        serviceId: 'srv-1',
        serviceName: 'Urgencias',
        positionId: 'pos-1',
        positionName: 'Enfermero',
        status: 'open',
        expiresAt: new Date(Date.now() + 3600000).toISOString(),
        fecha_inicio: '2026-10-10T08:00:00.000Z',
        fecha_termino: '2026-10-10T20:00:00.000Z',
        tipo_turno: '4TO_TURNO',
        applicantsCount: 1,
      } as any,
    ]

    store.setupSocketListeners()
    expect(socketHandlers['offer:applicant_withdrawn']).toBeDefined()

    // Simulamos que el funcionario retira su postulación
    socketHandlers['offer:applicant_withdrawn']({
      offerId: 'offer-123',
      applicantsCount: 0,
    })

    // El contador debe bajar inmediatamente a 0
    expect(store.offers[0].applicantsCount).toBe(0)

    // No debe activar el spinner de tabla
    expect(store.loading).toBe(false)

    // No debe llamar a fetchOffers de toda la tabla
    expect(mockApiGet).not.toHaveBeenCalled()
  })
})
