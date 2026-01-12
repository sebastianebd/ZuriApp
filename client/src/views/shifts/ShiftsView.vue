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

    <!-- Grid Container -->
    <div class="card border-0 shadow-sm rounded-4 overflow-hidden">
      <!-- ... Table ... -->
      <div class="table-responsive">
        <!-- ... -->
        <table class="table table-bordered mb-0 shift-table">
          <thead class="bg-light">
            <!-- ... -->
            <tr>
              <th
                class="sticky-col first-col bg-light border-end"
                style="width: 250px; min-width: 250px"
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
                style="width: 40px; min-width: 40px"
              >
                <div class="small fw-bold">{{ day.dayNum }}</div>
                <div style="font-size: 0.7rem; text-transform: uppercase">{{ day.dayName }}</div>
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
                No hay turnos activos para este mes.
              </td>
            </tr>
            <tr v-for="item in filteredShifts" :key="item._id">
              <!-- ... Row content ... -->
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
                      {{ item.servicio }}
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
                  class="shift-cell w-100 h-100 d-flex align-items-center justify-content-center"
                  :class="getShiftClass(getShift(item, day.date))"
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

    <!-- Custom Alert -->
    <AlertMessage ref="alertComponent" />

    <!-- Modal -->
    <TurnAssignmentModal
      :visible="showModal"
      :loading="turnAssignmentStore.loading"
      @cerrar="closeModal"
      @guardar="handleSaveAssignment"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useReplacementStore } from '@/stores/replacement.store'
import { useTurnAssignmentStore } from '@/stores/turn-assignment.store'
import { calculateShift, parseAsLocal } from '@/services/turn-pattern.service'
import type { RegisterDataReemplazo, TurnAssignment, User } from '@/types/models'
import TurnAssignmentModal from '@/components/shifts/TurnAssignmentModal.vue'
import AlertMessage from '@/components/common/AlertMessage.vue'

// State
const currentDate = ref(new Date())
const loading = ref(false)
const showModal = ref(false)
const replacementStore = useReplacementStore()
const turnAssignmentStore = useTurnAssignmentStore()
const alertComponent = ref()

// ... (Existing Computeds) ...

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

  // Ensure we iterate correctly for the whole month
  // New Date(year, month + 1, 0).getDate() gives last day of month
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

  const rows: GridRow[] = []

  // 1. Process Replacements
  replacementStore.reemplazosActivos.forEach((r: RegisterDataReemplazo) => {
    if (!r.fecha_inicio) return

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
  console.log('Assignments loaded:', turnAssignmentStore.assignments)
  turnAssignmentStore.assignments.forEach((a: TurnAssignment) => {
    // Determine effective end date (if null, it goes forever in the future)
    // For overlap check, if end_date is null, we assume it overlaps if start_date <= endOfMonth
    const aStart = parseAsLocal(a.start_date)
    const aEnd = a.end_date ? parseAsLocal(a.end_date) : new Date(9999, 11, 31)

    const overlap = aStart <= endOfMonth && aEnd >= startOfMonth

    if (overlap) {
      // User info comes populated in user_id
      const user = a.user_id as unknown as User
      if (user) {
        rows.push({
          _id: a._id,
          nombre: user.nombre,
          apellido: user.apellido,
          servicio: a.service || user.servicio || user.tipo_cargo, // Prefer assignment service
          tipo_turno: a.turn_type,
          fecha_inicio: aStart,
          fecha_termino: a.end_date ? aEnd : undefined, // Undefined means indefinite
          source: 'ASSIGNMENT',
          original: a
        })
      } else {
        console.warn('Assignment without user:', a)
      }
    }
  })

  return rows
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

// Core Logic: Get Shift Value
function getShift(row: GridRow, date: Date) {
  if (!row.fecha_inicio || !row.tipo_turno) return null

  const rStart = parseAsLocal(row.fecha_inicio)
  // For assignments without end date, we treat it as infinite (or handle elsewhere)
  // But for boundary check we need a date.
  const rEnd = row.fecha_termino ? parseAsLocal(row.fecha_termino) : new Date(9999, 11, 31)

  // Normalize date to start of day for comparison
  const checkDate = new Date(date.getFullYear(), date.getMonth(), date.getDate())
  const start = new Date(rStart.getFullYear(), rStart.getMonth(), rStart.getDate())
  const end = new Date(rEnd.getFullYear(), rEnd.getMonth(), rEnd.getDate())

  if (checkDate < start || checkDate > end) return null

  // calculateShift handles logic. We pass row.fecha_inicio which might be Date object now
  return calculateShift(date, row.fecha_inicio, row.tipo_turno)
}

function getShiftClass(shift: string | null) {
  if (!shift) return ''
  if (shift === 'LARGO') return 'bg-warning-subtle text-warning-emphasis fw-bold'
  if (shift === 'NOCHE') return 'bg-primary-subtle text-primary-emphasis fw-bold'
  if (shift === 'LIBRE') return ''
  return ''
}

function getInitials(nombre?: string, apellido?: string) {
  if (!nombre || !apellido) return '??'
  return `${nombre.charAt(0)}${apellido.charAt(0)}`.toUpperCase()
}

async function loadData() {
  loading.value = true
  try {
    await Promise.all([replacementStore.mostrarReemplazos(), turnAssignmentStore.loadAssignments()])
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  loadData()
})
</script>

<style scoped>
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
  width: 250px;
  min-width: 250px;
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
</style>
