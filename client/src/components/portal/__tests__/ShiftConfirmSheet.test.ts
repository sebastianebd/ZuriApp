import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { setActivePinia, createPinia } from 'pinia'
import ShiftConfirmSheet from '../ShiftConfirmSheet.vue'
import { usePortalStore } from '@/stores/portal.store'

describe('ShiftConfirmSheet.vue - Bottom Sheet de Declaración de Indisponibilidad (TDD RED)', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.clearAllMocks()
  })

  const mockShift = {
    id: 'shift-101',
    assignmentModel: 'Replacement' as const,
    date: '2026-09-21',
    serviceName: 'Urgencias Adulto',
  }

  it('mantiene deshabilitado el botón de envío si el motivo tiene menos de 5 caracteres', async () => {
    const wrapper = mount(ShiftConfirmSheet, {
      props: {
        modelValue: true,
        shift: mockShift,
      },
    })

    const textarea = wrapper.find('[data-test="reason-textarea"]')
    const submitBtn = wrapper.find<HTMLButtonElement>('[data-test="submit-unavailable-btn"]')

    expect(submitBtn.element.disabled).toBe(true)

    await textarea.setValue('mal')
    expect(submitBtn.element.disabled).toBe(true)
  })

  it('habilita el botón de envío cuando el motivo tiene al menos 5 caracteres y ejecuta la acción', async () => {
    const portalStore = usePortalStore()
    const reportSpy = vi.spyOn(portalStore, 'reportUnavailableNextShift').mockResolvedValue({
      success: true,
      message: 'Indisponibilidad reportada',
    })

    const wrapper = mount(ShiftConfirmSheet, {
      props: {
        modelValue: true,
        shift: mockShift,
      },
    })

    const textarea = wrapper.find('[data-test="reason-textarea"]')
    const submitBtn = wrapper.find<HTMLButtonElement>('[data-test="submit-unavailable-btn"]')

    await textarea.setValue('Licencia médica de urgencia por fractura')
    expect(submitBtn.element.disabled).toBe(false)

    await submitBtn.trigger('click')

    expect(reportSpy).toHaveBeenCalledWith(
      'shift-101',
      'Replacement',
      '2026-09-21',
      'Licencia médica de urgencia por fractura'
    )
    expect(wrapper.emitted('update:modelValue')?.[0]).toEqual([false])
  })
})
