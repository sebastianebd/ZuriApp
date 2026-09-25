import { describe, it, expect } from 'vitest'
import { findNextAvailableDate } from './date-utils'

describe('date-utils - findNextAvailableDate (TDD RED)', () => {
  it('debe retornar la fecha base si no está bloqueada', () => {
    const baseDate = new Date(2026, 8, 17) // 17 Sept 2026
    const blocked: any[] = []

    const result = findNextAvailableDate(baseDate, blocked)

    expect(result.getFullYear()).toBe(2026)
    expect(result.getMonth()).toBe(8)
    expect(result.getDate()).toBe(17)
  })

  it('debe saltar al día 21 si hoy es 17 y los días del 1 al 20 están bloqueados en un rango', () => {
    const today = new Date(2026, 8, 17) // 17 Sept 2026
    const blockedRanges = [
      {
        start: new Date(2026, 8, 1),
        end: new Date(2026, 8, 20)
      }
    ]

    const nextAvailable = findNextAvailableDate(today, blockedRanges)

    expect(nextAvailable.getFullYear()).toBe(2026)
    expect(nextAvailable.getMonth()).toBe(8)
    expect(nextAvailable.getDate()).toBe(21)
  })

  it('debe considerar fechas individuales en formato string o Date y saltar días continuos bloqueados', () => {
    const today = new Date(2026, 8, 17) // 17 Sept 2026
    const blocked = [
      '2026-09-17',
      '2026-09-18',
      new Date(2026, 8, 19),
      { start: new Date(2026, 8, 20), end: new Date(2026, 8, 20) }
    ]

    const nextAvailable = findNextAvailableDate(today, blocked)

    expect(nextAvailable.getDate()).toBe(21)
  })
})
