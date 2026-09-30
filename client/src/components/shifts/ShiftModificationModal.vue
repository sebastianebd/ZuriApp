<template>
  <Teleport to="body">
    <Transition name="fade">
      <div
        v-if="visible"
        class="modal fade show d-block"
        tabindex="-1"
        role="dialog"
        aria-modal="true"
        style="background-color: rgba(15, 23, 42, 0.65); backdrop-filter: blur(8px); z-index: 1080"
      >
        <div class="modal-dialog modal-dialog-centered modal-custom-width" role="document">
          <div class="modal-content vanguard-modal-content border-0 shadow-2xl rounded-4 overflow-hidden">
            <!-- HEADER VANGUARDISTA -->
            <div class="modal-header vanguard-modal-header p-3.5 px-4 border-bottom d-flex align-items-center justify-content-between">
              <div class="d-flex align-items-center gap-3">
                <div class="modal-icon-box shadow-xs">
                  <i class="bi bi-pencil-square text-primary fs-5"></i>
                </div>
                <div>
                  <div class="d-flex align-items-center gap-2">
                    <h5 class="modal-title fw-bold text-dark mb-0 modal-title-custom">Modificar Turno</h5>
                    <span class="badge-role-tag">Excepción Diaria</span>
                  </div>
                  <p class="text-secondary small mb-0 mt-0.5">
                    Ajuste puntual sobre la programación para la jornada seleccionada.
                  </p>
                </div>
              </div>
              <button
                type="button"
                class="btn-close-modal"
                @click="emit('cerrar')"
                aria-label="Cerrar modal"
              >
                <i class="bi bi-x-lg"></i>
              </button>
            </div>

            <!-- BODY CON ACABADO VANGUARDISTA -->
            <div class="modal-body p-4 bg-surface">
              <!-- Tarjeta de Contexto de la Jornada -->
              <div class="vanguard-context-card p-3 rounded-3 mb-3 border">
                <div class="d-flex align-items-center justify-content-between mb-2">
                  <div class="d-flex align-items-center gap-2 text-primary fw-semibold small">
                    <i class="bi bi-calendar-event"></i>
                    <span>{{ formattedDate }}</span>
                  </div>
                  <span class="badge bg-white text-secondary border px-2 py-1 x-small fw-semibold">
                    {{ assignmentName }}
                  </span>
                </div>

                <div class="current-shift-status-row d-flex align-items-center justify-content-between pt-2 border-top">
                  <span class="text-muted small">Turno programado actual:</span>
                  <div class="d-flex align-items-center">
                    <span
                      class="shift-pill-mini shadow-xs me-2"
                      :style="{
                        backgroundColor: currentShiftColor,
                        color: getContrastColor(currentShiftColor)
                      }"
                    >
                      {{ currentShift || '—' }}
                    </span>
                    <span class="text-dark small fw-bold">
                      {{ currentShiftLabel }}
                    </span>
                  </div>
                </div>
              </div>

              <!-- Selector de Opciones de Turno del Patrón -->
              <div class="vanguard-section-card p-3 rounded-3 mb-3 border bg-white">
                <div class="d-flex align-items-center justify-content-between mb-3.5 pb-2.5 border-bottom">
                  <div class="d-flex align-items-center gap-2">
                    <span class="section-indicator bg-primary"></span>
                    <span class="fw-bold text-dark small">Seleccionar Nuevo Turno</span>
                  </div>
                  <span class="text-muted x-small">Permitidos para este tipo de turno</span>
                </div>

                <!-- Lista de Opciones Permitidas -->
                <div class="shift-options-grid d-flex flex-column gap-2.5 pt-1">
                  <button
                    v-for="option in shiftOptions"
                    :key="option.value"
                    type="button"
                    class="shift-option-card text-start d-flex align-items-center justify-content-between p-2.5 px-3 rounded-3"
                    :class="{ 'shift-option-active': selectedShift === option.value }"
                    @click="selectedShift = option.value"
                    :data-test="`shift-opt-${option.value}`"
                  >
                    <div class="d-flex align-items-center gap-3">
                      <!-- Chip Oficial a la Izquierda -->
                      <span
                        class="shift-pill shadow-xs"
                        :style="{
                          backgroundColor: option.color,
                          color: getContrastColor(option.color)
                        }"
                      >
                        {{ option.value }}
                      </span>
                      <span class="option-label text-dark fw-bold">{{ option.label }}</span>
                    </div>

                    <!-- Indicador de Selección Tipo Radio a la Derecha -->
                    <div class="d-flex align-items-center gap-2">
                      <span v-if="option.isBase" class="badge-base-pill d-none d-sm-inline-block">
                        Base
                      </span>
                      <div
                        class="selection-indicator-circle shadow-xs"
                        :class="{ 'selection-indicator-active': selectedShift === option.value }"
                      >
                        <i v-if="selectedShift === option.value" class="bi bi-check-lg"></i>
                      </div>
                    </div>
                  </button>
                </div>

                <!-- Botón Restaurar Patrón -->
                <button
                  v-if="hasException"
                  type="button"
                  class="btn btn-restore-pill w-100 mt-3 d-flex align-items-center justify-content-center gap-2"
                  @click="handleRestore"
                  data-test="btn-restore-shift"
                >
                  <i class="bi bi-arrow-counterclockwise"></i>
                  <span>Restaurar Patrón Original de Planta</span>
                </button>
              </div>

              <!-- Acciones de Administración de Asignación -->
              <div class="pt-2">
                <div v-if="!showDeleteConfirm" class="text-center">
                  <button
                    type="button"
                    class="btn btn-link text-danger text-decoration-none x-small fw-semibold d-inline-flex align-items-center gap-1.5 opacity-75 hover-opacity-100"
                    @click="showDeleteConfirm = true"
                  >
                    <i class="bi bi-trash3"></i>
                    <span>Eliminar Asignación Base Completa</span>
                  </button>
                </div>

                <!-- Confirmación de Eliminación -->
                <div v-else class="vanguard-danger-card p-3 rounded-3 border border-danger-subtle bg-danger-subtle mt-2">
                  <div class="d-flex align-items-center gap-2 text-danger small fw-bold mb-2">
                    <i class="bi bi-exclamation-triangle-fill"></i>
                    <span>¿Eliminar esta asignación base completa?</span>
                  </div>
                  <p class="x-small text-danger-emphasis mb-3">
                    Se eliminará toda la programación del funcionario para este ciclo operativo.
                  </p>
                  <div class="d-flex gap-2">
                    <button
                      type="button"
                      class="btn btn-sm btn-light border w-50 fw-bold shadow-xs"
                      @click="showDeleteConfirm = false"
                    >
                      Cancelar
                    </button>
                    <button
                      type="button"
                      class="btn btn-sm btn-danger w-50 fw-bold shadow-xs"
                      @click="emit('delete-assignment')"
                    >
                      Confirmar
                    </button>
                  </div>
                </div>
              </div>
            </div>

            <!-- FOOTER VANGUARDISTA -->
            <div class="modal-footer vanguard-modal-footer p-3 px-4 bg-white d-flex align-items-center justify-content-end gap-2.5">
              <button
                type="button"
                class="btn-secondary-pill"
                @click="emit('cerrar')"
              >
                Cancelar
              </button>
              <button
                type="button"
                class="btn-primary-pill d-flex align-items-center gap-2"
                @click="handleSave"
                :disabled="!selectedShift || loading"
                data-test="btn-save-shift"
              >
                <span v-if="loading" class="spinner-border spinner-border-sm me-1" role="status"></span>
                <span v-else class="btn-icon-wrap primary shadow-xs">
                  <i class="bi bi-check-lg"></i>
                </span>
                <span>Guardar Cambio</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { useTurnSiglaStore } from '@/stores/turn-sigla.store'

