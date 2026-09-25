import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { reactive, ref } from 'vue'
import ActiveReplacementsView from './ActiveReplacementsView.vue'

// Mock router & route
const mockRoute = reactive({
  query: {} as Record<string, string | undefined>
})
const mockRouter = {
  replace: vi.fn((to: any) => {
    mockRoute.query = { ...to.query }
  })
}

vi.mock('vue-router', () => ({
  useRoute: () => mockRoute,
  useRouter: () => mockRouter
}))

// Mock Auth Store
const mockAuthStore = {
  hasPermission: vi.fn(() => true)
}
vi.mock('@/stores/auth.store', () => ({
  useAuthStore: () => mockAuthStore
}))

// Mock useReplacements composable
const mockStore = {
  reemplazosFiltrados: [],
  limpiarFiltros: vi.fn(),
  cargando: false
}
vi.mock('@/composables/active-replacements/useActiveReplacements', () => ({
  useReplacements: () => ({
    replacementStore: mockStore,
    paginatedReplacements: [],
    currentPage: ref(1),
    totalPages: ref(1),
    changePage: vi.fn(),
    listaDeTurnos: ref([]),
    listaDeServicios: ref([]),
    fechasOcupadas: ref([]),
    updateModalVisible: ref(false),
    createModalVisible: ref(false),
    substituteModalVisible: ref(false),
    registroActual: ref({}),
    registroNuevo: ref({}),
    nuevoEntranteSustitucion: ref(null),
    fechaCorteSustitucion: ref(''),
    closeUpdateModal: vi.fn(),
    closeCreateModal: vi.fn(),
    closeSubstituteModal: vi.fn(),
    initCreateReplacement: vi.fn(),
    initUpdateReplacement: vi.fn(),
    guardarNuevoReemplazo: vi.fn(),
    handleFinalizar: vi.fn(),
    handleAnular: vi.fn(),
    handleUpdate: vi.fn(),
    handleSustitucion: vi.fn(),
    confirmarSustitucion: vi.fn()
  })
}))

// Mock subcomponents
vi.mock('@/components/replacements', () => ({
  ReplacementFilter: { name: 'ReplacementFilter', template: '<div class="mock-filter"></div>' },
  ReplacementTable: { name: 'ReplacementTable', template: '<div class="mock-table"></div>' },
  ReplacementModalUpdate: { name: 'ReplacementModalUpdate', template: '<div></div>' },
  ReplacementModalCreate: { name: 'ReplacementModalCreate', template: '<div></div>' },
  ReplacementModalSubstitute: { name: 'ReplacementModalSubstitute', template: '<div></div>' },
  ReplacementCalendarTab: { name: 'ReplacementCalendarTab', template: '<div class="mock-calendar-tab"></div>' }
}))
vi.mock('@/components/common/TableLoader.vue', () => ({
  default: { name: 'TableLoader', template: '<div></div>' }
}))
vi.mock('@/components/common/AppPagination.vue', () => ({
  default: { name: 'AppPagination', template: '<div></div>' }
}))

describe('ActiveReplacementsView - Consolidated Navigation', () => {
  beforeEach(() => {
    mockRoute.query = {}
    vi.clearAllMocks()
  })

  const routerLinkStub = {
    name: 'RouterLink',
    props: ['to'],
    template: '<a :href="to"><slot /></a>',
  }

  it('debería renderizar la Vista Tabla por defecto cuando no hay query view', () => {
    const wrapper = mount(ActiveReplacementsView, {
      global: { stubs: { 'router-link': routerLinkStub } },
    })

    expect(wrapper.find('.mock-filter').exists()).toBe(true)
    expect(wrapper.find('.mock-calendar-tab').exists()).toBe(false)
    expect(wrapper.text()).toContain('Tabla')
    expect(wrapper.text()).toContain('Calendario')
    expect(wrapper.text()).toContain('Nuevo Reemplazo')
  })

  it('debería renderizar la Vista Calendario cuando view=calendar', () => {
    mockRoute.query = { view: 'calendar' }
    const wrapper = mount(ActiveReplacementsView, {
      global: { stubs: { 'router-link': routerLinkStub } },
    })

    expect(wrapper.find('.mock-calendar-tab').exists()).toBe(true)
    expect(wrapper.find('.mock-filter').exists()).toBe(false)
  })

  it('debería invocar router.replace al hacer clic en el botón Calendario', async () => {
    const wrapper = mount(ActiveReplacementsView, {
      global: { stubs: { 'router-link': routerLinkStub } },
    })

    const buttons = wrapper.findAll('button')
    const calendarBtn = buttons.find((b) => b.text().includes('Calendario'))
    expect(calendarBtn).toBeDefined()

    await calendarBtn!.trigger('click')

    expect(mockRouter.replace).toHaveBeenCalledWith({
      query: { view: 'calendar' }
    })
  })

  it('debería invocar router.replace al volver a la vista Tabla', async () => {
    mockRoute.query = { view: 'calendar' }
    const wrapper = mount(ActiveReplacementsView, {
      global: { stubs: { 'router-link': routerLinkStub } },
    })

    const buttons = wrapper.findAll('button')
    const tableBtn = buttons.find((b) => b.text().includes('Tabla'))
    expect(tableBtn).toBeDefined()

    await tableBtn!.trigger('click')

    expect(mockRouter.replace).toHaveBeenCalledWith({
      query: { view: undefined }
    })
  })
})
