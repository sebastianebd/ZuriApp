<template>
  <transition name="drawer-fade">
    <div
      v-if="modelValue"
      class="exceptions-drawer-overlay"
      @click.self="close"
    >
        <transition name="drawer-slide">
          <div
            v-if="modelValue"
            class="exceptions-drawer-panel shadow-2xl d-flex flex-column"
            role="dialog"
            aria-modal="true"
            aria-labelledby="drawer-title"
          >
            <!-- Drawer Header -->
            <div class="drawer-header px-4 py-3 border-bottom d-flex align-items-center justify-content-between">
              <div class="d-flex align-items-center gap-3">
                <div class="header-icon-bubble shadow-xs">
                  <i class="bi bi-shield-exclamation text-warning fs-5"></i>
                </div>
                <div>
                  <div class="d-flex align-items-center gap-2">
                    <h5 id="drawer-title" class="fw-bold mb-0 text-dark">Excepciones Vigentes</h5>
                    <span class="badge rounded-pill bg-warning bg-opacity-15 text-dark border border-warning border-opacity-25 px-2 py-0.5 small fw-semibold">
                      {{ filteredExceptions.length }} {{ filteredExceptions.length === 1 ? 'activa' : 'activas' }}
                    </span>
                  </div>
                  <p class="text-secondary small mb-0 mt-0.5">
                    Modificaciones operativas activas sobre la programación base de planta.
                  </p>
                </div>
              </div>

              <button
                type="button"
                class="btn-close-drawer btn btn-light rounded-circle p-2 shadow-xs d-flex align-items-center justify-content-center"
                @click="close"
                title="Cerrar panel (Esc)"
                aria-label="Cerrar panel"
              >
                <i class="bi bi-x-lg"></i>
              </button>
            </div>

            <!-- Scope Toolbar & Search -->
            <div class="drawer-toolbar px-4 py-3 border-bottom bg-light bg-opacity-50">
              <div class="d-flex align-items-center justify-content-between gap-2 flex-wrap mb-2">
                <!-- Scope Switcher -->
                <div class="btn-group btn-group-sm p-1 bg-white border rounded-pill shadow-xs scope-pill-group">
                  <button
                    type="button"
                    class="btn rounded-pill px-3 py-1 fw-semibold border-0 btn-scope"
                    :class="selectedScope === 'service' ? 'btn-primary text-white shadow-xs' : 'text-secondary bg-transparent'"
                    @click="selectedScope = 'service'"
                    data-test="scope-service-btn"
                  >
                    <i class="bi bi-hospital me-1"></i>
                    {{ currentServiceName || 'Este Servicio' }}
                  </button>
                  <button
                    type="button"
                    class="btn rounded-pill px-3 py-1 fw-semibold border-0 btn-scope"
                    :class="selectedScope === 'all' ? 'btn-primary text-white shadow-xs' : 'text-secondary bg-transparent'"
                    @click="selectedScope = 'all'"
                    data-test="scope-all-btn"
                  >
                    <i class="bi bi-globe me-1"></i>
                    Todo el Hospital
                  </button>
                </div>

                <!-- Resumen Mes -->
                <span class="text-muted small fw-medium">
                  <i class="bi bi-calendar3 me-1 text-primary"></i>
                  {{ formattedMonthLabel }}
                </span>
              </div>

              <!-- Input de Búsqueda Rápida dentro del Drawer -->
              <div class="drawer-search-wrapper position-relative">
                <i class="bi bi-search search-icon text-muted position-absolute"></i>
                <input
                  v-model="searchQuery"
                  type="text"
                  class="form-control form-control-sm rounded-pill ps-4 pe-4 py-2 border shadow-xs drawer-search-input"
                  placeholder="Buscar por funcionario o cargo..."
                  aria-label="Buscar excepciones"
                />
                <button
                  v-if="searchQuery"
                  type="button"
                  class="btn-clear position-absolute border-0 bg-transparent text-muted"
                  @click="searchQuery = ''"
                  title="Limpiar búsqueda"
                >
                  <i class="bi bi-x-circle-fill"></i>
                </button>
              </div>
            </div>

            <!-- Drawer Body / Content List -->
            <div class="drawer-body flex-grow-1 overflow-y-auto px-4 py-3">
              <!-- Loading State -->
              <div v-if="isLoading && restoringId === null" class="text-center py-5">
                <div class="spinner-border text-primary" role="status">
                  <span class="visually-hidden">Cargando...</span>
                </div>
                <p class="text-secondary small mt-2 fw-medium">Cargando excepciones operativas...</p>
              </div>

              <!-- Empty State -->
              <div
                v-else-if="filteredExceptions.length === 0"
                class="empty-drawer-state text-center py-5 px-3"
              >
                <div class="empty-icon-shield mb-3 mx-auto shadow-xs">
                  <i class="bi bi-shield-check text-success fs-2"></i>
                </div>
                <h6 class="fw-bold text-dark mb-1">Sin excepciones vigentes</h6>
                <p class="text-secondary small mb-0 max-w-xs mx-auto">
                  {{
                    searchQuery
                      ? 'No hay registros que coincidan con la búsqueda ingresada.'
                      : selectedScope === 'service'
                      ? `La programación de ${currentServiceName || 'este servicio'} se encuentra 100% alineada con el patrón de planta.`
                      : 'No se registran modificaciones de turno activas en ningún servicio para este período.'
                  }}
                </p>
                <button
                  v-if="searchQuery"
                  type="button"
                  class="btn btn-sm btn-outline-secondary rounded-pill px-3 mt-3 shadow-xs"
                  @click="searchQuery = ''"
                >
                  <i class="bi bi-eraser me-1"></i> Limpiar búsqueda
                </button>
              </div>

              <!-- List of Exception Cards -->
              <div v-else class="exceptions-list d-flex flex-column gap-3">
                <div
                  v-for="item in filteredExceptions"
                  :key="item._id"
                  class="card exception-card overflow-hidden"
                >
                  <!-- Card Header: Fecha y Funcionario -->
                  <div class="card-header bg-white px-3.5 py-3 d-flex align-items-center justify-content-between gap-2 border-bottom">
                    <div class="d-flex align-items-center gap-2.5 min-w-0">
                      <div class="staff-avatar-mini">
                        {{ getInitials(getAssignmentName(item)) }}
                      </div>
                      <div class="min-w-0">
                        <div class="staff-card-name text-truncate">
                          {{ getAssignmentName(item) }}
                        </div>
                        <div class="d-flex align-items-center gap-1.5 flex-wrap mt-0.5">
                          <span v-if="getAssignmentCargo(item)" class="badge-cargo-pill">
                            {{ getAssignmentCargo(item) }}
                          </span>
                          <span class="badge-service-pill">
                            <i class="bi bi-hospital me-1"></i>
                            {{ getAssignmentService(item) }}
                          </span>
                        </div>
                      </div>
                    </div>

                    <!-- Date Badge (Estilo Mini-Calendario Elegante) -->
                    <div class="date-badge-box text-center shadow-xs">
                      <div class="date-month">{{ getMonth(item.date) }}</div>
                      <div class="date-day">{{ getDay(item.date) }}</div>
                    </div>
                  </div>

                  <!-- Card Body: Turno Original vs Modificado -->
                  <div class="card-body p-3.5">
                    <!-- Caja de Comparación de Turnos -->
                    <div class="transition-comparison-box p-3 rounded-3 d-flex align-items-center justify-content-between mb-3">
                      <!-- Turno Base Planta -->
                      <div class="d-flex flex-column">
                        <span class="comparison-label text-muted mb-1.5">
                          <i class="bi bi-calendar-check me-1"></i>Turno Base
                        </span>
                        <div class="d-flex align-items-center gap-2">
                          <span
                            class="shift-pill shadow-xs"
                            :style="getShiftStyle(item.original_type)"
                          >
                            {{ getSigla(item.original_type) }}
                          </span>
                          <span class="shift-name-text">
                            {{ getShiftLabel(item.original_type) }}
                          </span>
                        </div>
                      </div>

                      <!-- Conector Central -->
                      <div class="transition-indicator-circle shadow-xs">
                        <i class="bi bi-arrow-right"></i>
                      </div>

                      <!-- Turno Modificado (Excepción) -->
                      <div class="d-flex flex-column text-end align-items-end">
                        <span class="badge-active-mod mb-1.5">
                          <i class="bi bi-lightning-charge-fill me-0.5"></i>Activo
                        </span>
                        <div class="d-flex align-items-center justify-content-end gap-2">
                          <span class="shift-name-text text-dark fw-bold">
                            {{ getShiftLabel(item.override_type) }}
                          </span>
                          <span
                            class="shift-pill shadow-xs"
                            :style="getShiftStyle(item.override_type)"
                          >
                            {{ getSigla(item.override_type) }}
                          </span>
                        </div>
                      </div>
                    </div>

                    <!-- Metadatos de Auditoría -->
                    <div class="audit-meta-row d-flex align-items-center justify-content-between mb-3">
                      <div class="d-flex align-items-center gap-1.5 text-truncate" style="max-width: 250px;">
                        <i class="bi bi-person-check text-primary opacity-75"></i>
                        <span class="text-secondary text-truncate">
                          Por <strong class="text-dark">{{ getCreatedByName(item) }}</strong>
                        </span>
                      </div>
                      <div class="d-flex align-items-center gap-1 text-secondary flex-shrink-0">
                        <i class="bi bi-clock"></i>
                        <span>{{ formatDateTime(item.created_at) }}</span>
                      </div>
                    </div>

                    <!-- Acciones de la Tarjeta -->
                    <div class="card-actions-row d-flex align-items-center justify-content-end gap-2 pt-2.5 border-top">
                      <!-- Ubicar en Grilla -->
                      <button
                        type="button"
                        class="btn-card-action btn-card-locate"
                        @click="handleLocate(item)"
                        data-test="btn-locate-cell"
                        title="Ubicar celda en la grilla mensual"
                      >
                        <i class="bi bi-crosshair2 text-primary"></i>
                        <span>Ubicar en Grilla</span>
                      </button>

                      <!-- Restablecer Turno Base -->
                      <button
                        v-if="hasUpdatePermission && !readonly"
                        type="button"
                        class="btn-card-action btn-card-restore"
                        :disabled="restoringId === item._id"
                        @click="handleRestore(item)"
                        data-test="btn-restore-exception"
                        title="Eliminar excepción y restaurar patrón original"
                      >
                        <span v-if="restoringId === item._id" class="spinner-border spinner-border-sm" role="status"></span>
                        <template v-else>
                          <i class="bi bi-arrow-counterclockwise"></i>
                          <span>Restablecer Turno</span>
                        </template>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <!-- Drawer Footer Summary -->
            <div class="drawer-footer px-4 py-3 border-top bg-white d-flex align-items-center justify-content-end">
              <button
                type="button"
                class="btn btn-sm btn-secondary rounded-pill px-4 py-1.5 shadow-xs fw-semibold"
                @click="close"
              >
                Cerrar
              </button>
            </div>
          </div>
        </transition>
      </div>
    </transition>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted, onUnmounted, unref } from 'vue'