const turnSiglaStore = useTurnSiglaStore()

const props = defineProps<{
  visible: boolean
  assignmentId: string
  assignmentName: string
  date: Date
  currentShift: string | null
  baseSigla?: string
  availableSiglas?: string[]
  hasException: boolean
  loading?: boolean
}>()

const emit = defineEmits<{
  (e: 'cerrar'): void
  (e: 'save', data: { override_type: string }): void
  (e: 'restore'): void
  (e: 'delete-assignment'): void
}>()

const showDeleteConfirm = ref(false)
const selectedShift = ref<string | null>(null)

// Helper para calcular contraste de texto
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

// Filtro estricto: Sólo siglas pertenecientes al tipo de turno asignado
const shiftOptions = computed(() => {
  let list = turnSiglaStore.siglas.filter((s) => s.activo)

  if (props.availableSiglas && props.availableSiglas.length > 0) {
    const allowed = new Set(props.availableSiglas.map((s) => s.toUpperCase()))
    list = list.filter((s) => allowed.has(s.sigla.toUpperCase()))
  }

  return list.map((s) => ({
    value: s.sigla,
    label: s.nombre,
    color: s.color || '#6c757d',
    isBase: s.sigla === props.baseSigla
  }))
})

const currentShiftColor = computed(() => {
  if (!props.currentShift) return '#94a3b8'
  const match = turnSiglaStore.siglas.find((s) => s.sigla.toUpperCase() === props.currentShift?.toUpperCase())
  return match?.color || '#3b82f6'
})

