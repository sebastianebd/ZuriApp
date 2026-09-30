import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import { ref } from 'vue'
import ReplacementOffersView from '../ReplacementOffersView.vue'

const mockOffers = ref<any[]>([])
const mockLoading = ref(false)

const mockStore = {
  offers: mockOffers,
  loading: mockLoading,
  fetchOffers: vi.fn(),
  fetchScoring: vi.fn(),
  setupSocketListeners: vi.fn(),
  awardOffer: vi.fn(),
  cancelOffer: vi.fn(),
}

vi.mock('@/stores/replacement-offer.store', () => ({
  useReplacementOfferStore: () => mockStore,
}))

vi.mock('@/stores/service.store', () => ({
  useServiceStore: () => ({
    services: ref([{ _id: 'srv-1', nombre: 'Urgencias' }]),
    fetchServices: vi.fn().mockResolvedValue([]),
  }),
}))

vi.mock('@/stores/turn-type.store', () => ({
  useTurnTypeStore: () => ({
    turnTypes: ref([{ nombre: '4TO_TURNO' }]),
    fetchTurnTypes: vi.fn().mockResolvedValue([]),
  }),
}))

// Mock router-link and modal stubs
const routerLinkStub = {
  name: 'RouterLink',
  props: ['to'],
  template: '<a :href="to"><slot /></a>',
}

const globalStubs = {
  'router-link': routerLinkStub,
  ReplacementOfferModalCreate: {
    name: 'ReplacementOfferModalCreate',
    template: '<div class="replacement-offer-modal-create-stub" v-if="visible"></div>',
    props: ['visible', 'listaDeTurnos', 'listaDeServicios'],
  },
}

