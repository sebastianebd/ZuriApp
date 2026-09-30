<template>
  <Transition name="fade">
    <div
      v-if="visible"
      class="coverage-modal-overlay"
      role="dialog"
      aria-modal="true"
      @click.self="emit('cerrar')"
    >
      <div class="coverage-modal-dialog shadow-2xl">
        <!-- HEADER VANGUARD -->
        <div class="coverage-modal-header d-flex justify-content-between align-items-center p-3 px-4 border-bottom">
          <div class="d-flex align-items-center gap-3">
            <div class="header-icon-box shadow-sm">
              <i class="bi bi-calendar3-range fs-4 text-primary"></i>
            </div>
            <div>
              <div class="d-flex align-items-center gap-2 mb-0">
                <h5 class="fw-bold mb-0 text-dark header-title">Cronograma de Cobertura y Reemplazos</h5>
                <span class="live-counter-badge">
                  {{ monthlyReplacements.length }} activos
                </span>
              </div>
              <p class="text-secondary smaller mb-0 mt-0.5">
                Visualiza la distribución temporal de coberturas y detecta solapamientos operativos.
              </p>
            </div>
          </div>

          <button
            type="button"
            class="btn-close shadow-none"
            aria-label="Cerrar modal"
            @click="emit('cerrar')"
          ></button>
        </div>

        <!-- TOOLBAR: NAVEGACIÓN, SERVICIOS Y ALERTAS -->
        <div class="coverage-toolbar p-3 px-4 bg-light border-bottom d-flex justify-content-between align-items-center flex-wrap gap-3">
          <!-- Navegador de Mes -->
          <div class="d-flex align-items-center gap-2">
            <div class="btn-group shadow-sm bg-white rounded-pill p-1 border">
              <button
                type="button"
                class="btn btn-sm btn-icon-round btn-prev-month"
                title="Mes anterior"
                @click="prevMonth"
              >
                <i class="bi bi-chevron-left"></i>
              </button>
              <span class="px-3 d-flex align-items-center fw-bold text-dark month-display-label">
                {{ monthName }}
              </span>
              <button
                type="button"
                class="btn btn-sm btn-icon-round btn-next-month"
                title="Mes siguiente"
                @click="nextMonth"
              >
                <i class="bi bi-chevron-right"></i>
              </button>
            </div>

            <button
              type="button"
              class="btn btn-sm btn-light border rounded-pill px-3 fw-semibold shadow-sm"
              @click="goToCurrentMonth"
            >
              Hoy
            </button>
          </div>

          <!-- Filtro de Servicio -->
          <div class="d-flex align-items-center gap-2" style="min-width: 240px">
            <label class="text-secondary smaller fw-bold text-uppercase mb-0">Servicio:</label>
            <select
              v-model="selectedServiceId"
              class="form-select form-select-sm rounded-pill shadow-sm border"
            >
              <option value="">Todos los Servicios</option>
              <option v-for="s in availableServices" :key="s._id" :value="s._id">
                {{ s.nombre }}
              </option>
            </select>
          </div>

          <!-- Leyenda de Estados -->
          <div class="d-flex align-items-center gap-3 smaller text-secondary ms-auto">
            <span class="d-flex align-items-center gap-1.5">
              <span class="legend-dot bg-success"></span> En curso
            </span>
            <span class="d-flex align-items-center gap-1.5">
              <span class="legend-dot bg-warning"></span> Pendiente
            </span>
          </div>
        </div>

        <!-- CUERPO PRINCIPAL / GANTT -->
        <div class="coverage-modal-body p-4 position-relative">
          <!-- Spinner de carga -->
          <div v-if="cargando" class="text-center py-5">
            <div class="spinner-border text-primary mb-2" role="status">
              <span class="visually-hidden">Cargando...</span>
            </div>
            <p class="text-secondary small mb-0">Cargando cronograma de coberturas...</p>
          </div>

          <!-- Empty State -->
          <div v-else-if="coverageRows.length === 0" class="empty-state text-center py-5">
            <div class="empty-icon-capsule mb-3 mx-auto">
              <i class="bi bi-calendar-x fs-2 text-secondary opacity-75"></i>
            </div>
            <h6 class="fw-bold text-dark mb-1">No hay reemplazos activos en este período</h6>
            <p class="text-secondary small mb-3">
              No se registran reemplazos vigentes para {{ monthName }} en el servicio seleccionado.
            </p>
            <button
              v-if="selectedServiceId"
              type="button"
              class="btn btn-sm btn-light border rounded-pill px-3 shadow-sm fw-semibold"
              @click="selectedServiceId = ''"
            >
              Ver todos los servicios
            </button>
          </div>

          <!-- GANTT TIMELINE MATRIX -->
          <div v-else class="gantt-scroll-wrapper border rounded-3 overflow-hidden shadow-sm">
            <div class="gantt-timeline-container" :style="{ '--days-count': daysInMonth }">
              <!-- HEADER ROW -->
              <div class="gantt-header-row">
                <!-- Columna fija de personal -->
                <div class="gantt-staff-col-header">
                  <span>Funcionario Titular (Saliente)</span>
                </div>

                <!-- Columnas de días del mes -->
                <div class="gantt-days-track">
                  <div
                    v-for="d in daysList"
                    :key="d.day"
                    class="gantt-day-cell-header"
                    :class="{ 'is-weekend': d.isWeekend, 'is-today': d.isToday }"
                  >
                    <span class="weekday-lbl">{{ d.weekdayShort }}</span>
                    <span class="day-number">{{ d.day }}</span>
                  </div>
                </div>
              </div>

              <!-- BODY ROWS (TITULARES) -->
              <div
                v-for="row in coverageRows"
                :key="row.titularKey"
                class="gantt-body-row"
                :class="{ 'has-conflict-row': row.hasConflict }"
                :style="{ height: `${row.totalTracks * 38 + 10}px` }"
              >
                <!-- Información del titular -->
                <div class="gantt-staff-cell">
                  <div class="d-flex align-items-center gap-2">
                    <div class="avatar-circle shadow-xs">
                      {{ getInitials(row.titularFullName) }}
                    </div>
                    <div class="text-truncate min-w-0">
                      <div class="fw-bold text-dark text-truncate fs-7" :title="row.titularFullName">
                        {{ row.titularFullName }}
                      </div>
                      <div class="smaller text-secondary text-truncate d-flex align-items-center gap-1.5 mt-0.5">
                        <span class="badge bg-light text-secondary border px-1.5 py-0.5 rounded">
                          {{ formatTitleCase(getServiceName(row.servicio) || row.servicioNombre) }}
                        </span>
                        <span v-if="row.hasConflict" class="badge bg-danger text-white px-1.5 py-0.5 rounded fw-bold" title="Solapamiento detectado">
                          <i class="bi bi-exclamation-triangle-fill"></i> Conflicto
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                <!-- Grilla de días y Barras de reemplazo -->
                <div class="gantt-days-track position-relative">
                  <!-- Fondos de celda para cada día -->
                  <div
                    v-for="d in daysList"
                    :key="d.day"
                    class="gantt-day-cell-bg"
                    :class="{ 'is-weekend': d.isWeekend, 'is-today': d.isToday }"
                  ></div>

                  <!-- Barras horizontales de Reemplazo -->
                  <div
                    v-for="(item, idx) in row.items"
                    :key="idx"
                    class="replacement-gantt-bar shadow-sm"
                    :class="[
                      getBarStatusClass(item),
                      { 'is-conflict': item.hasConflict }
                    ]"
                    :style="{
                      gridColumnStart: item.startDay,
                      gridColumnEnd: item.endDay + 1,
                      top: `${item.trackIndex * 34 + 5}px`
                    }"
                    @click="selectItem(item)"
                    :title="getBarTooltip(item)"
                  >
                    <div class="bar-inner-content d-flex align-items-center justify-content-between w-100 text-truncate px-1">
                      <div class="d-flex align-items-center gap-1.5 text-truncate min-w-0 flex-grow-1">
                        <span class="bar-avatar-mini">{{ getInitials(item.replacement.nombre_entrante + ' ' + item.replacement.apellido_entrante) }}</span>
                        <span class="bar-entrant-name text-truncate">
                          {{ formatTitleCase(item.replacement.nombre_entrante + ' ' + item.replacement.apellido_entrante) }}
                        </span>
                      </div>
                      <span class="bar-dates-chip flex-shrink-0 ms-3">
                        {{ item.startDay }}-{{ item.endDay }} {{ monthShortName }}
                      </span>
                      <i v-if="item.hasConflict" class="bi bi-exclamation-circle-fill text-white ms-1 flex-shrink-0" title="Solapamiento"></i>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- DETALLE FLOTANTE DE REEMPLAZO SELECCIONADO (Drawer / Popover) -->
          <Transition name="slide-up">
            <div v-if="selectedItem" class="detail-popover-card shadow-lg border p-3 bg-white rounded-3 mt-3">
              <div class="d-flex justify-content-between align-items-center mb-2 pb-2 border-bottom">
                <div class="d-flex align-items-center gap-2">
                  <span class="badge bg-primary bg-opacity-10 text-primary border border-primary border-opacity-25 px-2.5 py-1 rounded-pill fw-bold">
                    {{ selectedItem.replacement.id_negocio || 'Reemplazo' }}
                  </span>
                  <span class="badge" :class="selectedItem.hasConflict ? 'bg-danger text-white' : 'bg-success text-white'">
                    {{ selectedItem.hasConflict ? 'Conflicto de Solapamiento' : (selectedItem.replacement.status === 'active' ? 'En Curso' : 'Pendiente') }}
                  </span>
                </div>
                <button type="button" class="btn-close btn-close-sm" @click="selectedItem = null"></button>
              </div>

              <div class="row g-2 smaller">
                <div class="col-md-4">
                  <span class="text-secondary fw-semibold d-block">Funcionario Titular:</span>
                  <span class="fw-bold text-dark">{{ selectedItem.replacement.nombre_saliente }} {{ selectedItem.replacement.apellido_saliente }}</span>
                  <span class="text-muted d-block font-monospace">RUT: {{ selectedItem.replacement.rut_saliente || 'N/A' }}</span>
                </div>
                <div class="col-md-4">
                  <span class="text-secondary fw-semibold d-block">Funcionario Reemplazante:</span>
                  <span class="fw-bold text-dark">{{ selectedItem.replacement.nombre_entrante }} {{ selectedItem.replacement.apellido_entrante }}</span>
                  <span class="text-muted d-block font-monospace">RUT: {{ selectedItem.replacement.rut_entrante || 'N/A' }}</span>
                </div>
                <div class="col-md-4">
                  <span class="text-secondary fw-semibold d-block">Período y Turno:</span>
                  <span class="fw-bold text-dark">{{ formatDate(selectedItem.replacement.fecha_inicio) }} al {{ formatDate(selectedItem.replacement.fecha_termino) }}</span>
                  <span class="text-muted d-block">{{ selectedItem.replacement.tipo_turno || 'Turno Base' }}</span>
                </div>
              </div>

              <!-- Motivo de Conflicto si aplica -->
              <div v-if="selectedItem.hasConflict && selectedItem.conflictReasons.length" class="alert alert-danger p-2 px-3 mt-2 mb-0 smaller rounded-2">
                <i class="bi bi-exclamation-triangle-fill me-1"></i>
                <span class="fw-bold">Detalle del solapamiento: </span>
                <span v-for="(reason, rIdx) in selectedItem.conflictReasons" :key="rIdx" class="d-block mt-0.5">
                  • {{ reason }}
                </span>
              </div>
            </div>
          </Transition>
        </div>

        <!-- FOOTER -->
        <div class="coverage-modal-footer p-3 px-4 bg-light border-top d-flex justify-content-end">
          <button
            type="button"
            class="btn btn-light rounded-pill px-4 fw-bold border shadow-xs"
            @click="emit('cerrar')"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  </Transition>
