import { describe, it, expect, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import AbsenteeismReasonsCard from './AbsenteeismReasonsCard.vue'

vi.mock('vue-chartjs', () => ({
  Doughnut: {
    name: 'Doughnut',
    template: '<div class="stub-doughnut"></div>',
    props: ['data', 'options'],
  },
}))

describe('AbsenteeismReasonsCard.vue - Motivos de Ausentismo (Doughnut Chart)', () => {
  it('muestra estado vacío cuando reasons es undefined o está vacío', () => {
    const wrapper = mount(AbsenteeismReasonsCard, {
      props: {
        reasons: [],
      },
    })

    expect(wrapper.text()).toContain('Motivos de Ausentismo')
    expect(wrapper.text()).toContain('Sin ausencias registradas')
    expect(wrapper.find('.donut-chart-container').exists()).toBe(false)
  })

  it('renderiza gráfico de dona y leyenda con desglose de motivos cuando hay datos', () => {
    const mockReasons = [
      {
        motivo: 'LICENCIA_MEDICA',
        label: 'Licencia Médica',
        color: '#ef4444',
        count: 6,
        percentage: 60.0,
      },
      {
        motivo: 'FERIADO_LEGAL',
        label: 'Feriado Legal',
        color: '#10b981',
        count: 3,
        percentage: 30.0,
      },
      {
        motivo: 'PERMISO_ADMINISTRATIVO',
        label: 'Permiso Administrativo',
        color: '#3b82f6',
        count: 1,
        percentage: 10.0,
      },
    ]

    const wrapper = mount(AbsenteeismReasonsCard, {
      props: {
        reasons: mockReasons,
      },
    })

    expect(wrapper.text()).toContain('Motivos de Ausentismo')
    expect(wrapper.find('.donut-chart-container').exists()).toBe(true)
    expect(wrapper.find('.stub-doughnut').exists()).toBe(true)
    expect(wrapper.text()).toContain('10') // Total 6 + 3 + 1
    expect(wrapper.text()).toContain('Eventos')
    expect(wrapper.text()).toContain('Licencia Médica')
    expect(wrapper.text()).toContain('6 eventos')
    expect(wrapper.text()).toContain('60%')
    expect(wrapper.text()).toContain('Feriado Legal')
    expect(wrapper.text()).toContain('3 eventos')
    expect(wrapper.text()).toContain('30%')
  })
})
