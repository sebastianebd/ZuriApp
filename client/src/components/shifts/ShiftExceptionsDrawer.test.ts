import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { ref } from 'vue'
import ShiftExceptionsDrawer from './ShiftExceptionsDrawer.vue'

// Mock Stores
const mockExceptions = ref<any[]>([])
const mockLoading = ref(false)
const mockDeleteException = vi.fn().mockResolvedValue(true)

vi.mock('@/stores/shift-exception.store', () => ({
  useShiftExceptionStore: () => ({
    exceptions: mockExceptions,
    loading: mockLoading,
    deleteException: mockDeleteException
  })
}))

vi.mock('@/stores/turn-sigla.store', () => ({
  useTurnSiglaStore: () => ({
    siglas: [
      { sigla: 'L', nombre: 'Largo', color: '#fef08a' },
      { sigla: 'N', nombre: 'Noche', color: '#bae6fd' },
      { sigla: 'X', nombre: 'Libre', color: '#bbf7d0' }
    ],
    mapSiglaToNombre: (s: string) => (s === 'X' ? 'Libre' : s === 'L' ? 'Largo' : s)
  })
}))

vi.mock('@/stores/service.store', () => ({
  useServiceStore: () => ({
    getServiceName: (id: string) => (id === 'srv-1' ? 'Farmacia' : id === 'srv-2' ? 'Urgencias' : 'General'),
    isServiceMatch: (s1: string, s2: string) => s1 === s2
  })
}))

vi.mock('@/stores/position.store', () => ({
  usePositionStore: () => ({
    positions: [{ _id: 'pos-1', name: 'Técnico en Enfermería' }]
  })
}))

vi.mock('@/stores/alert.store', () => ({
  useAlertStore: () => ({
    fetchAlerts: vi.fn()
  })
}))

const mockAuthStaff = ref<any>({
  _id: 'usr-admin-1',
  firstName: 'Enrique',
  lastName: 'Admin'
})

vi.mock('@/stores/auth.store', () => ({
  useAuthStore: () => ({
    IStaff: mockAuthStaff.value,
    user: { _id: 'usr-admin-1', username: 'Enrique Admin' }
  })
}))

