<template>
  <div class="shifts-view p-4">
    <!-- Header -->
    <div class="d-flex justify-content-between align-items-center mb-4">
      <div>
        <h4 class="fw-bold mb-1 text-dark">
          <i class="bi bi-calendar-range text-primary me-2"></i>Grilla de Turnos
        </h4>
        <p class="text-secondary mb-0">Visualiza y gestiona los turnos operativos.</p>
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
            class="btn btn-sm btn-outline-primary d-flex align-items-center gap-2 px-3 fw-bold border-0 bg-primary-subtle text-primary"
            @click="openModal"
          >
            <i class="bi bi-plus-lg"></i> Asignar Planta
          </button>
          <div class="vr mx-1 text-secondary opacity-25"></div>
          <button class="btn btn-sm btn-outline-secondary border-0" @click="prevMonth">
            <i class="bi bi-chevron-left"></i>
          </button>
          <span class="fw-bold px-3 text-capitalize">{{ formattedMonth }}</span>
          <button class="btn btn-sm btn-outline-secondary border-0" @click="nextMonth">
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
        <table class="table table-bordered mb-0 shift-table">
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
            <tr v-for="item in filteredShifts" :key="item._id">
              <td class="sticky-col first-col bg-white border-end align-middle">
                <div class="d-flex align-items-center">
                  <div class="avatar-circle bg-primary text-white me-2 small">
                    {{ getInitials(item.nombre, item.apellido) }}
                  </div>
                  <div class="lh-1">
                    <div class="fw-bold small text-truncate" style="max-width: 180px">
                      {{ item.nombre }} {{ item.apellido }}
                    </div>
                    <small class="text-muted d-block" style="font-size: 0.75rem">
                      {{ item.cargo }}
                      <span
                        v-if="item.tipo_turno"
                        class="badge bg-secondary-subtle text-secondary ms-1"
                        style="font-size: 0.65rem"
                      >
                        {{ item.tipo_turno }}
                      </span>
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
                      'clickable-shift': !readonly && getShift(item, day.date),
                      'recently-modified': isRecentlyModified(item._id, day.date)
                    }
                  ]"
                  @mouseenter="showTooltip($event, item, day.date)"
                  @mouseleave="hideTooltip"
                  @click="handleCellClick(item, day.date)"
                >
                  <span v-if="getShift(item, day.date) === 'LARGO'">L</span>
                  <span v-else-if="getShift(item, day.date) === 'NOCHE'">N</span>
                  <span v-else-if="getShift(item, day.date) === 'LIBRE'">X</span>
                  <span v-else class="text-muted opacity-25">-</span>
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
      :current-shift="selectedShiftData.currentShift"
      :has-exception="selectedShiftData.hasException"
      :loading="exceptionStore.loading"
      @cerrar="showModifyModal = false"
      @save="handleSaveException"
      @restore="handleRestorePattern"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useReplacementStore } from '@/stores/replacement.store'
import { useTurnAssignmentStore } from '@/stores/turn-assignment.store'
import { useOptionStore } from '@/stores/option.store'
import { useShiftExceptionStore } from '@/stores/shift-exception.store'
import { useAuthStore } from '@/stores/auth.store'
import { calculateShift, parseAsLocal } from '@/services/turn-pattern.service'
import type { RegisterDataReemplazo, TurnAssignment, User } from '@/types/models'
import TurnAssignmentModal from '@/components/shifts/TurnAssignmentModal.vue'
import ShiftModificationModal from '@/components/shifts/ShiftModificationModal.vue'
import AlertMessage from '@/components/common/AlertMessage.vue'

// Props
const props = withDefaults(
  defineProps<{
    readonly?: boolean
    historyMode?: boolean
  }>(),
  {
    readonly: false,
    historyMode: false
  }
)

// State
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
  assignmentName: string
  date: Date
  currentShift: string | null
  hasException: boolean
} | null>(null)

// Track recently modified cell for visual feedback
const recentlyModifiedCell = ref<{
  assignmentId: string
  date: string
} | null>(null)

