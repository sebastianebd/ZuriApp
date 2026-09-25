import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import CoverageGauge from './CoverageGauge.vue'

describe('CoverageGauge.vue - Semáforo Contextual Dinámico', () => {
  it('muestra estado "warning" con badge y borde amarillo cuando cobertura es 91% y umbrales son 95/85', () => {
    const wrapper = mount(CoverageGauge, {
      props: {
        coverage: {
          configured: true,
          overallPercentage: 91,
          status: 'warning',
          thresholds: { green: 95, yellow: 85 },
          uncoveredSlotsCount: 5,
          byPosition: [],
        },
        canEditStaffing: true,
      },
    })

    expect(wrapper.text()).toContain('Alerta de Cobertura')
    expect(wrapper.find('.bg-warning').exists()).toBe(true)
    expect(wrapper.find('.border-warning-subtle').exists()).toBe(true)
  })

  it('muestra estado "optimal" con badge y borde verde cuando cobertura es 91% y umbrales son 90/80', () => {
    const wrapper = mount(CoverageGauge, {
      props: {
        coverage: {
          configured: true,
          overallPercentage: 91,
          status: 'optimal',
          thresholds: { green: 90, yellow: 80 },
          uncoveredSlotsCount: 0,
          byPosition: [],
        },
        canEditStaffing: false,
      },
    })

    expect(wrapper.text()).toContain('Dotación Óptima')
    expect(wrapper.find('.bg-success').exists()).toBe(true)
    expect(wrapper.find('.border-success-subtle').exists()).toBe(true)
  })

  it('muestra estado "critical" con badge y borde rojo cuando cobertura es deficitaria', () => {
    const wrapper = mount(CoverageGauge, {
      props: {
        coverage: {
          configured: true,
          overallPercentage: 75,
          status: 'critical',
          thresholds: { green: 95, yellow: 85 },
          uncoveredSlotsCount: 15,
          byPosition: [],
        },
        canEditStaffing: true,
      },
    })

    expect(wrapper.text()).toContain('Déficit Crítico')
    expect(wrapper.find('.bg-danger').exists()).toBe(true)
    expect(wrapper.find('.border-danger-subtle').exists()).toBe(true)
  })

  it('oculta el botón de ajustar dotación si canEditStaffing es false', () => {
    const wrapper = mount(CoverageGauge, {
      props: {
        coverage: {
          configured: true,
          overallPercentage: 96,
          status: 'optimal',
          thresholds: { green: 95, yellow: 85 },
          uncoveredSlotsCount: 0,
          byPosition: [],
        },
        canEditStaffing: false,
      },
    })

    expect(wrapper.find('[data-test="btn-edit-staffing"]').exists()).toBe(false)
  })
})
