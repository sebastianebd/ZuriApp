<template>
  <Transition name="modal-fade">
    <div
      v-if="show"
      class="staffing-modal-overlay"
      tabindex="-1"
      role="dialog"
      aria-modal="true"
      @click.self="$emit('close')"
    >
      <div class="staffing-modal-dialog">
        <div class="modal-content vanguard-modal-content staffing-modal-content border-0 shadow-2xl rounded-4">
          <!-- HEADER VANGUARDISTA CON ESPACIADO GENEROSO -->
          <div class="modal-header vanguard-modal-header executive-modal-header d-flex justify-content-between align-items-center border-bottom bg-white">
            <div class="d-flex align-items-center header-brand-cluster">
              <div class="modal-icon-box shadow-sm">
                <i class="bi bi-sliders2-vertical text-primary fs-5"></i>
              </div>
              <div class="header-text-block">
                <div class="d-flex align-items-center gap-2 mb-1 flex-wrap">
                  <h5 class="fw-bold mb-0 text-dark modal-title-custom">
                    Ajuste de Dotación y Metas
                  </h5>
                  <span v-if="serviceName" class="badge-role-tag">
                    <i class="bi bi-hospital me-1"></i>{{ serviceName }}
                  </span>
                </div>
                <p class="text-secondary small mb-0 mt-0.5">
                  Gobernanza clínica de umbrales del semáforo contextual y dotación mínima requerida.
                </p>
              </div>
            </div>
            <button
              type="button"
              class="btn-close-modal btn-close-custom shadow-none"
              aria-label="Cerrar modal"
              @click="$emit('close')"
            >
              <i class="bi bi-x-lg"></i>
            </button>
          </div>

          <!-- MODAL BODY -->
          <div class="modal-body p-4 bg-slate-subtle-50 executive-modal-body">
            <!-- 1. Umbrales de Semáforo y Alerta (Diseño Sobrio y Profesional) -->
            <div class="card border rounded-3 p-3.5 bg-white shadow-xs mb-4 section-card">
              <div class="d-flex align-items-center justify-content-between mb-3">
                <div class="d-flex align-items-center gap-2">
                  <div class="section-icon-mini text-primary">
                    <i class="bi bi-speedometer2"></i>
                  </div>
                  <h6 class="fw-bold text-dark mb-0">Umbrales de Alerta de Cobertura</h6>
                </div>
                <span class="badge bg-light text-secondary border rounded-pill px-2.5 py-0.5 smaller fw-semibold">
                  Semáforo Contextual
                </span>
              </div>

              <div class="row g-3">
                <!-- Meta Óptima (Verde) -->
                <div class="col-12 col-sm-6">
                  <div class="threshold-card p-3 rounded-3 h-100 border">
                    <div class="d-flex align-items-center justify-content-between mb-2">
                      <label class="form-label smaller fw-semibold text-dark mb-0 d-flex align-items-center gap-1.5">
                        <span class="status-indicator-dot bg-success"></span>
                        <span>Meta Óptima (Verde)</span>
                      </label>
                      <span class="badge bg-success-subtle text-success border border-success-subtle rounded-pill smaller">
                        Estado Óptimo
                      </span>
                    </div>
                    <div class="input-group input-group-lg threshold-input-group shadow-xs mb-2">
                      <input
                        v-model.number="formThresholds.verde"
                        type="number"
                        min="1"
                        max="100"
                        class="form-control text-center fw-bolder threshold-number-input"
                        placeholder="95"
                      />
                      <span class="input-group-text bg-light text-secondary fw-bold border-start-0">%</span>
                    </div>
                    <div class="form-text smaller text-secondary mb-0">
                      Porcentaje sobre el cual el servicio opera con cobertura óptima.
                    </div>
                  </div>
                </div>

                <!-- Alerta Mínima (Amarillo) -->
                <div class="col-12 col-sm-6">
                  <div class="threshold-card p-3 rounded-3 h-100 border">
                    <div class="d-flex align-items-center justify-content-between mb-2">
                      <label class="form-label smaller fw-semibold text-dark mb-0 d-flex align-items-center gap-1.5">
                        <span class="status-indicator-dot bg-warning"></span>
                        <span>Alerta Mínima (Amarillo)</span>
                      </label>
                      <span class="badge bg-amber-subtle text-amber border border-amber-subtle rounded-pill smaller">
                        Zona Preventiva
                      </span>
                    </div>
                    <div class="input-group input-group-lg threshold-input-group shadow-xs mb-2">
                      <input
                        v-model.number="formThresholds.amarillo"
                        type="number"
                        min="1"
                        max="100"
                        class="form-control text-center fw-bolder threshold-number-input"
                        placeholder="85"
                      />
                      <span class="input-group-text bg-light text-secondary fw-bold border-start-0">%</span>
                    </div>
                    <div class="form-text smaller text-secondary mb-0">
                      Bajo este porcentaje la cobertura se clasifica como déficit crítico (Rojo).
                    </div>
                  </div>
                </div>
              </div>

              <!-- Error de validación de umbrales si amarillo >= verde -->
              <div v-if="isThresholdInvalid" class="alert alert-warning py-2 px-3 mt-3 mb-0 smaller d-flex align-items-center gap-2 rounded-2">
                <i class="bi bi-exclamation-circle-fill text-warning"></i>
                <span>La Meta Óptima (Verde) debe ser estrictamente mayor a la Alerta Mínima (Amarillo) y estar entre 1% y 100%.</span>
              </div>

              <!-- Visual Range Preview Bar (Sobria, 6px) -->
              <div v-else class="threshold-preview-wrapper mt-3 pt-3 border-top">
                <div class="d-flex justify-content-between align-items-center mb-1.5 smaller fw-semibold flex-wrap gap-1">
                  <span class="text-danger d-flex align-items-center gap-1">
                    <span class="status-indicator-dot bg-danger"></span> Crítico: 0% - {{ (formThresholds.amarillo || 85) - 1 }}%
                  </span>
                  <span class="text-amber d-flex align-items-center gap-1">
                    <span class="status-indicator-dot bg-amber"></span> Alerta: {{ formThresholds.amarillo || 85 }}% - {{ (formThresholds.verde || 95) - 1 }}%
                  </span>
                  <span class="text-success d-flex align-items-center gap-1">
                    <span class="status-indicator-dot bg-success"></span> Óptimo: {{ formThresholds.verde || 95 }}% - 100%
                  </span>
                </div>
                <div class="threshold-range-bar shadow-xs">
                  <div
                    class="range-slice slice-danger"
                    :style="{ width: `${Math.max(0, Math.min(100, formThresholds.amarillo || 85))}%` }"
                    :title="`Crítico: 0% - ${(formThresholds.amarillo || 85) - 1}%`"
                  ></div>
                  <div
                    class="range-slice slice-warning"
                    :style="{ width: `${Math.max(0, Math.min(100, (formThresholds.verde || 95) - (formThresholds.amarillo || 85)))}%` }"
                    :title="`Alerta: ${formThresholds.amarillo || 85}% - ${(formThresholds.verde || 95) - 1}%`"
                  ></div>
                  <div
                    class="range-slice slice-success"
                    :style="{ width: `${Math.max(0, Math.min(100, 100 - (formThresholds.verde || 95)))}%` }"
                    :title="`Óptimo: ${formThresholds.verde || 95}% - 100%`"
                  ></div>
                </div>
              </div>
            </div>

            <!-- 2. Puestos y Dotación Mínima por Cargo (Sin Iconografía Infanto-Juvenil) -->
            <div class="card border rounded-3 p-3.5 bg-white shadow-xs section-card">
              <div class="d-flex justify-content-between align-items-center mb-3 flex-wrap gap-2">
                <div class="d-flex align-items-center gap-2">
                  <div class="section-icon-mini text-primary">
                    <i class="bi bi-person-badge"></i>
                  </div>
                  <div>
                    <h6 class="fw-bold text-dark mb-0">Puestos Mínimos Requeridos por Cargo</h6>
                    <span class="smaller text-secondary">Dotación mínima de personal clínico por cada turno</span>
                  </div>
                </div>
                <button
                  type="button"
                  class="btn btn-sm btn-primary rounded-pill px-3 py-1.5 shadow-xs d-flex align-items-center gap-1.5 fw-semibold"
                  @click="addRow"
                >
                  <i class="bi bi-plus-lg"></i>
                  <span>Agregar Cargo</span>
                </button>
              </div>

              <!-- Empty State -->
              <div v-if="staffingRows.length === 0" class="empty-staffing-box text-center py-5 rounded-3 border">
                <div class="empty-icon-circle mx-auto mb-3">
                  <i class="bi bi-person-badge fs-3 text-secondary"></i>
                </div>
                <h6 class="fw-bold text-dark mb-1">Sin cargos configurados</h6>
                <p class="smaller text-secondary mb-3" style="max-width: 380px; margin: auto;">
                  Agrega cargos clínicos para establecer la dotación requerida en turnos diurnos y nocturnos.
                </p>
                <button
                  type="button"
                  class="btn btn-sm btn-outline-primary rounded-pill px-3.5 py-1.5 fw-semibold shadow-xs"
                  @click="addRow"
                >
                  <i class="bi bi-plus-circle me-1"></i> Agregar Primer Cargo
                </button>
              </div>

              <!-- Staffing Table Container (overflow visible para permitir despliegue hacia afuera) -->
              <div v-else class="staffing-table-wrapper rounded-3 border">
                <table class="table staffing-table align-middle mb-0">
                  <thead>
                    <tr>
                      <th class="ps-3 py-2.5">Cargo / Estamento Clínico</th>
                      <th style="width: 160px;" class="text-center py-2.5">Mínimo Día</th>
                      <th style="width: 160px;" class="text-center py-2.5">Mínimo Noche</th>
                      <th style="width: 60px;" class="text-center py-2.5 pe-3">Acción</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr v-for="(row, idx) in staffingRows" :key="idx" class="staffing-row">
                      <td class="ps-3 py-2 staffing-cell-cargo">
                        <v-select
                          v-model="row.positionId"
                          :options="positionStore.positions"
                          label="name"
                          :reduce="(pos: any) => pos._id"
                          placeholder="Seleccione cargo clínico..."
                          class="custom-v-select staffing-cargo-vselect"
                          :clearable="false"
                        >
                          <template #option="{ name, position_code }">
                            <div class="d-flex align-items-center justify-content-between py-1">
                              <span class="fw-semibold text-dark">{{ name }}</span>
                              <span class="badge bg-light text-secondary border smaller ms-2">{{ position_code || 'General' }}</span>
                            </div>
                          </template>
                          <template #selected-option="{ name, position_code }">
                            <div class="d-flex align-items-center gap-1.5 text-truncate">
                              <span class="fw-semibold text-dark">{{ name }}</span>
                              <span class="badge bg-light text-secondary border smaller ms-1">{{ position_code || 'General' }}</span>
                            </div>
                          </template>
                          <template #no-options>
                            <div class="p-2 text-muted smaller text-center">Sin cargos disponibles</div>
                          </template>
                        </v-select>
                      </td>
                      <td class="py-2 text-center">
                        <div class="input-group input-group-sm staffing-input-group shadow-xs mx-auto" style="max-width: 130px;">
                          <input
                            v-model.number="row.minimo_dia"
                            type="number"
                            min="0"
                            class="form-control form-control-sm text-center fw-semibold text-dark border-end-0"
                            placeholder="0"
                          />
                          <span class="input-group-text bg-white text-secondary smaller border-start-0">turnos</span>
                        </div>
                      </td>
                      <td class="py-2 text-center">
                        <div class="input-group input-group-sm staffing-input-group shadow-xs mx-auto" style="max-width: 130px;">
                          <input
                            v-model.number="row.minimo_noche"
                            type="number"
                            min="0"
                            class="form-control form-control-sm text-center fw-semibold text-dark border-end-0"
                            placeholder="0"
                          />
                          <span class="input-group-text bg-white text-secondary smaller border-start-0">turnos</span>
                        </div>
                      </td>
                      <td class="text-center pe-3 py-2">
                        <button
                          type="button"
                          class="btn-row-delete"
                          title="Eliminar cargo"
                          @click="removeRow(idx)"
                        >
                          <i class="bi bi-trash3"></i>
                        </button>
                      </td>
                    </tr>
                  </tbody>
                </table>

                <!-- Resumen de Totales Sobrio al pie de la tabla -->
                <div class="staffing-table-footer p-3 px-3.5 bg-light border-top d-flex justify-content-between align-items-center flex-wrap gap-2 smaller">
                  <span class="text-secondary fw-medium">
                    Total requerimientos por ciclo de 24 horas:
                  </span>
                  <div class="d-flex align-items-center gap-2">
                    <span class="badge bg-white text-dark border px-2.5 py-1 rounded-pill fw-medium">
                      Día: <strong>{{ totalMinDia }}</strong>
                    </span>
                    <span class="badge bg-white text-dark border px-2.5 py-1 rounded-pill fw-medium">
                      Noche: <strong>{{ totalMinNoche }}</strong>
                    </span>
                    <span class="badge bg-dark text-white px-2.5 py-1 rounded-pill fw-semibold">
                      Total: <strong>{{ totalMinDia + totalMinNoche }}</strong> turnos
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- FOOTER VANGUARDISTA -->
          <div class="modal-footer vanguard-modal-footer executive-modal-footer border-top bg-white p-3 px-4 d-flex justify-content-between align-items-center">
            <div class="d-none d-md-flex align-items-center gap-2">
              <span class="badge bg-light text-secondary border px-3 py-1.5 rounded-pill smaller fw-medium d-flex align-items-center gap-1.5">
                <i class="bi bi-shield-check text-primary"></i>
                <span><strong>{{ validStaffingRowsCount }}</strong> cargos asignados</span>
              </span>
            </div>

            <div class="d-flex align-items-center gap-2 ms-auto">
              <button
                type="button"
                class="btn btn-light border bg-white rounded-pill px-4 py-2 small fw-semibold text-secondary shadow-sm hover-bg-light"
                @click="$emit('close')"
              >
                Cancelar
              </button>
              <button
                type="button"
                class="btn btn-primary rounded-pill px-4 py-2 small fw-semibold shadow-sm d-flex align-items-center gap-2"
                :disabled="loading || isThresholdInvalid"
                @click="handleSave"
              >
                <span v-if="loading" class="spinner-border spinner-border-sm" role="status"></span>
                <i v-else class="bi bi-check2-circle fs-6"></i>
                <span>Guardar Configuración</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  </Transition>