</template>

<script setup lang="ts">
import { ref, watch, onMounted, computed } from 'vue'
import { useAuthStore } from '@/stores/auth.store'
import { useServiceStore } from '@/stores/service.store'
import * as ReplacementService from '@/services/replacement.service'
import { useReplacementCoverage, type CoverageItem } from '@/composables/active-replacements/useReplacementCoverage'
import { formatDateDDMMYYYY } from '@/utils/date-utils'
import { formatTitleCase } from '@/utils/text-formatters'

const props = withDefaults(
  defineProps<{
    visible: boolean
    initialYear?: number
    initialMonth?: number
  }>(),
  {
    visible: false
  }
)

const emit = defineEmits<{
  (e: 'cerrar'): void
}>()

const authStore = useAuthStore()
const serviceStore = useServiceStore()

const replacements = ref<any[]>([])
const cargando = ref(false)
const selectedItem = ref<CoverageItem | null>(null)

// Composable de cobertura
const {
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
  conflictsCount,
  hasConflicts,
  coverageRows
} = useReplacementCoverage({
  replacements,
  initialYear: props.initialYear,
  initialMonth: props.initialMonth,
  getServiceName: (id: any) => serviceStore.getServiceName(id)
})

const availableServices = computed(() => serviceStore.services || [])