import { useShiftExceptionStore } from '@/stores/shift-exception.store'
import { useTurnSiglaStore } from '@/stores/turn-sigla.store'
import { useServiceStore } from '@/stores/service.store'
import { usePositionStore } from '@/stores/position.store'
import { useAlertStore } from '@/stores/alert.store'
import { useAuthStore } from '@/stores/auth.store'
import { formatTitleCase } from '@/utils/text-formatters'

interface Props {
  modelValue: boolean
  currentServiceId?: string | null
  currentServiceName?: string
  currentMonthDate?: Date
  hasUpdatePermission?: boolean
  readonly?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  modelValue: false,
  currentServiceId: null,
  currentServiceName: '',
  currentMonthDate: () => new Date(),
  hasUpdatePermission: true,
  readonly: false
})

const emit = defineEmits<{
  (e: 'update:modelValue', value: boolean): void
  (e: 'exception-restored', exceptionId: string): void
  (e: 'locate-cell', payload: { assignmentId: string; date: string }): void
}>()

const exceptionStore = useShiftExceptionStore()
const turnSiglaStore = useTurnSiglaStore()
const serviceStore = useServiceStore()
const positionStore = usePositionStore()
const alertStore = useAlertStore()
const authStore = useAuthStore()

watch(
  () => props.modelValue,
  (isOpen) => {
    if (isOpen && props.currentMonthDate) {
      const year = props.currentMonthDate.getFullYear()
      const month = props.currentMonthDate.getMonth()
      const startISO = new Date(year, month, 1).toISOString()
      const endISO = new Date(year, month + 1, 0, 23, 59, 59, 999).toISOString()
      exceptionStore.loadExceptions(undefined, startISO, endISO).catch((err) => {
        console.warn('Error silencioso al sincronizar excepciones en drawer:', err)
      })
    }
  }
)