</template>

<script setup lang="ts">
import { ref, watch, onMounted, computed } from 'vue'
import vSelect from 'vue-select'
import 'vue-select/dist/vue-select.css'
import { usePositionStore } from '../../stores/position.store'
import type { UpdateServiceStaffingPayload } from '../../types/dashboard.types'

const props = defineProps<{
  show: boolean
  serviceId?: string
  serviceName?: string
  currentStaffing?: Array<{
    positionId: string
    positionName?: string
    minDay: number
    minNight: number
  }>
  currentThresholds?: {
    green: number
    yellow: number
  }
  loading?: boolean
}>()

const emit = defineEmits<{
  (e: 'close'): void
  (e: 'save', payload: UpdateServiceStaffingPayload): void
}>()

const positionStore = usePositionStore()

interface StaffingRow {
  positionId: string
  minimo_dia: number
  minimo_noche: number
}

const staffingRows = ref<StaffingRow[]>([])
const formThresholds = ref<{ verde: number; amarillo: number }>({
  verde: 95,
  amarillo: 85,
})

const initializeForm = () => {
  if (props.currentThresholds) {
    formThresholds.value = {
      verde: props.currentThresholds.green ?? 95,
      amarillo: props.currentThresholds.yellow ?? 85,
    }
  }

  if (props.currentStaffing && props.currentStaffing.length > 0) {
    staffingRows.value = props.currentStaffing.map((item) => ({
      positionId: item.positionId,
      minimo_dia: item.minDay,
      minimo_noche: item.minNight,
    }))
  } else {
    staffingRows.value = []
  }
}

