import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import ShiftDayDetailSheet from '../ShiftDayDetailSheet.vue'
import type { PortalShiftItem } from '@/types/portal.types'

describe('ShiftDayDetailSheet.vue - Panel de Detalle Diario de Turno (TDD RED)', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  const mockBaseShift: PortalShiftItem = {
    date: '2026-09-15',
    sigla: 'L',
    isWorkDay: true,
    isReplacement: false,
    serviceId: 'srv-urgencias-1',
    serviceName: 'Urgencias Adulto',
    entryTime: '08:00',
    exitTime: '20:00',
    confirmationStatus: 'confirmed',
  }

  const mockReplacementShift: PortalShiftItem = {
    ...mockBaseShift,
    isReplacement: true,
    replacementId: 'rep-101',
    replacementBusinessCode: 'REP-2026-0891',
  }

  it('muestra la información completa del turno del día', () => {
    const wrapper = mount(ShiftDayDetailSheet, {
      props: {
        modelValue: true,
        shift: mockBaseShift,
      },
    })

    expect(wrapper.find('[data-test="detail-date"]').text()).toContain('15/09/2026')
    expect(wrapper.find('[data-test="detail-service"]').text()).toContain('Urgencias Adulto')
    expect(wrapper.find('[data-test="detail-hours"]').text()).toContain('08:00 - 20:00')
    expect(wrapper.find('[data-test="detail-confirmation"]').text()).toMatch(/confirmada/i)
  })

  it('muestra el banner y enlace al contrato cuando el turno proviene de un reemplazo', async () => {
    const wrapper = mount(ShiftDayDetailSheet, {
      props: {
        modelValue: true,
        shift: mockReplacementShift,
      },
    })

    const contractBanner = wrapper.find('[data-test="replacement-contract-banner"]')
    expect(contractBanner.exists()).toBe(true)
    expect(contractBanner.text()).toContain('REP-2026-0891')

    const viewContractLink = wrapper.find('[data-test="view-contract-link"]')
    expect(viewContractLink.exists()).toBe(true)

    await viewContractLink.trigger('click')
    expect(wrapper.emitted('view-contract')?.[0]).toEqual(['rep-101'])
  })
})
