import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import DashboardView from './DashboardView.vue'
import { useDashboardStore } from '../../stores/dashboard.store'

vi.mock('../../plugins/socket', () => ({
  default: {
    emit: vi.fn(),
    on: vi.fn(),
    off: vi.fn(),
  },
}))

vi.mock('../../composables/useApi', () => ({
  useApi: vi.fn(() => ({
    get: vi.fn().mockResolvedValue({ data: [] }),
    post: vi.fn().mockResolvedValue({ data: {} }),
  })),
  useApiPrivate: vi.fn(() => ({
    get: vi.fn().mockResolvedValue({ data: [] }),
    post: vi.fn().mockResolvedValue({ data: {} }),
    patch: vi.fn().mockResolvedValue({ data: {} }),
  })),
}))

vi.mock('../../services/service.service', () => ({
  getServices: vi.fn().mockResolvedValue([
    { _id: 'srv-1', nombre: 'UCI Adultos' },
    { _id: 'srv-2', nombre: 'Urgencias' },
  ]),
}))

describe('DashboardView.vue (TDD RED)', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    localStorage.clear()
    vi.clearAllMocks()
  })

  it('debería inicializar y cargar el servicio habitual desde localStorage si existe', async () => {
    localStorage.setItem('zuriapp_preferred_service', 'srv-1')
    const store = useDashboardStore()
    const fetchSpy = vi.spyOn(store, 'setSelectedService').mockImplementation(async () => {})

    mount(DashboardView, {
      global: {
        stubs: {
          KPICards: true,
          CoverageGauge: true,
          EmptyStateCoverage: true,
          ReplacementChart: true,
          TopReplacedStaff: true,
          HoursBreakdownCard: true,
          ServiceStaffingModal: true,
        },
      },
    })
    await flushPromises()

    expect(fetchSpy).toHaveBeenCalledWith('srv-1')
  })

  it('debería mostrar el botón de ajuste de dotación solo cuando canEditStaffing es true', async () => {
    const store = useDashboardStore()
    store.selectedServiceId = 'srv-1'
    store.kpiData = {
      period: { month: 10, year: 2026 },
      service: { id: 'srv-1', name: 'UCI', canEditStaffing: true },
      summary: {
        totalReplacements: 10,
        replacementRate: 5.0,
        scheduledShiftDays: 200,
        totalShiftsReplaced: 10,
      },
      coverage: {
        configured: true,
        overallPercentage: 96,
        status: 'optimal',
        thresholds: { green: 95, yellow: 85 },
        uncoveredSlotsCount: 0,
        byPosition: [],
      },
      hoursBreakdown: {
        totalHours: 120,
        dayHours: 60,
        nightHours: 60,
        nightPercentage: 50,
      },
      topReplacedStaff: [],
      comparative: {
        previousPeriod: { month: 9, year: 2026 },
        replacementsDeltaPct: 0,
        replacementRateDeltaPoints: 0,
        coverageDeltaPoints: 0,
      },
      cached: false,
      generatedAt: new Date().toISOString(),
    }

    const wrapper = mount(DashboardView, {
      global: {
        stubs: {
          KPICards: true,
          CoverageGauge: true,
          EmptyStateCoverage: true,
          ReplacementChart: true,
          TopReplacedStaff: true,
          HoursBreakdownCard: true,
          ServiceStaffingModal: true,
        },
      },
    })

    const editButton = wrapper.find('[data-test="btn-edit-staffing"]')
    expect(editButton.exists()).toBe(true)

    // Cambiar a canEditStaffing = false
    store.kpiData.service.canEditStaffing = false
    await wrapper.vm.$nextTick()

    const hiddenButton = wrapper.find('[data-test="btn-edit-staffing"]')
    expect(hiddenButton.exists()).toBe(false)
  })

  it('debería renderizar EmptyStateCoverage cuando coverage.configured es false', async () => {
    const store = useDashboardStore()
    store.selectedServiceId = 'srv-1'
    store.kpiData = {
      period: { month: 10, year: 2026 },
      service: { id: 'srv-1', name: 'UCI', canEditStaffing: false },
      summary: {
        totalReplacements: 0,
        replacementRate: 0,
        scheduledShiftDays: 100,
        totalShiftsReplaced: 0,
      },
      coverage: {
        configured: false,
        overallPercentage: null,
        status: 'optimal',
        thresholds: { green: 95, yellow: 85 },
        uncoveredSlotsCount: 0,
        byPosition: [],
      },
      hoursBreakdown: { totalHours: 0, dayHours: 0, nightHours: 0, nightPercentage: 0 },
      topReplacedStaff: [],
      comparative: {
        previousPeriod: { month: 9, year: 2026 },
        replacementsDeltaPct: null,
        replacementRateDeltaPoints: null,
        coverageDeltaPoints: null,
      },
      cached: false,
      generatedAt: new Date().toISOString(),
    }

    const wrapper = mount(DashboardView, {
      global: {
        stubs: {
          KPICards: true,
          CoverageGauge: true,
          EmptyStateCoverage: { template: '<div class="empty-state-coverage-stub">No configurado</div>' },
          ReplacementChart: true,
          TopReplacedStaff: true,
          HoursBreakdownCard: true,
          ServiceStaffingModal: true,
        },
      },
    })

    expect(wrapper.find('.empty-state-coverage-stub').exists()).toBe(true)
  })
})
