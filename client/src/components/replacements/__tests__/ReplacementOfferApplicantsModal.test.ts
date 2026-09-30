import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import ReplacementOfferApplicantsModal from '../ReplacementOfferApplicantsModal.vue'

describe('ReplacementOfferApplicantsModal.vue - Modal Dual Scoring y Contingencia (TDD RED)', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('Modo Postulantes: renderiza candidatos rankeados con puntajes y botón de adjudicar turno', async () => {
    const mockCandidates = [
      {
        staffId: 'staff-1',
        fullName: 'Carlos Pérez',
        rut: '11.111.111-1',
        phone: '+56911111111',
        positionName: 'Enfermero/a Clínico/a',
        score: 85,
        breakdown: {
          matchesPosition: true,
          hoursSinceLastShift: 36,
          historicalHoursInService: 120,
        },
      },
      {
        staffId: 'staff-2',
        fullName: 'Juan Soto',
        rut: '22.222.222-2',
        phone: '+56922222222',
        positionName: 'Enfermero/a Clínico/a',
        score: 45,
        breakdown: {
          matchesPosition: true,
          hoursSinceLastShift: 14,
          historicalHoursInService: 0,
        },
      },
    ]

    const wrapper = mount(ReplacementOfferApplicantsModal, {
      props: {
        visible: true,
        offerId: 'offer-1',
        isCallList: false,
        candidates: mockCandidates,
        loading: false,
      },
    })

    await flushPromises()

    const text = wrapper.text()
    expect(text).toContain('Carlos Pérez')
    expect(text).toContain('85 pts')
    expect(text).toContain('Juan Soto')
    expect(text).toContain('45 pts')

    const awardButtons = wrapper.findAll('button').filter((b) => b.text().includes('Adjudicar'))
    expect(awardButtons.length).toBeGreaterThanOrEqual(1)

    await awardButtons[0].trigger('click')
    expect(wrapper.emitted('award')).toBeDefined()
    expect(wrapper.emitted('award')![0]).toEqual(['staff-1'])
  })

  it('Modo Búsqueda Activa (0 postulantes): renderiza lista de contingencia con enlaces telefónicos directos', async () => {
    const mockCallList = [
      {
        staffId: 'staff-contingency',
        fullName: 'Laura Directa',
        rut: '15.555.555-5',
        phone: '+56999887766',
        positionName: 'Enfermero/a Clínico/a',
        score: 70,
        breakdown: {
          matchesPosition: true,
          hoursSinceLastShift: 48,
          historicalHoursInService: 24,
        },
      },
    ]

    const wrapper = mount(ReplacementOfferApplicantsModal, {
      props: {
        visible: true,
        offerId: 'offer-desierta',
        isCallList: true,
        candidates: mockCallList,
        loading: false,
      },
    })

    await flushPromises()

    const text = wrapper.text()
    expect(text).toContain('Búsqueda Activa')
    expect(text).toContain('Laura Directa')
    expect(text).toContain('+56999887766')

    const phoneLink = wrapper.find('a[href^="tel:"]')
    expect(phoneLink.exists()).toBe(true)
    expect(phoneLink.attributes('href')).toBe('tel:+56999887766')
  })
})
