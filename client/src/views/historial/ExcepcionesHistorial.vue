<template>
  <div class="container-fluid py-4">
    <!-- Header -->
    <div class="d-flex justify-content-between align-items-center mb-4">
      <h2 class="mb-0">
        <i class="bi bi-exclamation-triangle me-2 text-warning"></i>
        Excepciones de Turno
      </h2>
    </div>

    <!-- Filters -->
    <div class="card mb-4">
      <div class="card-body">
        <div class="row g-3 align-items-end">
          <div class="col-md-3">
            <label class="form-label">Desde</label>
            <VDatePicker
              v-model="filters.startDate"
              mode="date"
              :masks="{ input: 'DD/MM/YYYY' }"
              :popover="{ visibility: 'click' }"
            >
              <template #default="{ inputValue, inputEvents }">
                <input
                  class="form-control"
                  :value="inputValue"
                  v-on="inputEvents"
                  placeholder="Seleccione fecha inicio"
                  readonly
                />
              </template>
            </VDatePicker>
          </div>
          <div class="col-md-3">
            <label class="form-label">Hasta</label>
            <VDatePicker
              v-model="filters.endDate"
              mode="date"
              :masks="{ input: 'DD/MM/YYYY' }"
              :popover="{ visibility: 'click' }"
            >
              <template #default="{ inputValue, inputEvents }">
                <input
                  class="form-control"
                  :value="inputValue"
                  v-on="inputEvents"
                  placeholder="Seleccione fecha término"
                  readonly
                />
              </template>
            </VDatePicker>
          </div>
          <div class="col-md-3">
            <label class="form-label">Servicio</label>
            <select v-model="filters.service" class="form-select" @change="loadExceptions">
              <option value="">Todos los servicios</option>
              <option v-for="service in services" :key="service" :value="service">
                {{ service }}
              </option>
            </select>
          </div>
          <div class="col-md-3">
            <button class="btn btn-secondary w-100" @click="clearFilters">
              <i class="bi bi-x-circle me-2"></i>Limpiar Filtros
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Table -->
    <div class="card">
      <div class="card-body">
        <div v-if="loading" class="text-center py-5">
          <div class="spinner-border text-primary" role="status">
            <span class="visually-hidden">Cargando...</span>
          </div>
        </div>

        <div v-else-if="filteredExceptions.length === 0" class="text-center py-5 text-muted">
          <i class="bi bi-inbox fs-1 d-block mb-3"></i>
          <p>No se encontraron excepciones de turno</p>
        </div>

        <div v-else class="table-responsive">
          <table class="table table-hover align-middle">
            <thead class="table-light">
              <tr>
                <th>Fecha</th>
                <th>Funcionario</th>
                <th>Servicio</th>
                <th>Turno Original</th>
                <th>Turno Modificado</th>
                <th>Modificado Por</th>
                <th>Fecha Modificación</th>
                <th>Motivo</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="exception in paginatedExceptions" :key="exception._id">
                <td>{{ formatDate(exception.date) }}</td>
                <td>
                  <strong>{{ getAssignmentName(exception) }}</strong>
                </td>
                <td>
                  <span class="badge bg-info">{{ getAssignmentService(exception) }}</span>
                </td>
                <td>
                  <span
                    class="badge"
                    :class="
                      exception.original_type
                        ? getShiftBadgeClass(exception.original_type)
                        : 'bg-secondary'
                    "
                  >
                    {{
                      exception.original_type
                        ? getShiftLabel(exception.original_type)
                        : 'Desconocido'
                    }}
                  </span>
                </td>
                <td>
                  <span class="badge" :class="getShiftBadgeClass(exception.override_type)">
                    {{ getShiftLabel(exception.override_type) }}
                  </span>
                </td>
                <td>{{ getCreatedByName(exception) }}</td>
                <td>{{ formatDateTime(exception.created_at) }}</td>
                <td>
                  <small class="text-muted">{{ exception.reason || '-' }}</small>
                </td>
              </tr>
            </tbody>
          </table>

          <!-- Pagination -->
          <nav v-if="totalPages > 1" class="mt-3">
            <ul class="pagination justify-content-center">
              <li class="page-item" :class="{ disabled: currentPage === 1 }">
                <button class="page-link" @click="currentPage--">Anterior</button>
              </li>
              <li
                v-for="page in totalPages"
                :key="page"
                class="page-item"
                :class="{ active: currentPage === page }"
              >
                <button class="page-link" @click="currentPage = page">{{ page }}</button>
              </li>
              <li class="page-item" :class="{ disabled: currentPage === totalPages }">
                <button class="page-link" @click="currentPage++">Siguiente</button>
              </li>
            </ul>
          </nav>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { useShiftExceptionStore } from '@/stores/shift-exception.store'
