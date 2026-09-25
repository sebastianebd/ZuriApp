import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { reactive, ref } from 'vue'
import CurrentShiftsView from './CurrentShiftsView.vue'

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

// Mock useCurrentShifts composable
const mockIsPastMonth = ref(false)
const mockHasCreatePermission = ref(true)

vi.mock('@/composables/current-shifts/useCurrentShifts', () => ({
  useCurrentShifts: () => ({
    showModal: ref(false),
    selectedService: ref('srv-1'),
    serviceOptions: ref([{ nombre: 'FARMACIA', _id: 'srv-1' }]),
    alertComponent: ref(null),
    tooltipState: reactive({ show: false, style: {}, content: '' }),
    formattedMonth: ref('septiembre de 2026'),
    daysInMonth: ref([
      { date: new Date(2026, 8, 1), timestamp: 1, dayNum: 1, dayName: 'M' }
    ]),
    canGoNext: ref(false),
    isPastMonth: mockIsPastMonth,
    nextMonth: vi.fn(),
    prevMonth: vi.fn(),
    openModal: vi.fn(),
    closeModal: vi.fn(),
    loading: ref(false),
    filteredShifts: ref([]),
    getShiftStyle: vi.fn(() => ({})),
    getShiftClass: vi.fn(() => ''),
    isToday: vi.fn(() => false),
    isWeekend: vi.fn(() => false),
    isRecentlyModified: vi.fn(() => false),
    isEditableDate: vi.fn(() => true),
    hasException: vi.fn(() => false),
    hasUpdatePermission: ref(true),
    hasCreatePermission: mockHasCreatePermission,
    loadingExceptions: ref(false),
    loadingAssignments: ref(false),
    showModifyModal: ref(false),
    selectedShiftData: ref(null),
    handleCellClick: vi.fn(),
    handleSaveException: vi.fn(),
    handleRestorePattern: vi.fn(),
    showTooltip: vi.fn(),
    hideTooltip: vi.fn(),
    loadData: vi.fn(),
    handleSaveAssignment: vi.fn(),
    handleDeleteAssignment: vi.fn(),
    selectedServiceName: ref('FARMACIA')
  })
}))

// Mock sub-components
vi.mock('@/components/shifts/ShiftExceptionsTab.vue', () => ({
  default: {
    name: 'ShiftExceptionsTab',
    template: '<div class="mock-shift-exceptions-tab">Mock Exceptions Tab</div>',
    methods: {
      clearFilters: vi.fn()
    }
  }
}))

vi.mock('@/components/shifts/TurnAssignmentModal.vue', () => ({
  default: { template: '<div></div>' }
}))

vi.mock('@/components/shifts/ShiftModificationModal.vue', () => ({
  default: { template: '<div></div>' }
}))

vi.mock('@/components/shifts/ShiftCell.vue', () => ({
  default: { template: '<div class="mock-shift-cell"></div>' }
}))

vi.mock('@/components/common/AlertMessage.vue', () => ({
  default: { template: '<div></div>' }
}))

const mountComponent = () =>
  mount(CurrentShiftsView, {
    global: {
      stubs: {
        'v-select': { template: '<div class="v-select-mock"><slot name="no-options" /></div>' }
      }
    }
  })

describe('CurrentShiftsView (Épica 2: Turnos & Excepciones)', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockRoute.query = {}
    mockIsPastMonth.value = false
    mockHasCreatePermission.value = true
  })

  it('renders Grilla Mensual by default when no tab query is present', () => {
    const wrapper = mountComponent()

    expect(wrapper.text()).toContain('Grilla Mensual')
    expect(wrapper.text()).toContain('Excepciones Vigentes')
    expect(wrapper.find('.shift-table').exists()).toBe(true)
    expect(wrapper.find('.mock-shift-exceptions-tab').exists()).toBe(false)
  })

  it('switches to Excepciones Vigentes tab when clicked and updates router query', async () => {
    const wrapper = mountComponent()

    // Find tab buttons
    const buttons = wrapper.findAll('.btn-group button')
    const excepcionesBtn = buttons.find(b => b.text().includes('Excepciones Vigentes'))
    expect(excepcionesBtn).toBeDefined()

    await excepcionesBtn!.trigger('click')

    expect(mockRouter.replace).toHaveBeenCalledWith({
      query: { tab: 'excepciones' }
    })
  })

  it('renders ShiftExceptionsTab component when query tab is excepciones', async () => {
    mockRoute.query = { tab: 'excepciones' }
    const wrapper = mountComponent()

    expect(wrapper.find('.mock-shift-exceptions-tab').exists()).toBe(true)
    expect(wrapper.find('.shift-table').exists()).toBe(false)
    expect(wrapper.text()).toContain('Fiscalización y registro de modificaciones')
  })

  it('displays period closed banner and hides Asignar Planta button when isPastMonth is true', async () => {
    mockIsPastMonth.value = true
    const wrapper = mountComponent()

    // Banner should be visible
    expect(wrapper.text()).toContain('Período Histórico / Cerrado')
    expect(wrapper.text()).toContain('modo consulta')

    // Asignar Planta button should NOT be visible
    const buttons = wrapper.findAll('button')
    const asignarBtn = buttons.find(b => b.text().includes('Asignar Planta'))
    expect(asignarBtn).toBeUndefined()
  })

  it('shows Asignar Planta button when in current/future month and hasCreatePermission is true', () => {
    mockIsPastMonth.value = false
    mockHasCreatePermission.value = true
    const wrapper = mountComponent()

    expect(wrapper.text()).toContain('Asignar Planta')
    expect(wrapper.text()).not.toContain('Período Histórico / Cerrado')
  })
})