watch(
  () => props.show,
  async (newVal) => {
    if (newVal) {
      initializeForm()
      if (positionStore.positions.length === 0) {
        await positionStore.fetchPositions()
      }
    }
  },
  { immediate: true },
)

onMounted(async () => {
  if (positionStore.positions.length === 0) {
    await positionStore.fetchPositions()
  }
})

const addRow = () => {
  staffingRows.value.push({
    positionId: '',
    minimo_dia: 0,
    minimo_noche: 0,
  })
}

const removeRow = (index: number) => {
  staffingRows.value.splice(index, 1)
}

const totalMinDia = computed(() =>
  staffingRows.value.reduce((acc, row) => acc + (Number(row.minimo_dia) || 0), 0)
)

const totalMinNoche = computed(() =>
  staffingRows.value.reduce((acc, row) => acc + (Number(row.minimo_noche) || 0), 0)
)

const validStaffingRowsCount = computed(() =>
  staffingRows.value.filter((row) => Boolean(row.positionId)).length
)

const isThresholdInvalid = computed(() => {
  const v = Number(formThresholds.value.verde)
  const a = Number(formThresholds.value.amarillo)
  return isNaN(v) || isNaN(a) || a >= v || a < 1 || v > 100
})

const handleSave = () => {
  if (isThresholdInvalid.value) return

  const payload: UpdateServiceStaffingPayload = {
    dotacion_minima: staffingRows.value
      .filter((row) => Boolean(row.positionId))
      .map((row) => ({
        positionId: row.positionId,
        minimo_dia: Number(row.minimo_dia) || 0,
        minimo_noche: Number(row.minimo_noche) || 0,
      })),
    umbrales_cobertura: {
      verde: Number(formThresholds.value.verde) || 95,
      amarillo: Number(formThresholds.value.amarillo) || 85,
    },
  }

  emit('save', payload)
}
</script>

