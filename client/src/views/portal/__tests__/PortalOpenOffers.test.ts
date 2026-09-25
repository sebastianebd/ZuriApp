import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import { setActivePinia, createPinia } from 'pinia'
import PortalOpenOffers from '../PortalOpenOffers.vue'
import portalService from '@/services/portal.service'
import type { PwaOpenOfferItem, PwaMyApplicationItem } from '@/types/portal.types'

// Mock router
const mockPush = vi.fn()
vi.mock('vue-router', () => ({
  useRouter: () => ({
    push: mockPush,
  }),
  useRoute: () => ({
    query: {},
  }),
}))

describe('PortalOpenOffers.vue - Tablón Móvil de la Bolsa de Reemplazos (TDD RED)', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.clearAllMocks()
  })

  const mockOpenOffers: PwaOpenOfferItem[] = [
    {
      id: 'offer-1',
      serviceName: 'Urgencias Adulto',
      serviceLocation: 'Zócalo Edificio Central',
      positionName: 'TENS Urgencias',
      tipo_turno: 'Largo',
      entryTime: '08:00',
      exitTime: '20:00',
      fecha_inicio: '2026-09-25T08:00:00.000Z',
      fecha_termino: '2026-09-25T20:00:00.000Z',
      totalShifts: 1,
      expiresAt: new Date(Date.now() + 45 * 60 * 1000).toISOString(),
      observaciones: 'Apoyo sala reanimación',
      alreadyApplied: false,
    },
    {
      id: 'offer-2',
      serviceName: 'Medicina Quirúrgica',
      positionName: 'TENS Urgencias',
      tipo_turno: 'Noche',
      entryTime: '20:00',
      exitTime: '08:00',
      fecha_inicio: '2026-09-26T20:00:00.000Z',
      fecha_termino: '2026-09-27T08:00:00.000Z',
      totalShifts: 1,
      expiresAt: new Date(Date.now() + 120 * 60 * 1000).toISOString(),
      alreadyApplied: true,
      myApplicationStatus: 'pending',
    },
  ]

  const mockMyApplications: PwaMyApplicationItem[] = [
    {
      offerId: 'offer-2',
      serviceName: 'Medicina Quirúrgica',
      positionName: 'TENS Urgencias',
      tipo_turno: 'Noche',
      fecha_inicio: '2026-09-26T20:00:00.000Z',
      fecha_termino: '2026-09-27T08:00:00.000Z',
      appliedAt: '2026-09-21T10:00:00.000Z',
      status: 'pending',
      statusLabel: 'En postulación',
      statusColor: 'warning',
    },
    {
      offerId: 'offer-3',
      serviceName: 'Pabellón Central',
      positionName: 'TENS Urgencias',
      tipo_turno: 'Largo',
      fecha_inicio: '2026-09-28T08:00:00.000Z',
      fecha_termino: '2026-09-28T20:00:00.000Z',
      appliedAt: '2026-09-20T15:00:00.000Z',
      status: 'selected',
      statusLabel: 'Adjudicado',
      statusColor: 'success',
    },
    {
      offerId: 'offer-4',
      serviceName: 'Pediatría',
      positionName: 'TENS Urgencias',
      tipo_turno: 'Largo',
      fecha_inicio: '2026-09-28T08:00:00.000Z',
      fecha_termino: '2026-09-28T20:00:00.000Z',
      appliedAt: '2026-09-20T16:00:00.000Z',
      status: 'withdrawn_conflict',
      statusLabel: 'Retirado por conflicto',
      statusColor: 'danger',
    },
    {
      offerId: 'offer-5',
      serviceName: 'Cirugía Adulto',
      positionName: 'TENS Urgencias',
      tipo_turno: 'Largo',
      fecha_inicio: '2026-09-29T08:00:00.000Z',
      fecha_termino: '2026-09-29T20:00:00.000Z',
      appliedAt: '2026-09-21T11:00:00.000Z',
      status: 'pending',
      offerStatus: 'cancelled',
      statusLabel: 'Anulada',
      statusColor: 'dark',
    },
  ]

  it('renderiza control segmentado y carga convocatorias abiertas por defecto', async () => {
    vi.spyOn(portalService, 'getOpenOffers').mockResolvedValue(mockOpenOffers)
    vi.spyOn(portalService, 'getMyApplications').mockResolvedValue(mockMyApplications)

    const wrapper = mount(PortalOpenOffers)
    await flushPromises()

    expect(wrapper.find('[data-test="tab-open-offers"]').exists()).toBe(true)
    expect(wrapper.find('[data-test="tab-my-applications"]').exists()).toBe(true)
    expect(portalService.getOpenOffers).toHaveBeenCalled()

    // Renderiza las 2 tarjetas de ofertas
    const cards = wrapper.findAllComponents({ name: 'OfferCard' })
    expect(cards.length).toBe(2)
  })

  it('permite postular en 1 toque invocando applyToOffer y actualizando la interfaz', async () => {
    vi.spyOn(portalService, 'getOpenOffers').mockResolvedValue([...mockOpenOffers])
    vi.spyOn(portalService, 'getMyApplications').mockResolvedValue(mockMyApplications)
    const applySpy = vi.spyOn(portalService, 'applyToOffer').mockResolvedValue(undefined as any)

    const wrapper = mount(PortalOpenOffers)
    await flushPromises()

    const firstCard = wrapper.findComponent({ name: 'OfferCard' })
    expect(firstCard.exists()).toBe(true)

    // Simular evento apply de la tarjeta
    await firstCard.vm.$emit('apply', 'offer-1')
    await flushPromises()

    expect(applySpy).toHaveBeenCalledWith('offer-1')
  })

  it('permite retirar postulación voluntaria invocando withdrawApplication', async () => {
    vi.spyOn(portalService, 'getOpenOffers').mockResolvedValue([...mockOpenOffers])
    vi.spyOn(portalService, 'getMyApplications').mockResolvedValue(mockMyApplications)
    const withdrawSpy = vi.spyOn(portalService, 'withdrawApplication').mockResolvedValue(undefined as any)

    const wrapper = mount(PortalOpenOffers)
    await flushPromises()

    const secondCard = wrapper.findAllComponents({ name: 'OfferCard' })[1]
    expect(secondCard.exists()).toBe(true)

    // Simular evento withdraw de la tarjeta
    await secondCard.vm.$emit('withdraw', 'offer-2')
    await flushPromises()

    expect(withdrawSpy).toHaveBeenCalledWith('offer-2')
  })

  it('alterna a la pestaña "Mis Postulaciones" y muestra tarjetas con sus badges correspondientes', async () => {
    vi.spyOn(portalService, 'getOpenOffers').mockResolvedValue(mockOpenOffers)
    vi.spyOn(portalService, 'getMyApplications').mockResolvedValue(mockMyApplications)

    const wrapper = mount(PortalOpenOffers)
    await flushPromises()

    const myAppsTab = wrapper.find('[data-test="tab-my-applications"]')
    await myAppsTab.trigger('click')
    await flushPromises()

    expect(portalService.getMyApplications).toHaveBeenCalled()
    const appItems = wrapper.findAll('[data-test="application-item"]')
    expect(appItems.length).toBe(4)
  })

  it('muestra badge "Anulada" cuando la oferta fue anulada por la jefatura', async () => {
    vi.spyOn(portalService, 'getOpenOffers').mockResolvedValue(mockOpenOffers)
    vi.spyOn(portalService, 'getMyApplications').mockResolvedValue(mockMyApplications)

    const wrapper = mount(PortalOpenOffers)
    await flushPromises()

    const myAppsTab = wrapper.find('[data-test="tab-my-applications"]')
    await myAppsTab.trigger('click')
    await flushPromises()

    const cancelledItem = wrapper.findAll('[data-test="application-item"]')[3]
    expect(cancelledItem.text()).toContain('Anulada')
    expect(cancelledItem.text()).not.toContain('En evaluación')
  })

  it('muestra mensaje explicativo para postulaciones con estado withdrawn_conflict', async () => {
    vi.spyOn(portalService, 'getOpenOffers').mockResolvedValue(mockOpenOffers)
    vi.spyOn(portalService, 'getMyApplications').mockResolvedValue(mockMyApplications)

    const wrapper = mount(PortalOpenOffers)
    await flushPromises()

    const myAppsTab = wrapper.find('[data-test="tab-my-applications"]')
    await myAppsTab.trigger('click')
    await flushPromises()

    const conflictItem = wrapper.findAll('[data-test="application-item"]')[2]
    expect(conflictItem.text()).toContain('Retirado por conflicto')
    expect(conflictItem.text()).toContain('Fuiste seleccionado para otro turno en el mismo horario. Postulación cancelada automáticamente.')
  })

  it('muestra botón destacado "Ir a Mis Turnos" para postulaciones adjudicadas y redirige a /portal/shifts', async () => {
    vi.spyOn(portalService, 'getOpenOffers').mockResolvedValue(mockOpenOffers)
    vi.spyOn(portalService, 'getMyApplications').mockResolvedValue(mockMyApplications)

    const wrapper = mount(PortalOpenOffers)
    await flushPromises()

    const myAppsTab = wrapper.find('[data-test="tab-my-applications"]')
    await myAppsTab.trigger('click')
    await flushPromises()

    const viewShiftsBtn = wrapper.find('[data-test="go-to-my-shifts-btn"]')
    expect(viewShiftsBtn.exists()).toBe(true)

    await viewShiftsBtn.trigger('click')
    expect(mockPush).toHaveBeenCalledWith('/portal/shifts')
  })
})
