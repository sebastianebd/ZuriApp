<template>
  <div class="historial-view p-4">
    <!-- Header -->
    <div class="d-flex justify-content-between align-items-center mb-4">
      <div>
        <h4 class="fw-bold mb-1 text-dark">
          <i class="bi bi-exclamation-triangle text-warning me-2"></i>Historial de Excepciones
        </h4>
        <p class="text-secondary mb-0">
          Registro de modificaciones manuales de turnos ({{ filteredExceptions.length }} registros)
        </p>
      </div>
      <div class="d-flex gap-2">
        <button @click="clearFilters" class="btn btn-light border fw-semibold shadow-sm px-3">
          <i class="bi bi-eraser me-2"></i>Limpiar Filtros
        </button>
      </div>
    </div>

    <!-- Main Content Card -->
    <div class="card border-0 shadow-sm rounded-4">
      <div class="card-body p-4">
        <!-- Filter Section -->
        <div class="mb-4">
          <ShiftExceptionFilter
            v-model="filters"
            :lista-servicios="services"
            :lista-cargos="cargos"
          />
        </div>

        <!-- History Table Section -->
        <div class="modern-table-container">
          <div v-if="loading" class="text-center py-5">
            <div class="spinner-border text-primary" role="status">
              <span class="visually-hidden">Cargando...</span>
            </div>
            <p class="text-muted mt-2">Cargando excepciones...</p>
          </div>

          <div v-else-if="filteredExceptions.length === 0" class="empty-state text-center py-5">
            <div class="empty-icon-container mb-3 mx-auto">
              <i class="bi bi-clipboard-x fs-1 text-muted opacity-50"></i>
            </div>
            <h5 class="fw-bold text-dark mb-1">Sin excepciones encontradas</h5>
            <p class="text-muted">No hay registros que coincidan con los filtros</p>
          </div>

          <table v-else class="table modern-table mb-0">
            <thead>
              <tr>
                <th scope="col" class="ps-4">Fecha Turno</th>
                <th scope="col">Funcionario</th>
                <th scope="col">
                  Cambio de Turno (Original
                  <i class="bi bi-arrow-right mx-1 text-muted"></i> Modificado)
                </th>
                <th scope="col">Detalles</th>
              </tr>
            </thead>
            <tbody>
              <tr
                v-for="(exception, index) in paginatedExceptions"
                :key="exception._id"
                class="data-row"
                :style="{ animationDelay: `${index * 50}ms` }"
              >
                <!-- Fecha -->
                <td class="ps-4 first-cell">
                  <div class="d-flex align-items-center" style="height: 100%">
                    <div class="date-badge text-center me-3">
                      <div class="day fw-bold text-dark">{{ getDay(exception.date) }}</div>
                      <div class="month text-uppercase x-small text-secondary fw-bold">
                        {{ getMonth(exception.date) }}
                      </div>
                    </div>
                    <div class="fw-semibold text-dark">{{ getYear(exception.date) }}</div>
                  </div>
                </td>

                <!-- Funcionario & Contexto -->
                <td>
                  <div class="d-flex align-items-center py-2">
                    <div class="avatar-modern bg-primary bg-opacity-10 text-primary shadow-sm">
                      {{ getInitials(getAssignmentName(exception)) }}
                    </div>
                    <div class="ms-3">
                      <div class="fw-bold text-dark d-flex align-items-center">
                        {{ getAssignmentName(exception) }}
                        <span
                          v-if="getAssignmentCargo(exception)"
                          class="badge bg-light text-secondary border ms-2 fw-normal"
                          style="font-size: 0.7em; letter-spacing: 0.5px"
                        >
                          {{ getAssignmentCargo(exception) }}
                        </span>
                      </div>
                      <span class="badge-modern-context mt-1">
                        <i class="bi bi-hospital me-1"></i> {{ getAssignmentService(exception) }}
                      </span>
                    </div>
                  </div>
                </td>

                <!-- Cambio Flow -->
                <td>
                  <div class="d-flex align-items-center h-100">
                    <!-- Original -->
                    <div class="text-center" style="min-width: 80px">
                      <span class="d-block x-small text-secondary fw-bold text-uppercase mb-1"
                        >Original</span
                      >
                      <span
                        class="status-glass"
                        :class="
                          exception.original_type
                            ? getShiftBadgeClass(exception.original_type)
                            : 'glass-secondary'
                        "
                      >
                        {{
                          exception.original_type ? getShiftLabel(exception.original_type) : 'Desc.'
                        }}
                      </span>
                    </div>

                    <!-- Arrow -->
                    <div class="mx-3 text-muted opacity-50">
                      <i class="bi bi-arrow-right fs-5"></i>
                    </div>

                    <!-- Modificado -->
                    <div class="text-center" style="min-width: 80px">
                      <span class="d-block x-small text-primary fw-bold text-uppercase mb-1"
                        >Nuevo</span
                      >
                      <span
                        class="status-glass"
                        :class="getShiftBadgeClass(exception.override_type)"
                      >
                        {{ getShiftLabel(exception.override_type) }}
                      </span>
                    </div>
                  </div>
                  <div class="mt-2 text-muted x-small" v-if="exception.reason">
                    <i class="bi bi-chat-left-quote me-1"></i> "{{ exception.reason }}"
                  </div>
                </td>

                <!-- Auditoría -->
                <td class="last-cell">
                  <div class="d-flex flex-column h-100 justify-content-center">
                    <div class="d-flex align-items-center mb-1">
                      <i class="bi bi-person-check text-secondary me-2"></i>
                      <span class="text-dark small">{{ getCreatedByName(exception) }}</span>
                    </div>
                    <div class="d-flex align-items-center text-muted x-small">
                      <i class="bi bi-calendar-event me-2"></i>
                      {{ formatDateTime(exception.created_at) }}
                    </div>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>

          <!-- Pagination -->
          <div
            class="d-flex justify-content-between align-items-center mt-4 pt-3 border-top"
            v-if="totalPages > 1"
          >
            <span class="text-muted small"
              >Mostrando página {{ currentPage }} de {{ totalPages }}</span
            >
            <nav aria-label="Page navigation">
              <ul class="pagination pagination-sm mb-0 gap-1">
                <li class="page-item" :class="{ disabled: currentPage === 1 }">
                  <button
                    class="page-link rounded-2 border-0 bg-light text-dark shadow-xs"
                    @click="currentPage--"
                  >
                    <i class="bi bi-chevron-left small"></i>
                  </button>
                </li>
                <li
                  class="page-item"
                  v-for="page in totalPages"
                  :key="page"
                  :class="{ active: currentPage === page }"
                >
                  <button
                    class="page-link rounded-2 border-0 mx-1 shadow-xs"
                    :class="currentPage === page ? 'bg-primary text-white' : 'bg-white text-dark'"
                    @click="currentPage = page"
                  >
                    {{ page }}
                  </button>
                </li>
                <li class="page-item" :class="{ disabled: currentPage === totalPages }">
                  <button
                    class="page-link rounded-2 border-0 bg-light text-dark shadow-xs"
                    @click="currentPage++"
                  >
                    <i class="bi bi-chevron-right small"></i>
                  </button>
                </li>
              </ul>
            </nav>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { useShiftExceptionStore } from '@/stores/shift-exception.store'
