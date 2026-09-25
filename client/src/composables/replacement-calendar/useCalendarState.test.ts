import { describe, it, expect, vi, beforeEach } from 'vitest'
import { useCalendarState } from './useCalendarState'
import * as ReplacementService from '@/services/replacement.service'

// Mocks de stores y servicios
vi.mock('@/stores/auth.store', () => ({
  useAuthStore: () => ({
    usePrivateApi: () => ({})
  })
}))

const mockServices = [
  { _id: 'srv-1', nombre: 'FARMACIA' },
  { _id: 'srv-2', nombre: 'URGENCIAS' }
]

vi.mock('@/stores/service.store', () => ({
  useServiceStore: () => ({
    services: mockServices,
    fetchServices: vi.fn(),
    getServiceName: vi.fn((id: string) => {
      const found = mockServices.find(s => s._id === id)
      return found ? found.nombre : 'Servicio Desconocido'
    })
  })
}))

vi.mock('@/services/replacement.service', () => ({
  mostrarReemplazos: vi.fn()
}))

describe('useCalendarState', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('initializes with "Todos los Servicios" option and empty selectedService', () => {
    const state = useCalendarState()

    expect(state.selectedService.value).toBe('')
    expect(state.serviceOptions.value).toHaveLength(3)
    expect(state.serviceOptions.value[0]).toEqual({ nombre: 'Todos los Servicios', _id: '' })
  })

  it('loads and transforms replacements into calendar events with allDay: true and exclusive end date', async () => {
    const mockData = {
      reemplazos: [
        {
          _id: 'rep-1',
          nombre_saliente: 'JUAN',
          apellido_saliente: 'PEREZ',
          nombre_entrante: 'MARIA',
          apellido_entrante: 'GONZALEZ',
          fecha_inicio: '2026-04-10T00:00:00.000Z',
          fecha_termino: '2026-04-15T00:00:00.000Z',
          servicio: 'srv-1',
          tipo_turno: 'LARGO',
          status: 'EN CURSO'
        }
      ]
    }

    vi.mocked(ReplacementService.mostrarReemplazos).mockResolvedValueOnce(mockData)

    const state = useCalendarState()
    await state.refreshCalendar()

    expect(state.calendarEvents.value).toHaveLength(1)
    const event = state.calendarEvents.value[0]
    expect(event.id).toBe('rep-1')
    expect(event.title).toBe('Maria Gonzalez - LARGO')
    expect(event.start).toBe('2026-04-10')
    expect(event.end).toBe('2026-04-16') // RFC 5545 exclusive (+1 day)
    expect(event.allDay).toBe(true)
    expect(event.backgroundColor).toBe('#10b981') // EN CURSO is green
  })

  it('handles single-day replacements properly', async () => {
    const mockData = {
      reemplazos: [
        {
          _id: 'rep-2',
          nombre_entrante: 'PEDRO',
          apellido_entrante: 'SOTO',
          fecha_inicio: '2026-04-20',
          fecha_termino: '2026-04-20',
          servicio: 'srv-2',
          tipo_turno: 'NOCHE',
          status: 'PENDIENTE'
        }
      ]
    }

    vi.mocked(ReplacementService.mostrarReemplazos).mockResolvedValueOnce(mockData)

    const state = useCalendarState()
    await state.refreshCalendar()

    expect(state.calendarEvents.value).toHaveLength(1)
    const event = state.calendarEvents.value[0]
    expect(event.start).toBe('2026-04-20')
    expect(event.end).toBe('2026-04-21') // Next day exclusive
    expect(event.allDay).toBe(true)
    expect(event.backgroundColor).toBe('#f59e0b') // PENDIENTE is amber
  })

  it('manages modal visibility and selection', () => {
    const state = useCalendarState()
    expect(state.modalVisible.value).toBe(false)
    expect(state.eventoSeleccionado.value).toBeNull()

    const mockInfo = {
      event: {
        extendedProps: { id: 'rep-1', notes: 'Detalle del turno' }
      }
    }

    state.handleEventClick(mockInfo)
    expect(state.modalVisible.value).toBe(true)
    expect(state.eventoSeleccionado.value).toEqual({ id: 'rep-1', notes: 'Detalle del turno' })

    state.closeModal()
    expect(state.modalVisible.value).toBe(false)
    expect(state.eventoSeleccionado.value).toBeNull()
  })
})
