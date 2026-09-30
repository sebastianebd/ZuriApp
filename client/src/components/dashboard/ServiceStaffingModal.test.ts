import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import ServiceStaffingModal from './ServiceStaffingModal.vue'
import { usePositionStore } from '../../stores/position.store'

describe('ServiceStaffingModal.vue - Enterprise Redesign', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.clearAllMocks()
    const positionStore = usePositionStore()
    vi.spyOn(positionStore, 'fetchPositions').mockResolvedValue([] as any)
  })

  it('no se renderiza en el DOM cuando show es false', () => {
    const wrapper = mount(ServiceStaffingModal, {
      props: {
        show: false,
      },
    })

    expect(wrapper.find('.staffing-modal-overlay').exists()).toBe(false)
  })

  it('renderiza header con nombre del servicio y badge clínico cuando show es true', () => {
    const positionStore = usePositionStore()
    positionStore.positions = [
      { _id: 'pos-1', name: 'Técnico En Enfermería', position_code: 'TNS_03', isActive: true },
    ]

    const wrapper = mount(ServiceStaffingModal, {
      props: {
        show: true,
        serviceId: 'srv-farmacia',
        serviceName: 'FARMACIA',
        currentThresholds: { green: 95, yellow: 85 },
        currentStaffing: [
          { positionId: 'pos-1', positionName: 'Técnico En Enfermería', minDay: 15, minNight: 5 },
        ],
      },
      global: {
        stubs: {
          'v-select': true,
        },
      },
    })

    expect(wrapper.find('.staffing-modal-overlay').exists()).toBe(true)
    expect(wrapper.text()).toContain('Ajuste de Dotación y Metas')
    expect(wrapper.text()).toContain('FARMACIA')
    expect(wrapper.text()).toContain('Meta Óptima (Verde)')
    expect(wrapper.text()).toContain('Alerta Mínima (Amarillo)')
  })

  it('permite agregar y eliminar filas de cargos', async () => {
    const wrapper = mount(ServiceStaffingModal, {
      props: {
        show: true,
        serviceId: 'srv-farmacia',
        serviceName: 'FARMACIA',
        currentStaffing: [],
      },
      global: {
        stubs: {
          'v-select': true,
        },
      },
    })

    expect(wrapper.find('.empty-staffing-box').exists()).toBe(true)

    // Clic en agregar cargo
    const addBtn = wrapper.find('button.btn-primary.rounded-pill')
    await addBtn.trigger('click')

    expect(wrapper.find('.staffing-table').exists()).toBe(true)
    expect(wrapper.findAll('.staffing-row').length).toBe(1)

    // Eliminar fila
    const deleteBtn = wrapper.find('.btn-row-delete')
    await deleteBtn.trigger('click')

    expect(wrapper.find('.empty-staffing-box').exists()).toBe(true)
  })

  it('emite "save" con payload estructurado al guardar configuración', async () => {
    const positionStore = usePositionStore()
    positionStore.positions = [
      { _id: 'pos-1', name: 'Técnico En Enfermería', position_code: 'TNS_03', isActive: true },
    ]

    const wrapper = mount(ServiceStaffingModal, {
      props: {
        show: true,
        serviceId: 'srv-farmacia',
        serviceName: 'FARMACIA',
        currentThresholds: { green: 90, yellow: 80 },
        currentStaffing: [
          { positionId: 'pos-1', positionName: 'Técnico En Enfermería', minDay: 10, minNight: 4 },
        ],
      },
      global: {
        stubs: {
          'v-select': true,
        },
      },
    })

    const saveBtn = wrapper.findAll('button').find((b) => b.text().includes('Guardar Configuración'))
    expect(saveBtn).toBeDefined()
    await saveBtn!.trigger('click')

    expect(wrapper.emitted('save')).toBeTruthy()
    const emittedPayload = wrapper.emitted('save')![0][0]
    expect(emittedPayload).toEqual({
      dotacion_minima: [
        { positionId: 'pos-1', minimo_dia: 10, minimo_noche: 4 },
      ],
      umbrales_cobertura: {
        verde: 90,
        amarillo: 80,
      },
    })
  })

  it('emite "close" al presionar botón de cerrar o Cancelar', async () => {
    const wrapper = mount(ServiceStaffingModal, {
      props: {
        show: true,
      },
      global: {
        stubs: {
          'v-select': true,
        },
      },
    })

    const closeBtn = wrapper.find('.btn-close-custom')
    await closeBtn.trigger('click')
    expect(wrapper.emitted('close')).toBeTruthy()

    const cancelBtn = wrapper.findAll('button').find((b) => b.text().includes('Cancelar'))
    await cancelBtn!.trigger('click')
    expect(wrapper.emitted('close')!.length).toBe(2)
  })
})