const selectedScope = ref<'service' | 'all'>(props.currentServiceId ? 'service' : 'all')
const searchQuery = ref('')
const restoringId = ref<string | null>(null)
const isLoading = computed(() => Boolean(unref(exceptionStore.loading)))

const formattedMonthLabel = computed(() => {
  const d = props.currentMonthDate || new Date()
  return d.toLocaleString('es-ES', { month: 'long', year: 'numeric' })
})

const filteredExceptions = computed(() => {
  let list = (unref(exceptionStore.exceptions) as any[]) || []
  if (!Array.isArray(list)) list = []

  // Filtrado por Scope (Servicio Activo vs Todo el Hospital)
  if (selectedScope.value === 'service' && props.currentServiceId) {
    list = list.filter((e: any) => {
      const srv = getRawService(e)
      return srv === props.currentServiceId || serviceStore.isServiceMatch(srv, props.currentServiceId!)
    })
  }

  // Filtrado por buscador en vivo
  if (searchQuery.value.trim()) {
    const q = searchQuery.value.trim().toLowerCase()
    list = list.filter((e: any) => {
      const name = getAssignmentName(e).toLowerCase()
      const cargo = getAssignmentCargo(e).toLowerCase()
      const service = getAssignmentService(e).toLowerCase()
      return name.includes(q) || cargo.includes(q) || service.includes(q)
    })
  }

  // Ordenar por fecha cronológica descendente
  return [...list].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
})

