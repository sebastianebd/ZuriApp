import { describe, it, expect, beforeEach } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { nextTick } from 'vue'
import { useShiftsState } from '../useShiftsState'

describe('useShiftsState - Servicio Seleccionado & Persistencia', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    localStorage.clear()
  })

  it('inicializa selectedService como null si no hay valor guardado en localStorage', () => {
    const state = useShiftsState()
    expect(state.selectedService.value).toBeNull()
  })

  it('restaura el último servicio seleccionado desde zuriapp_shifts_selected_service', () => {
    localStorage.setItem('zuriapp_shifts_selected_service', 'srv-farmacia')

    const state = useShiftsState()
    expect(state.selectedService.value).toBe('srv-farmacia')
  })

  it('restaura desde zuriapp_preferred_service si no existe zuriapp_shifts_selected_service', () => {
    localStorage.setItem('zuriapp_preferred_service', 'srv-urgencias')

    const state = useShiftsState()
    expect(state.selectedService.value).toBe('srv-urgencias')
  })

  it('persiste el nuevo servicio en localStorage al cambiar selectedService', async () => {
    const state = useShiftsState()
    state.selectedService.value = 'srv-ginecologia'

    await nextTick()

    expect(localStorage.getItem('zuriapp_shifts_selected_service')).toBe('srv-ginecologia')
    expect(localStorage.getItem('zuriapp_preferred_service')).toBe('srv-ginecologia')
  })

  it('remueve zuriapp_shifts_selected_service al limpiar el selector (valor null)', async () => {
    localStorage.setItem('zuriapp_shifts_selected_service', 'srv-farmacia')
    const state = useShiftsState()

    state.selectedService.value = null
    await nextTick()

    expect(localStorage.getItem('zuriapp_shifts_selected_service')).toBeNull()
  })

  it('no lee ni escribe en localStorage si historyMode es true', async () => {
    localStorage.setItem('zuriapp_shifts_selected_service', 'srv-farmacia')

    const state = useShiftsState({ historyMode: true })
    expect(state.selectedService.value).toBeNull()

    state.selectedService.value = 'srv-otro'
    await nextTick()

    expect(localStorage.getItem('zuriapp_shifts_selected_service')).toBe('srv-farmacia')
  })

  it('permite navegar a meses futuros (canGoNext es true y nextMonth avanza la fecha)', () => {
    const state = useShiftsState()
    const initialMonth = state.currentMonth.value

    expect(state.canGoNext.value).toBe(true)

    state.nextMonth()
    const expectedMonth = (initialMonth + 1) % 12
    expect(state.currentMonth.value).toBe(expectedMonth)
    expect(state.canGoNext.value).toBe(true)
  })
})
