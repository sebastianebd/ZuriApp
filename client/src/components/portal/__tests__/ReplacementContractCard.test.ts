import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { setActivePinia, createPinia } from 'pinia'
import ReplacementContractCard from '../ReplacementContractCard.vue'
import { usePortalStore } from '@/stores/portal.store'
import type { PortalReplacementContract } from '@/types/portal.types'

describe('ReplacementContractCard.vue - Tarjeta de Pseudo-Contrato de Reemplazo (TDD RED)', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.clearAllMocks()
  })

  const mockContract: PortalReplacementContract = {
    id: 'rep-101',
    businessCode: 'REP-2026-0891',
    serviceId: 'srv-urgencias-1',
    serviceName: 'Urgencias Adulto',
    startDate: '2026-09-01',
    endDate: '2026-09-15',
    totalDays: 15,
    status: 'Activo',
    shiftsCommittedCount: 6,
    origin: 'Asignación Directa',
  }

  it('renderiza la información del contrato (código REP, servicio, fechas y badge de estado)', () => {
    const wrapper = mount(ReplacementContractCard, {
      props: {
        contract: mockContract,
      },
    })

    expect(wrapper.find('[data-test="contract-code"]').text()).toContain('REP-2026-0891')
    expect(wrapper.find('[data-test="contract-service"]').text()).toContain('Urgencias Adulto')
    expect(wrapper.find('[data-test="contract-dates"]').text()).toContain('01/09/2026')
    expect(wrapper.find('[data-test="contract-dates"]').text()).toContain('15/09/2026')
    expect(wrapper.find('[data-test="contract-status"]').text()).toMatch(/activo/i)
    expect(wrapper.find('[data-test="contract-shifts-count"]').text()).toContain('6')
  })

  it('permite copiar el código de negocio al portapapeles', async () => {
    const writeTextSpy = vi.fn().mockResolvedValue(undefined)
    Object.defineProperty(navigator, 'clipboard', {
      value: { writeText: writeTextSpy },
      configurable: true,
      writable: true,
    })

    const wrapper = mount(ReplacementContractCard, {
      props: {
        contract: mockContract,
      },
    })

    const copyBtn = wrapper.find('[data-test="copy-code-btn"]')
    expect(copyBtn.exists()).toBe(true)
    await copyBtn.trigger('click')

    expect(writeTextSpy).toHaveBeenCalledWith('REP-2026-0891')
    expect(wrapper.find('[data-test="copy-feedback"]').exists()).toBe(true)
  })

  it('invoca la descarga del comprobante PDF al pulsar el botón correspondiente', async () => {
    const portalStore = usePortalStore()
    const downloadSpy = vi.spyOn(portalStore, 'downloadReplacementVoucherPdf' as any).mockResolvedValue(undefined)

    const wrapper = mount(ReplacementContractCard, {
      props: {
        contract: mockContract,
      },
    })

    const downloadBtn = wrapper.find('[data-test="download-voucher-btn"]')
    expect(downloadBtn.exists()).toBe(true)
    await downloadBtn.trigger('click')

    expect(downloadSpy).toHaveBeenCalledWith('rep-101')
  })
})
