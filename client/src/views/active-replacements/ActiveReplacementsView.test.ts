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
  ReplacementCoverageModal: {
    name: 'ReplacementCoverageModal',
    props: ['visible'],
    template: '<div v-if="visible" class="mock-coverage-modal"></div>'
  }
}))
vi.mock('@/components/common/TableLoader.vue', () => ({
  default: { name: 'TableLoader', template: '<div></div>' }
}))
vi.mock('@/components/common/AppPagination.vue', () => ({
  default: { name: 'AppPagination', template: '<div></div>' }
}))

describe('ActiveReplacementsView - Navigation & Coverage Modal', () => {
  beforeEach(() => {
    mockRoute.query = {}
    vi.clearAllMocks()
  })

  const routerLinkStub = {
    name: 'RouterLink',
    props: ['to'],
    template: '<a :href="to"><slot /></a>',
  }

  it('debería renderizar la Vista Tabla con el botón Mapa de Cobertura', () => {
    const wrapper = mount(ActiveReplacementsView, {
      global: { stubs: { 'router-link': routerLinkStub } },
    })

    expect(wrapper.find('.mock-filter').exists()).toBe(true)
    expect(wrapper.find('.mock-coverage-modal').exists()).toBe(false)
    expect(wrapper.text()).toContain('Mapa de Cobertura')
    expect(wrapper.text()).toContain('Nuevo Reemplazo')
  })

  it('debería abrir el modal de cobertura al hacer clic en el botón Mapa de Cobertura', async () => {
    const wrapper = mount(ActiveReplacementsView, {
      global: { stubs: { 'router-link': routerLinkStub } },
    })

    expect(wrapper.find('.mock-coverage-modal').exists()).toBe(false)

    const coverageBtn = wrapper.find('.coverage-btn')
    expect(coverageBtn.exists()).toBe(true)

    await coverageBtn.trigger('click')

    expect(wrapper.find('.mock-coverage-modal').exists()).toBe(true)
  })

  it('debería abrir automáticamente el modal y limpiar el query si view=calendar', async () => {
    mockRoute.query = { view: 'calendar' }
    const wrapper = mount(ActiveReplacementsView, {
      global: { stubs: { 'router-link': routerLinkStub } },
    })

    await wrapper.vm.$nextTick()

    expect(wrapper.find('.mock-coverage-modal').exists()).toBe(true)
    expect(mockRouter.replace).toHaveBeenCalledWith({
      query: { view: undefined }
    })
  })
})
