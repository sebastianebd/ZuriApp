<template>
  <div class="shifts-view p-4">
    <!-- Header Unificado -->
    <div class="d-flex justify-content-between align-items-center mb-4 flex-wrap gap-3" v-if="!historyMode">
      <div class="d-flex align-items-center gap-3">
        <div class="icon-square bg-white shadow-sm text-primary">
          <i
            class="bi"
            :class="
              activeTab === 'excepciones'
                ? 'bi-exclamation-triangle fs-4 text-warning'
                : 'bi-calendar-range fs-4 text-primary'
            "
          ></i>
        </div>
        <div>
          <h4 class="fw-bold mb-0 text-dark">Gestión de Turnos</h4>
          <p class="text-secondary small mb-0">
            <span v-if="activeTab === 'grilla'">
              Visualiza y gestiona la programación operativa en la grilla mensual.
            </span>
            <span v-else>
              Fiscalización y registro de modificaciones manuales de turnos.
            </span>
          </p>
        </div>
      </div>

      <!-- Filters, Switcher & Controls -->
      <div class="d-flex align-items-center gap-3 flex-wrap">
        <!-- Switcher de Vistas: Grilla Mensual / Excepciones Vigentes -->
        <div class="btn-group p-1 bg-white border rounded-pill shadow-sm">
          <button
            type="button"
            class="btn btn-sm px-3 rounded-pill fw-semibold border-0"
            :class="
              activeTab === 'grilla'
                ? 'btn-primary text-white shadow-sm'
                : 'text-secondary bg-transparent'
            "
            @click="setTab('grilla')"
          >
            <i class="bi bi-grid-3x3 me-1"></i> Grilla Mensual
          </button>
          <button
            type="button"
            class="btn btn-sm px-3 rounded-pill fw-semibold border-0"
            :class="
              activeTab === 'excepciones'
                ? 'btn-primary text-white shadow-sm'
                : 'text-secondary bg-transparent'
            "
            @click="setTab('excepciones')"
          >
            <i class="bi bi-exclamation-triangle me-1"></i> Excepciones Vigentes
          </button>
        </div>

        <!-- Controles contextuales para Grilla Mensual -->
        <template v-if="activeTab === 'grilla'">
          <div class="vr my-1 text-secondary opacity-25"></div>

          <!-- Service Filter -->
          <div style="min-width: 200px">
            <v-select
              v-model="selectedService"
              :options="serviceOptions"
              label="nombre"
              :reduce="(s: any) => s._id"
              placeholder="Filtrar por Servicio"
              class="bg-white rounded shadow-sm custom-v-select"
              :clearable="true"
            />
          </div>

          <div class="d-flex gap-2 align-items-center bg-white p-2 rounded shadow-sm">
            <button
              v-if="hasCreatePermission && !isPastMonth"
              class="btn btn-sm btn-primary d-flex align-items-center gap-2 px-3 fw-bold border-0 text-white shadow-sm"
              @click="openModal"
            >
              <i class="bi bi-plus-lg"></i> Asignar Planta
            </button>
            <div
              v-if="hasCreatePermission && !isPastMonth"
              class="vr mx-1 text-secondary opacity-25"
            ></div>
            <button
              class="btn btn-sm btn-outline-secondary border-0"
              @click="prevMonth"
              title="Mes Anterior"
            >
              <i class="bi bi-chevron-left"></i>
            </button>
            <span class="fw-bold px-3 text-capitalize">{{ formattedMonth }}</span>
            <button
              class="btn btn-sm btn-outline-secondary border-0"
              @click="nextMonth"
              :disabled="!canGoNext"
              title="Mes Siguiente"
            >
              <i class="bi bi-chevron-right"></i>
            </button>
            <button
              class="btn btn-sm btn-primary ms-2"
              @click="loadData"
              title="Actualizar datos"
            >
              <i class="bi bi-arrow-clockwise"></i>
            </button>
          </div>
        </template>

        <!-- Controles contextuales para Excepciones -->
        <template v-else>
          <div class="vr my-1 text-secondary opacity-25"></div>
          <button
            @click="exceptionsTabRef?.clearFilters()"
            class="btn btn-light border fw-semibold shadow-sm px-3"
          >
            <i class="bi bi-eraser me-2"></i>Limpiar Filtros
          </button>
        </template>
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

    <!-- Banner Período Histórico / Cerrado -->
    <div
      v-if="activeTab === 'grilla' && isPastMonth && !historyMode"
      class="alert alert-info border-0 shadow-sm rounded-4 p-3 mb-4 d-flex align-items-center gap-3"
    >
      <div
        class="rounded-circle bg-info bg-opacity-25 p-2 d-flex align-items-center justify-content-center text-info"
        style="width: 40px; height: 40px"
      >
        <i class="bi bi-lock-fill fs-5"></i>
      </div>
      <div>
        <h6 class="fw-bold mb-0 text-dark">Período Histórico / Cerrado</h6>
        <p class="small text-secondary mb-0">
          Estás visualizando un mes anterior en modo consulta. Las modificaciones operativas están
          bloqueadas para garantizar la trazabilidad de auditoría.
        </p>
      </div>
    </div>

    <!-- SUB-VISTA 1: GRILLA MENSUAL -->
    <div
      v-if="activeTab === 'grilla'"
      class="card border-0 shadow-sm rounded-4 overflow-hidden"
    >
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
              <td :colspan="daysInMonth.length + 1" class="py-5 text-muted fst-italic fs-5">
                {{
                  selectedServiceName && selectedServiceName !== '—'
                    ? `No hay turnos para ${selectedServiceName}`
                    : 'Seleccione un servicio'
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
                <ShiftCell
                  :item="item"
                  :date="day.date"
                  :get-shift-class="getShiftClass"
                  :get-shift-style="getShiftStyle"
                  :readonly="readonly || isPastMonth"
                  :history-mode="historyMode"
                  :has-update-permission="hasUpdatePermission"
                  :is-editable-date="isEditableDate"
                  :is-recently-modified="isRecentlyModified"
                  :has-exception="hasException"
                  @mouseenter="showTooltip"
                  @mouseleave="hideTooltip"
                  @click="handleCellClick"
                />
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- SUB-VISTA 2: EXCEPCIONES VIGENTES -->
    <ShiftExceptionsTab v-else ref="exceptionsTabRef" />

    <!-- Custom Tooltip -->
    <div v-if="tooltipState.show" class="custom-tooltip" :style="tooltipState.style">
      {{ tooltipState.content }}
    </div>

    <!-- Custom Alert -->
    <AlertMessage ref="alertComponent" />

    <!-- Modal -->
    <TurnAssignmentModal
      :visible="showModal"
      :loading="loadingAssignments"
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
      :base-sigla="selectedShiftData.currentShift?.baseSigla || ''"
      :has-exception="selectedShiftData.hasException"
      :loading="loadingExceptions"
      @cerrar="showModifyModal = false"
      @save="handleSaveException"
      @restore="handleRestorePattern"
      @delete-assignment="handleDeleteAssignment"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useCurrentShifts } from '@/composables/current-shifts/useCurrentShifts'
import { formatTitleCase, getInitials } from '@/utils/text-formatters'
import TurnAssignmentModal from '@/components/shifts/TurnAssignmentModal.vue'
import ShiftModificationModal from '@/components/shifts/ShiftModificationModal.vue'
import ShiftExceptionsTab from '@/components/shifts/ShiftExceptionsTab.vue'
import ShiftCell from '@/components/shifts/ShiftCell.vue'
import AlertMessage from '@/components/common/AlertMessage.vue'

const route = useRoute()
const router = useRouter()
const exceptionsTabRef = ref<any>(null)

// Sincronización bidireccional con Query Parameter (?tab=grilla|excepciones)
const activeTab = computed<'grilla' | 'excepciones'>(() => {
  return route.query.tab === 'excepciones' ? 'excepciones' : 'grilla'
})

const setTab = (tab: 'grilla' | 'excepciones') => {
  router.replace({
    query: {
      ...route.query,
      tab: tab === 'grilla' ? undefined : tab
    }
  })
}

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

const {
  showModal,
  selectedService,
  serviceOptions,
  alertComponent,
  tooltipState,
  formattedMonth,
  daysInMonth,
  canGoNext,
  isPastMonth,
  nextMonth,
  prevMonth,
  openModal,
  closeModal,
  loading,

  filteredShifts,
  getShiftStyle,
  getShiftClass,
  isToday,
  isWeekend,
  isRecentlyModified,
  isEditableDate,
  hasException,
  hasUpdatePermission,
  hasCreatePermission,
  loadingExceptions,
  loadingAssignments,

  showModifyModal,
  selectedShiftData,
  handleCellClick,
  handleSaveException,
  handleRestorePattern,

  showTooltip,
  hideTooltip,

  loadData,
  handleSaveAssignment,
  handleDeleteAssignment,

  selectedServiceName
} = useCurrentShifts(props)

onMounted(() => {
  loadData()
})

defineExpose({
  prevMonth
})
</script>

<style scoped>
.shifts-view {
  background-color: #f8fafc;
  min-height: calc(100vh - 71px);
}

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

/* Sticky First Column (IStaff Node) */
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

/* --- IStaff Cell Styling --- */
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
  padding: 12px 16px; /* More breathing room for IStaff */
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
.shift-custom-color {
  color: #1e293b;
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
