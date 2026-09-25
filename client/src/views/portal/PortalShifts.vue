<template>
  <div class="portal-shifts p-3">
    <!-- 1. Cabecera con Selector de Mes y Año -->
    <div class="d-flex justify-content-between align-items-center mb-3">
      <button
        type="button"
        class="btn btn-sm btn-light rounded-circle month-nav-btn"
        @click="changeMonth(-1)"
      >
        <i class="bi bi-chevron-left"></i>
      </button>

      <div class="text-center">
        <h5 class="fw-bold mb-0 text-dark">
          {{ monthNames[currentMonth - 1] }} {{ currentYear }}
        </h5>
        <span
          v-if="shiftsData?.isClosed"
          class="badge bg-secondary-subtle text-secondary border mt-1"
        >
          <i class="bi bi-lock-fill me-1"></i> Período Cerrado
        </span>
        <span
          v-else
          class="badge bg-success-subtle text-success border mt-1"
        >
          <i class="bi bi-unlock-fill me-1"></i> Período Abierto
        </span>
      </div>

      <button
        type="button"
        class="btn btn-sm btn-light rounded-circle month-nav-btn"
        @click="changeMonth(1)"
      >
        <i class="bi bi-chevron-right"></i>
      </button>
    </div>

    <!-- Banner de Descarga de Cartola Oficial (Mes Cerrado) -->
    <div
      v-if="shiftsData?.isClosed"
      class="alert alert-primary border-primary d-flex justify-content-between align-items-center p-3 rounded-3 mb-3"
    >
      <div>
        <strong class="d-block text-primary">Cartola Oficial Disponible</strong>
        <small class="text-muted">Este mes ha sido cerrado administrativamente.</small>
      </div>
      <button
        type="button"
        class="btn btn-sm btn-primary fw-semibold"
        data-test="download-cartola-btn"
        @click="handleDownloadCartola"
      >
        <i class="bi bi-file-earmark-pdf-fill me-1"></i>
        Descargar Cartola (PDF)
      </button>
    </div>

    <!-- 2. Conmutador Segmentado Superior -->
    <div class="segmented-control bg-light p-1 rounded-pill d-flex mb-3">
      <button
        type="button"
        class="btn btn-sm flex-fill rounded-pill fw-semibold segment-btn"
        :class="{ active: activeTab === 'calendar' }"
        data-test="tab-btn-calendar"
        @click="activeTab = 'calendar'"
      >
        <i class="bi bi-calendar3 me-1"></i>
        Calendario de Turnos
      </button>

      <button
        type="button"
        class="btn btn-sm flex-fill rounded-pill fw-semibold segment-btn"
        :class="{ active: activeTab === 'contracts' }"
        data-test="tab-btn-contracts"
        @click="activeTab = 'contracts'"
      >
        <i class="bi bi-file-earmark-text me-1"></i>
        Mis Reemplazos
        <span class="badge bg-primary text-white ms-1 rounded-pill">
          {{ shiftsData?.replacementContracts?.length || 0 }}
        </span>
      </button>
    </div>

    <!-- ==================== SUB-PESTAÑA A: CALENDARIO DE TURNOS ==================== -->
    <section v-if="activeTab === 'calendar'" data-test="calendar-section">
      <!-- Alternador de Vista (Cuadrícula / Lista) -->
      <div class="d-flex justify-content-between align-items-center mb-2">
        <span class="text-muted small">
          {{ viewMode === 'grid' ? 'Vista Mensual' : 'Vista Cronológica' }}
        </span>
        <button
          type="button"
          class="btn btn-sm btn-outline-secondary py-1 px-2"
          data-test="toggle-view-btn"
          @click="toggleViewMode"
        >
          <i
            class="bi me-1"
            :class="viewMode === 'grid' ? 'bi-list-ul' : 'bi-grid-3x3-gap-fill'"
          ></i>
          {{ viewMode === 'grid' ? 'Ver como Lista' : 'Ver como Cuadrícula' }}
        </button>
      </div>

      <!-- Cuadrícula Mensual -->
      <div v-if="viewMode === 'grid'" class="calendar-grid-card bg-white rounded-4 shadow-sm p-2 mb-3" data-test="calendar-grid">
        <!-- Días de la semana -->
        <div class="row g-0 text-center text-muted fw-bold small mb-2 border-bottom pb-1">
          <div class="col">Lu</div>
          <div class="col">Ma</div>
          <div class="col">Mi</div>
          <div class="col">Ju</div>
          <div class="col">Vi</div>
          <div class="col">Sá</div>
          <div class="col text-danger">Do</div>
        </div>

        <!-- Celdas del calendario -->
        <div class="calendar-grid">
          <!-- Celdas vacías para alinear con el día de la semana correcto (Lunes a Domingo) -->
          <div
            v-for="n in leadingEmptyDays"
            :key="'empty-' + n"
            class="calendar-day-cell empty-day-cell rounded-3"
          ></div>

          <div
            v-for="shift in shiftsData?.shifts || []"
            :key="shift.date"
            class="calendar-day-cell text-center p-1 rounded-3 position-relative cursor-pointer"
            :class="[
              getCellClass(shift),
              {
                'is-today': isToday(shift.date),
                'is-replacement': shift.isReplacement && (shift.isWorkDay || shift.sigla),
                'is-workday': shift.isWorkDay,
                'is-empty-day': !shift.sigla,
              }
            ]"
            :data-test="`day-cell-${shift.date}`"
            @click="openDayDetail(shift)"
          >
            <div
              class="day-number small"
              :class="{ 'today-number': isToday(shift.date), 'text-muted': !isToday(shift.date) }"
            >
              {{ getDayNumber(shift.date) }}
            </div>
            <div
              v-if="shift.sigla && shift.sigla !== '-'"
              class="sigla-badge mx-auto my-1 rounded-circle d-flex align-items-center justify-content-center"
              :class="getSiglaClass(shift.sigla)"
            >
              {{ shift.sigla }}
            </div>
          </div>
        </div>
      </div>

      <!-- Vista de Lista Cronológica -->
      <div v-else class="calendar-list bg-white rounded-4 shadow-sm p-2 mb-3" data-test="calendar-list">
        <div v-if="scheduledShifts.length > 0">
          <div
            v-for="shift in scheduledShifts"
            :key="shift.date"
            class="d-flex justify-content-between align-items-center py-2 px-3 border-bottom-subtle cursor-pointer list-shift-item"
            @click="openDayDetail(shift)"
          >
            <div class="d-flex align-items-center gap-2">
              <span
                class="sigla-badge rounded-circle d-flex align-items-center justify-content-center"
                :class="getSiglaClass(shift.sigla)"
              >
                {{ shift.sigla }}
              </span>
              <div>
                <div class="fw-semibold small text-dark">
                  {{ formatDate(shift.date) }}
                  <span v-if="shift.isReplacement" class="badge bg-warning-subtle text-warning-emphasis border border-warning ms-1" style="font-size: 0.65rem;">
                    Reemplazo
                  </span>
                </div>
                <small class="text-muted">{{ shift.serviceName }}</small>
              </div>
            </div>
            <div class="text-end small">
              <span class="text-secondary d-block">{{ shift.entryTime && shift.exitTime ? `${shift.entryTime} - ${shift.exitTime}` : 'Libre' }}</span>
            </div>
          </div>
        </div>
        <div v-else class="text-center py-4 text-muted small" data-test="no-shifts-message">
          <i class="bi bi-calendar-x fs-2 d-block mb-1 text-secondary opacity-50"></i>
          Sin turnos programados en este mes.
        </div>
      </div>
    </section>

    <!-- ==================== SUB-PESTAÑA B: MIS REEMPLAZOS ==================== -->
    <section v-else-if="activeTab === 'contracts'" data-test="contracts-section">
      <!-- Filtros Rápidos -->
      <div class="d-flex gap-2 mb-3 overflow-auto pb-1">
        <button
          v-for="filter in ['Todos', 'Activos', 'Finalizados']"
          :key="filter"
          type="button"
          class="btn btn-sm rounded-pill fw-semibold px-3 filter-btn"
          :class="contractFilter === filter ? 'btn-primary' : 'btn-outline-secondary'"
          @click="contractFilter = filter"
        >
          {{ filter }}
        </button>
      </div>

      <!-- Lista de Contratos -->
      <div v-if="filteredContracts.length > 0">
        <div
          v-for="contract in filteredContracts"
          :key="contract.id"
          :data-test="`contract-card-${contract.id}`"
          class="contract-wrapper mb-2"
          :class="{ 'targeted-contract': targetedContractId === contract.id }"
        >
          <ReplacementContractCard :contract="contract" />
        </div>
      </div>

      <div
        v-else
        class="card border-0 bg-light rounded-4 text-center p-4"
      >
        <i class="bi bi-file-earmark-x fs-1 text-muted mb-2"></i>
        <h6 class="fw-bold mb-1">No hay reemplazos registrados</h6>
        <small class="text-muted">No se encontraron contratos de reemplazo en este período.</small>
      </div>
    </section>

    <!-- Bottom Sheet de Detalle Diario -->
    <ShiftDayDetailSheet
      v-model="showDayDetail"
      :shift="selectedShift"
      @view-contract="handleViewContract"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { useRoute } from 'vue-router'
