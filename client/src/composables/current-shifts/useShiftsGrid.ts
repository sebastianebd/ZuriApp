import { computed, type Ref } from 'vue'
import { useTurnAssignmentStore } from '@/stores/turn-assignment.store'
import { useReplacementStore } from '@/stores/replacement.store'
import { useTurnTypeStore } from '@/stores/turn-type.store'
import { useTurnSiglaStore } from '@/stores/turn-sigla.store'
import { useShiftExceptionStore } from '@/stores/shift-exception.store'
import { useServiceStore } from '@/stores/service.store'
import { calculateShift, parseAsLocal } from '@/services/turn-pattern.service'
import { formatTitleCase } from '@/utils/text-formatters'
import type { ReplacementRegistration } from '@/types/replacement.types'
import type { TurnAssignment } from '@/types/turn.types'
import type { User } from '@/types/user.types'

// Export interfaces for use in view and other composables
export interface GridRow {
  _id: string
  nombre: string
  apellido: string
  cargo: string
  servicio: string
  tipo_turno: string
  fecha_inicio: string | Date
  fecha_termino?: string | Date
  userId: string
  getShift: (date: Date) => ShiftResult | null
}

export interface ShiftResult {
  sigla: string
  color?: string
  assignmentId?: string
  assignmentName?: string
  replacementCode?: string
}

