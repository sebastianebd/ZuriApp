import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import ReplacementCoverageModal from './ReplacementCoverageModal.vue'

// Mock auth store
const mockAuthStore = {
  usePrivateApi: vi.fn(() => ({}))
}
vi.mock('@/stores/auth.store', () => ({
  useAuthStore: () => mockAuthStore
}))

// Mock service store
vi.mock('@/stores/service.store', () => ({
  useServiceStore: () => ({
    services: [
      { _id: 'serv-1', nombre: 'Medicina' },
      { _id: 'serv-2', nombre: 'Pediatría' }
    ],
    getServiceName: (id: any) => (id === 'serv-1' ? 'Medicina' : id === 'serv-2' ? 'Pediatría' : 'General'),
    fetchServices: vi.fn()
  })
}))

const { mockReplacements } = vi.hoisted(() => ({
  mockReplacements: [
    {
      _id: 'rep-1',
      id_negocio: 'REP-001',
      nombre_saliente: 'Juan',
      apellido_saliente: 'Perez',
      rut_saliente: '11.111.111-1',
      nombre_entrante: 'Maria',
      apellido_entrante: 'Gonzalez',
      rut_entrante: '22.222.222-2',
      servicio: 'serv-1',
      servicio_nombre: 'Medicina',
      tipo_turno: 'Cuarto Turno',
      fecha_inicio: '2026-09-05T00:00:00.000Z',
      fecha_termino: '2026-09-15T00:00:00.000Z',
      status: 'active'
    },
    {
      _id: 'rep-2',
      id_negocio: 'REP-002',
      nombre_saliente: 'Juan',
      apellido_saliente: 'Perez',
      rut_saliente: '11.111.111-1',
      nombre_entrante: 'Carlos',
      apellido_entrante: 'Lopez',
      rut_entrante: '33.333.333-3',
      servicio: 'serv-1',
      servicio_nombre: 'Medicina',
      tipo_turno: 'Cuarto Turno',
      fecha_inicio: '2026-09-12T00:00:00.000Z',
      fecha_termino: '2026-09-20T00:00:00.000Z',
      status: 'active'
    }
  ]
}))

vi.mock('@/services/replacement.service', () => ({
  mostrarReemplazos: vi.fn().mockResolvedValue({
    reemplazos: mockReplacements
  })
}))

describe('ReplacementCoverageModal', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('no debería mostrar el modal cuando visible es false', () => {
    const wrapper = mount(ReplacementCoverageModal, {
      props: {
        visible: false
      }
    })
    expect(wrapper.find('.coverage-modal-dialog').exists()).toBe(false)
  })

  it('debería mostrar el modal cuando visible es true y cargar reemplazos', async () => {
    const wrapper = mount(ReplacementCoverageModal, {
      props: {
        visible: true,
        initialYear: 2026,
        initialMonth: 9
      }
    })

    // Esperar a que la carga asíncrona resuelva
    await new Promise((r) => setTimeout(r, 50))
    await wrapper.vm.$nextTick()

    expect(wrapper.find('.coverage-modal-dialog').exists()).toBe(true)
    expect(wrapper.text()).toContain('Cronograma de Cobertura')
    expect(wrapper.text()).toContain('Septiembre 2026')
  })

  it('debería emitir cerrar al hacer clic en el botón de cerrar', async () => {
    const wrapper = mount(ReplacementCoverageModal, {
      props: {
        visible: true
      }
    })

    const closeBtn = wrapper.find('.btn-close')
    expect(closeBtn.exists()).toBe(true)
    await closeBtn.trigger('click')

    expect(wrapper.emitted('cerrar')).toBeTruthy()
  })

  it('debería marcar las filas y barras cuando hay conflictos sin mostrar badge en toolbar', async () => {
    const wrapper = mount(ReplacementCoverageModal, {
      props: {
        visible: true,
        initialYear: 2026,
        initialMonth: 9
      }
    })

    await new Promise((r) => setTimeout(r, 50))
    await wrapper.vm.$nextTick()

    // El badge en la barra superior fue retirado
    expect(wrapper.find('.conflict-badge').exists()).toBe(false)
    // Pero la fila y la barra sí se marcan con conflicto visual
    expect(wrapper.find('.has-conflict-row').exists()).toBe(true)
    expect(wrapper.find('.is-conflict').exists()).toBe(true)
  })

  it('debería mostrar el nombre del servicio bajo el nombre del funcionario titular', async () => {
    const wrapper = mount(ReplacementCoverageModal, {
      props: {
        visible: true,
        initialYear: 2026,
        initialMonth: 9
      }
    })

    await new Promise((r) => setTimeout(r, 50))
    await wrapper.vm.$nextTick()

    // En mockReplacements el servicio es 'serv-1' que mapea a 'Medicina' en serviceStore
    expect(wrapper.text()).toContain('Medicina')
  })

  it('debería permitir navegar entre meses usando los botones', async () => {
    const wrapper = mount(ReplacementCoverageModal, {
      props: {
        visible: true,
        initialYear: 2026,
        initialMonth: 9
      }
    })

    await new Promise((r) => setTimeout(r, 50))
    await wrapper.vm.$nextTick()

    expect(wrapper.text()).toContain('Septiembre 2026')

    const nextBtn = wrapper.find('.btn-next-month')
    expect(nextBtn.exists()).toBe(true)
    await nextBtn.trigger('click')

    expect(wrapper.text()).toContain('Octubre 2026')
  })
})