import { useOptionStore } from '@/stores/option.store'
import ShiftExceptionFilter from '@/components/historial/ShiftExceptionFilter.vue'

const exceptionStore = useShiftExceptionStore()
const optionStore = useOptionStore()

const loading = ref(false)
const currentPage = ref(1)
const itemsPerPage = 10 // Reduced for card design

const filters = ref({
  startDate: null as Date | null,
  endDate: null as Date | null,
  service: '',
  cargo: ''
})

// Watch for filter changes to reload data
watch(
  () => [filters.value.startDate, filters.value.endDate],
  () => {
    loadExceptions()
  }
)

const services = computed(() => optionStore.opciones?.servicios || [])
const cargos = computed(() => {
  const all = optionStore.opciones?.tipoCargo || []
  return all.filter((c) => !['RECURSOS HUMANOS', 'ADMIN-TI'].includes(c))
})

const filteredExceptions = computed(() => {
  let result = exceptionStore.exceptions

  if (filters.value.service) {
    result = result.filter((e: any) => {
      const assignment = e.assignment_id
      if (assignment && typeof assignment === 'object') {
        if (assignment.service === filters.value.service) return true
        if (assignment.user_id?.servicio === filters.value.service) return true
      }
      return false
    })
  }

  if (filters.value.cargo) {
    result = result.filter((e: any) => {
      const assignment = e.assignment_id
      if (assignment && typeof assignment === 'object' && assignment.user_id) {
        if (assignment.user_id.tipo_cargo === filters.value.cargo) return true
      }
      return false
    })
  }
  // Sort by date desc (newest first)
  return result.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
})