const currentShiftLabel = computed(() => {
  if (!props.currentShift) return 'Sin turno'
  const option = turnSiglaStore.siglas.find((s) => s.sigla.toUpperCase() === props.currentShift?.toUpperCase())
  return option ? option.nombre : props.currentShift
})

const formattedDate = computed(() => {
  const str = new Intl.DateTimeFormat('es-ES', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  }).format(props.date)
  return str.charAt(0).toUpperCase() + str.slice(1)
})

watch(
  () => props.visible,
  (newVal) => {
    if (newVal) {
      selectedShift.value = null
      showDeleteConfirm.value = false
    }
  }
)

function handleSave() {
  if (selectedShift.value) {
    emit('save', { override_type: selectedShift.value })
  }
}

function handleRestore() {
  emit('restore')
}
</script>

<style scoped>
/* Transiciones */
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.25s cubic-bezier(0.32, 0.72, 0, 1);
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

/* Modal Frame */
.modal-custom-width {
  max-width: 440px;
}

.vanguard-modal-content {
  background: white;
  border: 1px solid #e2e8f0 !important;
  box-shadow: 0 25px 50px -12px rgba(15, 23, 42, 0.25) !important;
}

.bg-surface {
  background-color: #f8fafc;
}

/* Header */
.vanguard-modal-header {
  background: white;
  border-bottom: 1px solid #f1f5f9;
}

.modal-icon-box {
  width: 42px;
  height: 42px;
  border-radius: 12px;
  background: linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  border: 1px solid rgba(191, 219, 254, 0.6);
  flex-shrink: 0;
}

.modal-title-custom {
  letter-spacing: -0.02em;
  font-size: 1.1rem;
}

.badge-role-tag {
  font-size: 0.7rem;
  font-weight: 700;
  color: #2563eb;
  background-color: #eff6ff;
  border: 1px solid #bfdbfe;
  padding: 2px 7px;
  border-radius: 6px;
}

.btn-close-modal {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  border: 1px solid #e2e8f0;
  background: white;
  color: #64748b;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.85rem;
  cursor: pointer;
  transition: all 0.2s ease;
}

.btn-close-modal:hover {
  background: #f1f5f9;
  color: #0f172a;
  border-color: #cbd5e1;
}

/* Card de Contexto */
.vanguard-context-card {
  background: white;
  border-color: #e2e8f0 !important;
  box-shadow: 0 1px 3px rgba(15, 23, 42, 0.03);
}

.shift-pill-mini {
  width: 22px;
  height: 22px;
  border-radius: 6px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-size: 0.76rem;
  font-weight: 800;
  border: 1px solid rgba(0, 0, 0, 0.08);
}

.shift-pill-mini {
  width: 26px;
  height: 26px;
  border-radius: 7px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-size: 0.76rem;
  font-weight: 800;
  border: 1px solid rgba(0, 0, 0, 0.08);
}

/* Section Card */
.vanguard-section-card {
  border-color: #e2e8f0 !important;
  box-shadow: 0 1px 3px rgba(15, 23, 42, 0.03);
}

