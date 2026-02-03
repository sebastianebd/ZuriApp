export type TurnType = 'TERCER TURNO' | 'CUARTO TURNO' | 'DIURNO'
export type ShiftType = 'LARGO' | 'NOCHE' | 'LIBRE'

// Patterns definitions
// TERCER TURNO: L - N - X - X
// CUARTO TURNO: L - L - N - N - X - X
export const PATTERNS: Record<string, ShiftType[]> = {
  'TERCER TURNO': ['LARGO', 'NOCHE', 'LIBRE', 'LIBRE'],
  'CUARTO TURNO': ['LARGO', 'LARGO', 'NOCHE', 'NOCHE', 'LIBRE', 'LIBRE']
}

/**
 * Calculates the difference in days between two dates.
 * Discards time components (treats as start of day UTC to avoid DST issues).
 */
function diffDays(d1: Date, d2: Date): number {
  const utc1 = Date.UTC(d1.getFullYear(), d1.getMonth(), d1.getDate())
  const utc2 = Date.UTC(d2.getFullYear(), d2.getMonth(), d2.getDate())
  const msPerDay = 1000 * 60 * 60 * 24
  return Math.floor((utc1 - utc2) / msPerDay)
}

/**
 * Helper to parse dates ensuring 'YYYY-MM-DD' strings are treated as Local Time 00:00
 * to avoid UTC timezone offsets shifting the day back.
 */
export function parseAsLocal(d: string | Date): Date {
  if (typeof d === 'string') {
    // Take first 10 chars (YYYY-MM-DD) ignoring time/timezone info
    const datePart = d.substring(0, 10)
    if (/^\d{4}-\d{2}-\d{2}$/.test(datePart)) {
      const [y, m, day] = datePart.split('-').map(Number)
      return new Date(y, m - 1, day)
    }
  }
  return new Date(d)
}

/**
 * Calculates the shift for a specific date based on a start date and a pattern array.
 * @param targetDate The date to calculate the shift for.
 * @param startDate The start date of the cycle (pattern seed).
 * @param pattern Array of pattern elements (strings or objects).
 * @returns The element from the pattern array corresponding to the date, or null.
 */
export const calculateShift = <T>(
  targetDate: string | Date,
  startDate: string | Date,
  pattern: T[]
): T | null => {
  if (!pattern || pattern.length === 0) return null

  const target = parseAsLocal(targetDate)
  const start = parseAsLocal(startDate)

  // Calculate difference in days
  const diff = diffDays(target, start)

  // Handle dates before start date (pattern repeats backwards)
  // Mathematical modulo for negative numbers: ((n % m) + m) % m
  const patternIndex = ((diff % pattern.length) + pattern.length) % pattern.length

  return pattern[patternIndex]
}

export default {
  calculateShift,
  PATTERNS
}