function close() {
  emit('update:modelValue', false)
}

function handleKeyDown(event: KeyboardEvent) {
  if (event.key === 'Escape' && props.modelValue) {
    close()
  }
}

onMounted(() => {
  window.addEventListener('keydown', handleKeyDown)
})

onUnmounted(() => {
  window.removeEventListener('keydown', handleKeyDown)
})

function getRawService(exception: any): string {
  const assignment = exception.assignment_id
  if (assignment && typeof assignment === 'object') {
    return assignment.servicio || assignment.service || ''
  }
  return ''
}

function getAssignmentService(exception: any): string {
  const rawService = getRawService(exception)
  if (!rawService) return 'N/A'
  return serviceStore.getServiceName(rawService)
}

function getAssignmentName(exception: any): string {
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

function getAssignmentCargo(exception: any): string {
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
      const pos = positionStore.positions.find((p: any) => p._id === posId)
      if (pos) return formatTitleCase(pos.name)
    }

    if (assignment.rut_entrante) return 'Reemplazo'
  }
  return ''
}

function getCreatedByName(exception: any): string {
  const creator = exception.created_by
  if (creator && typeof creator === 'object' && creator.firstName) {
    return formatTitleCase(`${creator.firstName} ${creator.lastName}`)
  }
  const currentStaff = authStore.IStaff
  if (creator && typeof creator === 'string' && currentStaff && currentStaff._id && creator.toString() === currentStaff._id.toString()) {
    const name = `${currentStaff.firstName || ''} ${currentStaff.lastName || ''}`.trim()
    if (name) return formatTitleCase(name)
  }
  return 'Sistema'
}