<style scoped lang="scss">
/* Modal Overlay y Diálogo */
.staffing-modal-overlay {
  position: fixed;
  inset: 0;
  width: 100vw;
  height: 100vh;
  background: rgba(15, 23, 42, 0.65);
  backdrop-filter: blur(8px);
  z-index: 1055;
  display: flex;
  align-items: flex-start;
  justify-content: center;
  padding: 2.5rem 1.25rem;
  overflow-y: auto;
}

.staffing-modal-dialog {
  width: 100%;
  max-width: 860px;
  margin: 0 auto;
  position: relative;
  z-index: 1056;
}

.vanguard-modal-content,
.staffing-modal-content {
  background: #ffffff;
  border-radius: 1.5rem !important; /* 24px esquinas redondeadas idénticas a los otros modales */
  border: 1px solid #e2e8f0 !important;
  box-shadow: 0 25px 50px -12px rgba(15, 23, 42, 0.25) !important;
  overflow: visible !important; /* Permite que v-select flote hacia abajo libremente */
}

/* Transiciones Suaves */
.modal-fade-enter-active,
.modal-fade-leave-active {
  transition: opacity 0.22s ease;

  .staffing-modal-dialog {
    transition: transform 0.22s cubic-bezier(0.16, 1, 0.3, 1), opacity 0.22s ease;
  }
}