import { usePortalStore } from '@/stores/portal.store'
import ReplacementContractCard from '@/components/portal/ReplacementContractCard.vue'
import ShiftDayDetailSheet from '@/components/portal/ShiftDayDetailSheet.vue'
import type { PortalShiftItem, PortalShiftsViewData } from '@/types/portal.types'

const route = useRoute()
const portalStore = usePortalStore()

const currentMonth = ref(new Date().getMonth() + 1)
const currentYear = ref(new Date().getFullYear())
const activeTab = ref<'calendar' | 'contracts'>('calendar')
const viewMode = ref<'grid' | 'list'>('grid')
const contractFilter = ref<string>('Todos')

const shiftsData = ref<PortalShiftsViewData | null>(null)
const selectedShift = ref<PortalShiftItem | null>(null)
const showDayDetail = ref(false)
const targetedContractId = ref<string | null>(null)

const monthNames = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
]

const filteredContracts = computed(() => {
  const contracts = shiftsData.value?.replacementContracts || []
  if (contractFilter.value === 'Activos') {
    return contracts.filter((c) => c.status === 'Activo')
  }
  if (contractFilter.value === 'Finalizados') {
    return contracts.filter((c) => c.status === 'Finalizado' || c.status === 'Corte Anticipado')
  }
  return contracts
})

