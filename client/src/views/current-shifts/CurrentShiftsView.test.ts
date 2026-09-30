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
const mockLoading = ref(false)
const mockFilteredShifts = ref<any[]>([])
const mockTurnSiglas = ref<any[]>([
  { sigla: 'L', nombre: 'Largo', color: '#fef08a', activo: true },
  { sigla: 'N', nombre: 'Noche', color: '#bae6fd', activo: true },
  { sigla: 'X', nombre: 'Libre', color: '#bbf7d0', activo: true }
])

vi.mock('@/composables/current-shifts/useCurrentShifts', () => ({
  useCurrentShifts: () => ({
    showModal: ref(false),
    selectedService: ref('srv-1'),
    serviceOptions: ref([{ nombre: 'FARMACIA', _id: 'srv-1' }]),
    alertComponent: ref(null),
    tooltipState: reactive({ show: false, style: {}, content: '' }),
    currentDate: ref(new Date(2026, 8, 1)),
    currentMonth: ref(8),
    currentYear: ref(2026),
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
    loading: mockLoading,
    filteredShifts: mockFilteredShifts,
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
    selectedServiceName: ref('FARMACIA'),
    turnSiglas: mockTurnSiglas,
    recentlyModifiedCell: ref(null),
    exceptionStore: {
      exceptions: ref([]),
      loading: ref(false),
      deleteException: vi.fn()
    },
    serviceStore: {
      getServiceName: vi.fn(() => 'FARMACIA'),
      isServiceMatch: vi.fn((s1, s2) => s1 === s2)
    }
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

vi.mock('@/components/shifts/ShiftExceptionsDrawer.vue', () => ({
  default: {
    name: 'ShiftExceptionsDrawer',
    props: ['modelValue', 'currentServiceId', 'currentServiceName', 'currentMonthDate', 'hasUpdatePermission', 'readonly'],
    template: '<div v-if="modelValue" class="mock-shift-exceptions-drawer">Mock Exceptions Drawer</div>'
  }
}))

vi.mock('@/components/shifts/TurnAssignmentModal.vue', () => ({
  default: { template: '<div></div>' }
}))

vi.mock('@/components/shifts/ShiftModificationModal.vue', () => ({
  default: { template: '<div></div>' }
}))

vi.mock('@/components/shifts/StaffShiftSheetModal.vue', () => ({
  default: {
    name: 'StaffShiftSheetModal',
    props: ['visible', 'staff'],
    template: '<div v-if="visible" class="mock-staff-sheet-modal">Mock Sheet</div>'
  }
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
    mockLoading.value = false
    mockFilteredShifts.value = []
    mockTurnSiglas.value = [
      { sigla: 'L', nombre: 'Largo', color: '#fef08a', activo: true },
      { sigla: 'N', nombre: 'Noche', color: '#bae6fd', activo: true },
      { sigla: 'X', nombre: 'Libre', color: '#bbf7d0', activo: true }
    ]
  })

  it('renders Grilla Mensual by default and provides trigger for Excepciones Vigentes drawer', () => {
    const wrapper = mountComponent()

    expect(wrapper.text()).toContain('Excepciones Vigentes')
    expect(wrapper.find('.shift-table').exists()).toBe(true)
    expect(wrapper.find('.mock-shift-exceptions-drawer').exists()).toBe(false)
  })

  it('opens Excepciones Vigentes drawer when trigger button is clicked without unmounting the shift grid', async () => {
    const wrapper = mountComponent()

    const triggerBtn = wrapper.find('[data-test="exceptions-drawer-trigger"]')
    expect(triggerBtn.exists()).toBe(true)

    await triggerBtn.trigger('click')

    expect(wrapper.find('.mock-shift-exceptions-drawer').exists()).toBe(true)
    expect(wrapper.find('.shift-table').exists()).toBe(true) // Grid remains visible!
  })

  it('opens Excepciones Vigentes drawer when query tab is excepciones while keeping shift grid visible', async () => {
    mockRoute.query = { tab: 'excepciones' }
    const wrapper = mountComponent()

    expect(wrapper.find('.mock-shift-exceptions-drawer').exists()).toBe(true)
    expect(wrapper.find('.shift-table').exists()).toBe(true)
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

  it('muestra el overlay de carga anti-flicker cuando loading es true', () => {
    mockLoading.value = true
    const wrapper = mountComponent()

    const overlay = wrapper.find('.grid-loading-overlay')
    expect(overlay.exists()).toBe(true)
    expect(overlay.find('.spinner-border').exists()).toBe(true)
    expect(overlay.text()).toContain('Cargando programación...')
  })

  it('no muestra el overlay de carga cuando loading es false', () => {
    mockLoading.value = false
    const wrapper = mountComponent()

    expect(wrapper.find('.grid-loading-overlay').exists()).toBe(false)
  })

  it('separa la navegación de mes en una cápsula independiente y el botón Asignar Planta como acción desacoplada', () => {
    mockIsPastMonth.value = false
    mockHasCreatePermission.value = true
    const wrapper = mountComponent()

    const monthCapsule = wrapper.find('.month-navigator-capsule')
    expect(monthCapsule.exists()).toBe(true)

    // El botón Asignar Planta NO debe vivir dentro de la cápsula del selector de meses
    expect(monthCapsule.find('.btn-asignar-planta').exists()).toBe(false)

    // Pero sí debe existir como acción independiente en la vista
    const asignarBtn = wrapper.find('.btn-asignar-planta')
    expect(asignarBtn.exists()).toBe(true)
    expect(asignarBtn.text()).toContain('Asignar Planta')
  })

  it('integra el selector de servicio dentro del pod con icono clínico y estructura cohesiva', () => {
    const wrapper = mountComponent()

    const servicePod = wrapper.find('.service-select-pod')
    expect(servicePod.exists()).toBe(true)
    expect(servicePod.find('.service-prefix-icon').exists()).toBe(true)
  })

  it('renderiza dinámicamente las referencias de turnos desde el catálogo incluyendo turnos personalizados como Guardia (G) en rojo', () => {
    mockFilteredShifts.value = [
      {
        _id: 'staff-1',
        nombre: 'Carlos',
        apellido: 'Méndez',
        cargo: 'Médico Urgencias',
        servicio: 'srv-1',
        tipo_turno: 'Guardia',
        fecha_inicio: '2026-09-01',
        userId: 'u1',
        getShift: () => null
      }
    ]
    mockTurnSiglas.value = [
      { sigla: 'G', nombre: 'Guardia', color: '#dc2626', activo: true },
      { sigla: 'L', nombre: 'Largo', color: '#fef08a', activo: true }
    ]

    const wrapper = mountComponent()

    const legendBar = wrapper.find('.shifts-legend-bar')
    expect(legendBar.exists()).toBe(true)
    expect(legendBar.text()).toContain('Guardia')
    expect(legendBar.text()).toContain('Largo')
    expect(legendBar.text()).toContain('G')
    expect(legendBar.text()).toContain('Reemplazo')

    // Find the chip with 'G' and verify its dynamic style
    const chips = legendBar.findAll('.legend-chip')
    const guardiaChip = chips.find(c => c.text() === 'G')
    expect(guardiaChip).toBeDefined()
    expect(guardiaChip?.attributes('style')).toContain('background-color: #dc2626')
    // Text color should be white on dark red
    expect(guardiaChip?.attributes('style')).toContain('color: #ffffff')
  })

  describe('Buscador en tiempo real, Filtro por Cargo y Agrupación Seccional (TDD)', () => {
    const sampleStaff = [
      {
        _id: 's1',
        nombre: 'Omar',
        apellido: 'Barria',
        cargo: 'TENS',
        servicio: 'srv-1',
        tipo_turno: '4to Turno',
        fecha_inicio: '2026-09-01',
        userId: 'u1',
        getShift: () => null
      },
      {
        _id: 's2',
        nombre: 'Rumina',
        apellido: 'Garcia',
        cargo: 'TENS',
        servicio: 'srv-1',
        tipo_turno: '4to Turno',
        fecha_inicio: '2026-09-01',
        userId: 'u2',
        getShift: () => null
      },
      {
        _id: 's3',
        nombre: 'Ana',
        apellido: 'Torres',
        cargo: 'Médico',
        servicio: 'srv-1',
        tipo_turno: 'Diurno',
        fecha_inicio: '2026-09-01',
        userId: 'u3',
        getShift: () => null
      }
    ]

    it('filtra funcionarios en tiempo real a través del input de búsqueda', async () => {
      mockFilteredShifts.value = sampleStaff
      const wrapper = mountComponent()

      const searchInput = wrapper.find('.search-input-field')
      expect(searchInput.exists()).toBe(true)

      await searchInput.setValue('Omar')

      expect(wrapper.text()).toContain('Omar Barria')
      expect(wrapper.text()).not.toContain('Rumina Garcia')
      expect(wrapper.text()).not.toContain('Ana Torres')
    })

    it('filtra funcionarios por estamento o cargo seleccionado', async () => {
      mockFilteredShifts.value = sampleStaff
      const wrapper = mountComponent()

      const cargoSelect = wrapper.find('.cargo-v-select')
      expect(cargoSelect.exists()).toBe(true)

      // El wrapper tiene expuesto o reactivo selectedCargo
      const vm = wrapper.vm as any
      vm.selectedCargo = 'Médico'
      await wrapper.vm.$nextTick()

      expect(wrapper.text()).toContain('Ana Torres')
      expect(wrapper.text()).not.toContain('Omar Barria')
      expect(wrapper.text()).not.toContain('Rumina Garcia')
    })

    it('agrupa los funcionarios en secciones por cargo con subtotales y permite colapsar/expandir', async () => {
      mockFilteredShifts.value = sampleStaff
      const wrapper = mountComponent()

      const groupHeaders = wrapper.findAll('.cargo-group-header-row')
      expect(groupHeaders.length).toBe(2) // 'Médico' y 'TENS'

      // Subtotales
      const headerTexts = groupHeaders.map(h => h.text().toUpperCase())
      expect(headerTexts.some(t => t.includes('MÉDICO') && t.includes('1'))).toBe(true)
      expect(headerTexts.some(t => t.includes('TENS') && t.includes('2'))).toBe(true)

      // Verificamos que inicialmente se ven los funcionarios
      expect(wrapper.text()).toContain('Omar Barria')
      expect(wrapper.text()).toContain('Rumina Garcia')

      // Colapsamos el grupo TENS
      const tensHeader = groupHeaders.find(h => h.text().includes('TENS'))
      expect(tensHeader).toBeDefined()
      await tensHeader!.trigger('click')

      // Omar y Rumina ya no deben estar visibles en el DOM
      expect(wrapper.text()).not.toContain('Omar Barria')
      expect(wrapper.text()).not.toContain('Rumina Garcia')
      // Ana (Médico) sigue visible
      expect(wrapper.text()).toContain('Ana Torres')

      // Expandimos nuevamente el grupo TENS
      await tensHeader!.trigger('click')
      expect(wrapper.text()).toContain('Omar Barria')
      expect(wrapper.text()).toContain('Rumina Garcia')
    })

    it('ubica el badge contador de funcionarios junto al título de Gestión de Turnos liberando espacio en el toolbar de filtros', async () => {
      mockFilteredShifts.value = sampleStaff
      const wrapper = mountComponent()

      // El badge debe estar dentro del bloque de título del encabezado principal
      const headerTitleBlock = wrapper.find('.header-title-block')
      expect(headerTitleBlock.exists()).toBe(true)
      const badgeInHeader = headerTitleBlock.find('.service-badge-counter')
      expect(badgeInHeader.exists()).toBe(true)
      expect(badgeInHeader.text()).toContain('3')
      expect(badgeInHeader.text()).toContain('en servicio')

      // El toolbar de filtros NO debe contener el badge para dar más holgura a los inputs
      const serviceFilterWrapper = wrapper.find('.service-filter-wrapper')
      expect(serviceFilterWrapper.exists()).toBe(true)
      expect(serviceFilterWrapper.find('.service-badge-counter').exists()).toBe(false)
    })

    it('abre el modal de ficha de turnos al hacer clic en el botón hover del funcionario', async () => {
      mockFilteredShifts.value = sampleStaff
      const wrapper = mountComponent()

      expect(wrapper.find('.mock-staff-sheet-modal').exists()).toBe(false)

      const sheetButtons = wrapper.findAll('.btn-staff-sheet-hover')
      expect(sheetButtons.length).toBeGreaterThan(0)

      await sheetButtons[0].trigger('click')

      expect(wrapper.find('.mock-staff-sheet-modal').exists()).toBe(true)
    })
  })
})