const paginatedExceptions = computed(() => {
  const start = (currentPage.value - 1) * itemsPerPage
  const end = start + itemsPerPage
  return filteredExceptions.value.slice(start, end)
})

const totalPages = computed(() => Math.ceil(filteredExceptions.value.length / itemsPerPage))

// Helpers to extract Date parts
function getDay(dateStr: string) {
  return new Date(dateStr).getDate()
}
function getMonth(dateStr: string) {
  return new Date(dateStr).toLocaleString('es-ES', { month: 'short' }).replace('.', '')
}
function getYear(dateStr: string) {
  return new Date(dateStr).getFullYear()
}

function getInitials(name: string) {
  if (!name || name === 'N/A') return '?'
  return name
    .split(' ')
    .map((n: string) => n[0])
    .slice(0, 2)
    .join('')
    .toUpperCase()
}

// Logic: Get Local Start/End of Day
function getLocalStartOfDay(date: Date) {
  const d = new Date(date)
  d.setHours(0, 0, 0, 0)
  return d
}

function getLocalEndOfDay(date: Date) {
  const d = new Date(date)
  d.setHours(23, 59, 59, 999)
  return d
}

async function loadExceptions() {
  loading.value = true
  try {
    const startISO =
      filters.value.startDate instanceof Date
        ? getLocalStartOfDay(filters.value.startDate).toISOString()
        : undefined

    const endISO =
      filters.value.endDate instanceof Date
        ? getLocalEndOfDay(filters.value.endDate).toISOString()
        : undefined

    await exceptionStore.loadExceptions(undefined, startISO, endISO)
  } finally {
    loading.value = false
  }
}

function clearFilters() {
  filters.value = {
    startDate: null,
    endDate: null,
    service: '',
    cargo: ''
  }
}

function formatDateTime(dateStr: string) {
  return new Date(dateStr).toLocaleString('es-ES', {
    day: '2-digit',
    month: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  })
}

function getShiftLabel(type: string) {
  const labels: Record<string, string> = {
    LARGO: 'Largo',
    NOCHE: 'Noche',
    LIBRE: 'Libre'
  }
  return labels[type] || type
}

function getShiftBadgeClass(type: string) {
  const classes: Record<string, string> = {
    LARGO: 'glass-warning',
    NOCHE: 'glass-primary',
    LIBRE: 'glass-success'
  }
  return classes[type] || 'glass-secondary'
}

function getAssignmentName(exception: any) {
  const assignment = exception.assignment_id
  if (assignment && typeof assignment === 'object' && assignment.user_id) {
    const user = assignment.user_id
    if (user && typeof user === 'object' && user.nombre) {
      return `${user.nombre} ${user.apellido}`
    }
  }
  return 'N/A'
}

function getAssignmentCargo(exception: any) {
  const assignment = exception.assignment_id
  if (assignment && typeof assignment === 'object' && assignment.user_id) {
    const user = assignment.user_id
    if (user && typeof user === 'object' && user.tipo_cargo) {
      return user.tipo_cargo
    }
  }
  return ''
}

function getAssignmentService(exception: any) {
  const assignment = exception.assignment_id
  if (assignment && typeof assignment === 'object') {
    if (assignment.service) return assignment.service
    if (
      assignment.user_id &&
      typeof assignment.user_id === 'object' &&
      assignment.user_id.servicio
    ) {
      return assignment.user_id.servicio
    }
  }
  return 'N/A'
}

function getCreatedByName(exception: any) {
  const creator = exception.created_by
  if (creator && typeof creator === 'object' && creator.nombre) {
    return `${creator.nombre} ${creator.apellido}`
  }
  return 'Sistema'
}

