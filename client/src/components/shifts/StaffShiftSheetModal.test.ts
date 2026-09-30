import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import StaffShiftSheetModal from './StaffShiftSheetModal.vue'

const { mockReportData } = vi.hoisted(() => ({
  mockReportData: {
    staff: {
      _id: 'user-123',
      firstName: 'Omar',
      lastName: 'Barria',
      rut: '13.522.665-3',
      cargo: 'Técnico en Enfermería'
    },
    totals: {
      hours: 96,
      dayHours: 48,
      nightHours: 48
    },
    hours: {
      totalHours: 96,
      dayHours: 48,
      nightHours: 48
    },
    serviceStats: [
      { serviceName: 'Farmacia', stats: { hours: 96, dayHours: 48, nightHours: 48 } }
    ],
    timeline: [
      { dayNum: 1, items: [] },
      { dayNum: 2, items: [] },
      { dayNum: 21, items: [{ sigla: 'L', startTime: '08:00', endTime: '20:00' }] },
      { dayNum: 22, items: [{ sigla: 'L', startTime: '08:00', endTime: '20:00' }] },
      { dayNum: 23, items: [{ sigla: 'N', startTime: '20:00', endTime: '08:00' }] },
      { dayNum: 25, items: [{ sigla: 'X', startTime: '', endTime: '' }] }
    ]
  }
}))

const mockReportStore = {
  currentFilters: {
    userId: '',
    month: 9,
    year: 2026
  },
  reportData: mockReportData as any,
  fetchReportSummary: vi.fn().mockResolvedValue(mockReportData)
}

vi.mock('@/stores/report.store', () => ({
  useReportStore: () => mockReportStore
}))

vi.mock('@/stores/turn-sigla.store', () => ({
  useTurnSiglaStore: () => ({
    siglas: [],
    fetchSiglas: vi.fn(),
    mapSiglaToNombre: (s: string) => (s === 'L' ? 'LARGO' : s === 'N' ? 'NOCHE' : s === 'X' ? 'LIBRE' : s),
    mapSiglaToColor: (s: string) => (s === 'L' ? '#f59e0b' : s === 'N' ? '#3b82f6' : s === 'X' ? '#10b981' : '#64748b')
  })
}))

vi.mock('@/stores/service.store', () => ({
  useServiceStore: () => ({
    services: [],
    fetchServices: vi.fn(),
    getServiceName: (id: any) => (id === 'srv-farmacia' ? 'Farmacia' : 'Farmacia')
  })
}))

describe('StaffShiftSheetModal', () => {
  const mockStaff = {
    userId: 'user-123',
    _id: 'user-123',
    firstName: 'Omar',
    lastName: 'Barria',
    nombre: 'Omar',
    apellido: 'Barria',
    rut: '13.522.665-3',
    cargo: 'Técnico en Enfermería',
    servicio: 'srv-farmacia'
  }

  beforeEach(() => {
    vi.clearAllMocks()
    mockReportStore.reportData = JSON.parse(JSON.stringify(mockReportData))
  })

  it('no debería mostrar el modal cuando visible es false', () => {
    const wrapper = mount(StaffShiftSheetModal, {
      props: {
        visible: false,
        staff: mockStaff
      }
    })

    expect(wrapper.find('.staff-sheet-modal-dialog').exists()).toBe(false)
  })

  it('debería mostrar el modal con los datos del funcionario y mes inicial cuando visible es true', async () => {
    const wrapper = mount(StaffShiftSheetModal, {
      props: {
        visible: true,
        staff: mockStaff,
        initialMonth: 9,
        initialYear: 2026
      }
    })

    await new Promise((r) => setTimeout(r, 50))
    await wrapper.vm.$nextTick()

    expect(wrapper.find('.staff-sheet-modal-dialog').exists()).toBe(true)
    expect(wrapper.text()).toContain('Omar Barria')
    expect(wrapper.text()).toContain('Septiembre 2026')
    expect(wrapper.text()).toContain('Técnico en Enfermería')
  })

  it('debería emitir cerrar al hacer clic en el botón de cerrar', async () => {
    const wrapper = mount(StaffShiftSheetModal, {
      props: {
        visible: true,
        staff: mockStaff
      }
    })

    const closeBtn = wrapper.find('.btn-close')
    expect(closeBtn.exists()).toBe(true)
    await closeBtn.trigger('click')

    expect(wrapper.emitted('cerrar')).toBeTruthy()
  })

  it('debería mostrar las tarjetas con estadísticas de horas y turnos en el calendario', async () => {
    const wrapper = mount(StaffShiftSheetModal, {
      props: {
        visible: true,
        staff: mockStaff,
        initialMonth: 9,
        initialYear: 2026
      }
    })

    await new Promise((r) => setTimeout(r, 50))
    await wrapper.vm.$nextTick()

    // Métricas de horas
    expect(wrapper.text()).toContain('96')
    expect(wrapper.text()).toContain('Horas Totales')
    expect(wrapper.text()).toContain('Horas Diurnas')
    expect(wrapper.text()).toContain('Horas Nocturnas')

    // Turnos en el calendario
    expect(wrapper.text()).toContain('Largo')
    expect(wrapper.text()).toContain('Noche')
    expect(wrapper.text()).toContain('Libre')
  })

  it('debería calcular las horas desde reportData.totals (contrato estándar del backend)', async () => {
    mockReportStore.reportData = {
      staff: mockStaff,
      totals: {
        hours: 24,
        dayHours: 12,
        nightHours: 12
      },
      timeline: []
    }

    const wrapper = mount(StaffShiftSheetModal, {
      props: {
        visible: true,
        staff: mockStaff,
        initialMonth: 9,
        initialYear: 2026
      }
    })

    await new Promise((r) => setTimeout(r, 50))
    await wrapper.vm.$nextTick()

    expect(wrapper.text()).toContain('24')
    expect(wrapper.text()).toContain('12')
  })

  it('debería calcular horas desde timeline dinámicamente si totals viene ausente o en 0', async () => {
    mockReportStore.reportData = {
      staff: mockStaff,
      totals: {
        hours: 0,
        dayHours: 0,
        nightHours: 0
      },
      timeline: [
        { dayNum: 7, items: [{ sigla: 'L', startTime: '08:00', endTime: '20:00' }] }, // 12h diurnas
        { dayNum: 8, items: [{ sigla: 'N', startTime: '20:00', endTime: '08:00' }] }  // 12h nocturnas
      ]
    }

    const wrapper = mount(StaffShiftSheetModal, {
      props: {
        visible: true,
        staff: mockStaff,
        initialMonth: 9,
        initialYear: 2026
      }
    })

    await new Promise((r) => setTimeout(r, 50))
    await wrapper.vm.$nextTick()

    // 12 + 12 = 24 total
    expect(wrapper.text()).toContain('24')
    expect(wrapper.text()).toContain('Horas Totales')
  })

  it('debería permitir navegar entre meses y volver a cargar los datos', async () => {
    const wrapper = mount(StaffShiftSheetModal, {
      props: {
        visible: true,
        staff: mockStaff,
        initialMonth: 9,
        initialYear: 2026
      }
    })

    await new Promise((r) => setTimeout(r, 50))
    await wrapper.vm.$nextTick()

    expect(wrapper.text()).toContain('Septiembre 2026')

    const nextBtn = wrapper.find('.btn-next-month')
    expect(nextBtn.exists()).toBe(true)
    await nextBtn.trigger('click')

    expect(wrapper.text()).toContain('Octubre 2026')
    expect(mockReportStore.fetchReportSummary).toHaveBeenCalled()
  })
})
