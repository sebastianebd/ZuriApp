<template>
  <div class="shifts-view p-4">
    <!-- Header -->
    <div class="d-flex justify-content-between align-items-center mb-4" v-if="!historyMode">
      <div class="d-flex align-items-center gap-3">
        <div class="icon-square bg-white shadow-sm text-primary">
          <i class="bi bi-calendar-range fs-4"></i>
        </div>
        <div>
          <h4 class="fw-bold mb-0 text-dark">Grilla de Turnos</h4>
          <p class="text-secondary small mb-0">Visualiza y gestiona los turnos operativos.</p>
        </div>
      </div>

      <!-- Filters & Controls -->
      <div class="d-flex gap-3 align-items-center">
        <!-- Service Filter -->
        <div style="min-width: 200px">
          <v-select
            v-model="selectedService"
            :options="serviceOptions"
            placeholder="Filtrar por Servicio"
            class="bg-white rounded shadow-sm custom-v-select"
            :clearable="true"
          />
        </div>

        <div class="d-flex gap-2 align-items-center bg-white p-2 rounded shadow-sm">
          <button
            v-if="authStore.hasPermission('shifts.create')"
            class="btn btn-sm btn-primary d-flex align-items-center gap-2 px-3 fw-bold border-0 text-white"
            @click="openModal"
          >
            <i class="bi bi-plus-lg"></i> Asignar Planta
          </button>
          <div
            v-if="authStore.hasPermission('shifts.create')"
            class="vr mx-1 text-secondary opacity-25"
          ></div>
          <button class="btn btn-sm btn-outline-secondary border-0" @click="prevMonth">
            <i class="bi bi-chevron-left"></i>
          </button>
          <span class="fw-bold px-3 text-capitalize">{{ formattedMonth }}</span>
          <button
            class="btn btn-sm btn-outline-secondary border-0"
            @click="nextMonth"
            :disabled="!canGoNext"
          >
            <i class="bi bi-chevron-right"></i>
          </button>
          <button class="btn btn-sm btn-primary ms-2" @click="loadData">
            <i class="bi bi-arrow-clockwise"></i>
          </button>
        </div>
      </div>
    </div>

    <!-- History Mode Controls -->
    <div class="d-flex justify-content-between align-items-center mb-4" v-else>
      <!-- Title Slot -->
      <div>
        <slot name="header-title"></slot>
      </div>

      <!-- Right Side: Filters & Nav -->
      <div class="d-flex align-items-center gap-3">
        <slot name="history-filters"></slot>

        <div class="d-flex gap-2 align-items-center bg-white p-2 rounded shadow-sm">
          <button class="btn btn-sm btn-outline-secondary border-0" @click="prevMonth">
            <i class="bi bi-chevron-left"></i>
          </button>
          <span class="fw-bold px-3 text-capitalize">{{ formattedMonth }}</span>
          <button
            class="btn btn-sm btn-outline-secondary border-0"
            @click="nextMonth"
            :disabled="!canGoNext"
          >
            <i class="bi bi-chevron-right"></i>
          </button>
          <button class="btn btn-sm btn-primary ms-2" @click="loadData">
            <i class="bi bi-arrow-clockwise"></i>
          </button>
        </div>
      </div>
    </div>

    <!-- Grid Container -->
    <div class="card border-0 shadow-sm rounded-4 overflow-hidden">
      <div class="table-responsive">
        <table class="table mb-0 shift-table">
          <thead class="bg-light">
            <tr>
              <th
                class="sticky-col first-col bg-light border-end"
                style="width: 200px; min-width: 200px"
              >
                Funcionario
              </th>
              <th
                v-for="day in daysInMonth"
                :key="day.timestamp"
                class="text-center p-1"
                :class="{
                  'bg-warning-subtle text-warning-emphasis': isWeekend(day.date),
                  'today-col': isToday(day.date)
                }"
                style="width: 32px; min-width: 32px"
              >
                <div class="small fw-bold">{{ day.dayNum }}</div>
                <div style="font-size: 0.65rem; text-transform: uppercase">{{ day.dayName }}</div>
              </th>
            </tr>
          </thead>
          <tbody>
            <tr v-if="loading" class="text-center">
              <td :colspan="daysInMonth.length + 1" class="py-5">
                <div class="spinner-border text-primary" role="status">
                  <span class="visually-hidden">Cargando...</span>
                </div>
              </td>
            </tr>
            <tr v-else-if="filteredShifts.length === 0" class="text-center">
              <td :colspan="daysInMonth.length + 1" class="py-5 text-muted">
                {{
                  selectedService
                    ? `No hay turnos para ${selectedService}`
                    : 'No hay turnos activos para este mes.'
                }}
              </td>
            </tr>
            <tr
              v-for="(item, index) in filteredShifts"
              :key="item._id"
              class="fade-in-row"
              :style="{ animationDelay: `${index * 20}ms` }"
            >
              <td class="sticky-col first-col bg-white border-end align-middle">
                <div class="d-flex align-items-center">
                  <div class="avatar-circle bg-primary text-white me-2 small">
                    {{ getInitials(item.nombre, item.apellido) }}
                  </div>
                  <div class="lh-1">
                    <div class="fw-bold small text-truncate" style="max-width: 180px">
                      {{ formatTitleCase(`${item.nombre} ${item.apellido}`) }}
                    </div>
                    <small class="text-muted d-block" style="font-size: 0.75rem">
                      {{ formatTitleCase(item.cargo) }}
                    </small>
                  </div>
                </div>
              </td>
              <td
                v-for="day in daysInMonth"
                :key="day.timestamp"
                class="text-center p-0 align-middle cell-hover"
                :class="{ 'today-col': isToday(day.date) }"
              >
                <div
                  class="shift-cell w-100 h-100 d-flex align-items-center justify-content-center position-relative"
                  :class="[
                    getShiftClass(getShift(item, day.date)),
                    {
                      'replacement-shift':
                        item.source === 'REPLACEMENT' && getShift(item, day.date),
                      'clickable-shift':
                        !readonly &&
                        getShift(item, day.date) &&
                        isEditableDate(day.date) &&
                        authStore.hasPermission('shifts.update'),
                      'recently-modified': isRecentlyModified(item._id, day.date),
                      'exception-modified':
                        historyMode && !!exceptionStore.findException(item._id, day.date)
                    }
                  ]"
                  :style="getShiftStyle(getShift(item, day.date))"
                  @mouseenter="showTooltip($event, item, day.date)"
                  @mouseleave="hideTooltip"
                  @click="handleCellClick(item, day.date)"
                >
                  <span
                    class="fw-bold"
                    :class="{ 'text-muted fw-normal opacity-50': !getShift(item, day.date)?.sigla }"
                    >{{ getShift(item, day.date)?.sigla || '–' }}</span
                  >
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- Custom Tooltip -->
    <div v-if="tooltipState.show" class="custom-tooltip" :style="tooltipState.style">
      {{ tooltipState.content }}
    </div>

    <!-- Custom Alert -->
    <AlertMessage ref="alertComponent" />

    <!-- Modal -->
    <TurnAssignmentModal
      :visible="showModal"
      :loading="turnAssignmentStore.loading"
      @cerrar="closeModal"
      @guardar="handleSaveAssignment"
    />

    <!-- Shift Modification Modal -->
    <ShiftModificationModal
      v-if="selectedShiftData"
      :visible="showModifyModal"
      :assignment-id="selectedShiftData.assignmentId"
      :assignment-name="selectedShiftData.assignmentName"
      :date="selectedShiftData.date"
      :current-shift="selectedShiftData.currentShift?.sigla || ''"
      :has-exception="selectedShiftData.hasException"
      :loading="exceptionStore.loading"
      @cerrar="showModifyModal = false"
      @save="handleSaveException"
      @restore="handleRestorePattern"
      @delete-assignment="handleDeleteAssignment"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { useReplacementStore } from '@/stores/replacement.store'