.section-indicator {
  width: 3px;
  height: 14px;
  border-radius: 2px;
  display: inline-block;
}

/* Shift Option Cards */
.shift-option-card {
  background: white;
  border: 1.5px solid #e2e8f0;
  cursor: pointer;
  outline: none;
  transition: all 0.2s cubic-bezier(0.16, 1, 0.3, 1);
}

.shift-option-card:hover {
  background: #f8fafc;
  border-color: #cbd5e1;
  transform: translateY(-1px);
}

.shift-option-active {
  background: #eff6ff !important;
  border-color: #2563eb !important;
  box-shadow: 0 0 0 1px #2563eb, 0 4px 12px rgba(37, 99, 235, 0.12) !important;
}

.option-label {
  font-size: 0.88rem;
  line-height: 1.25;
}

.badge-base-pill {
  font-size: 0.65rem;
  font-weight: 700;
  color: #475569;
  background-color: #f1f5f9;
  border: 1px solid #e2e8f0;
  padding: 2px 7px;
  border-radius: 6px;
  line-height: 1;
}

.selection-indicator-circle {
  width: 22px;
  height: 22px;
  border-radius: 50%;
  border: 1.5px solid #cbd5e1;
  background: white;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.78rem;
  transition: all 0.2s cubic-bezier(0.16, 1, 0.3, 1);
  flex-shrink: 0;
}

.selection-indicator-active {
  border-color: #2563eb !important;
  background: #2563eb !important;
  color: white !important;
  box-shadow: 0 2px 5px rgba(37, 99, 235, 0.35);
}

.shift-pill {
  width: 32px;
  height: 32px;
  border-radius: 9px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.82rem;
  font-weight: 800;
  border: 1px solid rgba(0, 0, 0, 0.08);
  flex-shrink: 0;
}

/* Restore Button */
.btn-restore-pill {
  background: #fffbeb;
  color: #b45309;
  border: 1px solid #fde68a;
  border-radius: 10px;
  padding: 0.5rem 1rem;
  font-size: 0.78rem;
  font-weight: 600;
  transition: all 0.2s ease;
}

.btn-restore-pill:hover {
  background: #fef3c7;
  border-color: #fcd34d;
  color: #92400e;
  transform: translateY(-1px);
}

/* Footer Buttons */
.vanguard-modal-footer {
  border-top: 1px solid #f1f5f9;
}

.btn-secondary-pill {
  background: white;
  color: #334155;
  border: 1px solid #cbd5e1;
  border-radius: 9999px;
  padding: 0.45rem 1.25rem;
  font-weight: 600;
  font-size: 0.82rem;
  box-shadow: 0 1px 3px rgba(15, 23, 42, 0.04);
  transition: all 0.2s cubic-bezier(0.32, 0.72, 0, 1);
}

.btn-secondary-pill:hover {
  background: #f8fafc;
  border-color: #94a3b8;
  color: #0f172a;
  transform: translateY(-1px);
}

.btn-primary-pill {
  background: linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%);
  color: white;
  border: 1px solid rgba(255, 255, 255, 0.15);
  border-radius: 9999px;
  padding: 0.45rem 1.25rem 0.45rem 0.65rem;
  font-weight: 600;
  font-size: 0.82rem;
  box-shadow: 0 4px 12px rgba(37, 99, 235, 0.25);
  transition: all 0.2s cubic-bezier(0.32, 0.72, 0, 1);
}

.btn-primary-pill:hover:not(:disabled) {
  background: linear-gradient(135deg, #1d4ed8 0%, #1e40af 100%);
  transform: translateY(-1px);
  box-shadow: 0 6px 16px rgba(37, 99, 235, 0.35);
  color: white;
}

.btn-primary-pill:disabled {
  opacity: 0.6;
  cursor: not-allowed;
  box-shadow: none;
}

.btn-icon-wrap {
  width: 24px;
  height: 24px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.82rem;
}

.btn-icon-wrap.primary {
  background: rgba(255, 255, 255, 0.2);
  color: white;
}

.x-small {
  font-size: 0.7rem;
}

.shadow-xs {
  box-shadow: 0 1px 2px 0 rgba(0, 0, 0, 0.05);
}
</style>
