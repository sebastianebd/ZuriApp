<template>
  <div class="exceptions-tab-wrapper">
    <!-- Main Content Card -->
    <div class="card border-0 shadow-sm rounded-4">
      <div class="card-body p-4">
        <!-- Filter Section -->
        <div class="mb-4" style="position: relative; z-index: 20;">
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
                      <div class="text-secondary x-small mt-1 d-flex align-items-center">
                        <i class="bi bi-hospital me-1"></i>
                        {{ getAssignmentService(exception) }}
                      </div>
                    </div>
                  </div>
                </td>

                <!-- Cambio de Turno -->
                <td>
                  <div class="d-flex align-items-center gap-2">
                    <span
                      class="shift-pill"
                      :style="getShiftStyle(exception.original_type)"
                      :title="getShiftLabel(exception.original_type)"
                    >
                      {{ exception.original_type }}
                    </span>
                    <i class="bi bi-arrow-right text-muted"></i>
                    <span
                      class="shift-pill"
                      :style="getShiftStyle(exception.override_type)"
                      :title="getShiftLabel(exception.override_type)"
                    >
                      {{ exception.override_type }}
                    </span>
                  </div>
                </td>

                <!-- Detalles y Autor -->
                <td>
                  <div class="d-flex flex-column justify-content-center">
                    <div class="small fw-semibold text-dark d-flex align-items-center">
                      <i class="bi bi-person-badge text-muted me-2"></i>
                      {{ getCreatedByName(exception) }}
                    </div>
                    <div class="x-small text-secondary mt-1">
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
import { useTurnSiglaStore } from '@/stores/turn-sigla.store'
import { usePositionStore } from '@/stores/position.store'
import { useServiceStore } from '@/stores/service.store'
import ShiftExceptionFilter from '@/components/historial/ShiftExceptionFilter.vue'
import { formatTitleCase } from '@/utils/text-formatters'

const exceptionStore = useShiftExceptionStore()
const turnSiglaStore = useTurnSiglaStore()
const positionStore = usePositionStore()
const serviceStore = useServiceStore()

const loading = ref(false)
const currentPage = ref(1)
const itemsPerPage = 10

const filters = ref({
  startDate: null as Date | null,
  endDate: null as Date | null,
  service: '',
  cargo: ''
})

watch(
  () => [filters.value.startDate, filters.value.endDate],
  () => {
    loadExceptions()
  }
)

const services = computed(() => serviceStore.services || [])
const cargos = computed(() => {
  const all = positionStore.positions.map((p: any) => formatTitleCase(p.name)) || []
  return all.filter((c: string) => {
    const upper = (c || '').toUpperCase()
    return !['RECURSOS HUMANOS', 'ADMIN-TI'].includes(upper)
  })
})

const filteredExceptions = computed(() => {
  let result = exceptionStore.exceptions

  if (filters.value.service) {
    result = result.filter((e: any) =>
      serviceStore.isServiceMatch(getAssignmentService(e), filters.value.service)
    )
  }

  if (filters.value.cargo) {
    result = result.filter((e: any) => getAssignmentCargo(e) === filters.value.cargo)
  }

  return result.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
})

const paginatedExceptions = computed(() => {
  const start = (currentPage.value - 1) * itemsPerPage
  const end = start + itemsPerPage
  return filteredExceptions.value.slice(start, end)
})

const totalPages = computed(() => Math.ceil(filteredExceptions.value.length / itemsPerPage))

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

