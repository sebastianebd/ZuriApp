
import { formatDistanceToNow } from 'date-fns'
import { es } from 'date-fns/locale'

export const getDatesInRange = (startDate: string, endDate: string): string[] => {
  const dates: string[] = [];
  const currentDate = new Date(startDate);
  const stopDate = new Date(endDate);

  // Asegurar que la fecha de inicio sea correcta al inicio del día (zona horaria)
  currentDate.setUTCHours(0, 0, 0, 0); 
  stopDate.setUTCHours(0, 0, 0, 0);

  // Itera día a día
  while (currentDate <= stopDate) {
    dates.push(currentDate.toISOString().slice(0, 10));
    currentDate.setDate(currentDate.getDate() + 1);
  }
  return dates;
};

export function formatDate(iso: string | Date | null | undefined): string {
  if (!iso) return '-'
  return new Date(iso).toLocaleDateString('es-CL', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  })
}

export function formatTime(iso: string | Date | null | undefined): string {
  if (!iso) return '-'
  return new Date(iso).toLocaleTimeString('es-CL', { hour: '2-digit', minute: '2-digit' })
}

export function formatDateLong(dateString: string | Date | null | undefined) {
  if (!dateString) return 'N/A'
  const date = dateString instanceof Date ? dateString : new Date(dateString)
  return date.toLocaleDateString('es-CL', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  })
}

export function formatRelativeTime(dateString: string) {
  return formatDistanceToNow(new Date(dateString), { addSuffix: true, locale: es })
}

/** Formatea una fecha ISO a dd-mm-yyyy mediante manipulación de string,
 *  evitando bugs de conversión de zona horaria local. */
export function formatDateDDMMYYYY(fechaIso: string): string {
  if (!fechaIso) return '-'
  const [year, month, day] = fechaIso.slice(0, 10).split('-')
  return `${day}-${month}-${year}`
}

/** Formatea una fecha asegurando UTC para evitar corrimientos por zona horaria */
export const formatReportDate = (dateStr: string | Date): string => {
  const d = new Date(dateStr)
  const day = String(d.getUTCDate()).padStart(2, '0')
  const mn = String(d.getUTCMonth() + 1).padStart(2, '0')
  const yr = d.getUTCFullYear()
  return `${day}/${mn}/${yr}`
}

/**
 * Encuentra el primer día disponible a partir de una fecha base (por defecto hoy)
 * que no se encuentre dentro de los rangos o fechas bloqueadas proporcionadas.
 *
 * @param fromDate Fecha base desde donde iniciar la búsqueda.
 * @param blockedItems Lista de bloqueos: Date individuales, objetos { start: Date, end?: Date }, o strings 'YYYY-MM-DD'.
 * @param maxDaysToSearch Límite de días a buscar para evitar bucles infinitos (por defecto 365 días).
 * @returns La primera Date disponible (a las 00:00:00 local).
 */
export function findNextAvailableDate(
  fromDate: Date = new Date(),
  blockedItems: any[] = [],
  maxDaysToSearch: number = 365
): Date {
  const candidate = new Date(fromDate)
  candidate.setHours(0, 0, 0, 0)

  if (!blockedItems || blockedItems.length === 0) {
    return candidate
  }

  // Pre-normalizar los rangos bloqueados para comparación en milisegundos
  const ranges = blockedItems
    .filter(Boolean)
    .map((item) => {
      let start: Date
      let end: Date
      if (item && item.start) {
        start = new Date(item.start)
        end = item.end ? new Date(item.end) : new Date(start)
      } else if (typeof item === 'string') {
        const [y, m, d] = item.split('-').map(Number)
        start = new Date(y, m - 1, d)
        end = new Date(y, m - 1, d)
      } else {
        start = new Date(item)
        end = new Date(item)
      }
      start.setHours(0, 0, 0, 0)
      end.setHours(23, 59, 59, 999)
      return { start: start.getTime(), end: end.getTime() }
    })

  for (let i = 0; i < maxDaysToSearch; i++) {
    const time = candidate.getTime()
    const isBlocked = ranges.some((r) => time >= r.start && time <= r.end)
    if (!isBlocked) {
      return candidate
    }
    candidate.setDate(candidate.getDate() + 1)
  }

  return candidate
}

