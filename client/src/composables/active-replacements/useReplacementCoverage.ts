import { ref, computed, type Ref, type ComputedRef } from 'vue'
import { formatTitleCase } from '@/utils/text-formatters'

export interface DayInfo {
  day: number
  weekdayShort: string
  isWeekend: boolean
  isToday: boolean
  dateStr: string
}

export interface CoverageConflict {
  replacementIdA: string
  replacementIdB: string
  type: 'same_titular' | 'same_reemplazante'
  description: string
  overlapStart: string
  overlapEnd: string
}

export interface CoverageItem {
  replacement: any
  startDay: number
  endDay: number
  spanDays: number
  isStartClamped: boolean
  isEndClamped: boolean
  hasConflict: boolean
  conflictReasons: string[]
  trackIndex: number
}

export interface CoverageRow {
  titularKey: string
  titularFullName: string
  titularRut: string
  servicio: any
  servicioNombre: string
  cargoNombre: string
  hasConflict: boolean
  items: CoverageItem[]
  totalTracks: number
}

export interface UseReplacementCoverageOptions {
  replacements: Ref<any[]> | ComputedRef<any[]>
  initialYear?: number
  initialMonth?: number
  services?: Ref<any[]> | ComputedRef<any[]>
  getServiceName?: (id: any) => string
}

const MONTH_NAMES = [
  'Enero',
  'Febrero',
  'Marzo',
  'Abril',
  'Mayo',
  'Junio',
  'Julio',
  'Agosto',
  'Septiembre',
  'Octubre',
  'Noviembre',
  'Diciembre'
]

const WEEKDAY_NAMES = ['DOM', 'LUN', 'MAR', 'MIÉ', 'JUE', 'VIE', 'SÁB']