import { useTurnAssignmentStore } from '@/stores/turn-assignment.store'
import { useOptionStore } from '@/stores/option.store'
import { useShiftExceptionStore } from '@/stores/shift-exception.store'
import { useTurnTypeStore } from '@/stores/turn-type.store'
import { useTurnSiglaStore } from '@/stores/turn-sigla.store'
import { useAuthStore } from '@/stores/auth.store'
import { useUserStore } from '@/stores/user.store'
import { calculateShift, parseAsLocal } from '@/services/turn-pattern.service'
import { formatTitleCase } from '@/utils/text-formatters'
import { type ReplacementRegistration } from '@/types/replacement.types'
import { type TurnAssignment } from '@/types/turn.types'
import { type User } from '@/types/user.types'
import TurnAssignmentModal from '@/components/shifts/TurnAssignmentModal.vue'
import ShiftModificationModal from '@/components/shifts/ShiftModificationModal.vue'
import AlertMessage from '@/components/common/AlertMessage.vue'

// Props
const props = withDefaults(
  defineProps<{
    readonly?: boolean
    historyMode?: boolean
    externalFilters?: {
      service: string
      cargo: string
      shiftType?: string
    }
  }>(),
  {
    readonly: false,
    historyMode: false,
    externalFilters: () => ({ service: '', cargo: '' })
  }
)

// AuthState
const currentDate = ref(new Date())
const loading = ref(false)
const showModal = ref(false)
const selectedService = ref<string | null>(null)

// Tooltip state
const tooltipState = ref({
  show: false,
  content: '',
  style: {}
})

let tooltipTimer: number | null = null

// Shift modification state
const showModifyModal = ref(false)
const selectedShiftData = ref<{
  assignmentId: string
  assignmentModel: 'TurnAssignment' | 'Replacement' // 🏢 ENTERPRISE: Polymorphic
  assignmentName: string
  date: Date
  currentShift: ShiftResult | null
  hasException: boolean
} | null>(null)

// Track recently modified cell for visual feedback
const recentlyModifiedCell = ref<{
  assignmentId: string
  date: string
} | null>(null)

const replacementStore = useReplacementStore()
const turnAssignmentStore = useTurnAssignmentStore()
const turnTypeStore = useTurnTypeStore()
const turnSiglaStore = useTurnSiglaStore()
const optionStore = useOptionStore()
const exceptionStore = useShiftExceptionStore()