describe('ReplacementOffersView.vue - Tablón Operativo de Convocatorias (TDD RED)', () => {
  const testOffers = [
    {
      id: 'offer-1',
      serviceId: 'srv-1',
      serviceName: 'Urgencias',
      positionId: 'pos-1',
      positionName: 'Enfermero/a Clínico/a',
      status: 'open',
      expiresAt: new Date(Date.now() + 3600000).toISOString(), // 1 hora
      fecha_inicio: '2026-10-10T08:00:00.000Z',
      fecha_termino: '2026-10-10T20:00:00.000Z',
      tipo_turno: '4TO_TURNO',
      applicantsCount: 2,
      id_saliente: 'staff-s1',
      nombre_saliente: 'Marta Saliente',
      rut_saliente: '12.345.678-9',
      motivo: 'LICENCIA_MEDICA',
      observaciones: 'Licencia por 3 días',
    },
    {
      id: 'offer-2',
      serviceId: 'srv-1',
      serviceName: 'Urgencias',
      positionId: 'pos-2',
      positionName: 'Técnico en Enfermería',
      status: 'finalized',
      expiresAt: new Date(Date.now() - 3600000).toISOString(), // Expirada
      fecha_inicio: '2026-10-11T08:00:00.000Z',
      fecha_termino: '2026-10-11T20:00:00.000Z',
      tipo_turno: '4TO_TURNO',
      applicantsCount: 0,
      id_saliente: 'staff-s2',
      nombre_saliente: 'Pedro Saliente',
      rut_saliente: '13.456.789-0',
      motivo: 'FERIADO_LEGAL',
    },
    {
      id: 'offer-3',
      serviceId: 'srv-2',
      serviceName: 'Medicina',
      positionId: 'pos-1',
      positionName: 'Enfermero/a Clínico/a',
      status: 'filled',
      expiresAt: new Date(Date.now() - 7200000).toISOString(),
      fecha_inicio: '2026-10-12T08:00:00.000Z',
      fecha_termino: '2026-10-12T20:00:00.000Z',
      tipo_turno: 'LARGO',
      applicantsCount: 4,
      id_saliente: 'staff-s3',
      nombre_saliente: 'Claudia Saliente',
      rut_saliente: '14.567.890-1',
      motivo: 'PERMISO_ADMINISTRATIVO',
    },
  ]

  beforeEach(() => {
    vi.clearAllMocks()
    mockOffers.value = [...testOffers]
    mockLoading.value = false
  })

  it('renderiza la lista de convocatorias y las columnas operativas', async () => {
    const wrapper = mount(ReplacementOffersView, {
      global: {
        stubs: globalStubs,
      },
    })

    await flushPromises()

    const text = wrapper.text()
    expect(text).toContain('Bolsa de Reemplazos')
    expect(text).toContain('Urgencias')
    expect(text).toContain('Enfermero/a Clínico/a')
    expect(text).toContain('Marta Saliente')
    expect(text).toContain('Licencia Médica')
  })

  it('filtra reactivamente por estado al pulsar los botones de filtro', async () => {
    const wrapper = mount(ReplacementOffersView, {
      global: {
        stubs: globalStubs,
      },
    })

    await flushPromises()

    // Filtro "Abiertas"
    const openFilterBtn = wrapper.findAll('button').find((b) => b.text().includes('Abiertas'))
    expect(openFilterBtn).toBeDefined()
    await openFilterBtn!.trigger('click')

    expect(wrapper.text()).toContain('Marta Saliente')
    expect(wrapper.text()).not.toContain('Pedro Saliente')
    expect(wrapper.text()).not.toContain('Claudia Saliente')

    // Filtro "Finalizadas"
    const finalizedFilterBtn = wrapper.findAll('button').find((b) => b.text().includes('Finalizadas'))
    await finalizedFilterBtn!.trigger('click')

    expect(wrapper.text()).toContain('Pedro Saliente')
    expect(wrapper.text()).not.toContain('Marta Saliente')
  })

  it('abre el modal de postulantes/scoring al pulsar el botón de candidatos', async () => {
    const wrapper = mount(ReplacementOffersView, {
      global: {
        stubs: globalStubs,
      },
    })

    await flushPromises()

    const candidateBtn = wrapper.findAll('button').find((b) => b.text().includes('2 Postulantes') || b.text().includes('Ver'))
    expect(candidateBtn).toBeDefined()
    await candidateBtn!.trigger('click')

    expect(wrapper.findComponent({ name: 'ReplacementOfferApplicantsModal' }).exists()).toBe(true)
  })

  it('actualiza el contador de postulantes en el botón de forma reactiva sin destruir la tabla ni mostrar spinners', async () => {
    const wrapper = mount(ReplacementOffersView, {
      global: {
        stubs: globalStubs,
      },
    })

    await flushPromises()

    // 1. Verificamos que la tabla está presente y no hay spinner
    expect(wrapper.find('table').exists()).toBe(true)
    expect(wrapper.find('.spinner-border').exists()).toBe(false)

    // 2. Botón inicial muestra 2 Postulantes
    let candidateBtn = wrapper.findAll('button').find((b) => b.text().includes('2 Postulantes'))
    expect(candidateBtn).toBeDefined()
    expect(candidateBtn?.classes()).toContain('btn-outline-primary')

    // 3. Simula que llega un evento reactivo de postulación incrementando a 3
    mockOffers.value[0].applicantsCount = 3
    await wrapper.vm.$nextTick()

    // 4. El botón debe reflejar "3 Postulantes" de inmediato
    candidateBtn = wrapper.findAll('button').find((b) => b.text().includes('3 Postulantes'))
    expect(candidateBtn).toBeDefined()
    expect(candidateBtn?.classes()).toContain('btn-outline-primary')

    // 5. La tabla NO se desmontó ni parpadeó con spinners
    expect(wrapper.find('table').exists()).toBe(true)
    expect(wrapper.find('.spinner-border').exists()).toBe(false)

    // 6. Simula retiro de postulaciones dejando en 0
    mockOffers.value[0].applicantsCount = 0
    await wrapper.vm.$nextTick()

    candidateBtn = wrapper.findAll('button').find((b) => b.text().includes('0 Postulantes'))
    expect(candidateBtn).toBeDefined()
    expect(candidateBtn?.classes()).toContain('btn-outline-warning')
    expect(wrapper.find('table').exists()).toBe(true)
    expect(wrapper.find('.spinner-border').exists()).toBe(false)
  })

  it('pasa listaDeTurnos y listaDeServicios al montar ReplacementOfferModalCreate', async () => {
    const wrapper = mount(ReplacementOffersView, {
      global: {
        stubs: globalStubs,
      },
    })

    await flushPromises()

    const createModal = wrapper.findComponent({ name: 'ReplacementOfferModalCreate' })
    expect(createModal.exists()).toBe(true)
    expect(createModal.props('listaDeServicios')).toBeDefined()
    expect(createModal.props('listaDeTurnos')).toBeDefined()
  })
})