onMounted(async () => {
  // Allow nulls to show placeholders
  // filters.value.startDate = null
  // filters.value.endDate = null

  await optionStore.mostrarOpciones()
  loadExceptions() // Trigger initial load (likely returns all or recent depending on backend)
})
</script>

<style scoped>
.historial-view {
  background-color: #f8fafc;
}

/* --- Animation Keyframes --- */
@keyframes slideUpFade {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

/* --- Container & Table Reset --- */
.modern-table-container {
  padding: 0 4px 10px 4px;
}

.modern-table {
  border-collapse: separate;
  border-spacing: 0 8px; /* Vertical gap between rows */
  width: 100%;
}

.modern-table thead th {
  border: none;
  font-size: 0.75rem;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  font-weight: 700;
  color: #94a3b8;
  padding-bottom: 8px;
  background: transparent;
}

/* --- Row Styling --- */
.data-row {
  animation: slideUpFade 0.5s ease-out forwards;
  opacity: 0;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.02);
}

.data-row td {
  background-color: white;
  border-top: 1px solid rgba(0, 0, 0, 0.02);
  border-bottom: 1px solid rgba(0, 0, 0, 0.02);
  padding: 1rem 0.5rem;
  vertical-align: middle;
  transition: all 0.2s cubic-bezier(0.25, 0.8, 0.25, 1);
}

.data-row td.first-cell {
  border-left: 1px solid rgba(0, 0, 0, 0.02);
  border-top-left-radius: 12px;
  border-bottom-left-radius: 12px;
}

.data-row td.last-cell {
  border-right: 1px solid rgba(0, 0, 0, 0.02);
  border-top-right-radius: 12px;
  border-bottom-right-radius: 12px;
}

.data-row:hover {
  transform: translateY(-2px);
  box-shadow: 0 12px 24px rgba(0, 0, 0, 0.06);
  z-index: 10;
  position: relative;
}

/* --- Components --- */
.avatar-modern {
  width: 42px;
  height: 42px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.9rem;
  font-weight: 700;
  flex-shrink: 0;
}

.badge-modern-context {
  display: inline-flex;
  align-items: center;
  font-size: 0.75rem;
  font-weight: 600;
  color: #334155;
  background-color: #f1f5f9;
  padding: 4px 8px;
  border-radius: 6px;
  max-width: fit-content;
}

.date-badge {
  line-height: 1;
}
.date-badge .day {
  font-size: 1.25rem;
}

.empty-state {
  min-height: 300px;
}
.empty-icon-container {
  width: 80px;
  height: 80px;
  background-color: #f1f5f9;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
}

/* Pagination Styles */
.pagination .page-link {
  color: #475569;
  font-weight: 500;
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
}
.pagination .active .page-link {
  background-color: #3b82f6 !important;
  color: white !important;
}
.pagination .page-item.disabled .page-link {
  opacity: 0.5;
}
.shadow-xs {
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
}

.x-small {
  font-size: 0.72rem;
}

/* Glass Status Pills */
.status-glass {
  padding: 6px 12px;
  border-radius: 99px;
  font-size: 0.7rem;
  font-weight: 700;
  letter-spacing: 0.05em;
  backdrop-filter: blur(4px);
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.05);
}

.glass-success {
  background: rgba(34, 197, 94, 0.1);
  color: #15803d;
  border: 1px solid rgba(34, 197, 94, 0.2);
}
.glass-warning {
  background: rgba(234, 179, 8, 0.1);
  color: #a16207;
  border: 1px solid rgba(234, 179, 8, 0.2);
}
.glass-danger {
  background: rgba(239, 68, 68, 0.1);
  color: #b91c1c;
  border: 1px solid rgba(239, 68, 68, 0.2);
}
.glass-primary {
  background: rgba(59, 130, 246, 0.1);
  color: #1d4ed8;
  border: 1px solid rgba(59, 130, 246, 0.2);
}
.glass-secondary {
  background: rgba(148, 163, 184, 0.1);
  color: #475569;
  border: 1px solid rgba(148, 163, 184, 0.2);
}
</style>