const monthShortName = computed(() => {
  return monthName.value.split(' ')[0].slice(0, 3)
})

function getServiceName(id: any): string {
  if (!id) return 'General'
  const name = serviceStore.getServiceName(id)
  if (!name || name === '—' || name === 'undefined' || name === id) {
    if (typeof id === 'object' && id?.nombre) return id.nombre
    const found = availableServices.value.find(
      (s: any) => String(s._id) === String(id) || String(s.id) === String(id)
    )
    if (found) return found.nombre
  }
  return name && name !== '—' && name !== 'undefined' ? name : 'General'
}

// Cargar reemplazos completos para el visor
const loadAllReplacements = async () => {
  cargando.value = true
  try {
    const apiPrivate = authStore.usePrivateApi()
    const response = await ReplacementService.mostrarReemplazos(apiPrivate, {
      limit: 1000,
      status: 'active'
    })
    replacements.value =
      response?.reemplazos ||
      (Array.isArray(response) ? response : response?.data?.reemplazos || [])
  } catch (err) {
    console.error('Error al cargar reemplazos para el cronograma:', err)
  } finally {
    cargando.value = false
  }
}

// Cargar al abrir el modal
watch(
  () => props.visible,
  async (isVis) => {
    if (isVis) {
      if (!serviceStore.services?.length) {
        await serviceStore.fetchServices()
      }
      selectedItem.value = null
      loadAllReplacements()
    }
  },
  { immediate: true }
)