describe('ShiftExceptionsDrawer (TDD Panel Lateral de Excepciones)', () => {
  const sampleExceptions = [
    {
      _id: 'exc-1',
      assignment_id: {
        _id: 'asg-1',
        servicio: 'srv-1',
        staffId: {
          firstName: 'Omar',
          lastName: 'Barria',
          positionId: { _id: 'pos-1', name: 'Técnico en Enfermería' }
        }
      },
      date: '2026-09-09T00:00:00.000Z',
      original_type: 'Libre',
      override_type: 'L',
      created_by: {
        firstName: 'Enrique',
        lastName: 'Admin'
      },
      created_at: '2026-09-19T23:53:00.000Z'
    },
    {
      _id: 'exc-2',
      assignment_id: {
        _id: 'asg-2',
        servicio: 'srv-2',
        staffId: {
          firstName: 'Camila',
          lastName: 'Soto',
          positionId: 'pos-1'
        }
      },
      date: '2026-09-15T00:00:00.000Z',
      original_type: 'Largo',
      override_type: 'X',
      created_by: {
        firstName: 'Super',
        lastName: 'Visor'
      },
      created_at: '2026-09-20T10:00:00.000Z'
    }
  ]

  beforeEach(() => {
    vi.clearAllMocks()
    mockExceptions.value = sampleExceptions
    mockLoading.value = false
  })

  const mountDrawer = (props = {}) =>
    mount(ShiftExceptionsDrawer, {
      props: {
        modelValue: true,
        currentServiceId: 'srv-1',
        currentServiceName: 'Farmacia',
        currentMonthDate: new Date(2026, 8, 1),
        hasUpdatePermission: true,
        readonly: false,
        ...props
      }
    })

  it('no renderiza contenido si modelValue es false', () => {
    const wrapper = mountDrawer({ modelValue: false })
    expect(wrapper.find('.exceptions-drawer-panel').exists()).toBe(false)
  })

  it('renderiza el drawer lateral con cabecera y tarjetas de excepciones cuando modelValue es true', () => {
    const wrapper = mountDrawer({ modelValue: true })

    expect(wrapper.find('.exceptions-drawer-panel').exists()).toBe(true)
    expect(wrapper.text()).toContain('Excepciones Vigentes')
    expect(wrapper.text()).toContain('Omar Barria')
  })

  it('filtra por defecto las excepciones correspondientes al servicio activo', () => {
    const wrapper = mountDrawer({ currentServiceId: 'srv-1' })

    // Debe mostrar a Omar Barria (srv-1: Farmacia) pero no a Camila Soto (srv-2: Urgencias)
    expect(wrapper.text()).toContain('Omar Barria')
    expect(wrapper.text()).not.toContain('Camila Soto')
  })

  it('permite alternar el alcance para ver excepciones de todo el hospital', async () => {
    const wrapper = mountDrawer({ currentServiceId: 'srv-1' })

    const scopeAllBtn = wrapper.find('[data-test="scope-all-btn"]')
    expect(scopeAllBtn.exists()).toBe(true)

    await scopeAllBtn.trigger('click')

    // Ahora deben estar visibles ambas excepciones
    expect(wrapper.text()).toContain('Omar Barria')
    expect(wrapper.text()).toContain('Camila Soto')
  })

  it('filtra excepciones por texto de búsqueda en vivo dentro del drawer', async () => {
    const wrapper = mountDrawer({ currentServiceId: null }) // todo el hospital

    const searchInput = wrapper.find('.drawer-search-input')
    expect(searchInput.exists()).toBe(true)

    await searchInput.setValue('Camila')

    expect(wrapper.text()).toContain('Camila Soto')
    expect(wrapper.text()).not.toContain('Omar Barria')
  })

  it('ejecuta la acción de restablecer turno eliminando la excepción y emitiendo evento', async () => {
    const wrapper = mountDrawer({ currentServiceId: 'srv-1' })

    const restoreBtn = wrapper.find('[data-test="btn-restore-exception"]')
    expect(restoreBtn.exists()).toBe(true)

    await restoreBtn.trigger('click')

    expect(mockDeleteException).toHaveBeenCalledWith('exc-1')
    expect(wrapper.emitted('exception-restored')).toBeDefined()
  })

  it('emite evento locate-cell cuando se hace clic en Ubicar en Grilla', async () => {
    const wrapper = mountDrawer({ currentServiceId: 'srv-1' })

    const locateBtn = wrapper.find('[data-test="btn-locate-cell"]')
    expect(locateBtn.exists()).toBe(true)

    await locateBtn.trigger('click')

    expect(wrapper.emitted('locate-cell')).toBeDefined()
  })

  it('emite update:modelValue false cuando se hace clic en el botón cerrar o backdrop', async () => {
    const wrapper = mountDrawer({ modelValue: true })

    const closeBtn = wrapper.find('.btn-close-drawer')
    expect(closeBtn.exists()).toBe(true)

    await closeBtn.trigger('click')
    expect(wrapper.emitted('update:modelValue')?.[0]).toEqual([false])
  })

  it('renderiza la sigla correcta dentro del chip y su nombre al lado para el turno base original y el modificado', () => {
    mockExceptions.value = [
      {
        _id: 'exc-3',
        assignment_id: {
          _id: 'asg-3',
          servicio: 'srv-1',
          staffId: {
            firstName: 'Sebastian',
            lastName: 'Echeverria',
            positionId: { _id: 'pos-1', name: 'Informático' }
          }
        },
        date: '2026-09-29T00:00:00.000Z',
        original_type: 'Noche',
        override_type: 'L',
        created_by: { firstName: 'Enrique', lastName: 'Admin' },
        created_at: '2026-09-28T12:17:00.000Z'
      }
    ]

    const wrapper = mountDrawer({ currentServiceId: 'srv-1' })

    const chipElements = wrapper.findAll('.shift-pill')
    expect(chipElements.length).toBe(2)
    // El chip base debe tener la sigla 'N' (no el texto 'Noche' ni 'Libre')
    expect(chipElements[0].text()).toBe('N')
    // El chip modificado debe tener la sigla 'L'
    expect(chipElements[1].text()).toBe('L')

    // Y el texto al lado del chip base debe decir 'Noche' (no 'Libre')
    expect(wrapper.text()).toContain('Noche')
    expect(wrapper.text()).toContain('Largo')
    expect(wrapper.text()).not.toContain('Libre')
  })

  it('no muestra el texto de auditoría en el footer y el botón cerrar tiene holgura', () => {
    const wrapper = mountDrawer()
    const footer = wrapper.find('.drawer-footer')
    expect(footer.exists()).toBe(true)
    expect(footer.text()).not.toContain('Las excepciones se auditan')
    expect(footer.find('button').text()).toBe('Cerrar')
  })

  it('muestra el nombre del usuario autenticado cuando created_by coincide con el usuario actual o viene como objeto', () => {
    mockExceptions.value = [
      {
        _id: 'exc-new-1',
        assignment_id: {
          _id: 'asg-new-1',
          servicio: 'srv-1',
          staffId: {
            firstName: 'Omar',
            lastName: 'Barria',
            positionId: { _id: 'pos-1', name: 'Técnico en Enfermería' }
          }
        },
        date: '2026-09-10T00:00:00.000Z',
        original_type: 'Libre',
        override_type: 'N',
        created_by: 'usr-admin-1', // ID recién retornado antes de recargar
        created_at: '2026-09-28T12:38:00.000Z'
      }
    ]

    const wrapper = mountDrawer({ currentServiceId: 'srv-1' })
    expect(wrapper.text()).toContain('Enrique Admin')
    expect(wrapper.text()).not.toContain('Sistema')
  })
})