// 🏢 ENTERPRISE: Dynamic Mapping for Exception Types -> Siglas
function mapEnumToSigla(type: string): { sigla: string; color?: string } {
  // 1. Try to find match in TurnSiglaStore by name OR sigla
  const match = turnSiglaStore.siglas.find(
    (s) =>
      s.nombre.toUpperCase() === type.toUpperCase() || s.sigla.toUpperCase() === type.toUpperCase()
  )
  if (match) return { sigla: match.sigla, color: match.color }

  // 2. Fallback for standard types (Legacy safety)
  if (type === 'LARGO') return { sigla: 'L' }
  if (type === 'NOCHE') return { sigla: 'N' }
  if (type === 'LIBRE') return { sigla: 'X' }

  return { sigla: type.charAt(0) }
}
const authStore = useAuthStore()
const userStore = useUserStore()
const alertComponent = ref()

// Local cache of all users for fallback info
const allUsers = ref<User[]>([])

// Options computed
const serviceOptions = computed(() => {
  return optionStore.opciones?.servicios || []
})

// Actions
function openModal() {
  showModal.value = true
}

function closeModal() {
  showModal.value = false
  loadData()
}

async function handleSaveAssignment(payload: any) {
  try {
    await turnAssignmentStore.addAssignment(payload)
    closeModal()
    alertComponent.value.show('Éxito', 'Turno asignado correctamente', 'success')
  } catch (error) {
    console.error(error)
    alertComponent.value.show('Error', 'No se pudo asignar el turno', 'error')
  }
}

// Computeds for Date Navigation
const currentYear = computed(() => currentDate.value.getFullYear())
const currentMonth = computed(() => currentDate.value.getMonth())

const formattedMonth = computed(() => {
  return new Intl.DateTimeFormat('es-ES', { month: 'long', year: 'numeric' }).format(
    currentDate.value
  )
})

const daysInMonth = computed(() => {
  const year = currentYear.value
  const month = currentMonth.value
  const days = []

  const lastDay = new Date(year, month + 1, 0).getDate()

  for (let i = 1; i <= lastDay; i++) {
    const d = new Date(year, month, i)
    days.push({
      date: d,
      timestamp: d.getTime(),
      dayNum: i,
      dayName: new Intl.DateTimeFormat('es-ES', { weekday: 'narrow' }).format(d)
    })
  }
  return days
})

// Define a unified interface for the Grid Row
interface GridRow {
  _id: string
  nombre: string
  apellido: string
  cargo: string
  servicio: string
  tipo_turno: string
  fecha_inicio: string | Date
  fecha_termino?: string | Date
  source: 'REPLACEMENT' | 'ASSIGNMENT' | 'MIXED'
  original: ReplacementRegistration | TurnAssignment | any
  userId: string
}

interface ShiftResult {
  sigla: string
  color?: string
  assignmentId?: string // New: To identify which assignment
  assignmentName?: string // New: To display which assignment
  assignmentModel?: 'TurnAssignment' | 'Replacement' // 🏢 ENTERPRISE: Polymorphic model
  replacementCode?: string // New: For replacements
}

