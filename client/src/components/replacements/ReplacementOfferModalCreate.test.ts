import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import ReplacementOfferModalCreate from './ReplacementOfferModalCreate.vue'
import { MOTIVOS_AUSENCIA_LABELS } from '@/types/replacement.types'

// Mock v-calendar
vi.mock('v-calendar', () => ({
  DatePicker: {
    name: 'DatePickerStub',
    template: '<div class="date-picker-stub"><slot :inputValue="modelValue" :inputEvents="{}" /></div>',
    props: ['modelValue', 'disabledDates', 'minDate', 'masks', 'popover', 'attributes', 'isRequired', 'color']
  }
}))

// Mock useDatePicker composable
vi.mock('@/composables/useDatePicker', () => ({
  useDatePicker: () => ({
    popoverConfig: {},
    dateAttributes: [],
    isDisabled: []
  })
}))

// Mock Stores
const mockSearchStaff = vi.fn().mockResolvedValue([])
vi.mock('@/stores/staff.store', () => ({
  useStaffStore: () => ({
    searchResults: [],
    searchStaff: mockSearchStaff
  })
}))

const mockFetchAssignmentsByUser = vi.fn().mockResolvedValue([])
vi.mock('@/stores/turn-assignment.store', () => ({
  useTurnAssignmentStore: () => ({
    fetchAssignmentsByUser: mockFetchAssignmentsByUser
  })
}))

vi.mock('@/stores/replacement.store', () => ({
  useReplacementStore: () => ({
    checkConflicts: vi.fn().mockResolvedValue([]),
    getFechasAusencia: vi.fn().mockReturnValue([]),
    getFechasOcupadas: vi.fn().mockReturnValue([])
  })
}))

const mockCreateOffer = vi.fn().mockResolvedValue({ success: true, data: { id: 'offer-123' } })
vi.mock('@/stores/replacement-offer.store', () => ({
  useReplacementOfferStore: () => ({
    createOffer: mockCreateOffer,
    loading: false,
    error: null
  })
}))

vi.mock('@/stores/service.store', () => ({
  useServiceStore: () => ({
    services: [{ _id: 'srv-1', nombre: 'Urgencia' }],
    fetchServices: vi.fn().mockResolvedValue([]),
  })
}))

vi.mock('@/stores/turn-type.store', () => ({
  useTurnTypeStore: () => ({
    turnTypes: [{ nombre: 'Cuarto Turno' }],
    fetchTurnTypes: vi.fn().mockResolvedValue([]),
  })
}))

// Stubs
const ConfirmationModalStub = {
  template: '<div class="confirmation-modal-stub" v-if="visible"><slot /></div>',
  props: ['visible', 'mensaje']
}

const VSelectStub = {
  template: '<div class="v-select-stub"><slot name="option" :option="{}" /><slot name="selected-option" :option="{}" /></div>',
  props: ['modelValue', 'options', 'label', 'placeholder']
}

