import { describe, it, expect, vi } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import ReplacementModalCreate from './ReplacementModalCreate.vue'
import { MOTIVOS_AUSENCIA_LABELS, type AusenciaSalienteMotivo } from '@/types/replacement.types'

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
vi.mock('@/stores/staff.store', () => ({
  useStaffStore: () => ({
    searchResults: [],
    searchStaff: vi.fn().mockResolvedValue([])
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

vi.mock('@/stores/replacement-offer.store', () => ({
  useReplacementOfferStore: () => ({
    createOffer: vi.fn().mockResolvedValue({ success: true }),
  }),
}))

vi.mock('@/stores/service.store', () => ({
  useServiceStore: () => ({
    services: [{ _id: 'srv-fallback-1', nombre: 'Pediatría Fallback' }],
    fetchServices: vi.fn().mockResolvedValue([]),
  }),
}))

vi.mock('@/stores/turn-type.store', () => ({
  useTurnTypeStore: () => ({
    turnTypes: [{ nombre: 'Turno Fallback' }],
    fetchTurnTypes: vi.fn().mockResolvedValue([]),
  }),
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

describe('ReplacementModalCreate.vue - Causal de Ausencia (Pre-req 3.4)', () => {
  const defaultProps = {
    visible: true,
    listaDeTurnos: ['Largo', 'Noche', 'Diurno'],
    listaDeServicios: [{ _id: 'srv-1', nombre: 'Urgencia' }],
    registro: {},
    fechasBloqueadas: []
  }

  const globalOptions = {
    stubs: {
      ConfirmationModal: ConfirmationModalStub,
      'v-select': VSelectStub,
      Transition: true
    }
  }

  it('debe renderizar el selector desplegable con las 8 causales oficiales de ausencia', () => {
    const wrapper = mount(ReplacementModalCreate, {
      props: defaultProps,
      global: globalOptions
    })

    const select = wrapper.find('select[data-testid="motivo-select"]')
    expect(select.exists()).toBe(true)

    // Verificar que contenga las 8 causales oficiales
    const options = select.findAll('option')
    const officialMotivos = Object.keys(MOTIVOS_AUSENCIA_LABELS)

    expect(officialMotivos).toHaveLength(8)
    officialMotivos.forEach((motivoKey) => {
      const matchingOption = options.find((opt) => opt.attributes('value') === motivoKey)
      expect(matchingOption).toBeDefined()
      expect(matchingOption?.text()).toBe(MOTIVOS_AUSENCIA_LABELS[motivoKey as AusenciaSalienteMotivo])
    })
  })

  it('no permite habilitar el botón de crear si no se ha seleccionado un motivo', async () => {
    const wrapper = mount(ReplacementModalCreate, {
      props: {
        ...defaultProps,
        registro: {
          rut_saliente: '11.111.111-1',
          rut_entrante: '22.222.222-2',
          tipo_turno: 'Largo',
          servicio: 'srv-1',
          fecha_inicio: '2026-10-01',
          fecha_termino: '2026-10-05',
          motivo: undefined
        }
      },
      global: globalOptions
    })

    const submitBtn = wrapper.find('button.btn-primary')
    expect(submitBtn.attributes('disabled')).toBeDefined()
  })

  it('exige observaciones obligatorias y muestra mensaje de validación cuando el motivo es "OTRO"', async () => {
    const wrapper = mount(ReplacementModalCreate, {
      props: {
        ...defaultProps,
        registro: {
          rut_saliente: '11.111.111-1',
          rut_entrante: '22.222.222-2',
          tipo_turno: 'Largo',
          servicio: 'srv-1',
          fecha_inicio: '2026-10-01',
          fecha_termino: '2026-10-05',
          motivo: 'OTRO',
          observaciones: ''
        }
      },
      global: globalOptions
    })

    // El botón debe permanecer deshabilitado
    const submitBtn = wrapper.find('button.btn-primary')
    expect(submitBtn.attributes('disabled')).toBeDefined()

    // La alerta de validación debe indicar que las observaciones son obligatorias
    expect(wrapper.text()).toContain("Las observaciones son obligatorias cuando el motivo es 'OTRO'")

    // Al ingresar observaciones, debe habilitarse
    const textarea = wrapper.find('textarea[data-testid="observaciones-textarea"]')
    expect(textarea.exists()).toBe(true)
    await textarea.setValue('Imprevisto de fuerza mayor debidamente justificado')

    expect(wrapper.text()).not.toContain("Las observaciones son obligatorias cuando el motivo es 'OTRO'")
    expect(submitBtn.attributes('disabled')).toBeUndefined()
  })

  it('habilita el formulario sin exigir observaciones obligatorias cuando se selecciona una causal regular como LICENCIA_MEDICA', async () => {
    const wrapper = mount(ReplacementModalCreate, {
      props: {
        ...defaultProps,
        registro: {
          rut_saliente: '11.111.111-1',
          rut_entrante: '22.222.222-2',
          tipo_turno: 'Largo',
          servicio: 'srv-1',
          fecha_inicio: '2026-10-01',
          fecha_termino: '2026-10-05',
          motivo: 'LICENCIA_MEDICA',
          observaciones: ''
        }
      },
      global: globalOptions
    })

    const submitBtn = wrapper.find('button.btn-primary')
    expect(submitBtn.attributes('disabled')).toBeUndefined()
    expect(wrapper.text()).not.toContain("Las observaciones son obligatorias cuando el motivo es 'OTRO'")
  })

  it('emite el evento guardar con motivo y observaciones en el payload al confirmar', async () => {
    const wrapper = mount(ReplacementModalCreate, {
      props: {
        ...defaultProps,
        registro: {
          rut_saliente: '11.111.111-1',
          rut_entrante: '22.222.222-2',
          tipo_turno: 'Largo',
          servicio: 'srv-1',
          fecha_inicio: '2026-10-01',
          fecha_termino: '2026-10-05',
          motivo: 'FERIADO_LEGAL',
          observaciones: 'Feriado legal programado'
        }
      },
      global: globalOptions
    })

    // Click en Crear Reemplazo abre confirmación
    const submitBtn = wrapper.find('button.btn-primary')
    await submitBtn.trigger('click')

    // Confirmar en el modal de confirmación
    const confirmModal = wrapper.findComponent(ConfirmationModalStub)
    expect(confirmModal.exists()).toBe(true)
    await confirmModal.vm.$emit('confirmar')

    // Verificar payload emitido
    const emitted = wrapper.emitted('guardar')
    expect(emitted).toBeDefined()
    expect(emitted![0][0]).toMatchObject({
      rut_saliente: '11.111.111-1',
      rut_entrante: '22.222.222-2',
      motivo: 'FERIADO_LEGAL',
      observaciones: 'Feriado legal programado'
    })
  })

  it('debe bloquear hasta el día 20 cuando el funcionario saliente tiene turnos asignados del 1 al 20, y auto-posicionar fecha_inicio en el día disponible más cercano (21)', async () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date(2026, 8, 17, 10, 0, 0))

    try {
      mockFetchAssignmentsByUser.mockResolvedValue([
        {
          _id: 'asg-omar-1',
          staffId: 'staff-omar-1',
          start_date: '2026-09-01T00:00:00.000Z',
          end_date: '2026-09-20T23:59:59.999Z'
        }
      ])

      const wrapper = mount(ReplacementModalCreate, {
        props: defaultProps,
        global: globalOptions
      })

      const vm = wrapper.vm as any
      // Seleccionar funcionario saliente
      vm.selectedSaliente = {
        _id: 'staff-omar-1',
        rut: '12.345.678-9',
        firstName: 'Omar',
        lastName: 'Barría'
      }

      await flushPromises()
      await wrapper.vm.$nextTick()

      // Debe incluir el rango bloqueado del 1 al 20 en salienteBlockedDates
      expect(vm.salienteBlockedDates).toHaveLength(1)
      expect(vm.salienteBlockedDates[0].start.getUTCDate()).toBe(1)
      expect(vm.salienteBlockedDates[0].end.getUTCDate()).toBe(20)

      // fecha_inicio debe situarse automáticamente en el día disponible más cercano (2026-09-21)
      expect(vm.registroLocal.fecha_inicio).toBe('2026-09-21')
      expect(vm.registroLocal.fecha_termino).toBe('2026-09-21')
    } finally {
      vi.useRealTimers()
    }
  })

  it('resuelve automáticamente listaDeServicios y listaDeTurnos desde los stores cuando no se pasan como props', () => {
    const wrapper = mount(ReplacementModalCreate, {
      props: {
        visible: true,
        registro: {},
        fechasBloqueadas: []
      },
      global: globalOptions,
    })

    const vm = wrapper.vm as any
    expect(vm.computedListaDeServicios).toEqual([{ _id: 'srv-fallback-1', nombre: 'Pediatría Fallback' }])
    expect(vm.computedListaDeTurnos).toEqual(['Turno Fallback'])
  })

  it('emite el evento cerrar cuando se hace clic en Cancelar', async () => {
    const wrapper = mount(ReplacementModalCreate, {
      props: defaultProps,
      global: globalOptions,
    })

    const cancelBtn = wrapper.findAll('button').find((b) => b.text().trim() === 'Cancelar')
    expect(cancelBtn).toBeDefined()
    await cancelBtn!.trigger('click')

    expect(wrapper.emitted('cerrar')).toBeTruthy()
  })
})
