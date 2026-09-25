import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import TurnAssignmentModal from './TurnAssignmentModal.vue'

// Mock VCalendar
vi.mock('v-calendar', () => ({
  DatePicker: {
    name: 'DatePickerStub',
    template: '<div class="date-picker-stub"><slot :inputValue="modelValue" :inputEvents="{}" /></div>',
    props: ['modelValue', 'disabledDates', 'minDate', 'masks', 'popover', 'attributes', 'isRequired', 'color']
  }
}))

// Mock Stores
const mockFetchAssignmentsByUser = vi.fn()
vi.mock('@/stores/turn-assignment.store', () => ({
  useTurnAssignmentStore: () => ({
    fetchAssignmentsByUser: mockFetchAssignmentsByUser
  })
}))

const mockCheckConflicts = vi.fn()
const mockGetFechasAusencia = vi.fn()
vi.mock('@/stores/replacement.store', () => ({
  useReplacementStore: () => ({
    checkConflicts: mockCheckConflicts,
    getFechasAusencia: mockGetFechasAusencia
  })
}))

vi.mock('@/stores/service.store', () => ({
  useServiceStore: () => ({
    services: [{ _id: 'srv-1', nombre: 'Farmacia' }],
    fetchServices: vi.fn().mockResolvedValue([])
  })
}))

vi.mock('@/stores/turn-type.store', () => ({
  useTurnTypeStore: () => ({
    turnTypes: [{ _id: 'tt-1', nombre: 'Turno 4to' }],
    fetchTurnTypes: vi.fn().mockResolvedValue([])
  })
}))

vi.mock('@/stores/staff.store', () => ({
  useStaffStore: () => ({
    searchStaff: vi.fn().mockResolvedValue([]),
    searchResults: []
  })
}))

const ConfirmationModalStub = {
  template: '<div class="confirmation-modal-stub" v-if="visible"><slot /></div>',
  props: ['visible', 'title', 'message']
}

const VSelectStub = {
  template: '<div class="v-select-stub"><slot name="option" :option="{}" /><slot name="selected-option" :option="{}" /></div>',
  props: ['modelValue', 'options', 'label', 'placeholder']
}

describe('TurnAssignmentModal.vue - Disponibilidad y Bloqueo de Fechas (TDD)', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.useFakeTimers()
    vi.setSystemTime(new Date(2026, 8, 17, 10, 0, 0))
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  const defaultProps = {
    visible: true,
    loading: false
  }

  const globalOptions = {
    stubs: {
      ConfirmationModal: ConfirmationModalStub,
      'v-select': VSelectStub,
      Transition: true
    }
  }

  it('debe mantener desbloqueados los días 21 al 30 cuando el funcionario solo tiene turnos del 1 al 20', async () => {
    // Funcionario Omar Barría solo tiene turnos del 1 al 20
    mockFetchAssignmentsByUser.mockResolvedValue([
      {
        _id: 'asg-omar-1',
        staffId: 'staff-omar',
        start_date: '2026-09-01T00:00:00.000Z',
        end_date: '2026-09-20T23:59:59.999Z'
      }
    ])
    // No tiene ausencias activas
    mockCheckConflicts.mockResolvedValue([])
    mockGetFechasAusencia.mockReturnValue([])

    const wrapper = mount(TurnAssignmentModal, {
      props: defaultProps,
      global: globalOptions
    })

    // Simular selección de Omar Barría
    const selectedStaff = {
      _id: 'staff-omar',
      rut: '12.345.678-9',
      firstName: 'Omar',
      lastName: 'Barría'
    }

    // Acceder a la instancia interna y setear selectedUser
    const vm = wrapper.vm as any
    vm.selectedUser = selectedStaff

    // Esperar a que los watchers asíncronos se resuelvan
    await flushPromises()
    await wrapper.vm.$nextTick()

    expect(mockFetchAssignmentsByUser).toHaveBeenCalledWith('staff-omar')

    // Verificar blockedDates
    const blocked = vm.blockedDates
    expect(blocked).toHaveLength(1)
    expect(blocked[0].start.getUTCDate()).toBe(1)
    expect(blocked[0].end.getUTCDate()).toBe(20)

    // El selector de inicio debe posicionarse automáticamente en el día disponible más cercano (21)
    expect(vm.form.start_date.getDate()).toBe(21)

    // Verificar que un rango del 21 al 30 NO genere error de traslape
    vm.form.start_date = new Date(Date.UTC(2026, 8, 21, 12, 0, 0))
    vm.form.end_date = new Date(Date.UTC(2026, 8, 30, 12, 0, 0))
    vm.form.service = 'srv-1'
    vm.form.turn_type = 'Turno 4to'

    const isValid = vm.validateForm()
    expect(isValid).toBe(true)
    expect(vm.errors.start_date).toBeUndefined()
  })

  it('no debe bloquear fechas correspondientes a reemplazos ANULADOS', async () => {
    // Sin asignaciones de turno
    mockFetchAssignmentsByUser.mockResolvedValue([])
    // Reemplazos devueltos por el store excluyen anulados (lista vacía)
    mockCheckConflicts.mockResolvedValue([])
    mockGetFechasAusencia.mockReturnValue([]) // Reemplazo ANULADO del 21 al 30 no genera fechas

    const wrapper = mount(TurnAssignmentModal, {
      props: defaultProps,
      global: globalOptions
    })

    const vm = wrapper.vm as any
    vm.selectedUser = { _id: 'staff-omar', rut: '12.345.678-9', firstName: 'Omar', lastName: 'Barría' }

    await flushPromises()
    await wrapper.vm.$nextTick()

    expect(vm.blockedDates).toHaveLength(0)

    // Puede asignar libremente turnos del 21 al 30
    vm.form.start_date = new Date(Date.UTC(2026, 8, 21, 12, 0, 0))
    vm.form.end_date = new Date(Date.UTC(2026, 8, 30, 12, 0, 0))
    vm.form.service = 'srv-1'
    vm.form.turn_type = 'Turno 4to'

    const isValid = vm.validateForm()
    expect(isValid).toBe(true)
  })
})
