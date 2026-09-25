import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import { reactive, ref } from 'vue'
import ShiftRecordsView from './ShiftRecordsView.vue'

// Mock router & route
const mockRoute = reactive({
  query: {} as Record<string, string | undefined>
})
const mockPush = vi.fn()

vi.mock('vue-router', () => ({
  useRoute: () => mockRoute,
  useRouter: () => ({
    push: mockPush
  })
}))

// Mock Stores
const dummyStaffList = [
  { _id: 'staff-1', firstName: 'CARLOS', lastName: 'SILVA', rut: '11.111.111-1' },
  { _id: 'staff-2', firstName: 'ANA', lastName: 'TORRES', rut: '22.222.222-2' }
]

const mockStaffStore = {
  searchStaff: vi.fn().mockResolvedValue(dummyStaffList),
  getStaffById: vi.fn((id: string) => {
    const found = dummyStaffList.find(s => s._id === id)
    return Promise.resolve(found || null)
  })
}

vi.mock('../../stores/staff.store', () => ({
  useStaffStore: () => mockStaffStore
}))

const mockReportStore = {
  reportData: null,
  currentFilters: { userId: '', month: 1, year: 2026 },
  fetchReportSummary: vi.fn().mockResolvedValue({})
}

vi.mock('../../stores/report.store', () => ({
  useReportStore: () => mockReportStore
}))

vi.mock('../../stores/turn-sigla.store', () => ({
  useTurnSiglaStore: () => ({
    fetchSiglas: vi.fn().mockResolvedValue([]),
    mapSiglaToNombre: vi.fn((s: string) => s)
  })
}))

vi.mock('../../stores/replacement.store', () => ({
  useReplacementStore: () => ({
    fetchActiveReplacementsPaginated: vi.fn().mockResolvedValue([]),
    getFechasAusencia: vi.fn().mockReturnValue([])
  })
}))

vi.mock('../../stores/service.store', () => ({
  useServiceStore: () => ({
    fetchServices: vi.fn().mockResolvedValue([]),
    getServiceName: vi.fn(() => 'Urgencias')
  })
}))

vi.mock('../../plugins/socket', () => ({
  default: {
    connected: true,
    connect: vi.fn(),
    on: vi.fn(),
    off: vi.fn()
  }
}))

vi.mock('vue-select', () => ({
  default: {
    name: 'v-select',
    props: ['modelValue', 'options'],
    template: '<div class="v-select-mock"></div>'
  }
}))

describe('ShiftRecordsView (Épica 3: Ficha de Turnos Deep Link)', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockRoute.query = {}
    mockReportStore.reportData = null
  })

  it('renders "Volver a Funcionarios" navigation button and navigates to personal-staff on click', async () => {
    const wrapper = mount(ShiftRecordsView)
    await flushPromises()

    const backButton = wrapper.find('button[title="Regresar al listado de funcionarios"]')
    expect(backButton.exists()).toBe(true)
    expect(backButton.text()).toContain('Volver a Funcionarios')

    await backButton.trigger('click')
    expect(mockPush).toHaveBeenCalledWith({ name: 'personal-staff' })
  })

  it('automatically preselects staff member when route.query.staffId is present', async () => {
    mockRoute.query = { staffId: 'staff-2' }

    mount(ShiftRecordsView)
    await flushPromises()

    // It should have loaded staff list and auto-selected staff-2
    expect(mockStaffStore.searchStaff).toHaveBeenCalled()
    expect(mockReportStore.fetchReportSummary).toHaveBeenCalled()
    expect(mockReportStore.currentFilters.userId).toBe('staff-2')
  })

  it('renders profile card and totals safely without crashing when backend returns staff object (no IStaff)', async () => {
    mockRoute.query = { staffId: 'staff-1' }
    // Simulate backend response with `staff` structure (not IStaff)
    ;(mockReportStore as any).reportData = {
      staff: {
        _id: 'staff-1',
        nombre: 'CARLOS',
        apellido: 'SILVA',
        rut: '11.111.111-1',
        cargo: 'ENFERMERO'
      },
      totals: {
        hours: 160,
        dayHours: 120,
        nightHours: 40
      },
      serviceStats: [
        { serviceName: 'service-1', stats: { hours: 160 } }
      ],
      timeline: []
    }

    const wrapper = mount(ShiftRecordsView)
    await flushPromises()

    const profileCard = wrapper.find('.profile-card')
    expect(profileCard.exists()).toBe(true)
    expect(profileCard.find('.avatar-placeholder').text()).toBe('CS')
    expect(profileCard.find('.profile-info h3').text()).toBe('CARLOS SILVA')
    expect(profileCard.find('.profile-info .role').text()).toBe('ENFERMERO')
    expect(profileCard.find('.profile-info .meta').text()).toBe('11.111.111-1')

    const kpiGrid = wrapper.find('.kpi-grid')
    expect(kpiGrid.exists()).toBe(true)
    expect(kpiGrid.text()).toContain('160')
  })

  it('renders informative empty state "Sin turnos asignados" when staff is selected but reportData is null', async () => {
    mockRoute.query = { staffId: 'staff-2' }
    mockReportStore.reportData = null

    const wrapper = mount(ShiftRecordsView)
    await flushPromises()

    expect(wrapper.text()).toContain('Sin turnos asignados')
    expect(wrapper.text()).not.toContain('Seleccione un funcionario')
  })
})