.modal-fade-enter-from,
.modal-fade-leave-to {
  opacity: 0;

  .staffing-modal-dialog {
    transform: scale(0.96) translateY(-8px);
    opacity: 0;
  }
}

/* Header Vanguardista con Esquinas Redondeadas Superiores */
.vanguard-modal-header,
.executive-modal-header {
  background: #ffffff;
  border-bottom: 1px solid #f1f5f9;
  border-top-left-radius: 1.5rem !important;
  border-top-right-radius: 1.5rem !important;
  padding: 1.5rem 2rem;
}

.header-brand-cluster {
  gap: 1.25rem; /* Espaciado amplio y generoso entre el ícono y el texto */
}

.modal-icon-box {
  width: 44px;
  height: 44px;
  border-radius: 12px;
  background: linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  border: 1px solid rgba(191, 219, 254, 0.6);
  box-shadow: 0 1px 2px 0 rgba(0, 0, 0, 0.05);
  flex-shrink: 0;
}

.header-text-block {
  display: flex;
  flex-direction: column;
}

.modal-title-custom {
  letter-spacing: -0.02em;
  font-size: 1.15rem;
  color: #0f172a;
}

.badge-role-tag {
  font-size: 0.72rem;
  font-weight: 700;
  color: #2563eb;
  background-color: #eff6ff;
  border: 1px solid #bfdbfe;
  padding: 2px 8px;
  border-radius: 6px;
  display: inline-flex;
  align-items: center;
}

