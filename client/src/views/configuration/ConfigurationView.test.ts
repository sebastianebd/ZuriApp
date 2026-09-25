import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import { reactive, ref } from 'vue'
import ConfigurationView from './ConfigurationView.vue'

// Mock router & route
const mockRoute = reactive({
  query: {} as Record<string, string | undefined>
})
const mockReplace = vi.fn()

vi.mock('vue-router', () => ({
  useRoute: () => mockRoute,
  useRouter: () => ({
    replace: mockReplace
  })
}))

// Mock Auth
const mockCan = vi.fn((perm: string) => true)
vi.mock('@/composables/login/useAuth', () => ({
  useAuth: () => ({
    can: mockCan,
    isAuthenticated: ref(true)
  })
}))

// Mock child tab components to simplify testing orchestrator
vi.mock('@/components/config/ServicesConfigTab.vue', () => ({
  default: {
    name: 'ServicesConfigTab',
    template: '<div class="mock-services-tab">Services Tab</div>',
    methods: {
      openCreateModal: vi.fn()
    }
  }
}))

vi.mock('@/components/config/TurnTypesConfigTab.vue', () => ({
  default: {
    name: 'TurnTypesConfigTab',
    template: '<div class="mock-turn-types-tab">Turn Types Tab</div>',
    methods: {
      openCreateModal: vi.fn()
    }
  }
}))

vi.mock('@/components/config/TurnSiglaManagement.vue', () => ({
  default: {
    name: 'TurnSiglaManagement',
    template: '<div class="mock-siglas-tab">Siglas Tab</div>',
    methods: {
      openCreateModal: vi.fn()
    }
  }
}))

vi.mock('@/components/config/RolesConfigTab.vue', () => ({
  default: {
    name: 'RolesConfigTab',
    template: '<div class="mock-roles-tab">Roles Tab</div>',
    methods: {
      openCreateModal: vi.fn()
    }
  }
}))

vi.mock('@/components/config/PositionsConfigTab.vue', () => ({
  default: {
    name: 'PositionsConfigTab',
    template: '<div class="mock-positions-tab">Positions Tab</div>',
    methods: {
      openCreateModal: vi.fn()
    }
  }
}))

describe('ConfigurationView (Épica 4: Configuración Unificada)', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockRoute.query = {}
    mockCan.mockReturnValue(true)
  })

  it('renders all 5 tab buttons when user has full permissions', async () => {
    const wrapper = mount(ConfigurationView)
    await flushPromises()

    const pills = wrapper.findAll('.tab-pill')
    expect(pills.length).toBe(5)
    expect(pills[0].text()).toContain('Servicios')
    expect(pills[1].text()).toContain('Tipos de Turno')
    expect(pills[2].text()).toContain('Leyenda (Siglas)')
    expect(pills[3].text()).toContain('Roles y Accesos')
    expect(pills[4].text()).toContain('Cargos Físicos')
  })

  it('defaults to servicios tab and updates query when no tab param is provided', async () => {
    const wrapper = mount(ConfigurationView)
    await flushPromises()

    expect(mockReplace).toHaveBeenCalledWith(
      expect.objectContaining({
        query: expect.objectContaining({ tab: 'servicios' })
      })
    )
    expect(wrapper.find('.mock-services-tab').exists()).toBe(true)
    expect(wrapper.text()).toContain('Nuevo Servicio')
  })

  it('activates the tab indicated in route.query.tab (deep linking)', async () => {
    mockRoute.query = { tab: 'roles' }
    const wrapper = mount(ConfigurationView)
    await flushPromises()

    expect(wrapper.find('.mock-roles-tab').exists()).toBe(true)
    expect(wrapper.text()).toContain('Nuevo Rol')
  })

  it('switches tab on click and calls router.replace with new tab', async () => {
    const wrapper = mount(ConfigurationView)
    await flushPromises()

    const pills = wrapper.findAll('.tab-pill')
    // Click on "Tipos de Turno" (index 1)
    await pills[1].trigger('click')

    expect(mockReplace).toHaveBeenCalledWith(
      expect.objectContaining({
        query: expect.objectContaining({ tab: 'tipos-turno' })
      })
    )
  })

  it('filters out unauthorized tabs according to Tab-Level RBAC', async () => {
    // Only allow turn-type.view and turn-sigla.view
    mockCan.mockImplementation((perm: string) => {
      return perm === 'turn-type.view' || perm === 'turn-sigla.view'
    })

    const wrapper = mount(ConfigurationView)
    await flushPromises()

    const pills = wrapper.findAll('.tab-pill')
    expect(pills.length).toBe(2)
    expect(pills[0].text()).toContain('Tipos de Turno')
    expect(pills[1].text()).toContain('Leyenda (Siglas)')
  })

  it('falls back to first authorized tab if route.query.tab is unauthorized', async () => {
    mockRoute.query = { tab: 'servicios' } // not authorized
    mockCan.mockImplementation((perm: string) => {
      return perm === 'role.view' || perm === 'role.create'
    })

    const wrapper = mount(ConfigurationView)
    await flushPromises()

    expect(wrapper.find('.mock-roles-tab').exists()).toBe(true)
    expect(mockReplace).toHaveBeenCalledWith(
      expect.objectContaining({
        query: expect.objectContaining({ tab: 'roles' })
      })
    )
  })
})