// Helper to get Pattern from Store
// Helper to get Pattern from Store or Snapshot
function getPattern(assignment: TurnAssignment | null, turnName?: string): ShiftResult[] {
  // 1. Try Snapshot (Immutable History)
  if (assignment && assignment.snapshot_secuencia && assignment.snapshot_secuencia.length > 0) {
    return assignment.snapshot_secuencia.map((d: any) => {
      // Type 'any' for now as mapped from different shapes
      // Look up global sigla color if not in snapshot, or use snapshot color
      const globalSigla = turnSiglaStore.siglas.find((s) => s.sigla === d.sigla)
      return {
        sigla: d.sigla,
        color: d.color || (globalSigla ? globalSigla.color : undefined)
      }
    })
  }

  // 2. Fallback to Store (Legacy or New Assignment without snapshot)
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

// Data Logic
const filteredShifts = computed(() => {
  const startOfMonth = new Date(currentYear.value, currentMonth.value, 1)
  const endOfMonth = new Date(currentYear.value, currentMonth.value + 1, 0)

  const rows: GridRow[] = []
  const processedUsers = new Set<string>()

  // Pre-calculate user assignments map for O(1) access
  const userAssignmentsMap = new Map<string, TurnAssignment[]>()

  turnAssignmentStore.assignments.forEach((a) => {
    // Handle both populated User object and string ID
    const uid = typeof a.user_id === 'string' ? a.user_id : (a.user_id as unknown as User)?._id

    if (!uid) return // Skip if no valid user ID

    if (!userAssignmentsMap.has(uid)) userAssignmentsMap.set(uid, [])
    userAssignmentsMap.get(uid)?.push(a)
  })

  // 1. Process Replacements (Grouped by Entrante)
  const userReplacementsMap = new Map<string, ReplacementRegistration[]>()

  // ✅ ENTERPRISE: Use currentPageReplacements (server-side pagination)
  replacementStore.currentPageReplacements.forEach((r) => {
    if (!r.fecha_inicio) return

    // Use id_entrante (Real User ID) for grouping
    if (!r.id_entrante) return

    // Handle populated id_entrante (can be object or string)
    let uid = r.id_entrante

    if (typeof uid === 'object' && uid !== null) {
      // Try _id first, then id. If neither exists, KEEP the original object so String(uid) works on it.
      const candidate = (uid as any)._id || (uid as any).id
      if (candidate) uid = candidate
    }

    // Ensure string
    uid = String(uid)

    if (!uid || uid === 'undefined' || uid === 'null') return

    if (!userReplacementsMap.has(uid)) userReplacementsMap.set(uid, [])
    userReplacementsMap.get(uid)?.push(r)
  })

  userReplacementsMap.forEach((replacements, userId) => {
    // Check validity/overlap for ANY replacement
    const validReplacements = replacements.filter((r) => {
      // Filters
      const activeServiceFilter = props.historyMode
        ? props.externalFilters.service
        : selectedService.value
      if (activeServiceFilter && r.servicio !== activeServiceFilter) return false

      if (
        props.historyMode &&
        props.externalFilters.cargo &&
        r.tipo_cargo !== props.externalFilters.cargo
      )
        return false
      if (
        props.historyMode &&
        props.externalFilters.shiftType &&
        r.tipo_turno !== props.externalFilters.shiftType
      )
        return false

      const rStart = parseAsLocal(r.fecha_inicio)
      const rEnd = parseAsLocal(r.fecha_termino)
      // Check overlap
      const overlap = rStart <= endOfMonth && rEnd >= startOfMonth
      return overlap
    })

    if (validReplacements.length > 0) {
      // Use first valid as representative for name/cargo (assuming consistency)
      const rep = validReplacements[0]

      // Try to get cargo from multiple sources
      let cargo = rep.tipo_cargo // First try: from replacement itself

      // 1.5 Try from populated id_entrante
      if (!cargo && typeof rep.id_entrante === 'object') {
        cargo = (rep.id_entrante as any).tipo_cargo
      }

      if (!cargo) {
        // 2. Try to find user in assignments store
        const foundUserAssignment = turnAssignmentStore.assignments.find((a) => {
          const uid =
            typeof a.user_id === 'string' ? a.user_id : (a.user_id as unknown as User)?._id
          return uid === userId
        })

        if (foundUserAssignment && typeof foundUserAssignment.user_id !== 'string') {
          const u = foundUserAssignment.user_id as unknown as User
          cargo = u?.tipo_cargo
        }

        // 3. Fallback: Check full user list
        if (!cargo && Array.isArray(allUsers.value) && allUsers.value.length > 0) {
          const foundUser = allUsers.value.find((u) => u._id === userId)
          if (foundUser) cargo = foundUser.tipo_cargo
        }
      }

      // Also add to processedUsers so we don't duplicate if they also have assignments?
      // User asked to unify replacements. Unifying with Assignments is implied if we use real UserID.
      // Let's TRY adding to processedUsers to fully unify mixed rows.
      processedUsers.add(userId)

      rows.push({
        _id: rep._id,
        userId: userId, // REAL User ID
        nombre: rep.nombre_entrante,
        apellido: rep.apellido_entrante,
        cargo: cargo || 'Sin Cargo',
        servicio: rep.servicio,
        tipo_turno: rep.tipo_turno, // Representative
        fecha_inicio: rep.fecha_inicio, // Representative
        source: 'REPLACEMENT',
        original: rep // Representative
      })
    }
  })

  // 2. Process Turn Assignments (Grouped by User)

  turnAssignmentStore.assignments.forEach((a: TurnAssignment) => {
    const user = a.user_id as unknown as User
    if (!user || processedUsers.has(user._id)) return

    const effectiveService = a.service || user.servicio || user.tipo_cargo

    // Filters
    const activeServiceFilter = props.historyMode
      ? props.externalFilters.service
      : selectedService.value
    if (activeServiceFilter && effectiveService !== activeServiceFilter) return

    if (
      props.historyMode &&
      props.externalFilters.cargo &&
      user.tipo_cargo !== props.externalFilters.cargo
    )
      return
    // Note: Shift Type Filter is tricky for multiple assignments.
    // If ANY of user's assignments match, should we show user? Or only show if CURRENT assignment matches?
    // For simplicity, let's import type strict shift type filtering on the ROW level if we want to show full history,
    // OR filter if *any* assignment overlaps.

    // Check if ANY assignment for this user overlaps current view
    const userAssignments = userAssignmentsMap.get(user._id) || []
    const hasOverlap = userAssignments.some((assign) => {
      const start = parseAsLocal(assign.start_date)
      const end = assign.end_date ? parseAsLocal(assign.end_date) : new Date(9999, 11, 31)
      return start <= endOfMonth && end >= startOfMonth
    })

    if (hasOverlap) {
      processedUsers.add(user._id)

      rows.push({
        _id: a._id, // Use ID of the first found assignment (or arbitrary)
        userId: user._id, // REAL User ID
        nombre: user.nombre,
        apellido: user.apellido,
        cargo: user.tipo_cargo,
        servicio: effectiveService,
        tipo_turno: a.turn_type, // Representative turn type (will vary by date in cell)
        fecha_inicio: a.start_date, // Representative
        source: 'ASSIGNMENT',
        original: a
      })
    }
  })

  // Sort by name
  const sorted = rows.sort((a, b) => a.nombre.localeCompare(b.nombre))
  return sorted
})

// Actions
function prevMonth() {
  currentDate.value = new Date(currentYear.value, currentMonth.value - 1, 1)
}

const canGoNext = computed(() => {
  if (!props.historyMode) return true

  const now = new Date()
  const nextMonthDate = new Date(currentYear.value, currentMonth.value + 1, 1)
  const startOfCurrentRealMonth = new Date(now.getFullYear(), now.getMonth(), 1)
  return nextMonthDate < startOfCurrentRealMonth
})

function nextMonth() {
  if (!canGoNext.value) return
  currentDate.value = new Date(currentYear.value, currentMonth.value + 1, 1)
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
  return day === 0 || day === 6 // Sun or Sat
}

// Core Logic: Get Shift Value (with exception support)
function getShift(row: GridRow, date: Date): ShiftResult | null {
  if (!row.fecha_inicio || !row.tipo_turno) return null

  // 1. Check for exception first
  // Need to find exception for THIS user, regardless of assignment ID?
  // Current Exception logic link exception to assignment_id.
  // We need to know WHICH assignment is active today to check exceptions for IT.

  if (row.source === 'REPLACEMENT') {
    // 🏢 ENTERPRISE: Use the original replacement object directly from the row
    // This avoids searching global arrays which might not contain the paginated data
    const replacement = row.original as any // Cast as any or Replacement type

    if (!replacement) return null

    // Check date range validity for this specific replacement
    const checkDate = new Date(date.getFullYear(), date.getMonth(), date.getDate())

    // Safety check for dates
    if (!replacement.fecha_inicio) return null

    const start = parseAsLocal(replacement.fecha_inicio)
    const end = replacement.fecha_termino
      ? parseAsLocal(replacement.fecha_termino)
      : new Date(9999, 11, 31)

    const sDate = new Date(start.getFullYear(), start.getMonth(), start.getDate())
    const eDate = new Date(end.getFullYear(), end.getMonth(), end.getDate())

    if (checkDate < sDate || checkDate > eDate) return null

    // 🚀 Check Exception for Replacement
    const exception = exceptionStore.findException(replacement._id, date)
    if (exception) {
      const { sigla, color } = mapEnumToSigla(exception.override_type)
      return {
        sigla,
        color,
        assignmentId: replacement._id,
        assignmentModel: 'Replacement',
        assignmentName:
          turnTypeStore.turnTypes.find((t) => t._id === replacement.tipo_turno)?.nombre ||
          replacement.tipo_turno,
        replacementCode: replacement.id_negocio
      }
    }

    // Pass replacement as assignment to use snapshot if available
    // Replacement structure is compatible enough with TurnAssignment for getPattern
    // (both have snapshot, tipo_turno, start/end dates)
    const pattern = getPattern(replacement, replacement.tipo_turno)

    if (!pattern || pattern.length === 0) return null

    const result = calculateShift<ShiftResult>(date, replacement.fecha_inicio, pattern)

    if (result) {
      return {
        ...result,
        assignmentId: replacement._id,
        assignmentModel: 'Replacement', // 🏢
        assignmentName:
          turnTypeStore.turnTypes.find((t) => t._id === replacement.tipo_turno)?.nombre ||
          replacement.tipo_turno,
        replacementCode: replacement.id_negocio
      }
    }
    return null
  }

  // 2. Assignments (Unified Row)
  // Find the active assignment for this specific assignment
  const checkDate = new Date(date.getFullYear(), date.getMonth(), date.getDate())

  const activeAssignment = turnAssignmentStore.assignments.find((a: TurnAssignment) => {
    const u = a.user_id as unknown as User
    if (u._id !== row.userId) return false

    const start = parseAsLocal(a.start_date)
    const end = a.end_date ? parseAsLocal(a.end_date) : new Date(9999, 11, 31)

    const sDate = new Date(start.getFullYear(), start.getMonth(), start.getDate())
    const eDate = new Date(end.getFullYear(), end.getMonth(), end.getDate())

    return checkDate >= sDate && checkDate <= eDate
  })

  if (!activeAssignment) return null

  // Base metadata
  const meta = {
    assignmentId: activeAssignment._id,
    assignmentModel: 'TurnAssignment' as const, // 🏢
    assignmentName:
      turnTypeStore.turnTypes.find((t) => t._id === activeAssignment.turn_type)?.nombre ||
      activeAssignment.turn_type
  }

  // Check Exception
  const exception = exceptionStore.findException(activeAssignment._id, date)
  if (exception) {
    const { sigla, color } = mapEnumToSigla(exception.override_type)
    return {
      sigla,
      color,
      ...meta
    }
  }

  // Calculate pattern
  const pattern = getPattern(activeAssignment)
  if (pattern.length === 0) return null

  const aStart = parseAsLocal(activeAssignment.start_date)
  const result = calculateShift<ShiftResult>(date, aStart, pattern)

  if (result) {
    return { ...result, ...meta }
  }
  return null
}

function getShiftStyle(shift: ShiftResult | null) {
  if (!shift || !shift.color) return {}
  return {
    backgroundColor: shift.color,
    color: '#1e293b' // Dark text for contrast on pastel
  }
}

function getShiftClass(shift: ShiftResult | null) {
  // If we have explicit color, rely on style.
  // But maybe use classes for borders or other default styling?
  if (shift?.color) return 'shift-custom-color'

  // Fallback for no color (Exceptions might fail here if not mapped color)
  if (!shift) return ''
  const s = shift.sigla.toUpperCase()
  if (s === 'LARGO' || s === 'L') return 'shift-day'
  if (s === 'NOCHE' || s === 'N') return 'shift-night'
  if (s === 'LIBRE' || s === 'X') return 'shift-free'
  return ''
}

function getInitials(nombre?: string, apellido?: string) {
  if (!nombre || !apellido) return '??'
  return `${nombre.charAt(0)}${apellido.charAt(0)}`.toUpperCase()
}

function getShiftTooltip(item: GridRow, date: Date): string {
  const shift = getShift(item, date)
  if (!shift) return ''

  // Format name in title case
  const fullName = formatTitleCase(`${item.nombre} ${item.apellido}`)

  // Find full sigla info from store to get proper name and times
  // We need to look it up because 'shift' might only have sigla code if it came from pattern calculation
  // However, calculateShift now returns partial objects.
  // Best way: find in turnSiglaStore using shift.sigla
  const siglaInfo = turnSiglaStore.siglas.find((s) => s.sigla === shift.sigla)

  let tooltip = `${fullName}\n`

  if (siglaInfo) {
    tooltip += `Turno: ${siglaInfo.nombre}`
    if (siglaInfo.turno_entrada && siglaInfo.turno_salida) {
      tooltip += `\n${siglaInfo.turno_entrada} - ${siglaInfo.turno_salida}`
    } else {
      if (shift.sigla === 'X' || siglaInfo.nombre.toUpperCase() === 'LIBRE') {
        tooltip += '\nDía libre'
      }
    }
  } else {
    // Fallback
    const s = shift.sigla.toUpperCase()
    if (s === 'L') tooltip += 'Turno Long\n08:00 - 20:00'
    else if (s === 'N') tooltip += 'Turno Noche\n20:00 - 08:00'
    else if (s === 'X') tooltip += 'Día libre'
    else tooltip += `Turno: ${shift.sigla}`
  }

  // Add Assignment Name if distinct from global row type
  if (shift.assignmentName) {
    const formattedName = formatTitleCase(shift.assignmentName)
    // Only add if it adds value (simple check)
    tooltip += `\n(Patrón: ${formattedName})`
  }

  // Add replacement code if applicable
  if (shift.replacementCode) {
    tooltip += '\n' + shift.replacementCode
  }

  return tooltip
}

function showTooltip(event: MouseEvent, item: GridRow, date: Date) {
  const content = getShiftTooltip(item, date)
  if (!content) return

  tooltipTimer = window.setTimeout(() => {
    const rect = (event.target as HTMLElement).getBoundingClientRect()
    tooltipState.value = {
      show: true,
      content: content,
      style: {
        top: `${rect.top - 10}px`,
        left: `${rect.left + rect.width / 2}px`
      }
    }
  }, 200) // 200ms delay
}

function hideTooltip() {
  if (tooltipTimer) {
    clearTimeout(tooltipTimer)
    tooltipTimer = null
  }
  tooltipState.value.show = false
}

function isRecentlyModified(assignmentId: string, date: Date): boolean {
  if (!recentlyModifiedCell.value) return false
  const dateStr = date.toISOString().split('T')[0]
  return (
    recentlyModifiedCell.value.assignmentId === assignmentId &&
    recentlyModifiedCell.value.date === dateStr
  )
}

// Helper: Check if a date is editable (Current Month or Future)
function isEditableDate(date: Date): boolean {
  const now = new Date()
  const startOfCurrentMonth = new Date(now.getFullYear(), now.getMonth(), 1)
  const targetDate = new Date(date.getFullYear(), date.getMonth(), 1)

  // Allow edit if target month is >= current month
  return targetDate >= startOfCurrentMonth
}

function handleCellClick(item: GridRow, date: Date) {
  // Prevent editing in readonly mode
  if (props.readonly) return

  // Prevent editing if no permissions
  if (!authStore.hasPermission('shifts.update')) return

  // Prevent editing past months even in operational mode
  if (!isEditableDate(date)) return

  const shift = getShift(item, date)
  if (!shift) return

  const exception = exceptionStore.findException(shift.assignmentId || item._id, date)

  selectedShiftData.value = {
    // Use the specific assignment ID if available (from multi-assignment logic), else fallback to row ID
    assignmentId: shift.assignmentId || item._id,
    assignmentModel: shift.assignmentModel || 'TurnAssignment', // Default safe
    // Use the specific assignment name if available
    assignmentName: shift.assignmentName
      ? formatTitleCase(shift.assignmentName)
      : formatTitleCase(`${item.nombre} ${item.apellido}`),
    date: date,
    currentShift: shift,
    hasException: !!exception
  }

  showModifyModal.value = true
}

async function handleDeleteAssignment() {
  if (!selectedShiftData.value) return

  try {
    const idToDelete = selectedShiftData.value.assignmentId
    // If it's a replacement mixed in, logic might vary, but for TurnAssignment:
    await turnAssignmentStore.removeAssignment(idToDelete)

    showModifyModal.value = false
    alertComponent.value.show('Éxito', 'Asignación eliminada correctamente', 'success')
    loadData() // Reload to refresh grid
  } catch (error) {
    console.error(error)
    alertComponent.value.show('Error', 'No se pudo eliminar la asignación', 'error')
  }
}

async function handleSaveException(data: { override_type: string }) {
  if (!selectedShiftData.value) return

  if (!authStore.user || !authStore.user._id) {
    alertComponent.value.show('Error', 'Debe iniciar sesión para realizar cambios', 'error')
    return
  }

  try {
    await exceptionStore.createException({
      assignment_id: selectedShiftData.value.assignmentId,
      assignment_model: selectedShiftData.value.assignmentModel, // 🏢
      date: selectedShiftData.value.date.toISOString(),
      original_type: turnSiglaStore.mapSiglaToNombre(
        selectedShiftData.value.currentShift?.sigla || 'X'
      ),
      override_type: data.override_type,
      created_by: authStore.user._id
    })

    // Set recently modified cell for visual feedback
    recentlyModifiedCell.value = {
      assignmentId: selectedShiftData.value.assignmentId,
      date: selectedShiftData.value.date.toISOString().split('T')[0]
    }

    // Clear the highlight after 2 seconds
    setTimeout(() => {
      recentlyModifiedCell.value = null
    }, 2000)

    showModifyModal.value = false
    alertComponent.value.show('Éxito', 'Turno modificado correctamente', 'success')
  } catch (error) {
    console.error(error)
    alertComponent.value.show('Error', 'No se pudo modificar el turno', 'error')
  }
}

async function handleRestorePattern() {
  if (!selectedShiftData.value) return

  try {
    const exception = exceptionStore.findException(
      selectedShiftData.value.assignmentId,
      selectedShiftData.value.date
    )

    if (exception) {
      await exceptionStore.deleteException(exception._id)
      showModifyModal.value = false
      alertComponent.value.show('Éxito', 'Patrón restaurado correctamente', 'success')
    }
  } catch (error) {
    console.error(error)
    alertComponent.value.show('Error', 'No se pudo restaurar el patrón', 'error')
  }
}

async function loadData() {
  loading.value = true
  try {
    const startOfMonth = new Date(currentYear.value, currentMonth.value, 1)
    const endOfMonth = new Date(currentYear.value, currentMonth.value + 1, 0)

    // 🔧 STEP 1: Load options FIRST to ensure service filter is available
    await optionStore.mostrarOpciones()

    // 🔧 STEP 2: Set default service if not set (BEFORE loading replacements)
    if (!selectedService.value && serviceOptions.value.length > 0) {
      selectedService.value = serviceOptions.value[0]
    }

    // 🔧 STEP 3: Load all data in parallel (replacements now use server-side pagination)
    await Promise.all([
      // ✅ ENTERPRISE: Server-side pagination with service filter
      replacementStore.fetchActiveReplacementsPaginated({
        servicio: selectedService.value || undefined,
        limit: 1000 // Large limit to get all replacements for the selected service
      }),
      turnAssignmentStore.loadAssignments(),
      exceptionStore.loadExceptions(
        undefined,
        startOfMonth.toISOString(),
        endOfMonth.toISOString()
      ),
      turnTypeStore.fetchTurnTypes(true),
      turnSiglaStore.fetchSiglas(),
      userStore
        .mostrarTodos(1000) // Load ALL users for modal selection
        .then((data: User[]) => {
          allUsers.value = data
        })
        .catch((err) => console.error('[ShiftsView] Failed to load users:', err))
    ])
  } finally {
    loading.value = false
  }
}

// 🔧 Watch for service changes and reload replacements
watch(selectedService, (newService, oldService) => {
  if (newService && newService !== oldService) {
    // Reload only replacements (assignments are not service-specific)
    replacementStore.fetchActiveReplacementsPaginated({
      servicio: newService,
      limit: 1000
    })
  }
})

onMounted(() => {
  loadData()
})

defineExpose({
  prevMonth
})
</script>

<style scoped>
/* --- Animation Keyframes --- */
@keyframes fadeIn {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}

.fade-in-row {
  animation: fadeIn 0.4s ease-out forwards;
  opacity: 0; /* Init hidden for animation */
}

/* Extra styles for filters */
.custom-v-select :deep(.vs__dropdown-toggle) {
  border: 1px solid #e2e8f0;
  border-radius: 0.375rem;
  padding: 3px;
  background: white;
  box-shadow: none;
}

.custom-v-select :deep(.vs__selected) {
  font-size: 0.875rem;
  color: #1e293b;
}

.custom-v-select :deep(.vs__search::placeholder) {
  color: #94a3b8;
}

.custom-v-select :deep(.vs__actions svg) {
  fill: #64748b;
  transform: scale(0.8);
}

.custom-v-select :deep(.vs__dropdown-menu) {
  border: 1px solid #e2e8f0;
  border-radius: 0.5rem;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
  padding: 5px;
  font-size: 0.875rem;
  max-height: 200px;
  overflow-y: auto;
}

.custom-v-select :deep(.vs__dropdown-option) {
  border-radius: 0.25rem;
  padding: 6px 10px;
  margin-bottom: 2px;
  color: #475569;
}

.custom-v-select :deep(.vs__dropdown-option--highlight) {
  background: #3b82f6;
  color: white;
}

.shifts-view {
  background-color: #f8fafc;
  min-height: 100vh;
}

.shift-table {
  table-layout: fixed;
  border-collapse: separate;
  border-spacing: 0;
}

.shift-table th,
.shift-table td {
  vertical-align: middle;
}

/* Sticky Column Logic */
.sticky-col {
  position: sticky;
  left: 0;
  z-index: 10;
}
thead .sticky-col {
  z-index: 20; /* Higher than body sticky cols */
}

.first-col {
  width: 200px;
  min-width: 200px;
}

/* Cell Styling */
/* --- Modern Table Architecture --- */
.shifts-view {
  background-color: #f8fafc;
  min-height: 100vh;
}

/* Card Container */
.card {
  border: none;
  background: white;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 2px 4px -1px rgba(0, 0, 0, 0.03);
  border-radius: 16px;
}

/* Grid Table Reset */
.table-responsive {
  overflow-x: auto;
  border-radius: 16px;
}

.shift-table {
  border-collapse: separate;
  border-spacing: 0;
  width: 100%;
}

.shift-table th,
.shift-table td {
  border: none;
  vertical-align: middle;
}

/* --- Headers --- */
.shift-table thead {
  position: sticky;
  top: 0;
  z-index: 30;
  background-color: rgba(255, 255, 255, 0.98);
  backdrop-filter: blur(8px);
}

.shift-table thead th {
  padding: 12px 4px;
  border-bottom: 2px solid #e2e8f0;
  color: #64748b;
  font-weight: 700;
  font-size: 0.75rem;
  letter-spacing: 0.05em;
  text-transform: uppercase;
  background-color: inherit;
  transition: background-color 0.2s;
}

/* Today Column Highlight Header */
.shift-table thead th.today-col {
  background-color: #f0f9ff; /* light sky blue */
  color: #0ea5e9;
  border-bottom-color: #0ea5e9;
}

/* Sticky First Column (User Node) */
.sticky-col.first-col {
  position: sticky;
  left: 0;
  z-index: 20;
  background-color: white;
  border-right: 1px solid #f1f5f9 !important;
  box-shadow: 4px 0 12px -2px rgba(0, 0, 0, 0.02); /* Subtle depth */
}

/* Ensure header corner covers content */
.shift-table thead th.sticky-col {
  z-index: 40; /* Above regular headers */
  border-bottom: 2px solid #e2e8f0;
}

/* --- Row Styles --- */
.shift-table tbody tr {
  transition: all 0.2s;
}

.shift-table tbody tr:hover td {
  background-color: #f8fafc;
}

/* Keep sticky column white on hover or match? */
.shift-table tbody tr:hover td.sticky-col {
  background-color: #f8fafc;
}

/* Row separator */
.shift-table td {
  border-bottom: 1px solid #f1f5f9;
  padding: 6px 4px; /* Tighter padding for cells */
}

/* --- User Cell Styling --- */
.avatar-circle {
  width: 36px;
  height: 36px;
  border-radius: 10px; /* Squircle */
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 700;
  font-size: 0.85rem;
  background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%);
  color: white;
  box-shadow: 0 2px 4px rgba(59, 130, 246, 0.2);
}