function getDay(dateStr: string) {
  return new Date(dateStr).getDate()
}

function getMonth(dateStr: string) {
  return new Date(dateStr).toLocaleString('es-ES', { month: 'short' }).replace('.', '')
}

function formatDateTime(dateStr: string) {
  if (!dateStr) return '—'
  return new Date(dateStr).toLocaleString('es-ES', {
    day: '2-digit',
    month: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  })
}

function getInitials(name: string): string {
  if (!name || name === 'N/A') return '?'
  return name
    .split(' ')
    .map((n: string) => n[0])
    .slice(0, 2)
    .join('')
    .toUpperCase()
}

function findSiglaInfo(type: string) {
  if (!type) return null
  const clean = type.trim().toUpperCase()
  return (
    turnSiglaStore.siglas.find(
      (s: any) =>
        s.sigla?.toUpperCase() === clean ||
        (s.nombre && s.nombre.toUpperCase() === clean)
    ) || null
  )
}

function getSigla(type: string): string {
  if (!type) return ''
  const info = findSiglaInfo(type)
  return info ? info.sigla : type
}

function getShiftLabel(type: string): string {
  if (!type) return ''
  const info = findSiglaInfo(type)
  if (info && info.nombre) {
    return formatTitleCase(info.nombre)
  }
  return formatTitleCase(turnSiglaStore.mapSiglaToNombre(type))
}

function getContrastColor(hex?: string): string {
  if (!hex || typeof hex !== 'string') return '#1e293b'
  let cleanHex = hex.replace('#', '')
  if (cleanHex.length === 3) {
    cleanHex = cleanHex.split('').map((c) => c + c).join('')
  }
  if (cleanHex.length !== 6) return '#1e293b'
  const r = parseInt(cleanHex.substring(0, 2), 16)
  const g = parseInt(cleanHex.substring(2, 4), 16)
  const b = parseInt(cleanHex.substring(4, 6), 16)
  const yiq = (r * 299 + g * 587 + b * 114) / 1000
  return yiq >= 128 ? '#1e293b' : '#ffffff'
}

function getShiftStyle(type: string) {
  const match = findSiglaInfo(type)

  if (match && match.color) {
    const bgColor = match.color
    const textColor = getContrastColor(bgColor)
    return {
      backgroundColor: bgColor,
      color: textColor,
      borderColor: bgColor
    }
  }

  return {
    backgroundColor: '#64748b',
    color: '#ffffff',
    borderColor: '#64748b'
  }
}

async function handleRestore(exception: any) {
  if (restoringId.value !== null) return
  restoringId.value = exception._id

  try {
    await exceptionStore.deleteException(exception._id)
    emit('exception-restored', exception._id)
    alertStore.fetchAlerts(props.currentServiceId || undefined)
  } catch (error) {
    console.error('Error al restaurar excepción:', error)
  } finally {
    restoringId.value = null
  }
}

function handleLocate(exception: any) {
  const assignment = exception.assignment_id
  const assignmentId = typeof assignment === 'object' ? assignment._id : assignment
  emit('locate-cell', {
    assignmentId,
    date: exception.date
  })
}
</script>

