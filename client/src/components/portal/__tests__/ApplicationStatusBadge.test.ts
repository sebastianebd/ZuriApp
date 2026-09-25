import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import ApplicationStatusBadge from '../ApplicationStatusBadge.vue'

describe('ApplicationStatusBadge.vue - Estados de Postulación Hospitalaria (TDD RED)', () => {
  it('renderiza badge para estado "pending" (En postulación / En evaluación)', () => {
    const wrapper = mount(ApplicationStatusBadge, {
      props: {
        status: 'pending',
        offerStatus: 'open',
      },
    })

    expect(wrapper.text()).toContain('En postulación')
    expect(wrapper.classes()).toContain('badge')
  })

  it('renderiza badge "En evaluación" cuando la postulación es pending pero la oferta ya cerró', () => {
    const wrapper = mount(ApplicationStatusBadge, {
      props: {
        status: 'pending',
        offerStatus: 'evaluating',
      },
    })

    expect(wrapper.text()).toContain('En evaluación')
  })

  it('renderiza badge para estado "selected" (Adjudicado)', () => {
    const wrapper = mount(ApplicationStatusBadge, {
      props: {
        status: 'selected',
      },
    })

    expect(wrapper.text()).toContain('Adjudicado')
  })

  it('renderiza badge para estado "not_selected" (No seleccionado)', () => {
    const wrapper = mount(ApplicationStatusBadge, {
      props: {
        status: 'not_selected',
      },
    })

    expect(wrapper.text()).toContain('No seleccionado')
  })

  it('renderiza badge y mensaje explicativo para estado "withdrawn_conflict"', () => {
    const wrapper = mount(ApplicationStatusBadge, {
      props: {
        status: 'withdrawn_conflict',
        showExplanation: true,
      },
    })

    expect(wrapper.text()).toContain('Retirado por conflicto')
    const explanation = wrapper.find('[data-test="conflict-explanation"]')
    expect(explanation.exists()).toBe(true)
    expect(explanation.text()).toContain('Fuiste seleccionado para otro turno en el mismo horario')
  })

  it('renderiza badge para estado "cancelled_by_staff" (Cancelado)', () => {
    const wrapper = mount(ApplicationStatusBadge, {
      props: {
        status: 'cancelled_by_staff',
      },
    })

    expect(wrapper.text()).toContain('Cancelado')
  })

  it('renderiza badge "Anulada" cuando la oferta fue anulada por la jefatura aunque la postulación esté pending', () => {
    const wrapper = mount(ApplicationStatusBadge, {
      props: {
        status: 'pending',
        offerStatus: 'cancelled',
      },
    })

    expect(wrapper.text()).toContain('Anulada')
    expect(wrapper.text()).not.toContain('En evaluación')
  })
})