export function useReplacementCoverage(options: UseReplacementCoverageOptions) {
  const now = new Date()
  const selectedYear = ref(options.initialYear ?? now.getFullYear())
  const selectedMonth = ref(options.initialMonth ?? now.getMonth() + 1) // 1-12
  const selectedServiceId = ref<string>('')

  // Nombre formateado del mes y año (ej: "Septiembre 2026")
  const monthName = computed(() => {
    const idx = Math.max(0, Math.min(11, selectedMonth.value - 1))
    return `${MONTH_NAMES[idx]} ${selectedYear.value}`
  })

  // Cantidad de días en el mes seleccionado
  const daysInMonth = computed(() => {
    return new Date(selectedYear.value, selectedMonth.value, 0).getDate()
  })

  // Lista estructurada de días del mes
  const daysList = computed<DayInfo[]>(() => {
    const year = selectedYear.value
    const month = selectedMonth.value
    const totalDays = daysInMonth.value
    const today = new Date()
    const todayY = today.getFullYear()
    const todayM = today.getMonth() + 1
    const todayD = today.getDate()

    const list: DayInfo[] = []
    for (let d = 1; d <= totalDays; d++) {
      const dateObj = new Date(year, month - 1, d)
      const dayOfWeek = dateObj.getDay()
      const isWeekend = dayOfWeek === 0 || dayOfWeek === 6
      const isToday = year === todayY && month === todayM && d === todayD
      const padM = String(month).padStart(2, '0')
      const padD = String(d).padStart(2, '0')

      list.push({
        day: d,
        weekdayShort: WEEKDAY_NAMES[dayOfWeek],
        isWeekend,
        isToday,
        dateStr: `${year}-${padM}-${padD}`
      })
    }
    return list
  })

  // Navegación de mes
  function nextMonth() {
    if (selectedMonth.value === 12) {
      selectedMonth.value = 1
      selectedYear.value++
    } else {
      selectedMonth.value++
    }
  }

  function prevMonth() {
    if (selectedMonth.value === 1) {
      selectedMonth.value = 12
      selectedYear.value--
    } else {
      selectedMonth.value--
    }
  }

  function goToCurrentMonth() {
    const today = new Date()
    selectedYear.value = today.getFullYear()
    selectedMonth.value = today.getMonth() + 1
  }

  // Helper para normalizar fecha YYYY-MM-DD
  function toDateStr(val: any): string {
    if (!val) return ''
    if (typeof val === 'string') return val.slice(0, 10)
    if (val instanceof Date) return val.toISOString().slice(0, 10)
    return ''
  }

  // Filtrado de reemplazos para el mes y servicio actual
  const monthlyReplacements = computed(() => {
    const padM = String(selectedMonth.value).padStart(2, '0')
    const firstDayStr = `${selectedYear.value}-${padM}-01`
    const lastDayStr = `${selectedYear.value}-${padM}-${String(daysInMonth.value).padStart(2, '0')}`

    return (options.replacements.value || []).filter((r: any) => {
      // Excluir cancelados o inactivos
      if (r.status === 'cancelled' || r.status === 'anulado') return false

      const start = toDateStr(r.fecha_inicio)
      const end = toDateStr(r.fecha_termino) || start

      if (!start) return false

      // Intersección de fechas con el mes: start <= lastDayStr && end >= firstDayStr
      const isInMonth = start <= lastDayStr && end >= firstDayStr
      if (!isInMonth) return false

      // Filtro de servicio si está seleccionado
      if (selectedServiceId.value && selectedServiceId.value.trim() !== '') {
        const servId = typeof r.servicio === 'object' ? r.servicio?._id : r.servicio
        if (servId !== selectedServiceId.value) return false
      }

      return true
    })
  })

  // Detección de solapamientos (mismo titular o mismo reemplazante con fechas cruzadas)
  const conflicts = computed<CoverageConflict[]>(() => {
    const reps = monthlyReplacements.value
    const foundConflicts: CoverageConflict[] = []
    const seenPairs = new Set<string>()

    for (let i = 0; i < reps.length; i++) {
      for (let j = i + 1; j < reps.length; j++) {
        const a = reps[i]
        const b = reps[j]
        const idA = String(a._id || a.id_negocio)
        const idB = String(b._id || b.id_negocio)
        const pairKey = [idA, idB].sort().join('___')

        if (seenPairs.has(pairKey)) continue

        const startA = toDateStr(a.fecha_inicio)
        const endA = toDateStr(a.fecha_termino) || startA
        const startB = toDateStr(b.fecha_inicio)
        const endB = toDateStr(b.fecha_termino) || startB

        // Comprobar intersección de fechas: max(startA, startB) <= min(endA, endB)
        const overlapStart = startA > startB ? startA : startB
        const overlapEnd = endA < endB ? endA : endB

        if (overlapStart <= overlapEnd) {
          // Condición 1: Mismo titular (saliente)
          const sameTitular =
            (a.rut_saliente && b.rut_saliente && a.rut_saliente === b.rut_saliente) ||
            (`${a.nombre_saliente} ${a.apellido_saliente}`.trim().toLowerCase() ===
              `${b.nombre_saliente} ${b.apellido_saliente}`.trim().toLowerCase() &&
              `${a.nombre_saliente}`.trim() !== '')

          // Condición 2: Mismo reemplazante (entrante)
          const sameReemplazante =
            (a.rut_entrante && b.rut_entrante && a.rut_entrante === b.rut_entrante) ||
            (`${a.nombre_entrante} ${a.apellido_entrante}`.trim().toLowerCase() ===
              `${b.nombre_entrante} ${b.apellido_entrante}`.trim().toLowerCase() &&
              `${a.nombre_entrante}`.trim() !== '')

          if (sameTitular) {
            seenPairs.add(pairKey)
            const titularName = formatTitleCase(`${a.nombre_saliente} ${a.apellido_saliente}`)
            foundConflicts.push({
              replacementIdA: idA,
              replacementIdB: idB,
              type: 'same_titular',
              description: `Titular ${titularName} tiene 2 reemplazos simultáneos (${overlapStart} al ${overlapEnd})`,
              overlapStart,
              overlapEnd
            })
          } else if (sameReemplazante) {
            seenPairs.add(pairKey)
            const entrantName = formatTitleCase(`${a.nombre_entrante} ${a.apellido_entrante}`)
            foundConflicts.push({
              replacementIdA: idA,
              replacementIdB: idB,
              type: 'same_reemplazante',
              description: `Reemplazante ${entrantName} asignado a 2 puestos simultáneos (${overlapStart} al ${overlapEnd})`,
              overlapStart,
              overlapEnd
            })
          }
        }
      }
    }

    return foundConflicts
  })

  const conflictsCount = computed(() => conflicts.value.length)
  const hasConflicts = computed(() => conflictsCount.value > 0)

  // Mapa rápido de ID de reemplazo a razones de conflicto
  const conflictMap = computed(() => {
    const map = new Map<string, string[]>()
    for (const c of conflicts.value) {
      if (!map.has(c.replacementIdA)) map.set(c.replacementIdA, [])
      if (!map.has(c.replacementIdB)) map.set(c.replacementIdB, [])
      map.get(c.replacementIdA)!.push(c.description)
      map.get(c.replacementIdB)!.push(c.description)
    }
    return map
  })

  // Agrupación por Funcionario Titular y asignación de pistas (sub-tracks)
  const coverageRows = computed<CoverageRow[]>(() => {
    const year = selectedYear.value
    const month = selectedMonth.value
    const totalDays = daysInMonth.value

    // Agrupar reemplazos por titular
    const groups = new Map<string, any[]>()
    for (const r of monthlyReplacements.value) {
      const key = r.rut_saliente || `${r.nombre_saliente}_${r.apellido_saliente}` || 'desconocido'
      if (!groups.has(key)) groups.set(key, [])
      groups.get(key)!.push(r)
    }

    const rows: CoverageRow[] = []

    for (const [key, reps] of groups.entries()) {
      const first = reps[0]
      const titularFullName = formatTitleCase(`${first.nombre_saliente || ''} ${first.apellido_saliente || ''}`.trim()) || 'Funcionario Titular'
      const titularRut = first.rut_saliente || ''
      let resolvedServiceName = ''
      if (options.getServiceName) {
        resolvedServiceName = options.getServiceName(first.servicio)
      }
      if (!resolvedServiceName || resolvedServiceName === '—' || resolvedServiceName === 'undefined') {
        resolvedServiceName = typeof first.servicio === 'object' ? first.servicio?.nombre : first.servicio_nombre || ''
      }
      const servicioNombre = resolvedServiceName || 'Servicio'
      const cargoNombre = first.cargo || first.tipo_turno || ''

      // Mapear cada reemplazo a CoverageItem con días calculados dentro del mes
      const items: CoverageItem[] = reps.map((r) => {
        const id = String(r._id || r.id_negocio)
        const startStr = toDateStr(r.fecha_inicio)
        const endStr = toDateStr(r.fecha_termino) || startStr

        const [sY, sM, sD] = startStr.split('-').map(Number)
        const [eY, eM, eD] = endStr.split('-').map(Number)

        let startDay = 1
        let isStartClamped = false
        if (sY === year && sM === month) {
          startDay = sD
        } else if (sY < year || (sY === year && sM < month)) {
          startDay = 1
          isStartClamped = true
        }

        let endDay = totalDays
        let isEndClamped = false
        if (eY === year && eM === month) {
          endDay = eD
        } else if (eY > year || (eY === year && eM > month)) {
          endDay = totalDays
          isEndClamped = true
        }

        // Clamp final dentro del rango 1..totalDays
        startDay = Math.max(1, Math.min(totalDays, startDay))
        endDay = Math.max(startDay, Math.min(totalDays, endDay))
        const spanDays = endDay - startDay + 1

        const conflictReasons = conflictMap.value.get(id) || []
        const hasConflict = conflictReasons.length > 0

        return {
          replacement: r,
          startDay,
          endDay,
          spanDays,
          isStartClamped,
          isEndClamped,
          hasConflict,
          conflictReasons,
          trackIndex: 0
        }
      })

      // Ordenar por startDay asc, endDay asc
      items.sort((a, b) => a.startDay - b.startDay || a.endDay - b.endDay)

      // Algoritmo voraz para calcular trackIndex evitando solapamientos visuales
      const trackEndDays: number[] = []
      for (const item of items) {
        let placed = false
        for (let t = 0; t < trackEndDays.length; t++) {
          if (trackEndDays[t] < item.startDay) {
            item.trackIndex = t
            trackEndDays[t] = item.endDay
            placed = true
            break
          }
        }
        if (!placed) {
          item.trackIndex = trackEndDays.length
          trackEndDays.push(item.endDay)
        }
      }

      const totalTracks = Math.max(1, trackEndDays.length)
      const hasConflict = items.some((i) => i.hasConflict)

      rows.push({
        titularKey: key,
        titularFullName,
        titularRut,
        servicio: first.servicio,
        servicioNombre,
        cargoNombre,
        hasConflict,
        items,
        totalTracks
      })
    }

    // Ordenar filas: primero las que tienen conflictos, luego por nombre
    rows.sort((a, b) => {
      if (a.hasConflict && !b.hasConflict) return -1
      if (!a.hasConflict && b.hasConflict) return 1
      return a.titularFullName.localeCompare(b.titularFullName)
    })

    return rows
  })

  return {
    selectedYear,
    selectedMonth,
    selectedServiceId,
    monthName,
    daysInMonth,
    daysList,
    nextMonth,
    prevMonth,
    goToCurrentMonth,
    monthlyReplacements,
    conflicts,
    conflictsCount,
    hasConflicts,
    conflictMap,
    coverageRows
  }
}