.btn-close-modal,
.btn-close-custom {
  width: 34px;
  height: 34px;
  border-radius: 50%;
  border: 1px solid #e2e8f0;
  background: #ffffff;
  color: #64748b;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-size: 0.8rem;
  cursor: pointer;
  transition: all 0.2s cubic-bezier(0.32, 0.72, 0, 1);
  flex-shrink: 0;

  &:hover {
    background: #f1f5f9;
    color: #0f172a;
    transform: rotate(90deg);
  }
}

/* Footer Vanguardista con Esquinas Redondeadas Inferiores */
.vanguard-modal-footer,
.executive-modal-footer {
  background: #ffffff;
  border-top: 1px solid #f1f5f9;
  border-bottom-left-radius: 1.5rem !important;
  border-bottom-right-radius: 1.5rem !important;
}

/* Modal Body */
.bg-slate-subtle-50 {
  background-color: #f8fafc;
}

.executive-modal-body {
  overflow: visible !important;
  min-height: 460px;
}

.section-card {
  border-color: rgba(226, 232, 240, 0.9) !important;
  overflow: visible !important;
}

.section-icon-mini {
  width: 28px;
  height: 28px;
  border-radius: 8px;
  background: #eff6ff;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.95rem;
}

/* Tarjetas de Umbrales - Sobrias y Limpias */
.threshold-card {
  background: #ffffff;
  border-color: #e2e8f0 !important;
  transition: border-color 0.2s ease, box-shadow 0.2s ease;

  &:focus-within {
    border-color: #3b82f6 !important;
    box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
  }
}

.threshold-number-input {
  font-size: 1.35rem;
  height: 48px;
  letter-spacing: -0.02em;
  color: #0f172a;
  background: white;
  border-color: #e2e8f0;

  &:focus {
    box-shadow: none;
    border-color: #3b82f6;
  }
}

/* Barra Visual de Rangos del Semáforo (Delgada y calibrada) */
.threshold-range-bar {
  height: 7px;
  border-radius: 9999px;
  background: #e2e8f0;
  display: flex;
  overflow: hidden;
}

.range-slice {
  height: 100%;
  transition: width 0.3s ease;

  &.slice-danger {
    background: #ef4444;
  }
  &.slice-warning {
    background: #f59e0b;
  }
  &.slice-success {
    background: #10b981;
  }
}

.status-indicator-dot {
  width: 7px;
  height: 7px;
  border-radius: 50%;
  display: inline-block;
  flex-shrink: 0;
}

/* Tabla de Puestos por Cargo (Con overflow visible para desplegables flotantes) */
.empty-staffing-box {
  background: #ffffff;
  border-color: #e2e8f0 !important;
  border-style: dashed !important;
}

.empty-icon-circle {
  width: 60px;
  height: 60px;
  border-radius: 50%;
  background: #f1f5f9;
  display: flex;
  align-items: center;
  justify-content: center;
}

.staffing-table-wrapper {
  background: white;
  border-color: #e2e8f0 !important;
  overflow: visible !important;
  position: relative;
}

.staffing-table {
  width: 100%;
  border-collapse: separate;
  border-spacing: 0;
  overflow: visible !important;

  thead th {
    background: #f8fafc;
    font-size: 0.72rem;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    color: #64748b;
    border-bottom: 1px solid #e2e8f0;
  }

  tbody tr {
    transition: background-color 0.15s ease;

    &:hover {
      background-color: #fbfcfe;
    }

    &:not(:last-child) td {
      border-bottom: 1px solid #f1f5f9;
    }
  }

  td {
    overflow: visible !important;
    position: relative;
  }
}

