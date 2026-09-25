import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import { setActivePinia, createPinia } from 'pinia'
import PortalShifts from '../PortalShifts.vue'
import { usePortalStore } from '@/stores/portal.store'
import type { PortalShiftsViewData } from '@/types/portal.types'

vi.mock('vue-router', () => ({
  useRouter: () => ({ push: vi.fn() }),
  useRoute: () => ({ query: {} }),
}))

describe('PortalShifts.vue - Calendario Mensual vs Cartola de Reemplazos (TDD RED)', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.clearAllMocks()
  })

  const mockShiftsData: PortalShiftsViewData = {
    period: { month: 9, year: 2026 },
    isClosed: false,
    shifts: [
      {
        date: '2026-09-01',
        sigla: 'L',
        isWorkDay: true,
        isReplacement: false,
        serviceId: 'srv-1',
        serviceName: 'Urgencias',
        entryTime: '08:00',
        exitTime: '20:00',
      },
      {
        date: '2026-09-15',
        sigla: 'N',
        isWorkDay: true,
        isReplacement: true,
        replacementId: 'rep-101',
        replacementBusinessCode: 'REP-2026-0891',
        serviceId: 'srv-1',
        serviceName: 'Urgencias',
        entryTime: '20:00',
        exitTime: '08:00',
        confirmationStatus: 'confirmed',
      },
    ],
    replacementContracts: [
      {
        id: 'rep-101',
        businessCode: 'REP-2026-0891',
        serviceId: 'srv-1',
        serviceName: 'Urgencias',
        startDate: '2026-09-01',
        endDate: '2026-09-15',
        totalDays: 15,
        status: 'Activo',
        shiftsCommittedCount: 5,
        origin: 'Asignación Directa',
      },
    ],
  }

  it('renderiza el conmutador segmentado superior y permite alternar entre Calendario y Mis Reemplazos', async () => {
    const portalStore = usePortalStore()
    vi.spyOn(portalStore, 'fetchShifts' as any).mockResolvedValue(mockShiftsData)

    const wrapper = mount(PortalShifts)
    await flushPromises()

    const calendarTabBtn = wrapper.find('[data-test="tab-btn-calendar"]')
    const contractsTabBtn = wrapper.find('[data-test="tab-btn-contracts"]')

    expect(calendarTabBtn.exists()).toBe(true)
    expect(contractsTabBtn.exists()).toBe(true)
    expect(contractsTabBtn.text()).toContain('1') // Conteo de contratos

    // Por defecto inicia en calendario
    expect(wrapper.find('[data-test="calendar-section"]').exists()).toBe(true)
    expect(wrapper.find('[data-test="contracts-section"]').exists()).toBe(false)

    // Cambiar a pestaña de contratos
    await contractsTabBtn.trigger('click')
    expect(wrapper.find('[data-test="calendar-section"]').exists()).toBe(false)
    expect(wrapper.find('[data-test="contracts-section"]').exists()).toBe(true)
  })

  it('elimina el icono de la mano 🤝 en los días de reemplazo pero conserva la clase is-replacement', async () => {
    const portalStore = usePortalStore()
    vi.spyOn(portalStore, 'fetchShifts' as any).mockResolvedValue(mockShiftsData)

    const wrapper = mount(PortalShifts)
    // Forzamos la data
    ;(wrapper.vm as any).shiftsData = mockShiftsData
    await wrapper.vm.$nextTick()

    const replacementCell = wrapper.find('[data-test="day-cell-2026-09-15"]')
    expect(replacementCell.exists()).toBe(true)
    expect(replacementCell.text()).not.toContain('🤝')
    expect(replacementCell.find('[data-test="replacement-indicator"]').exists()).toBe(false)
    expect(replacementCell.classes()).toContain('is-replacement')
  })

  it('al seleccionar un día con reemplazo y presionar "Ver Contrato", conmuta a la pestaña de contratos y lo enfoca', async () => {
    const portalStore = usePortalStore()
    vi.spyOn(portalStore, 'fetchShifts' as any).mockResolvedValue(mockShiftsData)

    const wrapper = mount(PortalShifts)
    ;(wrapper.vm as any).shiftsData = mockShiftsData
    await wrapper.vm.$nextTick()

    // Abrir detalle del día con reemplazo
    await wrapper.find('[data-test="day-cell-2026-09-15"]').trigger('click')

    // Disparar salto a contrato desde el detail sheet
    const detailSheet = wrapper.findComponent({ name: 'ShiftDayDetailSheet' })
    expect(detailSheet.exists()).toBe(true)
    await detailSheet.vm.$emit('view-contract', 'rep-101')

    // Verifica que conmutó a la pestaña de contratos
    expect(wrapper.find('[data-test="contracts-section"]').exists()).toBe(true)
    expect(wrapper.find('[data-test="contract-card-rep-101"]').exists()).toBe(true)
  })

  it('muestra el botón de descarga de cartola oficial cuando el período está cerrado', async () => {
    const portalStore = usePortalStore()
    const closedMonthData: PortalShiftsViewData = {
      ...mockShiftsData,
      isClosed: true,
    }
    vi.spyOn(portalStore, 'fetchShifts' as any).mockResolvedValue(closedMonthData)
    const downloadSpy = vi.spyOn(portalStore, 'downloadCartolaPdf' as any).mockResolvedValue(undefined)

    const wrapper = mount(PortalShifts)
    ;(wrapper.vm as any).shiftsData = closedMonthData
    await wrapper.vm.$nextTick()

    const downloadBtn = wrapper.find('[data-test="download-cartola-btn"]')
    expect(downloadBtn.exists()).toBe(true)
    await downloadBtn.trigger('click')

    expect(downloadSpy).toHaveBeenCalledWith(9, 2026)
  })

  it('permite alternar entre la cuadrícula mensual y la lista cronológica', async () => {
    const portalStore = usePortalStore()
    vi.spyOn(portalStore, 'fetchShifts' as any).mockResolvedValue(mockShiftsData)

    const wrapper = mount(PortalShifts)
    ;(wrapper.vm as any).shiftsData = mockShiftsData
    await wrapper.vm.$nextTick()

    const toggleBtn = wrapper.find('[data-test="toggle-view-btn"]')
    expect(toggleBtn.exists()).toBe(true)

    // Inicialmente cuadrícula
    expect(wrapper.find('[data-test="calendar-grid"]').exists()).toBe(true)
    expect(wrapper.find('[data-test="calendar-list"]').exists()).toBe(false)

    // Alternar a lista
    await toggleBtn.trigger('click')
    expect(wrapper.find('[data-test="calendar-grid"]').exists()).toBe(false)
    expect(wrapper.find('[data-test="calendar-list"]').exists()).toBe(true)
  })

  it('no renderiza sigla-badge en días sin turnos asignados (días vacíos)', async () => {
    const portalStore = usePortalStore()
    const monthWithEmptyDays: PortalShiftsViewData = {
      period: { month: 9, year: 2026 },
      isClosed: false,
      shifts: [
        {
          date: '2026-09-01',
          sigla: '',
          isWorkDay: false,
          isReplacement: false,
          serviceId: '',
          serviceName: '',
        },
        {
          date: '2026-09-21',
          sigla: 'L',
          isWorkDay: true,
          isReplacement: true,
          serviceId: 'srv-1',
          serviceName: 'Farmacia',
          entryTime: '08:00',
          exitTime: '20:00',
        },
      ],
      replacementContracts: [],
    }

    vi.spyOn(portalStore, 'fetchShifts' as any).mockResolvedValue(monthWithEmptyDays)

    const wrapper = mount(PortalShifts)
    ;(wrapper.vm as any).shiftsData = monthWithEmptyDays
    await wrapper.vm.$nextTick()

    // Día 1 (vacío): no debe tener sigla-badge ni icono de reemplazo
    const emptyCell = wrapper.find('[data-test="day-cell-2026-09-01"]')
    expect(emptyCell.exists()).toBe(true)
    expect(emptyCell.find('.sigla-badge').exists()).toBe(false)
    expect(emptyCell.find('[data-test="replacement-indicator"]').exists()).toBe(false)

    // Día 21 (turno real): sí tiene sigla-badge y clase de reemplazo pero NO tiene icono de mano
    const filledCell = wrapper.find('[data-test="day-cell-2026-09-21"]')
    expect(filledCell.exists()).toBe(true)
    expect(filledCell.find('.sigla-badge').exists()).toBe(true)
    expect(filledCell.find('.sigla-badge').text()).toBe('L')
    expect(filledCell.text()).not.toContain('🤝')
    expect(filledCell.find('[data-test="replacement-indicator"]').exists()).toBe(false)
    expect(filledCell.classes()).toContain('is-replacement')
  })

  it('muestra mensaje informativo en lista cronológica cuando el mes no tiene turnos programados (ej. Febrero 2027)', async () => {
    const portalStore = usePortalStore()
    const emptyMonthData: PortalShiftsViewData = {
      period: { month: 2, year: 2027 },
      isClosed: false,
      shifts: [
        { date: '2027-02-01', sigla: '', isWorkDay: false, isReplacement: false, serviceId: '', serviceName: '' },
        { date: '2027-02-02', sigla: '', isWorkDay: false, isReplacement: false, serviceId: '', serviceName: '' },
      ],
      replacementContracts: [],
    }

    vi.spyOn(portalStore, 'fetchShifts' as any).mockResolvedValue(emptyMonthData)

    const wrapper = mount(PortalShifts)
    ;(wrapper.vm as any).shiftsData = emptyMonthData
    await wrapper.vm.$nextTick()

    // Alternar a vista lista
    await wrapper.find('[data-test="toggle-view-btn"]').trigger('click')

    expect(wrapper.find('[data-test="no-shifts-message"]').exists()).toBe(true)
    expect(wrapper.text()).toContain('Sin turnos programados en este mes')
  })

  it('aplica las clases de color correspondientes a las celdas y badges del calendario (Largo, Noche, Libre)', async () => {
    const portalStore = usePortalStore()
    const colorTestData: PortalShiftsViewData = {
      period: { month: 9, year: 2026 },
      isClosed: false,
      shifts: [
        { date: '2026-09-24', sigla: 'N', isWorkDay: true, isReplacement: true, serviceId: 'srv-1', serviceName: 'Farmacia' },
        { date: '2026-09-25', sigla: 'X', isWorkDay: false, isReplacement: false, serviceId: '', serviceName: '' },
        { date: '2026-09-27', sigla: 'L', isWorkDay: true, isReplacement: true, serviceId: 'srv-1', serviceName: 'Farmacia' },
      ],
      replacementContracts: [],
    }

    vi.spyOn(portalStore, 'fetchShifts' as any).mockResolvedValue(colorTestData)

    const wrapper = mount(PortalShifts)
    ;(wrapper.vm as any).shiftsData = colorTestData
    await wrapper.vm.$nextTick()

    // 2026-09-24: Noche
    const nocheCell = wrapper.find('[data-test="day-cell-2026-09-24"]')
    expect(nocheCell.classes()).toContain('cell-noche')
    expect(nocheCell.find('.sigla-badge').classes()).toContain('sigla-noche')

    // 2026-09-25: Libre
    const libreCell = wrapper.find('[data-test="day-cell-2026-09-25"]')
    expect(libreCell.classes()).toContain('cell-libre')
    expect(libreCell.find('.sigla-badge').classes()).toContain('sigla-libre')

    // 2026-09-27: Largo
    const largoCell = wrapper.find('[data-test="day-cell-2026-09-27"]')
    expect(largoCell.classes()).toContain('cell-largo')
    expect(largoCell.find('.sigla-badge').classes()).toContain('sigla-largo')
  })

  it('resalta la celda del día actual agregando la clase is-today', async () => {
    const portalStore = usePortalStore()
    const now = new Date()
    const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`

    const todayTestData: PortalShiftsViewData = {
      period: { month: now.getMonth() + 1, year: now.getFullYear() },
      isClosed: false,
      shifts: [
        { date: todayStr, sigla: 'N', isWorkDay: true, isReplacement: false, serviceId: 'srv-1', serviceName: 'Farmacia' },
      ],
      replacementContracts: [],
    }

    vi.spyOn(portalStore, 'fetchShifts' as any).mockResolvedValue(todayTestData)

    const wrapper = mount(PortalShifts)
    ;(wrapper.vm as any).shiftsData = todayTestData
    await wrapper.vm.$nextTick()

    const todayCell = wrapper.find(`[data-test="day-cell-${todayStr}"]`)
    expect(todayCell.exists()).toBe(true)
    expect(todayCell.classes()).toContain('is-today')
  })
})