import { useOptionStore } from '@/stores/option.store'

const exceptionStore = useShiftExceptionStore()
const optionStore = useOptionStore()

const loading = ref(false)
const currentPage = ref(1)
const itemsPerPage = 20

const filters = ref({
  startDate: new Date(),
  endDate: new Date(),
  service: ''
})

// Watch for date changes to reload data
watch(
  () => [filters.value.startDate, filters.value.endDate],
  () => {
    loadExceptions()
  }
)

const services = computed(() => optionStore.opciones?.servicios || [])

const filteredExceptions = computed(() => {
  let result = exceptionStore.exceptions

  if (filters.value.service) {
    result = result.filter((e: any) => {
      // Check service in user object (from nested populate) OR direct assignment service
      const assignment = e.assignment_id
      if (typeof assignment === 'object') {
        // Option 1: Service directly on assignment (from our fix)
        if (assignment.service === filters.value.service) return true
        // Option 2: Service in user object (fallback)
        if (assignment.user_id?.servicio === filters.value.service) return true
      }
      return false
    })
  }

  return result
})

const paginatedExceptions = computed(() => {
  const start = (currentPage.value - 1) * itemsPerPage
  const end = start + itemsPerPage
  return filteredExceptions.value.slice(start, end)
})

const totalPages = computed(() => Math.ceil(filteredExceptions.value.length / itemsPerPage))

// Helper to get local start/end of day
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
    // Convert to ISO strings but keeping local day boundaries
    // We want the backend to filter from 00:00 local to 23:59 local
    // Since backend likely compares raw ISO dates, we should send ISO dates corresponding to those timestamps

    const startDate =
      filters.value.startDate instanceof Date
        ? filters.value.startDate
        : new Date(filters.value.startDate)
    const endDate =
      filters.value.endDate instanceof Date
        ? filters.value.endDate
        : new Date(filters.value.endDate)

    const startISO = !isNaN(startDate.getTime())
      ? getLocalStartOfDay(startDate).toISOString()
      : undefined
    const endISO = !isNaN(endDate.getTime()) ? getLocalEndOfDay(endDate).toISOString() : undefined

    const response = await exceptionStore.loadExceptions(undefined, startISO, endISO)
    console.log('Loaded exceptions:', exceptionStore.exceptions) // Debugging
  } finally {
    loading.value = false
  }
}

function clearFilters() {
  const today = new Date()
  filters.value = {
    startDate: today,
    endDate: today,
    service: ''
  }
  // loadExceptions is triggered by watch
}

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString('es-ES', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  })
}

function formatDateTime(dateStr: string) {
  return new Date(dateStr).toLocaleString('es-ES', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
}

function getShiftLabel(type: string) {
  const labels: Record<string, string> = {
    LARGO: 'Turno Día',
    NOCHE: 'Turno Noche',
    LIBRE: 'Día Libre'
  }
  return labels[type] || type
}

function getShiftBadgeClass(type: string) {
  const classes: Record<string, string> = {
    LARGO: 'bg-warning text-dark',
    NOCHE: 'bg-primary',
    LIBRE: 'bg-success'
  }
  return classes[type] || 'bg-secondary'
}

function getAssignmentName(exception: any) {
  const assignment = exception.assignment_id
  if (assignment && typeof assignment === 'object' && assignment.user_id) {
    const user = assignment.user_id
    // Check if user is populated object or just ID
    if (user && typeof user === 'object' && user.nombre) {
      return `${user.nombre} ${user.apellido}`
    }
  }
  return 'N/A'
}

function getAssignmentService(exception: any) {
  const assignment = exception.assignment_id
  if (assignment && typeof assignment === 'object') {
    // Check turn assignment direct service first
    if (assignment.service) return assignment.service

    // Then check user service
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
  if (typeof creator === 'object' && creator?.nombre) {
    return `${creator.nombre} ${creator.apellido}`
  }
  return 'Sistema'
}

onMounted(async () => {
  // Set default date range (Today)
  const today = new Date()

  filters.value.startDate = today
  filters.value.endDate = today

  await optionStore.mostrarOpciones()
  // loadExceptions will be triggered by watch
})
</script>

<style scoped>
.table th {
  font-weight: 600;
  font-size: 0.875rem;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.table td {
  font-size: 0.9rem;
}

.badge {
  font-weight: 500;
  padding: 0.35em 0.65em;
}
</style>