const leadingEmptyDays = computed(() => {
  if (!shiftsData.value?.shifts?.length) return 0
  const firstDateStr = shiftsData.value.shifts[0].date
  const parts = firstDateStr.split('-').map(Number)
  if (parts.length < 3) return 0
  const d = new Date(parts[0], parts[1] - 1, parts[2])
  // Monday is 0, Sunday is 6
  const dayOfWeek = d.getDay()
  return (dayOfWeek + 6) % 7
})

const scheduledShifts = computed(() => {
  return (shiftsData.value?.shifts || []).filter(
    (s) => s.isWorkDay || (s.sigla && s.sigla !== '-')
  )
})

onMounted(async () => {
  await loadShifts()
  if (route?.query?.tab === 'contracts') {
    activeTab.value = 'contracts'
  }
  if (route?.query?.id) {
    targetedContractId.value = String(route.query.id)
  }
})

watch(
  () => [currentMonth.value, currentYear.value],
  async () => {
    await loadShifts()
  }
)

async function loadShifts() {
  try {
    const data = await portalStore.fetchShifts(currentMonth.value, currentYear.value)
    shiftsData.value = data
  } catch (error) {
    console.error('Error cargando turnos del mes:', error)
  }
}

function changeMonth(delta: number) {
  let newMonth = currentMonth.value + delta
  let newYear = currentYear.value

  if (newMonth > 12) {
    newMonth = 1
    newYear++
  } else if (newMonth < 1) {
    newMonth = 12
    newYear--
  }

  currentMonth.value = newMonth
  currentYear.value = newYear
}

function toggleViewMode() {
  viewMode.value = viewMode.value === 'grid' ? 'list' : 'grid'
}

function openDayDetail(shift: PortalShiftItem) {
  selectedShift.value = shift
  showDayDetail.value = true
}

function handleViewContract(replacementId: string) {
  activeTab.value = 'contracts'
  targetedContractId.value = replacementId
}

async function handleDownloadCartola() {
  try {
    await portalStore.downloadCartolaPdf(currentMonth.value, currentYear.value)
  } catch (error) {
    console.error('Error descargando cartola oficial:', error)
  }
}

