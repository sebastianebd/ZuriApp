import { describe, it, expect } from 'vitest'
import { ref } from 'vue'
import { useReplacementCoverage } from './useReplacementCoverage'

describe('useReplacementCoverage', () => {
  const mockReplacements = [
    {
      _id: 'rep-1',
      id_negocio: 'REP-001',
      nombre_saliente: 'Juan',
      apellido_saliente: 'Perez',
      rut_saliente: '11.111.111-1',
      nombre_entrante: 'Maria',
      apellido_entrante: 'Gonzalez',
      rut_entrante: '22.222.222-2',
      servicio: 'serv-1',
      tipo_turno: 'Cuarto Turno',
      fecha_inicio: '2026-09-05T00:00:00.000Z',
      fecha_termino: '2026-09-15T00:00:00.000Z',
      status: 'active'
    },
    {
      _id: 'rep-2',
      id_negocio: 'REP-002',
      nombre_saliente: 'Juan',
      apellido_saliente: 'Perez',
      rut_saliente: '11.111.111-1',
      nombre_entrante: 'Carlos',
      apellido_entrante: 'Lopez',
      rut_entrante: '33.333.333-3',
      servicio: 'serv-1',
      tipo_turno: 'Cuarto Turno',
      fecha_inicio: '2026-09-12T00:00:00.000Z', // Overlaps with rep-1 (Sept 12 to 20 vs Sept 5 to 15)
      fecha_termino: '2026-09-20T00:00:00.000Z',
      status: 'active'
    },
    {
      _id: 'rep-3',
      id_negocio: 'REP-003',
      nombre_saliente: 'Ana',
      apellido_saliente: 'Rojas',
      rut_saliente: '44.444.444-4',
      nombre_entrante: 'Pedro',
      apellido_entrante: 'Soto',
      rut_entrante: '55.555.555-5',
      servicio: 'serv-2',
      tipo_turno: 'Diurno',
      fecha_inicio: '2026-09-22T00:00:00.000Z',
      fecha_termino: '2026-09-28T00:00:00.000Z',
      status: 'active'
    },
    {
      _id: 'rep-4-cancelled',
      id_negocio: 'REP-004',
      nombre_saliente: 'Luis',
      apellido_saliente: 'Vidal',
      rut_saliente: '66.666.666-6',
      nombre_entrante: 'Pedro',
      apellido_entrante: 'Soto',
      rut_entrante: '55.555.555-5',
      servicio: 'serv-1',
      fecha_inicio: '2026-09-01T00:00:00.000Z',
      fecha_termino: '2026-09-10T00:00:00.000Z',
      status: 'cancelled'
    },
    {
      _id: 'rep-5-october',
      id_negocio: 'REP-005',
      nombre_saliente: 'Marta',
      apellido_saliente: 'Silva',
      rut_saliente: '77.777.777-7',
      nombre_entrante: 'Pedro',
      apellido_entrante: 'Soto',
      rut_entrante: '55.555.555-5',
      servicio: 'serv-1',
      fecha_inicio: '2026-10-05T00:00:00.000Z',
      fecha_termino: '2026-10-15T00:00:00.000Z',
      status: 'active'
    }
  ]

  it('calcula correctamente los días del mes y navegación de mes', () => {
    const replacementsRef = ref(mockReplacements as any)
    const {
      selectedYear,
      selectedMonth,
      monthName,
      daysInMonth,
      daysList,
      nextMonth,
      prevMonth
    } = useReplacementCoverage({
      replacements: replacementsRef,
      initialYear: 2026,
      initialMonth: 9 // Septiembre 2026 (30 días)
    })

    expect(selectedYear.value).toBe(2026)
    expect(selectedMonth.value).toBe(9)
    expect(daysInMonth.value).toBe(30)
    expect(daysList.value.length).toBe(30)
    expect(monthName.value.toLowerCase()).toContain('septiembre')
    expect(monthName.value).toContain('2026')

    // Navegación al mes siguiente (Octubre 2026: 31 días)
    nextMonth()
    expect(selectedMonth.value).toBe(10)
    expect(daysInMonth.value).toBe(31)

    // Navegación al mes anterior (de vuelta a Septiembre)
    prevMonth()
    expect(selectedMonth.value).toBe(9)
    expect(daysInMonth.value).toBe(30)
  })

  it('filtra los reemplazos vigentes para el mes excluyendo cancelados y fuera de fecha', () => {
    const replacementsRef = ref(mockReplacements as any)
    const { monthlyReplacements } = useReplacementCoverage({
      replacements: replacementsRef,
      initialYear: 2026,
      initialMonth: 9
    })

    // Deberían estar rep-1, rep-2, rep-3 (rep-4 está cancelado, rep-5 es de octubre)
    expect(monthlyReplacements.value.length).toBe(3)
    const ids = monthlyReplacements.value.map((r) => r._id)
    expect(ids).toContain('rep-1')
    expect(ids).toContain('rep-2')
    expect(ids).toContain('rep-3')
    expect(ids).not.toContain('rep-4-cancelled')
    expect(ids).not.toContain('rep-5-october')
  })

  it('detecta solapamientos entre reemplazos del mismo titular en fechas coincidentes', () => {
    const replacementsRef = ref(mockReplacements as any)
    const { conflicts, conflictsCount, hasConflicts } = useReplacementCoverage({
      replacements: replacementsRef,
      initialYear: 2026,
      initialMonth: 9
    })

    expect(hasConflicts.value).toBe(true)
    expect(conflictsCount.value).toBe(1)
    expect(conflicts.value[0].type).toBe('same_titular')
    expect(conflicts.value[0].replacementIdA).toBe('rep-1')
    expect(conflicts.value[0].replacementIdB).toBe('rep-2')
    expect(conflicts.value[0].description).toContain('Juan Perez')
  })

  it('detecta solapamientos si un mismo funcionario entrante es asignado a dos reemplazos al mismo tiempo', () => {
    const doubleBookingMock = [
      {
        _id: 'book-1',
        id_negocio: 'REP-101',
        nombre_saliente: 'Titular Uno',
        apellido_saliente: 'Sur',
        rut_saliente: '11.111.111-1',
        nombre_entrante: 'Reemplazante Clon',
        apellido_entrante: 'Norte',
        rut_entrante: '99.999.999-9',
        servicio: 'serv-1',
        fecha_inicio: '2026-09-10T00:00:00.000Z',
        fecha_termino: '2026-09-20T00:00:00.000Z',
        status: 'active'
      },
      {
        _id: 'book-2',
        id_negocio: 'REP-102',
        nombre_saliente: 'Titular Dos',
        apellido_saliente: 'Este',
        rut_saliente: '22.222.222-2',
        nombre_entrante: 'Reemplazante Clon',
        apellido_entrante: 'Norte',
        rut_entrante: '99.999.999-9',
        servicio: 'serv-2',
        fecha_inicio: '2026-09-15T00:00:00.000Z', // Clashes with book-1 between 15 and 20
        fecha_termino: '2026-09-25T00:00:00.000Z',
        status: 'active'
      }
    ]

    const replacementsRef = ref(doubleBookingMock as any)
    const { conflicts, conflictsCount } = useReplacementCoverage({
      replacements: replacementsRef,
      initialYear: 2026,
      initialMonth: 9
    })

    expect(conflictsCount.value).toBe(1)
    expect(conflicts.value[0].type).toBe('same_reemplazante')
    expect(conflicts.value[0].description).toContain('Reemplazante Clon')
  })

  it('organiza las filas agrupadas por titular y asigna sub-tracks para evitar que barras se monten', () => {
    const replacementsRef = ref(mockReplacements as any)
    const { coverageRows } = useReplacementCoverage({
      replacements: replacementsRef,
      initialYear: 2026,
      initialMonth: 9
    })

    // Juan Perez tiene 2 reemplazos solapados -> totalTracks = 2
    const juanRow = coverageRows.value.find((r) => r.titularRut === '11.111.111-1')
    expect(juanRow).toBeDefined()
    expect(juanRow!.items.length).toBe(2)
    expect(juanRow!.hasConflict).toBe(true)
    expect(juanRow!.totalTracks).toBe(2)

    // Un item tiene trackIndex 0 y el otro trackIndex 1
    const trackIndices = juanRow!.items.map((i) => i.trackIndex).sort()
    expect(trackIndices).toEqual([0, 1])

    // Ana Rojas tiene 1 reemplazo sin solapamiento -> totalTracks = 1, hasConflict = false
    const anaRow = coverageRows.value.find((r) => r.titularRut === '44.444.444-4')
    expect(anaRow).toBeDefined()
    expect(anaRow!.items.length).toBe(1)
    expect(anaRow!.hasConflict).toBe(false)
    expect(anaRow!.totalTracks).toBe(1)
    expect(anaRow!.items[0].trackIndex).toBe(0)
  })

  it('aplica correctamente el filtro de servicio cuando se selecciona uno', () => {
    const replacementsRef = ref(mockReplacements as any)
    const { selectedServiceId, monthlyReplacements, coverageRows } = useReplacementCoverage({
      replacements: replacementsRef,
      initialYear: 2026,
      initialMonth: 9
    })

    selectedServiceId.value = 'serv-2'
    expect(monthlyReplacements.value.length).toBe(1)
    expect(monthlyReplacements.value[0]._id).toBe('rep-3')
    expect(coverageRows.value.length).toBe(1)
    expect(coverageRows.value[0].titularRut).toBe('44.444.444-4')
  })
})