<style scoped>
/* --- Drawer Overlay & Backdrop --- */
.exceptions-drawer-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  background-color: rgba(15, 23, 42, 0.45);
  backdrop-filter: blur(2px);
  z-index: 1060;
  display: flex;
  justify-content: flex-end;
}

/* --- Drawer Panel --- */
.exceptions-drawer-panel {
  width: 520px;
  max-width: 95vw;
  height: 100%;
  background: #ffffff;
  box-shadow: -10px 0 35px -5px rgba(15, 23, 42, 0.2);
  display: flex;
  flex-direction: column;
}

/* --- Header Elements --- */
.header-icon-bubble {
  width: 42px;
  height: 42px;
  border-radius: 12px;
  background: #fffbeb;
  border: 1px solid #fef3c7;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.btn-close-drawer {
  width: 34px;
  height: 34px;
  transition: all 0.15s ease;
  color: #64748b;
}

.btn-close-drawer:hover {
  background: #f1f5f9;
  color: #0f172a;
  transform: rotate(90deg);
}

/* --- Scope & Search Toolbar --- */
.scope-pill-group {
  border-color: #e2e8f0;
}

.btn-scope {
  font-size: 0.775rem;
  transition: all 0.15s ease;
}

.drawer-search-wrapper .search-icon {
  left: 12px;
  top: 50%;
  transform: translateY(-50%);
  font-size: 0.85rem;
}

.drawer-search-input {
  font-size: 0.825rem;
  background: white;
  border-color: #e2e8f0;
}

.drawer-search-input:focus {
  border-color: #3b82f6;
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
}

.btn-clear {
  right: 12px;
  top: 50%;
  transform: translateY(-50%);
  padding: 0;
  cursor: pointer;
}

/* --- Empty State --- */
.empty-icon-shield {
  width: 58px;
  height: 58px;
  border-radius: 16px;
  background: #f0fdf4;
  border: 1px solid #dcfce7;
  display: flex;
  align-items: center;
  justify-content: center;
}

.max-w-xs {
  max-width: 300px;
}

/* --- Exception Cards (High-End Enterprise Design) --- */
.exception-card {
  border: 1px solid #e2e8f0;
  border-radius: 14px;
  background: #ffffff;
  box-shadow: 0 1px 3px rgba(15, 23, 42, 0.04), 0 4px 12px -2px rgba(15, 23, 42, 0.03);
  transition: transform 0.2s cubic-bezier(0.16, 1, 0.3, 1), box-shadow 0.2s cubic-bezier(0.16, 1, 0.3, 1), border-color 0.2s ease;
}

.exception-card:hover {
  transform: translateY(-2px);
  border-color: #cbd5e1;
  box-shadow: 0 8px 24px -4px rgba(15, 23, 42, 0.08), 0 2px 6px -1px rgba(15, 23, 42, 0.04);
}

.staff-avatar-mini {
  width: 36px;
  height: 36px;
  border-radius: 11px;
  background: linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%);
  color: #ffffff;
  font-weight: 700;
  font-size: 0.8rem;
  letter-spacing: 0.02em;
  box-shadow: 0 2px 6px rgba(37, 99, 235, 0.25);
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.staff-card-name {
  font-size: 0.9rem;
  font-weight: 700;
  color: #0f172a;
  line-height: 1.25;
}

.badge-cargo-pill {
  font-size: 0.72rem;
  font-weight: 600;
  color: #475569;
  background: #f1f5f9;
  border: 1px solid #e2e8f0;
  border-radius: 6px;
  padding: 1px 7px;
  line-height: 1.3;
}

.badge-service-pill {
  font-size: 0.72rem;
  font-weight: 600;
  color: #0284c7;
  background: #f0f9ff;
  border: 1px solid #bae6fd;
  border-radius: 6px;
  padding: 1px 7px;
  line-height: 1.3;
}