const replacementStore = useReplacementStore()
const turnAssignmentStore = useTurnAssignmentStore()
const optionStore = useOptionStore()
const exceptionStore = useShiftExceptionStore()
const authStore = useAuthStore()
const alertComponent = ref()

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
}

async function handleSaveAssignment(payload: any) {
  try {
    await turnAssignmentStore.addAssignment(payload)
    closeModal()
    alertComponent.value.show('Éxito', 'Funcionario asignado correctamente', 'success')
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
  source: 'REPLACEMENT' | 'ASSIGNMENT'
  original: RegisterDataReemplazo | TurnAssignment
}

// Data Logic
const filteredShifts = computed(() => {
  const startOfMonth = new Date(currentYear.value, currentMonth.value, 1)
  const endOfMonth = new Date(currentYear.value, currentMonth.value + 1, 0)
  const filterService = selectedService.value

  const rows: GridRow[] = []

  // 1. Process Replacements
  replacementStore.reemplazosActivos.forEach((r: RegisterDataReemplazo) => {
    if (!r.fecha_inicio) return

    // Service Filter
    if (filterService && r.servicio !== filterService) return

    const rStart = parseAsLocal(r.fecha_inicio)
    const rEnd = parseAsLocal(r.fecha_termino)

    // Check Overlap
    const overlap = rStart <= endOfMonth && rEnd >= startOfMonth
    // Also must have a recognized turn pattern
    const hasPattern = r.tipo_turno === 'TERCER TURNO' || r.tipo_turno === 'CUARTO TURNO'

    if (overlap && hasPattern) {
      rows.push({
        _id: r._id,
        nombre: r.nombre_entrante,
        apellido: r.apellido_entrante,
        cargo: r.tipo_cargo,
        servicio: r.servicio,
        tipo_turno: r.tipo_turno,
        fecha_inicio: rStart,
        fecha_termino: rEnd,
        source: 'REPLACEMENT',
        original: r
      })
    }
  })

  // 2. Process Turn Assignments (Permanent Staff)
  turnAssignmentStore.assignments.forEach((a: TurnAssignment) => {
    // User info comes populated in user_id, cast it
    const user = a.user_id as unknown as User
    if (!user) return

    const effectiveService = a.service || user.servicio || user.tipo_cargo

    // Service Filter
    if (filterService && effectiveService !== filterService) return

    const aStart = parseAsLocal(a.start_date)
    const aEnd = a.end_date ? parseAsLocal(a.end_date) : new Date(9999, 11, 31)

    const overlap = aStart <= endOfMonth && aEnd >= startOfMonth

    if (overlap) {
      rows.push({
        _id: a._id,
        nombre: user.nombre,
        apellido: user.apellido,
        cargo: user.tipo_cargo,
        servicio: effectiveService,
        tipo_turno: a.turn_type,
        fecha_inicio: aStart,
        fecha_termino: a.end_date ? aEnd : undefined, // Undefined means indefinite
        source: 'ASSIGNMENT',
        original: a
      })
    }
  })

  // Sort by name
  const sorted = rows.sort((a, b) => a.nombre.localeCompare(b.nombre))

  // Debug: Log replacement count
  const replacementCount = sorted.filter((r) => r.source === 'REPLACEMENT').length
  console.log(`Total shifts: ${sorted.length}, Replacements: ${replacementCount}`)

  return sorted
})

// Actions
function prevMonth() {
  currentDate.value = new Date(currentYear.value, currentMonth.value - 1, 1)
}

function nextMonth() {
  currentDate.value = new Date(currentYear.value, currentMonth.value + 1, 1)
}

// Helper: Check if date is today (local time)
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
function getShift(row: GridRow, date: Date) {
  if (!row.fecha_inicio || !row.tipo_turno) return null

  // 1. Check for exception first (works for both ASSIGNMENT and REPLACEMENT)
  const exception = exceptionStore.findException(row._id, date)
  if (exception) {
    return exception.override_type
  }

  // 2. Calculate base shift from pattern
  const rStart = parseAsLocal(row.fecha_inicio)
  const rEnd = row.fecha_termino ? parseAsLocal(row.fecha_termino) : new Date(9999, 11, 31)

  // Normalize date to start of day for comparison
  const checkDate = new Date(date.getFullYear(), date.getMonth(), date.getDate())
  const start = new Date(rStart.getFullYear(), rStart.getMonth(), rStart.getDate())
  const end = new Date(rEnd.getFullYear(), rEnd.getMonth(), rEnd.getDate())

  if (checkDate < start || checkDate > end) return null

  return calculateShift(date, row.fecha_inicio, row.tipo_turno)
}

function getShiftClass(shift: string | null) {
  if (!shift) return ''
  if (shift === 'LARGO') return 'shift-day' // Yellow pastel
  if (shift === 'NOCHE') return 'shift-night' // Blue pastel
  if (shift === 'LIBRE') return 'shift-free' // Green pastel
  return ''
}

function getInitials(nombre?: string, apellido?: string) {
  if (!nombre || !apellido) return '??'
  return `${nombre.charAt(0)}${apellido.charAt(0)}`.toUpperCase()
}

function getReplacementCode(item: GridRow): string {
  if (item.source === 'REPLACEMENT' && item.original) {
    const replacement = item.original as RegisterDataReemplazo
    return replacement.id_negocio || 'R-???'
  }
  return ''
}

function toTitleCase(str: string): string {
  return str.toLowerCase().replace(/\b\w/g, (char) => char.toUpperCase())
}

function getShiftTooltip(item: GridRow, date: Date): string {
  const shift = getShift(item, date)
  if (!shift) return ''

  // Format name in title case
  const fullName = `${toTitleCase(item.nombre)} ${toTitleCase(item.apellido)}`

  // Build tooltip based on shift type
  let tooltip = fullName + '\n'

  if (shift === 'LARGO') {
    tooltip += 'Turno día\n08:00 am - 20:00 pm'
  } else if (shift === 'NOCHE') {
    tooltip += 'Turno noche\n20:00 pm - 08:00 am'
  } else if (shift === 'LIBRE') {
    tooltip += 'Día libre'
  }

  // Add replacement code if applicable
  if (item.source === 'REPLACEMENT') {
    const code = getReplacementCode(item)
    tooltip += '\n' + code
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

function handleCellClick(item: GridRow, date: Date) {
  // Prevent editing in readonly mode
  if (props.readonly) return

  const shift = getShift(item, date)
  if (!shift) return

  const exception = exceptionStore.findException(item._id, date)

  selectedShiftData.value = {
    assignmentId: item._id,
    assignmentName: `${item.nombre} ${item.apellido}`,
    date: date,
    currentShift: shift,
    hasException: !!exception
  }

  showModifyModal.value = true
}

async function handleSaveException(data: { override_type: 'LARGO' | 'NOCHE' | 'LIBRE' }) {
  if (!selectedShiftData.value) return

  try {
    await exceptionStore.createException({
      assignment_id: selectedShiftData.value.assignmentId,
      date: selectedShiftData.value.date.toISOString(),
      original_type: selectedShiftData.value.currentShift as 'LARGO' | 'NOCHE' | 'LIBRE',
      override_type: data.override_type,
      created_by: authStore.user?._id || ''
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

    await Promise.all([
      replacementStore.mostrarReemplazos(),
      turnAssignmentStore.loadAssignments(),
      optionStore.mostrarOpciones(),
      exceptionStore.loadExceptions(undefined, startOfMonth.toISOString(), endOfMonth.toISOString())
    ])
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  loadData()
})
</script>

<style scoped>
/* Extra styles for filters */
.custom-v-select :deep(.vs__dropdown-toggle) {
  border: none;
  padding: 4px;
}
.custom-v-select :deep(.vs__selected) {
  font-size: 0.9rem;
  color: #1e293b;
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

.avatar-circle {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 600;
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
</style>