.shift-table td.sticky-col {
  padding: 12px 16px; /* More breathing room for user */
}
/* Cell Styling */
.shift-cell {
  font-size: 0.9rem;
  transition: all 0.1s ease;
  cursor: default;
}

.cell-hover:hover {
  background-color: rgba(0, 0, 0, 0.02);
}

.today-col {
  background-color: #e8f0fe !important; /* Light blue tint */
}

/* Shift Type Colors - Pastel Theme */
.shift-day {
  background-color: #fef3c7; /* Yellow pastel */
  color: #92400e;
  font-weight: 600;
}

.shift-night {
  background-color: #dbeafe; /* Blue pastel */
  color: #1e3a8a;
  font-weight: 600;
}

.shift-free {
  background-color: #d1fae5; /* Green pastel */
  color: #065f46;
  font-weight: 600;
}

/* Replacement Shift Styling */
.replacement-shift {
  border: 2px dashed rgba(0, 0, 0, 0.3) !important;
  box-shadow: inset 0 0 0 1px rgba(0, 0, 0, 0.05);
}

/* Clickable Shift Styling */
.clickable-shift {
  cursor: pointer;
  transition: all 0.15s ease;
}

.clickable-shift:hover {
  transform: scale(1.05);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
  z-index: 10;
}

/* Recently Modified Cell Animation */
.recently-modified {
  animation: pulseHighlight 0.5s ease-in-out 4;
  position: relative;
}