function toYYYYMMDD(date: Date) {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

async function loadExceptions() {
  loading.value = true
  try {
    const startISO =
      filters.value.startDate instanceof Date
        ? toYYYYMMDD(filters.value.startDate)
        : undefined

    const endISO =
      filters.value.endDate instanceof Date
        ? toYYYYMMDD(filters.value.endDate)
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
  return formatTitleCase(turnSiglaStore.mapSiglaToNombre(type))
}

function getShiftStyle(type: string) {
  const match = turnSiglaStore.siglas.find(
    (s) => s.sigla === type || s.nombre.toUpperCase() === type.toUpperCase()
  )

  if (match) {
    const hex = match.color || '#64748b'
    let c: any
    if (/^#([A-Fa-f0-9]{3}){1,2}$/.test(hex)) {
      c = hex.substring(1).split('')
      if (c.length === 3) {
        c = [c[0], c[0], c[1], c[1], c[2], c[2]]
      }
      c = '0x' + c.join('')
      const r = (c >> 16) & 255
      const g = (c >> 8) & 255
      const b = c & 255
      return {
        background: `rgba(${r}, ${g}, ${b}, 0.1)`,
        color: `rgb(${Math.max(0, r - 50)}, ${Math.max(0, g - 50)}, ${Math.max(0, b - 50)})`,
        border: `1px solid rgba(${r}, ${g}, ${b}, 0.2)`
      }
    }
  }

  return {
    background: '#f1f5f9',
    color: '#64748b',
    border: '1px solid #e2e8f0'
  }
}

function getAssignmentName(exception: any) {
  const assignment = exception.assignment_id
  if (assignment && typeof assignment === 'object') {
    if (assignment.staffId && assignment.staffId.firstName) {
      return formatTitleCase(`${assignment.staffId.firstName} ${assignment.staffId.lastName}`)
    }
    if (assignment.nombre_entrante) {
      return formatTitleCase(`${assignment.nombre_entrante} ${assignment.apellido_entrante}`)
    }
  }
  return 'N/A'
}

function getAssignmentCargo(exception: any) {
  const assignment = exception.assignment_id
  if (assignment && typeof assignment === 'object') {
    let posId: any = null

    if (assignment.staffId && assignment.staffId.positionId) {
      posId =
        typeof assignment.staffId.positionId === 'object'
          ? assignment.staffId.positionId._id || assignment.staffId.positionId.id
          : assignment.staffId.positionId
    } else if (
      assignment.id_entrante &&
      typeof assignment.id_entrante === 'object' &&
      assignment.id_entrante.positionId
    ) {
      posId =
        typeof assignment.id_entrante.positionId === 'object'
          ? assignment.id_entrante.positionId._id || assignment.id_entrante.positionId.id
          : assignment.id_entrante.positionId
    }

    if (posId) {
      const pos = positionStore.positions.find((p) => p._id === posId)
      if (pos) return formatTitleCase(pos.name)
    }

    if (assignment.rut_entrante) return 'Reemplazo'
  }
  return ''
}

function getAssignmentService(exception: any) {
  const assignment = exception.assignment_id
  let rawService: any = null
  if (assignment && typeof assignment === 'object') {
    if (assignment.servicio) rawService = assignment.servicio
    else if (assignment.service) rawService = assignment.service
  }

  if (!rawService) return 'N/A'
  return serviceStore.getServiceName(rawService)
}

function getCreatedByName(exception: any) {
  const creator = exception.created_by
  if (creator && typeof creator === 'object' && creator.firstName) {
    return formatTitleCase(`${creator.firstName} ${creator.lastName}`)
  }
  return 'Sistema'
}

onMounted(async () => {
  await Promise.all([
    exceptionStore.loadExceptions(),
    turnSiglaStore.fetchSiglas(),
    serviceStore.fetchServices(),
    positionStore.fetchPositions()
  ])
  loadExceptions()
})

defineExpose({
  clearFilters,
  loadExceptions
})
</script>

<style scoped>
.exceptions-tab-wrapper {
  animation: fadeIn 0.3s ease-in-out;
}

@keyframes fadeIn {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}

.modern-table-container {
  padding: 0 4px 10px 4px;
}

.modern-table {
  border-collapse: separate;
  border-spacing: 0 8px;
  width: 100%;
}

.modern-table thead th {
  border: none;
  font-size: 0.75rem;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  font-weight: 700;
  color: #94a3b8;
  padding: 0 16px 8px 16px;
}

.data-row {
  background: #ffffff;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.02);
  border-radius: 12px;
  transition: all 0.2s cubic-bezier(0.16, 1, 0.3, 1);
  animation: slideUpFade 0.4s ease-out forwards;
}

@keyframes slideUpFade {
  from {
    opacity: 0;
    transform: translateY(12px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.data-row:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 16px rgba(0, 0, 0, 0.06);
}

.data-row td {
  border: none;
  padding: 12px 16px;
  vertical-align: middle;
  background-color: #ffffff;
}

.data-row td:first-child {
  border-top-left-radius: 12px;
  border-bottom-left-radius: 12px;
}

.data-row td:last-child {
  border-top-right-radius: 12px;
  border-bottom-right-radius: 12px;
}

.date-badge {
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  border-radius: 10px;
  padding: 4px 10px;
  min-width: 48px;
}

.date-badge .day {
  font-size: 1.1rem;
  line-height: 1.1;
}

.avatar-modern {
  width: 38px;
  height: 38px;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 700;
  font-size: 0.85rem;
}

.shift-pill {
  font-size: 0.8rem;
  font-weight: 700;
  padding: 4px 10px;
  border-radius: 8px;
  min-width: 36px;
  text-align: center;
  display: inline-block;
}

.x-small {
  font-size: 0.75rem;
}

.empty-state {
  min-height: 250px;
}

.empty-icon-container {
  width: 70px;
  height: 70px;
  background-color: #f1f5f9;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
}
</style>
