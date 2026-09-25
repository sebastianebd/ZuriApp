import { describe, it, expect, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import OfferCard from '../OfferCard.vue'
import type { PwaOpenOfferItem } from '@/types/portal.types'

describe('OfferCard.vue - Tarjeta de Convocatoria Móvil (TDD RED)', () => {
  const mockOffer: PwaOpenOfferItem = {
    id: 'offer-123',
    serviceName: 'Urgencias Adulto',
    serviceLocation: 'Edificio Central - Zócalo',
    positionName: 'TENS Urgencias',
    tipo_turno: 'Largo',
    entryTime: '08:00',
    exitTime: '20:00',
    fecha_inicio: '2026-09-25T08:00:00.000Z',
    fecha_termino: '2026-09-25T20:00:00.000Z',
    totalShifts: 1,
    expiresAt: new Date(Date.now() + 45 * 60 * 1000).toISOString(), // Cierra en 45 mins
    observaciones: 'Apoyo en sala de reanimación',
    alreadyApplied: false,
  }

  it('renderiza la información clínica y operativa de la convocatoria', () => {
    const wrapper = mount(OfferCard, {
      props: { offer: mockOffer },
    })

    expect(wrapper.find('[data-test="service-name"]').text()).toContain('Urgencias Adulto')
    expect(wrapper.find('[data-test="position-name"]').text()).toContain('TENS Urgencias')
    expect(wrapper.find('[data-test="shift-badge"]').text()).toContain('Largo')
    expect(wrapper.find('[data-test="offer-notes"]').text()).toContain('Apoyo en sala de reanimación')
  })

  it('muestra el badge con cuenta regresiva en vivo', () => {
    const wrapper = mount(OfferCard, {
      props: { offer: mockOffer },
    })

    const countdown = wrapper.find('[data-test="countdown-badge"]')
    expect(countdown.exists()).toBe(true)
    expect(countdown.text()).toMatch(/cierra en/i)
  })

  it('muestra el botón "Aplicar a Reemplazo" cuando no ha postulado y emite @apply al hacer click', async () => {
    const wrapper = mount(OfferCard, {
      props: { offer: mockOffer },
    })

    const applyBtn = wrapper.find('[data-test="apply-btn"]')
    expect(applyBtn.exists()).toBe(true)
    expect(applyBtn.text()).toContain('Aplicar a Reemplazo')
    expect(applyBtn.attributes('disabled')).toBeUndefined()

    await applyBtn.trigger('click')
    expect(wrapper.emitted('apply')).toBeTruthy()
    expect(wrapper.emitted('apply')![0]).toEqual(['offer-123'])
  })

  it('bloquea el botón en gris con texto "Ya aplicaste a este Reemplazo" cuando ya postuló y no muestra botón de cancelar', async () => {
    const appliedOffer: PwaOpenOfferItem = {
      ...mockOffer,
      alreadyApplied: true,
      myApplicationStatus: 'pending',
    }

    const wrapper = mount(OfferCard, {
      props: { offer: appliedOffer },
    })

    const applyBtn = wrapper.find('[data-test="apply-btn"]')
    expect(applyBtn.exists()).toBe(true)
    expect(applyBtn.text()).toContain('Ya aplicaste a este Reemplazo')
    expect(applyBtn.attributes('disabled')).toBeDefined()
    expect(applyBtn.classes()).toContain('btn-secondary')

    // El botón de cancelar postulación debe haber sido eliminado completamente
    expect(wrapper.find('[data-test="withdraw-btn"]').exists()).toBe(false)
    expect(wrapper.text()).not.toContain('Cancelar')
  })

  it('deshabilita los botones de acción durante el estado de carga', () => {
    const wrapper = mount(OfferCard, {
      props: {
        offer: mockOffer,
        loading: true,
      },
    })

    const applyBtn = wrapper.find('[data-test="apply-btn"]')
    expect(applyBtn.attributes('disabled')).toBeDefined()
  })
})