function getInitials(name?: string): string {
  if (!name) return '?'
  const parts = name.trim().split(/\s+/)
  if (parts.length >= 2) {
    return (parts[0][0] + parts[1][0]).toUpperCase()
  }
  return parts[0].slice(0, 2).toUpperCase()
}

function formatDate(iso?: string): string {
  if (!iso) return ''
  return formatDateDDMMYYYY(iso)
}

function selectItem(item: CoverageItem) {
  selectedItem.value = selectedItem.value === item ? null : item
}

function getBarStatusClass(item: CoverageItem): string {
  if (item.hasConflict) return 'bar-conflict'
  if (item.replacement.status === 'active') return 'bar-active'
  return 'bar-pending'
}

function getBarTooltip(item: CoverageItem): string {
  const r = item.replacement
  const titular = `${r.nombre_saliente} ${r.apellido_saliente}`
  const entrante = `${r.nombre_entrante} ${r.apellido_entrante}`
  let tip = `${entrante} cubre a ${titular} (${item.startDay} al ${item.endDay} de ${monthName.value})`
  if (item.hasConflict) {
    tip = `⚠️ SOLAPAMIENTO: ${item.conflictReasons.join(' | ')}`
  }
  return tip
}
</script>

<style scoped lang="scss">
.coverage-modal-overlay {
  position: fixed;
  inset: 0;
  z-index: 1055;
  background-color: rgba(15, 23, 42, 0.6);
  backdrop-filter: blur(6px);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 1.5rem;
}

.coverage-modal-dialog {
  background: #ffffff;
  border-radius: 1.25rem;
  width: 100%;
  max-width: 1380px;
  max-height: 92vh;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.header-icon-box {
  width: 44px;
  height: 44px;
  border-radius: 12px;
  background: rgba(14, 165, 233, 0.1);
  display: flex;
  align-items: center;
  justify-content: center;
}

.live-counter-badge {
  font-size: 0.75rem;
  font-weight: 700;
  background: #eff6ff;
  color: #2563eb;
  padding: 0.2rem 0.65rem;
  border-radius: 9999px;
  border: 1px solid rgba(37, 99, 235, 0.2);
}

.btn-icon-round {
  width: 28px;
  height: 28px;
  border-radius: 50%;
  padding: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  border: none;
  background: transparent;
  color: #475569;
  transition: all 0.15s ease;

  &:hover {
    background: #f1f5f9;
    color: #0f172a;
  }
}

.month-display-label {
  min-width: 160px;
  justify-content: center;
  font-size: 0.875rem;
}

.legend-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  display: inline-block;
}

.coverage-modal-body {
  flex: 1 1 auto;
  overflow-y: auto;
  min-height: 380px;
}

/* GANTT MATRIX */
.gantt-scroll-wrapper {
  overflow-x: auto;
  background: #ffffff;
}

.gantt-timeline-container {
  min-width: 1050px;
  display: flex;
  flex-direction: column;
}

.gantt-header-row {
  display: flex;
  background: #f8fafc;
  border-bottom: 2px solid #e2e8f0;
}