/* Date Badge Mini-Calendario */
.date-badge-box {
  background: #ffffff;
  border: 1px solid #e2e8f0;
  border-radius: 9px;
  overflow: hidden;
  min-width: 46px;
  box-shadow: 0 1px 2px rgba(15, 23, 42, 0.04);
  flex-shrink: 0;
}

.date-month {
  background: #f8fafc;
  color: #64748b;
  font-size: 0.62rem;
  letter-spacing: 0.08em;
  font-weight: 700;
  padding: 2.5px 5px 1.5px;
  border-bottom: 1px solid #e2e8f0;
  text-transform: uppercase;
  line-height: 1;
}

.date-day {
  font-size: 1.1rem;
  font-weight: 800;
  color: #0f172a;
  padding: 3px 0 2px;
  line-height: 1;
}

/* Caja de Transición de Turnos */
.transition-comparison-box {
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  border-radius: 12px;
}

.comparison-label {
  font-size: 0.68rem;
  text-transform: uppercase;
  letter-spacing: 0.04em;
  font-weight: 600;
  line-height: 1;
}

.badge-active-mod {
  display: inline-flex;
  align-items: center;
  background: #fef3c7;
  color: #b45309;
  border: 1px solid #fde68a;
  border-radius: 999px;
  padding: 1.5px 7px;
  font-size: 0.64rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.04em;
  line-height: 1;
}

.shift-name-text {
  font-size: 0.82rem;
  font-weight: 600;
  color: #334155;
}

.transition-indicator-circle {
  width: 28px;
  height: 28px;
  border-radius: 50%;
  background: #ffffff;
  border: 1px solid #e2e8f0;
  color: #2563eb;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.8rem;
  flex-shrink: 0;
  box-shadow: 0 1px 3px rgba(15, 23, 42, 0.05);
}

.shift-pill {
  width: 30px;
  height: 30px;
  border-radius: 9px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.8rem;
  font-weight: 800;
  border: 1px solid rgba(0, 0, 0, 0.08);
  box-shadow: 0 1px 2px rgba(15, 23, 42, 0.06);
}

.audit-meta-row {
  font-size: 0.74rem;
  line-height: 1.3;
}

/* Botones de Acción de Tarjeta */
.btn-card-action {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  height: 32px;
  padding: 0 13px;
  border-radius: 999px;
  font-size: 0.78rem;
  font-weight: 600;
  cursor: pointer;
  outline: none;
  transition: all 0.2s cubic-bezier(0.16, 1, 0.3, 1);
}

.btn-card-locate {
  background: #ffffff;
  color: #334155;
  border: 1px solid #cbd5e1;
  box-shadow: 0 1px 2px rgba(15, 23, 42, 0.04);
}

.btn-card-locate:hover {
  background: #f8fafc;
  color: #0f172a;
  border-color: #94a3b8;
  box-shadow: 0 2px 4px rgba(15, 23, 42, 0.06);
}

.btn-card-restore {
  background: #fff1f2;
  color: #be123c;
  border: 1px solid #fecdd3;
  box-shadow: 0 1px 2px rgba(190, 18, 60, 0.04);
}

.btn-card-restore:hover:not(:disabled) {
  background: #ffe4e6;
  color: #9f1239;
  border-color: #fda4af;
  box-shadow: 0 2px 4px rgba(190, 18, 60, 0.08);
}

.btn-card-restore:disabled {
  opacity: 0.65;
  cursor: not-allowed;
}

.x-small {
  font-size: 0.72rem;
}

/* --- Transitions --- */
.drawer-fade-enter-active,
.drawer-fade-leave-active {
  transition: opacity 0.25s ease;
}

.drawer-fade-enter-from,
.drawer-fade-leave-to {
  opacity: 0;
}

.drawer-slide-enter-active,
.drawer-slide-leave-active {
  transition: transform 0.3s cubic-bezier(0.16, 1, 0.3, 1);
}

.drawer-slide-enter-from,
.drawer-slide-leave-to {
  transform: translateX(100%);
}
</style>
