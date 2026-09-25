import { setActivePinia, createPinia } from 'pinia'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { useReplacementStore } from './replacement.store'
import * as ReplacementService from '../services/replacement.service'

vi.mock('../services/replacement.service', () => ({
  mostrarReemplazos: vi.fn(),
  crearReemplazo: vi.fn(),
  actualizarReemplazo: vi.fn(),
  eliminarReemplazo: vi.fn(),
  finalizarReemplazo: vi.fn(),
  obtenerReemplazosGrilla: vi.fn(),
}))

vi.mock('./auth.store', () => ({
  useAuthStore: () => ({
    usePrivateApi: () => ({}),
  }),
}))

describe('Replacement Store - Filtro de Estados Anulados/Inactivos (TDD RED)', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.clearAllMocks()
  })

  const staffId = 'staff-omar-123'

  it('getFechasAusencia NO debe incluir fechas de reemplazos ANULADOS o CANCELADOS', () => {
    const store = useReplacementStore()

    const mockReplacements: any[] = [
      {
        _id: 'rep-1',
        id_saliente: staffId,
        rut_saliente: '11.111.111-1',
        fecha_inicio: '2026-09-21',
        fecha_termino: '2026-09-25',
        status: 'ANULADO', // Reemplazo anulado
      },
      {
        _id: 'rep-2',
        id_saliente: staffId,
        rut_saliente: '11.111.111-1',
        fecha_inicio: '2026-09-26',
        fecha_termino: '2026-09-30',
        status: 'CANCELADO', // Reemplazo cancelado
      },
      {
        _id: 'rep-3',
        id_saliente: staffId,
        rut_saliente: '11.111.111-1',
        fecha_inicio: '2026-09-01',
        fecha_termino: '2026-09-05',
        status: 'EN CURSO', // Reemplazo activo
      },
    ]

    const fechasAusencia = store.getFechasAusencia(staffId, mockReplacements)

    // Los días 21 al 30 de los reemplazos anulados/cancelados NO deben estar presentes
    expect(fechasAusencia).not.toContain('2026-09-21')
    expect(fechasAusencia).not.toContain('2026-09-25')
    expect(fechasAusencia).not.toContain('2026-09-26')
    expect(fechasAusencia).not.toContain('2026-09-30')

    // El reemplazo activo sí debe estar
    expect(fechasAusencia).toContain('2026-09-01')
    expect(fechasAusencia).toContain('2026-09-05')
  })

  it('getFechasOcupadas NO debe incluir fechas de reemplazos ANULADOS o CANCELADOS donde el staff es entrante', () => {
    const store = useReplacementStore()

    const mockReplacements: any[] = [
      {
        _id: 'rep-4',
        id_entrante: staffId,
        rut_entrante: '11.111.111-1',
        fecha_inicio: '2026-09-21',
        fecha_termino: '2026-09-25',
        status: 'ANULADO',
      },
      {
        _id: 'rep-5',
        id_entrante: staffId,
        rut_entrante: '11.111.111-1',
        fecha_inicio: '2026-09-10',
        fecha_termino: '2026-09-12',
        status: 'PENDIENTE',
      },
    ]

    const fechasOcupadas = store.getFechasOcupadas(staffId, mockReplacements)

    expect(fechasOcupadas).not.toContain('2026-09-21')
    expect(fechasOcupadas).toContain('2026-09-10')
  })

  it('checkConflicts debe excluir reemplazos ANULADOS, CANCELADOS o RECHAZADOS', async () => {
    const store = useReplacementStore()

    const mockResponse = {
      reemplazos: [
        {
          _id: 'rep-1',
          id_saliente: staffId,
          rut_saliente: '11.111.111-1',
          fecha_inicio: '2026-09-21',
          fecha_termino: '2026-09-25',
          status: 'ANULADO',
        },
        {
          _id: 'rep-2',
          id_saliente: staffId,
          rut_saliente: '11.111.111-1',
          fecha_inicio: '2026-09-01',
          fecha_termino: '2026-09-05',
          status: 'CONFIRMADO',
        },
      ],
    }

    vi.mocked(ReplacementService.mostrarReemplazos).mockResolvedValue(mockResponse as any)

    const conflicts = await store.checkConflicts({ search: '11.111.111-1' })

    expect(conflicts).toHaveLength(1)
    expect(conflicts[0]._id).toBe('rep-2')
    expect(conflicts.find((c) => c._id === 'rep-1')).toBeUndefined()
  })
})