.gantt-staff-col-header {
  width: 240px;
  min-width: 240px;
  padding: 0.4rem 0.75rem;
  font-size: 0.725rem;
  font-weight: 700;
  text-transform: uppercase;
  color: #64748b;
  display: flex;
  align-items: center;
  border-right: 2px solid #e2e8f0;
}

.gantt-days-track {
  flex: 1;
  display: grid;
  grid-template-columns: repeat(var(--days-count, 31), 1fr);
}

.gantt-day-cell-header {
  padding: 0.35rem 0.2rem;
  text-align: center;
  border-right: 1px solid #f1f5f9;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 1px;

  .weekday-lbl {
    font-size: 0.625rem;
    font-weight: 600;
    color: #94a3b8;
  }

  .day-number {
    font-size: 0.725rem;
    font-weight: 700;
    color: #334155;
  }

  &.is-weekend {
    background: #f1f5f9;
  }

  &.is-today {
    background: #eff6ff;
    .day-number {
      color: #2563eb;
      background: #dbeafe;
      border-radius: 50%;
      width: 18px;
      height: 18px;
      display: flex;
      align-items: center;
      justify-content: center;
    }
  }
}

.gantt-body-row {
  display: flex;
  border-bottom: 1px solid #e2e8f0;
  transition: background 0.15s ease;

  &:hover {
    background: #fafafa;
  }

  &.has-conflict-row {
    background: rgba(254, 242, 242, 0.5);
  }
}

.gantt-staff-cell {
  width: 240px;
  min-width: 240px;
  padding: 0.25rem 0.75rem;
  border-right: 2px solid #e2e8f0;
  display: flex;
  align-items: center;
  background: inherit;
}

.avatar-circle {
  width: 28px;
  height: 28px;
  min-width: 28px;
  border-radius: 50%;
  background: linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%);
  color: #ffffff;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 700;
  font-size: 0.7rem;
}

.gantt-day-cell-bg {
  border-right: 1px solid #f1f5f9;
  height: 100%;

  &.is-weekend {
    background: rgba(241, 245, 249, 0.45);
  }

  &.is-today {
    background: rgba(239, 246, 255, 0.45);
    border-left: 1px solid rgba(37, 99, 235, 0.3);
    border-right: 1px solid rgba(37, 99, 235, 0.3);
  }
}

.replacement-gantt-bar {
  position: absolute;
  height: 30px;
  border-radius: 6px;
  padding: 0 0.4rem;
  display: flex;
  align-items: center;
  cursor: pointer;
  z-index: 2;
  transition: transform 0.15s ease, box-shadow 0.15s ease;
  left: 2px;
  right: 2px;

  &:hover {
    transform: translateY(-1px);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  }

  &.bar-active {
    background: linear-gradient(135deg, #10b981 0%, #059669 100%);
    color: #ffffff;
    border: 1px solid rgba(255, 255, 255, 0.2);
  }

  &.bar-pending {
    background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%);
    color: #ffffff;
    border: 1px solid rgba(255, 255, 255, 0.2);
  }

  &.bar-conflict {
    background: linear-gradient(135deg, #ef4444 0%, #b91c1c 100%);
    color: #ffffff;
    border: 2px solid #ffffff;
    outline: 2px solid #ef4444;
    animation: pulse-border 2s infinite ease-in-out;
  }
}

@keyframes pulse-border {
  0%, 100% { outline-color: #ef4444; }
  50% { outline-color: #fca5a5; }
}

.bar-avatar-mini {
  width: 18px;
  height: 18px;
  min-width: 18px;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.25);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.6rem;
  font-weight: 700;
}

.bar-entrant-name {
  font-size: 0.725rem;
  font-weight: 700;
}

.bar-dates-chip {
  font-size: 0.625rem;
  background: rgba(0, 0, 0, 0.18);
  padding: 0.1rem 0.45rem;
  border-radius: 4px;
  font-weight: 600;
  white-space: nowrap;
}

.fs-7 {
  font-size: 0.8125rem;
}

.smaller {
  font-size: 0.75rem;
}

.shadow-xs {
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
}

.empty-icon-capsule {
  width: 60px;
  height: 60px;
  border-radius: 50%;
  background: #f1f5f9;
  display: flex;
  align-items: center;
  justify-content: center;
}

/* TRANSITIONS */
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.2s ease;
}
.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

.slide-up-enter-active,
.slide-up-leave-active {
  transition: all 0.2s ease;
}
.slide-up-enter-from,
.slide-up-leave-to {
  opacity: 0;
  transform: translateY(10px);
}
</style>