export function useShiftsGrid(
  state: any, // state object from useShiftsState
  props: { historyMode?: boolean; externalFilters?: any },
  allUsers: Ref<User[]>
) {
  const turnAssignmentStore = useTurnAssignmentStore()
  const replacementStore = useReplacementStore()
  const turnTypeStore = useTurnTypeStore()
  const turnSiglaStore = useTurnSiglaStore()
  const exceptionStore = useShiftExceptionStore()

  function mapEnumToSigla(type: string): { sigla: string; color?: string } {
    const match = turnSiglaStore.siglas.find(
      (s) =>
        s.nombre.toUpperCase() === type.toUpperCase() ||
        s.sigla.toUpperCase() === type.toUpperCase()
    )
    if (match) return { sigla: match.sigla, color: match.color }

    // Fallback genérico si no se encuentra en la base de datos

    return { sigla: type.charAt(0) }
  }

  function getPattern(assignment: TurnAssignment | null, turnName?: string): ShiftResult[] {
    if (assignment && assignment.snapshot_secuencia && assignment.snapshot_secuencia.length > 0) {
      return assignment.snapshot_secuencia.map((d: any) => {
        const globalSigla = turnSiglaStore.siglas.find((s) => s.sigla === d.sigla)
        return {
          sigla: d.sigla,
          color: d.color || (globalSigla ? globalSigla.color : undefined)
        }
      })
    }

    const name = turnName || (assignment ? assignment.turn_type : '')
    if (!name) return []

    const turn = turnTypeStore.turnTypes.find((t) => t.nombre === name)
    if (turn && turn.secuencia) {
      return turn.secuencia.map((d) => {
        const globalSigla = turnSiglaStore.siglas.find((s) => s.sigla === d.sigla)
        return {
          sigla: d.sigla,
          color: globalSigla ? globalSigla.color : d.color
        }
      })
    }
    return []
  }

  const filteredShifts = computed(() => {
    const activeServiceFilter = props.historyMode
      ? props.externalFilters?.service
      : state.selectedService.value

    if (!activeServiceFilter) {
      return []
    }

    const startOfMonth = new Date(state.currentYear.value, state.currentMonth.value, 1)
    const endOfMonth = new Date(state.currentYear.value, state.currentMonth.value + 1, 0)

    const rows: GridRow[] = []
    const processedUsers = new Set<string>()
    const userAssignmentsMap = new Map<string, TurnAssignment[]>()

    turnAssignmentStore.assignments.forEach((a) => {
      const uid = typeof a.user_id === 'string' ? a.user_id : (a.user_id as unknown as User)?._id
      if (!uid) return
      if (!userAssignmentsMap.has(uid)) userAssignmentsMap.set(uid, [])
      userAssignmentsMap.get(uid)?.push(a)
    })

    const userReplacementsMap = new Map<string, ReplacementRegistration[]>()

    replacementStore.currentPageReplacements.forEach((r) => {
      if (!r.fecha_inicio || !r.id_entrante) return
      let uid = r.id_entrante
      if (typeof uid === 'object' && uid !== null) {
        const candidate = (uid as any)._id || (uid as any).id
        if (candidate) uid = candidate
      }
      uid = String(uid)
      if (!uid || uid === 'undefined' || uid === 'null') return

      if (!userReplacementsMap.has(uid)) userReplacementsMap.set(uid, [])
      userReplacementsMap.get(uid)?.push(r)
    })

    userReplacementsMap.forEach((replacements, userId) => {
      const validReplacements = replacements.filter((r) => {
        const activeServiceFilter = props.historyMode
          ? props.externalFilters?.service
          : state.selectedService.value
        if (activeServiceFilter) {
          const serviceStore = useServiceStore()
          if (!serviceStore.isServiceMatch(r.servicio, activeServiceFilter)) return false
        }
        if (
          props.historyMode &&
          props.externalFilters?.cargo &&
          r.tipo_cargo !== props.externalFilters.cargo
        )
          return false
        if (
          props.historyMode &&
          props.externalFilters?.shiftType &&
          r.tipo_turno !== props.externalFilters.shiftType
        )
          return false

        const rStart = parseAsLocal(r.fecha_inicio)
        const rEnd = parseAsLocal(r.fecha_termino)
        return rStart <= endOfMonth && rEnd >= startOfMonth
      })

      if (validReplacements.length > 0) {
        const rep = validReplacements[0]
        let cargo = rep.tipo_cargo

        if (!cargo && typeof rep.id_entrante === 'object') {
          cargo = (rep.id_entrante as any).tipo_cargo
        }

        if (!cargo) {
          const foundUserAssignment = turnAssignmentStore.assignments.find((a) => {
            const uid =
              typeof a.user_id === 'string' ? a.user_id : (a.user_id as unknown as User)?._id
            return uid === userId
          })

          if (foundUserAssignment && typeof foundUserAssignment.user_id !== 'string') {
            const u = foundUserAssignment.user_id as unknown as User
            cargo = u?.tipo_cargo
          }

          if (!cargo && Array.isArray(allUsers.value) && allUsers.value.length > 0) {
            const foundUser = allUsers.value.find((u) => u._id === userId)
            if (foundUser) cargo = foundUser.tipo_cargo
          }
        }

        processedUsers.add(userId)

        rows.push({
          _id: rep._id,
          userId: userId,
          nombre: rep.nombre_entrante,
          apellido: rep.apellido_entrante,
          cargo: cargo || 'Sin Cargo',
          servicio: rep.servicio,
          tipo_turno: rep.tipo_turno,
          fecha_inicio: rep.fecha_inicio,
          getShift: (date: Date) => {
            if (!rep.fecha_inicio) return null

            const checkDate = new Date(date.getFullYear(), date.getMonth(), date.getDate())
            const start = parseAsLocal(rep.fecha_inicio)
            const end = rep.fecha_termino ? parseAsLocal(rep.fecha_termino) : new Date(9999, 11, 31)

            const sDate = new Date(start.getFullYear(), start.getMonth(), start.getDate())
            const eDate = new Date(end.getFullYear(), end.getMonth(), end.getDate())

            if (checkDate < sDate || checkDate > eDate) return null

            const exception = exceptionStore.findException(rep._id, date)
            if (exception) {
              const { sigla, color } = mapEnumToSigla(exception.override_type)
              return {
                sigla,
                color,
                assignmentId: rep._id,
                assignmentName:
                  turnTypeStore.turnTypes.find((t) => t._id === rep.tipo_turno)?.nombre ||
                  rep.tipo_turno,
                replacementCode: rep.id_negocio
              }
            }

            const pattern = getPattern(rep as any, rep.tipo_turno)
            if (!pattern || pattern.length === 0) return null

            const result = calculateShift<ShiftResult>(date, rep.fecha_inicio, pattern)

            if (result) {
              return {
                ...result,
                assignmentId: rep._id,
                assignmentName:
                  turnTypeStore.turnTypes.find((t) => t._id === rep.tipo_turno)?.nombre ||
                  rep.tipo_turno,
                replacementCode: rep.id_negocio
              }
            }
            return null
          }
        })
      }
    })

    turnAssignmentStore.assignments.forEach((a: TurnAssignment) => {
      const user = a.user_id as unknown as User
      if (!user || processedUsers.has(user._id)) return

      const effectiveService = a.service || user.servicio || user.tipo_cargo

      const activeServiceFilter = props.historyMode
        ? props.externalFilters?.service
        : state.selectedService.value
      if (activeServiceFilter) {
        const serviceStore = useServiceStore()
        if (!serviceStore.isServiceMatch(effectiveService, activeServiceFilter)) return
      }
      if (
        props.historyMode &&
        props.externalFilters?.cargo &&
        user.tipo_cargo !== props.externalFilters.cargo
      )
        return

      const userAssignments = userAssignmentsMap.get(user._id) || []
      const hasOverlap = userAssignments.some((assign) => {
        const start = parseAsLocal(assign.start_date)
        const end = assign.end_date ? parseAsLocal(assign.end_date) : new Date(9999, 11, 31)
        return start <= endOfMonth && end >= startOfMonth
      })

      if (hasOverlap) {
        processedUsers.add(user._id)
        rows.push({
          _id: a._id,
          userId: user._id,
          nombre: user.nombre,
          apellido: user.apellido,
          cargo: user.tipo_cargo,
          servicio: effectiveService,
          tipo_turno: a.turn_type,
          fecha_inicio: a.start_date,
          getShift: (date: Date) => {
            const checkDate = new Date(date.getFullYear(), date.getMonth(), date.getDate())

            const start = parseAsLocal(a.start_date)
            const end = a.end_date ? parseAsLocal(a.end_date) : new Date(9999, 11, 31)
            const sDate = new Date(start.getFullYear(), start.getMonth(), start.getDate())
            const eDate = new Date(end.getFullYear(), end.getMonth(), end.getDate())

            if (checkDate < sDate || checkDate > eDate) return null

            const meta = {
              assignmentId: a._id,
              assignmentName:
                turnTypeStore.turnTypes.find((t) => t._id === a.turn_type)?.nombre || a.turn_type
            }

            const exception = exceptionStore.findException(a._id, date)
            if (exception) {
              const { sigla, color } = mapEnumToSigla(exception.override_type)
              return { sigla, color, ...meta }
            }

            const pattern = getPattern(a)
            if (pattern.length === 0) return null

            const aStart = parseAsLocal(a.start_date)
            const result = calculateShift<ShiftResult>(date, aStart, pattern)

            if (result) {
              return { ...result, ...meta }
            }
            return null
          }
        })
      }
    })

    return rows.sort((a, b) => a.nombre.localeCompare(b.nombre))
  })

  function getShiftStyle(shift: ShiftResult | null) {
    if (!shift || !shift.color) return {}
    return {
      backgroundColor: shift.color
    }
  }

  function getShiftClass(shift: ShiftResult | null) {
    if (shift?.color) return 'shift-custom-color'
    return ''
  }

  function getShiftTooltip(item: GridRow, date: Date): string {
    const shift = item.getShift(date)
    if (!shift) return ''

    const fullName = formatTitleCase(`${item.nombre} ${item.apellido}`)
    const siglaInfo = turnSiglaStore.siglas.find((s) => s.sigla === shift.sigla)

    let tooltip = `${fullName}\n`

    if (siglaInfo) {
      tooltip += `Turno: ${siglaInfo.nombre}`
      if (siglaInfo.turno_entrada && siglaInfo.turno_salida) {
        tooltip += `\n${siglaInfo.turno_entrada} - ${siglaInfo.turno_salida}`
      } else if (siglaInfo.descripcion) {
        tooltip += `\n${siglaInfo.descripcion}`
      }
    } else {
      tooltip += `Turno: ${shift.sigla}`
    }

    if (shift.assignmentName) {
      const formattedName = formatTitleCase(shift.assignmentName)
      tooltip += `\n(Patrón: ${formattedName})`
    }

    if (shift.replacementCode) {
      tooltip += '\n' + shift.replacementCode
    }

    const exception = exceptionStore.findException(shift.assignmentId || item._id, date)
    if (exception) {
      tooltip += '\n⚠️ Excepción manual'
    }

    return tooltip
  }

  function isToday(date: Date) {
    const now = new Date()
    return (
      date.getDate() === now.getDate() &&
      date.getMonth() === now.getMonth() &&
      date.getFullYear() === now.getFullYear()
    )
  }

  function isWeekend(date: Date) {
    const day = date.getDay()
    return day === 0 || day === 6
  }

  function isEditableDate(date: Date) {
    const now = new Date()
    const currentMonthStart = new Date(now.getFullYear(), now.getMonth(), 1)
    return date >= currentMonthStart
  }

  return {
    filteredShifts,
    getShiftStyle,
    getShiftClass,
    getShiftTooltip,
    isToday,
    isWeekend,
    isEditableDate,
    mapEnumToSigla
  }
}