describe('ReplacementOfferModalCreate.vue - TDD Suite', () => {
  const defaultProps = {
    visible: true,
    listaDeTurnos: ['Cuarto Turno', 'Tercer Turno', 'Diurno'],
    listaDeServicios: [{ _id: 'srv-1', nombre: 'Urgencia' }, { _id: 'srv-2', nombre: 'Pediatría' }],
    fechasBloqueadas: []
  }

  const globalOptions = {
    stubs: {
      ConfirmationModal: ConfirmationModalStub,
      'v-select': VSelectStub,
      Transition: true
    }
  }

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('debe renderizarse cuando visible es true con título de convocatoria en bolsa', () => {
    const wrapper = mount(ReplacementOfferModalCreate, {
      props: defaultProps,
      global: globalOptions
    })

    expect(wrapper.text()).toContain('Publicar en Bolsa de Reemplazos')
    expect(wrapper.find('[data-testid="offer-expiration-presets"]').exists()).toBe(true)
  })

  it('debe renderizar el selector desplegable con las 8 causales oficiales de ausencia', () => {
    const wrapper = mount(ReplacementOfferModalCreate, {
      props: defaultProps,
      global: globalOptions
    })

    const select = wrapper.find('[data-testid="offer-motivo-select"]')
    expect(select.exists()).toBe(true)

    const options = select.findAll('option')
    // 8 motivos + placeholder disabled = 9
    expect(options.length).toBe(9)

    Object.values(MOTIVOS_AUSENCIA_LABELS).forEach((label) => {
      expect(select.text()).toContain(label)
    })
  })

  it('debe contener los presets de tiempo ergonómicos (2h, 4h, Fin del día, Personalizado)', async () => {
    const wrapper = mount(ReplacementOfferModalCreate, {
      props: defaultProps,
      global: globalOptions
    })

    const presetsContainer = wrapper.find('[data-testid="offer-expiration-presets"]')
    expect(presetsContainer.exists()).toBe(true)

    expect(presetsContainer.text()).toContain('2 horas')
    expect(presetsContainer.text()).toContain('4 horas')
    expect(presetsContainer.text()).toContain('Fin del día')
    expect(presetsContainer.text()).toContain('Personalizado')
  })

  it('debe cambiar el preset de vencimiento al hacer clic', async () => {
    const wrapper = mount(ReplacementOfferModalCreate, {
      props: defaultProps,
      global: globalOptions
    })

    const vm = wrapper.vm as any
    expect(vm.expirationPreset).toBe('2h')

    const btn4h = wrapper.findAll('button').find((b) => b.text().includes('4 horas'))
    expect(btn4h).toBeDefined()
    await btn4h!.trigger('click')

    expect(vm.expirationPreset).toBe('4h')
  })

  it('debe mostrar input datetime-local cuando el preset es Personalizado', async () => {
    const wrapper = mount(ReplacementOfferModalCreate, {
      props: defaultProps,
      global: globalOptions
    })

    const vm = wrapper.vm as any
    vm.expirationPreset = 'custom'
    await wrapper.vm.$nextTick()

    const customInput = wrapper.find('[data-testid="custom-expires-at-input"]')
    expect(customInput.exists()).toBe(true)
  })

  it('debe exigir observaciones cuando el motivo seleccionado es OTRO', async () => {
    const wrapper = mount(ReplacementOfferModalCreate, {
      props: defaultProps,
      global: globalOptions
    })

    const vm = wrapper.vm as any
    vm.registroLocal.motivo = 'OTRO'
    vm.registroLocal.observaciones = ''
    vm.registroLocal.id_saliente = 'user-1'
    vm.registroLocal.rut_saliente = '11.111.111-1'
    vm.registroLocal.servicio = 'srv-1'
    vm.registroLocal.tipo_turno = 'Cuarto Turno'
    vm.registroLocal.fecha_inicio = '2026-10-01'
    vm.registroLocal.fecha_termino = '2026-10-01'

    expect(vm.validationError).toBe("Las observaciones son obligatorias cuando el motivo es 'OTRO'")
    expect(vm.isFormComplete).toBe(false)

    vm.registroLocal.observaciones = 'Licencia médica especial en trámite'
    expect(vm.validationError).toBe('')
    expect(vm.isFormComplete).toBe(true)
  })

  it('debe emitir cerrar cuando se hace clic en cancelar', async () => {
    const wrapper = mount(ReplacementOfferModalCreate, {
      props: defaultProps,
      global: globalOptions
    })

    const cancelBtn = wrapper.findAll('button').find((b) => b.text().trim() === 'Cancelar')
    expect(cancelBtn).toBeDefined()
    await cancelBtn!.trigger('click')

    expect(wrapper.emitted('cerrar')).toBeTruthy()
  })

  it('debe llamar a offerStore.createOffer con el payload limpio al confirmar', async () => {
    const wrapper = mount(ReplacementOfferModalCreate, {
      props: defaultProps,
      global: globalOptions
    })

    const vm = wrapper.vm as any
    vm.selectedSaliente = {
      _id: 'user-1',
      rut: '12.345.678-9',
      firstName: 'Camila',
      lastName: 'Vallejos',
      positionId: { _id: 'pos-1', name: 'Matrona' }
    }
    vm.registroLocal.id_saliente = 'user-1'
    vm.registroLocal.rut_saliente = '12.345.678-9'
    vm.registroLocal.motivo = 'LICENCIA_MEDICA'
    vm.registroLocal.servicio = 'srv-1'
    vm.registroLocal.tipo_turno = 'Cuarto Turno'
    vm.registroLocal.fecha_inicio = '2026-10-05'
    vm.registroLocal.fecha_termino = '2026-10-05'
    vm.registroLocal.observaciones = 'Cobertura turno noche'

    await vm.confirmarGuardar()

    expect(mockCreateOffer).toHaveBeenCalled()
    const callArgs = mockCreateOffer.mock.calls[0][0]
    expect(callArgs.serviceId).toBe('srv-1')
    expect(callArgs.positionId).toBe('pos-1')
    expect(callArgs.motivo).toBe('LICENCIA_MEDICA')
    expect(callArgs.tipo_turno).toBe('Cuarto Turno')
    expect(callArgs.expiresAt).toBeDefined()
    expect(wrapper.emitted('cerrar')).toBeTruthy()
    expect(wrapper.emitted('guardar')).toBeTruthy()
  })
})