/* Exception Modified Highlight (History Mode) */
.exception-modified {
  box-shadow: inset 0 0 0 2px #f59e0b; /* Amber border */
  background-color: rgba(251, 191, 36, 0.1);
}

.exception-modified:after {
  content: '';
  position: absolute;
  top: 2px;
  right: 2px;
  width: 6px;
  height: 6px;
  background-color: #f59e0b;
  border-radius: 50%;
}

@keyframes pulseHighlight {
  0%,
  100% {
    box-shadow: inset 0 0 0 0 rgba(59, 130, 246, 0.8);
  }
  50% {
    box-shadow: inset 0 0 12px 4px rgba(59, 130, 246, 0.6);
  }
}

.replacement-badge {
  position: absolute;
  bottom: 1px;
  right: 1px;
  font-size: 0.5rem;
  background-color: rgba(0, 0, 0, 0.7);
  color: white;
  padding: 0px 3px;
  border-radius: 2px;
  font-weight: 600;
  line-height: 1.2;
  letter-spacing: -0.3px;
}

/* Custom Tooltip */
.custom-tooltip {
  position: fixed;
  background: rgba(0, 0, 0, 0.9);
  color: white;
  padding: 8px 12px;
  border-radius: 6px;
  font-size: 0.75rem;
  line-height: 1.4;
  white-space: pre-line;
  transform: translate(-50%, -100%);
  z-index: 9999;
  pointer-events: none;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
  animation: tooltipFadeIn 0.15s ease-out;
}

@keyframes tooltipFadeIn {
  from {
    opacity: 0;
    transform: translate(-50%, -95%);
  }
  to {
    opacity: 1;
    transform: translate(-50%, -100%);
  }
}
.icon-square {
  width: 48px;
  height: 48px;
  border-radius: 14px;
  display: flex;
  align-items: center;
  justify-content: center;
}
</style>