.staffing-cell-cargo {
  min-width: 260px;
}

/* Inputs numéricos limpios y sobrios */
.staffing-input-group {
  border-radius: 8px;
  overflow: hidden;
  border: 1px solid #e2e8f0;
  transition: border-color 0.15s ease, box-shadow 0.15s ease;

  .form-control {
    border: none;
    font-size: 0.875rem;

    &:focus {
      box-shadow: none;
    }
  }

  .input-group-text {
    border: none;
    color: #94a3b8;
    font-size: 0.75rem;
    padding-left: 0;
  }

  &:focus-within {
    border-color: #3b82f6;
    box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.12);
  }
}

.btn-row-delete {
  width: 32px;
  height: 32px;
  border-radius: 8px;
  border: 1px solid transparent;
  background: transparent;
  color: #94a3b8;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-size: 0.95rem;
  transition: all 0.15s ease;

  &:hover {
    background: #fef2f2;
    border-color: #fecaca;
    color: #dc2626;
  }
}

/* Custom vue-select para asignación de cargo que flota HACIA AFUERA */
.staffing-cargo-vselect {
  position: relative;

  &.vs--open {
    z-index: 1050;
  }

  :deep(.vs__dropdown-toggle) {
    border: 1px solid #e2e8f0;
    border-radius: 8px;
    background: white;
    padding: 2px 8px;
    min-height: 36px;
    box-shadow: none;
    cursor: pointer;
    transition: border-color 0.15s ease, box-shadow 0.15s ease;

    &:focus-within {
      border-color: #3b82f6;
      box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.12);
    }
  }

  :deep(.vs__selected-options) {
    padding: 0;
    margin: 0;
  }

  :deep(.vs__selected) {
    font-size: 0.85rem;
    font-weight: 600;
    color: #0f172a;
    margin: 0;
    padding: 0;
  }

  :deep(.vs__search) {
    font-size: 0.85rem;
    margin: 0;
    padding: 0;
  }

  :deep(.vs__search::placeholder) {
    color: #94a3b8;
    font-size: 0.825rem;
  }

  :deep(.vs__actions) {
    padding: 0 2px;
  }

  :deep(.vs__open-indicator) {
    fill: #64748b;
    width: 12px;
    height: 12px;
  }

  :deep(.vs__dropdown-menu) {
    border: 1px solid #e2e8f0;
    border-radius: 12px;
    box-shadow: 0 16px 36px -4px rgba(15, 23, 42, 0.18), 0 6px 16px rgba(15, 23, 42, 0.08);
    padding: 6px;
    font-size: 0.85rem;
    max-height: 240px;
    overflow-y: auto;
    z-index: 1090 !important;
    top: calc(100% + 4px) !important;
    min-width: 100%;
    width: max-content;
    max-width: 440px;
    background: #ffffff !important;
  }

  :deep(.vs__dropdown-option) {
    border-radius: 8px;
    padding: 7px 12px;
    margin-bottom: 2px;
    color: #334155;
    font-weight: 500;
    transition: all 0.15s ease;
  }

  :deep(.vs__dropdown-option--highlight) {
    background: #2563eb;
    color: white;

    .badge {
      background: rgba(255, 255, 255, 0.25) !important;
      color: white !important;
      border-color: rgba(255, 255, 255, 0.3) !important;
    }
  }
}

/* Colores Clínicos Refinados */
.bg-primary-subtle {
  background-color: #eff6ff !important;
}
.text-primary {
  color: #2563eb !important;
}

.bg-amber-subtle {
  background-color: #fffbeb !important;
}
.text-amber {
  color: #d97706 !important;
}
.border-amber-subtle {
  border-color: #fde68a !important;
}

.bg-success-subtle {
  background-color: #f0fdf4 !important;
}
.text-success {
  color: #166534 !important;
}
.border-success-subtle {
  border-color: #bbf7d0 !important;
}

.shadow-xs {
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.04);
}

.smaller {
  font-size: 0.75rem;
}
</style>