function getDayNumber(dateStr: string): number {
  if (!dateStr) return 1
  return parseInt(dateStr.split('-')[2], 10)
}

function formatDate(dateStr: string): string {
  if (!dateStr) return ''
  const parts = dateStr.split('-')
  if (parts.length === 3) {
    return `${parts[2]}/${parts[1]}/${parts[0]}`
  }
  return dateStr
}

function isToday(dateStr: string): boolean {
  if (!dateStr) return false
  const now = new Date()
  const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`
  return dateStr === todayStr
}

function getCellClass(shift: PortalShiftItem) {
  const s = shift?.sigla?.toUpperCase()
  if (s === 'L') return 'cell-largo'
  if (s === 'N') return 'cell-noche'
  if (s === 'X') return 'cell-libre'
  return ''
}

function getSiglaClass(sigla: string) {
  switch (sigla?.toUpperCase()) {
    case 'L':
      return 'sigla-largo'
    case 'N':
      return 'sigla-noche'
    case 'X':
      return 'sigla-libre'
    default:
      return 'sigla-default'
  }
}
</script>

<style scoped lang="scss">
.portal-shifts {
  max-width: 540px;
  margin: 0 auto;
}

.month-nav-btn {
  width: 36px;
  height: 36px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.segmented-control {
  .segment-btn {
    border: none;
    color: #6c757d;
    background: transparent;
    transition: all 0.2s ease;

    &.active {
      background: #ffffff;
      color: #0d6efd;
      box-shadow: 0 2px 6px rgba(0, 0, 0, 0.08);
    }
  }
}

.calendar-grid {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  gap: 4px;

  .calendar-day-cell {
    border: 1px solid #f1f3f5;
    min-height: 52px;
    transition: background 0.15s ease;

    &:hover {
      background: #f8f9fa;
    }

    &.is-today {
      outline: 2.5px solid #0d6efd !important;
      outline-offset: -1px;
      box-shadow: 0 0 8px rgba(13, 110, 253, 0.35);
      z-index: 2;

      .today-number {
        background-color: #0d6efd;
        color: #ffffff !important;
        border-radius: 50%;
        width: 20px;
        height: 20px;
        display: inline-flex;
        align-items: center;
        justify-content: center;
        font-weight: 700;
        margin: 0 auto;
      }
    }

    &.cell-largo {
      background-color: #fffbeb !important;
      border-color: #fde68a !important;
    }

    &.cell-noche {
      background-color: #f0f7ff !important;
      border-color: #bae6fd !important;
    }

    &.cell-libre {
      background-color: #f0fdf4 !important;
      border-color: #bbf7d0 !important;
    }

    &.is-replacement {
      border: 1.5px solid #ffc107 !important;
    }

    &.empty-day-cell {
      border: none !important;
      background: transparent !important;
      pointer-events: none;
    }

    &.is-empty-day {
      background: #fafbfc;
      opacity: 0.7;
    }
  }
}

.sigla-badge {
  width: 26px;
  height: 26px;
  font-weight: 700;
  font-size: 0.75rem;
}

.sigla-largo {
  background-color: #fef08a !important;
  color: #854d0e !important;
  border: 1px solid #fde047 !important;
}

.sigla-noche {
  background-color: #dbeafe !important;
  color: #1e40af !important;
  border: 1px solid #bfdbfe !important;
}

.sigla-libre {
  background-color: #dcfce7 !important;
  color: #166534 !important;
  border: 1px solid #bbf7d0 !important;
}

.sigla-default {
  background-color: #f1f5f9 !important;
  color: #475569 !important;
  border: 1px solid #cbd5e1 !important;
}

.cursor-pointer {
  cursor: pointer;
}

.targeted-contract {
  animation: pulseHighlight 1.5s infinite;
  border-radius: 1rem;
}

@keyframes pulseHighlight {
  0% {
    box-shadow: 0 0 0 0 rgba(13, 110, 253, 0.4);
  }
  70% {
    box-shadow: 0 0 0 8px rgba(13, 110, 253, 0);
  }
  100% {
    box-shadow: 0 0 0 0 rgba(13, 110, 253, 0);
  }
}
</style>
