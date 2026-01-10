<template>
  <Transition name="fade">
    <div
      class="modal fade show d-block"
      v-if="visible"
      tabindex="-1"
      role="dialog"
      style="background-color: rgba(15, 23, 42, 0.6); backdrop-filter: blur(4px)"
    >
      <div class="modal-dialog modal-lg modal-dialog-centered" role="document">
        <div class="modal-content shadow-2xl border-0 rounded-4">
          <!-- HEADER -->
          <div class="modal-header border-0 bg-white p-4 pb-3">
            <div>
              <h5 class="modal-title fw-bold text-dark">
                <i class="bi bi-plus-circle-fill text-primary me-2"></i>Nuevo Reemplazo
              </h5>
              <p class="text-secondary small mb-0 mt-1">
                Configure los detalles de la transacción y el período.
              </p>
            </div>
            <button
              type="button"
              class="btn-close"
              @click="$emit('cerrar')"
              aria-label="Close"
            ></button>
          </div>

          <!-- BODY -->
          <div class="modal-body p-4 bg-light bg-opacity-50">
            <!-- ALERTAS DE VALIDACIÓN -->
            <div
              v-if="validationError"
              class="alert alert-danger border-0 shadow-sm rounded-3 d-flex align-items-center mb-4 animate-shake"
            >
              <i class="bi bi-exclamation-triangle-fill fs-5 me-3"></i>
              <div>
                <div class="fw-bold">Conflicto de Usuarios</div>
                <div class="small">{{ validationError }}</div>
              </div>
            </div>

            <!-- SECCIÓN TRANSACCIÓN (Saliente -> Entrante) -->
            <div class="transaction-container bg-white rounded-4 shadow-sm p-4 mb-4 border">
              <div class="row align-items-center g-0">
                <!-- SALIENTE CARD -->
                <div class="col-md-5">
                  <div
                    class="user-card outgoing p-3 rounded-3 border border-danger border-opacity-25 bg-danger bg-opacity-10 position-relative"
                  >
                    <div
                      class="badge bg-danger text-white position-absolute top-0 start-0 m-2 x-small shadow-sm"
                    >
                      SALIENTE
                    </div>

                    <div class="text-center py-2" v-if="!registroLocal.rut_saliente">
                      <div
                        class="avatar-empty mx-auto mb-2 text-danger bg-white border border-danger border-opacity-25"
                      >
                        <i class="bi bi-person"></i>
                      </div>
                      <p class="text-muted small mb-2">No seleccionado</p>
                      <button
                        class="btn btn-sm btn-light border text-danger fw-bold shadow-xs"
                        @click="$emit('buscar-usuario', 1)"
                      >
                        <i class="bi bi-search me-1"></i> Buscar
                      </button>
                    </div>

                    <div v-else class="d-flex align-items-center">
                      <div class="avatar-filled bg-gradient-danger text-white shadow-sm me-3">
                        {{
                          getInitials(
                            registroLocal.nombre_saliente + ' ' + registroLocal.apellido_saliente
                          )
                        }}
                      </div>
                      <div class="flex-grow-1 overflow-hidden">
                        <div class="fw-bold text-dark text-truncate">
                          {{ registroLocal.nombre_saliente }} {{ registroLocal.apellido_saliente }}
                        </div>
                        <div class="text-secondary x-small font-monospace">
                          {{ registroLocal.rut_saliente }}
                        </div>
                      </div>
                      <button
                        class="btn btn-icon btn-light text-secondary ms-2"
                        @click="$emit('buscar-usuario', 1)"
                        title="Cambiar"
                      >
                        <i class="bi bi-arrow-repeat"></i>
                      </button>
                    </div>
                  </div>
                </div>

                <!-- ARROW CONNECTOR -->
                <div class="col-md-2 text-center py-3 py-md-0">
                  <div
                    class="connector-icon bg-white text-secondary shadow-sm rounded-circle d-inline-flex align-items-center justify-content-center border"
                  >
                    <i class="bi bi-arrow-right fs-4 d-none d-md-block"></i>
                    <i class="bi bi-arrow-down fs-4 d-md-none"></i>
                  </div>
                </div>

                <!-- ENTRANTE CARD -->
                <div class="col-md-5">
                  <div
                    class="user-card incoming p-3 rounded-3 border border-success border-opacity-25 bg-success bg-opacity-10 position-relative"
                  >
                    <div
                      class="badge bg-success text-white position-absolute top-0 start-0 m-2 x-small shadow-sm"
                    >
                      ENTRANTE
                    </div>

                    <div class="text-center py-2" v-if="!registroLocal.rut_entrante">
                      <div
                        class="avatar-empty mx-auto mb-2 text-success bg-white border border-success border-opacity-25"
                      >
                        <i class="bi bi-person-plus"></i>
                      </div>
                      <p class="text-muted small mb-2">No seleccionado</p>
                      <button
                        class="btn btn-sm btn-light border text-success fw-bold shadow-xs"
                        @click="$emit('buscar-usuario', 2)"
                      >
                        <i class="bi bi-search me-1"></i> Buscar
                      </button>
                    </div>

                    <div v-else class="d-flex align-items-center">
                      <div class="avatar-filled bg-gradient-success text-white shadow-sm me-3">
                        {{
                          getInitials(
                            registroLocal.nombre_entrante + ' ' + registroLocal.apellido_entrante
                          )
                        }}
                      </div>
                      <div class="flex-grow-1 overflow-hidden">
                        <div class="fw-bold text-dark text-truncate">
                          {{ registroLocal.nombre_entrante }} {{ registroLocal.apellido_entrante }}
                        </div>
                        <div class="text-secondary x-small font-monospace">
                          {{ registroLocal.rut_entrante }}
                        </div>
                      </div>
                      <button
                        class="btn btn-icon btn-light text-secondary ms-2"
                        @click="$emit('buscar-usuario', 2)"
                        title="Cambiar"
                      >
                        <i class="bi bi-arrow-repeat"></i>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <!-- SECCIÓN CONTEXTO -->
            <div class="context-container bg-white rounded-4 shadow-sm p-4 border">
              <h6 class="text-uppercase text-secondary fw-bold x-small mb-3 tracking-wider">
                Detalles del Período
              </h6>

              <div class="row g-3">
                <!-- SERVICIO -->
                <div class="col-md-6">
                  <label class="form-label small fw-semibold text-secondary"
                    >Servicio Clínico</label
                  >
                  <v-select
                    id="servicio"
                    v-model="registroLocal.servicio"
                    :options="listaDeServicios"
                    :clearable="false"
                    :searchable="true"
                    placeholder="Seleccione servicio..."
                    class="custom-v-select"
                  />
                </div>

                <!-- TIPO TURNO -->
                <div class="col-md-6">
                  <label class="form-label small fw-semibold text-secondary">Tipo de Turno</label>
                  <v-select
                    id="tipo_turno"
                    v-model="registroLocal.tipo_turno"
                    :options="listaDeTurnos"
                    :clearable="false"
                    :searchable="true"
                    placeholder="Tipo de turno..."
                    class="custom-v-select"
                  />
                </div>

                <!-- FECHAS -->
                <div class="col-md-6">
                  <label class="form-label small fw-semibold text-secondary">Inicio</label>
                  <DatePicker
                    ref="dpInicio"
                    v-model="fechaInicioComputed"
                    :disabled-dates="isDisabled"
                    :min-date="today"
                    :masks="{ input: 'DD/MM/YYYY' }"
                    :popover="popoverConfig"
                    :attributes="dateAttributes"
                    is-required
                    color="blue"
                  >
                    <template #default="{ inputValue, inputEvents }">
                      <div class="input-group">
                        <span class="input-group-text bg-white border-end-0 text-muted"
                          ><i class="bi bi-calendar3"></i
                        ></span>
                        <input
                          class="form-control bg-white border-start-0 ps-0"
                          :value="inputValue"
                          v-on="inputEvents"
                          @click="handleInicioClick"
                          placeholder="Seleccione fecha inicio"
                          readonly
                        />
                      </div>
                    </template>
                  </DatePicker>
                </div>

                <div class="col-md-6">
                  <label class="form-label small fw-semibold text-secondary">Término</label>
                  <DatePicker
                    ref="dpTermino"
                    v-model="fechaTerminoComputed"
                    :disabled-dates="isDisabled"
                    :min-date="fechaInicioComputed || today"
                    :masks="{ input: 'DD/MM/YYYY' }"
                    :popover="popoverConfig"
                    :attributes="dateAttributes"
                    is-required
                    color="blue"
                  >
                    <template #default="{ inputValue, inputEvents }">
                      <div class="input-group">
                        <span class="input-group-text bg-white border-end-0 text-muted"
                          ><i class="bi bi-calendar3"></i
                        ></span>
                        <input
                          class="form-control bg-white border-start-0 ps-0"
                          :value="inputValue"
                          v-on="inputEvents"
                          @click="handleTerminoClick"
                          placeholder="Seleccione fecha término"
                          readonly
                        />
                      </div>
                    </template>
                  </DatePicker>
                </div>
              </div>
            </div>
          </div>

          <!-- FOOTER -->
          <div class="modal-footer border-top bg-light p-3">
            <button
              type="button"
              class="btn btn-light border fw-bold text-secondary px-4 me-2"
              @click="$emit('cerrar')"
            >
              Cancelar
            </button>
            <button
              type="button"
              @click="abrirConfirmacion"
              class="btn btn-primary fw-bold px-4 shadow-sm"
              :disabled="!!validationError || !isFormComplete"
            >
              <i class="bi bi-check-lg me-2"></i>Crear Reemplazo
            </button>
          </div>

          <!-- Modal de confirmación -->
          <ConfirmationModal
            :visible="showConfirmacion"
            mensaje="¿Confirmas la creación de este reemplazo?"
            @confirmar="confirmarGuardar"
            @cancelar="cancelarConfirmacion"
          />
        </div>
      </div>
    </div>
  </Transition>
</template>

<script setup lang="ts">
import { ref, watch, reactive, computed } from 'vue'
import type { RegisterDataReemplazo } from '@/types/models'
import ConfirmationModal from '../common/ConfirmationModal.vue'
import { DatePicker } from 'v-calendar'
import 'v-calendar/style.css'
import { useDatePicker } from '@/composables/useDatePicker'

const props = defineProps<{
  visible: boolean
  listaDeTurnos: string[]
  listaDeServicios: string[]
  registro: Partial<RegisterDataReemplazo>
  fechasBloqueadas: string[]
}>()

const emit = defineEmits<{
  (e: 'cerrar'): void
  (e: 'guardar', registro: RegisterDataReemplazo): void
  (e: 'buscar-usuario', grupo: 1 | 2): void
}>()

const registroLocal = reactive({ ...props.registro })
const showConfirmacion = ref(false)

// --- Validation Logic ---
const validationError = computed(() => {
  // 1. Validar conflicto de usuarios
  if (registroLocal.rut_saliente && registroLocal.rut_entrante) {
    if (registroLocal.rut_saliente === registroLocal.rut_entrante) {
      return 'El funcionario saliente y entrante no pueden ser la misma persona.'
    }
  }

  // 2. Validar Fechas
  if (registroLocal.fecha_inicio) {
    const start = new Date(registroLocal.fecha_inicio + 'T00:00:00')
    const now = new Date()
    now.setHours(0, 0, 0, 0)

    if (start < now) {
      return 'La fecha de inicio no puede ser anterior a hoy.'
    }

    if (registroLocal.fecha_termino) {
      const end = new Date(registroLocal.fecha_termino + 'T00:00:00')
      if (end < start) {
        return 'La fecha de término no puede ser anterior a la fecha de inicio.'
      }
    }
  }
  return ''
})

const isFormComplete = computed(() => {
  return (
    registroLocal.rut_saliente &&
    registroLocal.rut_entrante &&
    registroLocal.tipo_turno &&
    registroLocal.servicio &&
    registroLocal.fecha_inicio &&
    registroLocal.fecha_termino
  )
})

// --- Watchers ---
watch(
  () => props.registro,
  (nuevo) => {
    Object.assign(registroLocal, nuevo)
  },
  { deep: true }
)

watch(
  () => props.visible,
  (nuevoValor) => {
    if (nuevoValor) {
      // Reset logic if needed
      if (!registroLocal.fecha_inicio) registroLocal.fecha_inicio = todayString()
      if (!registroLocal.fecha_termino) registroLocal.fecha_termino = todayString()
    }
  }
)

// Sync Termino with Inicio
watch(
  () => registroLocal.fecha_inicio,
  (newVal) => {
    if (newVal) {
      registroLocal.fecha_termino = newVal
    }
  }
)

// --- Date Logic ---
const dpInicio = ref<any>(null)
const dpTermino = ref<any>(null)
const { popoverConfig, isDisabled, dateAttributes } = useDatePicker(props)
const today = new Date()
today.setHours(0, 0, 0, 0)

function todayString() {
  const d = new Date()
  const yyyy = d.getFullYear()
  const mm = String(d.getMonth() + 1).padStart(2, '0')
  const dd = String(d.getDate()).padStart(2, '0')
  return `${yyyy}-${mm}-${dd}`
}

function handleInicioClick() {
  if (dpTermino.value) dpTermino.value.hidePopover()
}

function handleTerminoClick() {
  if (dpInicio.value) dpInicio.value.hidePopover()
}

const fechaInicioComputed = computed({
  get: () => {
    if (!registroLocal.fecha_inicio) return null
    const [year, month, day] = registroLocal.fecha_inicio.split('-').map(Number)
    return new Date(year, month - 1, day)
  },
  set: (val: Date | string | null) => {
    if (!val) {
      registroLocal.fecha_inicio = undefined
      return
    }
    if (val instanceof Date && !isNaN(val.getTime())) {
      const year = val.getFullYear()
      const month = String(val.getMonth() + 1).padStart(2, '0')
      const day = String(val.getDate()).padStart(2, '0')
      registroLocal.fecha_inicio = `${year}-${month}-${day}`
    } else if (typeof val === 'string') {
      registroLocal.fecha_inicio = val.split('T')[0]
    }
  }
})

const fechaTerminoComputed = computed({
  get: () => {
    if (!registroLocal.fecha_termino) return null
    const [year, month, day] = registroLocal.fecha_termino.split('-').map(Number)
    return new Date(year, month - 1, day)
  },
  set: (val: Date | string | null) => {
    if (!val) {
      registroLocal.fecha_termino = undefined
      return
    }
    if (val instanceof Date && !isNaN(val.getTime())) {
      const year = val.getFullYear()
      const month = String(val.getMonth() + 1).padStart(2, '0')
      const day = String(val.getDate()).padStart(2, '0')
      registroLocal.fecha_termino = `${year}-${month}-${day}`
    } else if (typeof val === 'string') {
      registroLocal.fecha_termino = val.split('T')[0]
    }
  }
})

// --- Helpers ---
function getInitials(name: string) {
  if (!name) return '?'
  return name
    .split(' ')
    .filter((n) => n.length > 0)
    .map((n) => n[0])
    .slice(0, 2)
    .join('')
    .toUpperCase()
}

function abrirConfirmacion() {
  if (validationError.value) return
  showConfirmacion.value = true
}

function confirmarGuardar() {
  showConfirmacion.value = false
  emit('guardar', registroLocal as RegisterDataReemplazo)
}

function cancelarConfirmacion() {
  showConfirmacion.value = false
}
</script>

<style scoped>
.modal-content {
  border: 1px solid rgba(255, 255, 255, 0.1);
}

.shadow-2xl {
  box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
}

.animate-shake {
  animation: shake 0.5s cubic-bezier(0.36, 0.07, 0.19, 0.97) both;
}

@keyframes shake {
  10%,
  90% {
    transform: translate3d(-1px, 0, 0);
  }
  20%,
  80% {
    transform: translate3d(2px, 0, 0);
  }
  30%,
  50%,
  70% {
    transform: translate3d(-4px, 0, 0);
  }
  40%,
  60% {
    transform: translate3d(4px, 0, 0);
  }
}

/* User Cards */
.user-card {
  transition: all 0.2s ease;
  height: 100%;
}
.user-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
}

.avatar-empty {
  width: 48px;
  height: 48px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.5rem;
}

.avatar-filled {
  width: 42px;
  height: 42px;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 700;
  font-size: 0.9rem;
  flex-shrink: 0;
}

.bg-gradient-danger {
  background: linear-gradient(135deg, #fecaca 0%, #ef4444 100%);
}
.bg-gradient-success {
  background: linear-gradient(135deg, #bbf7d0 0%, #22c55e 100%);
}

.btn-icon {
  width: 32px;
  height: 32px;
  padding: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 8px;
}

.connector-icon {
  width: 40px;
  height: 40px;
}

.form-control:focus {
  box-shadow: none;
  background-color: #f8fafc;
}

.custom-v-select :deep(.vs__dropdown-toggle) {
  border: 1px solid #e2e8f0;
  border-radius: 0.375rem;
  padding: 4px;
  background: white;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
}

.custom-v-select :deep(.vs__selected) {
  font-size: 0.875rem;
  color: #1e293b;
  font-weight: 500;
}

.custom-v-select :deep(.vs__search::placeholder) {
  color: #94a3b8;
}

.custom-v-select :deep(.vs__actions svg) {
  fill: #64748b;
  transform: scale(0.8);
}

.custom-v-select :deep(.vs__dropdown-menu) {
  border: none;
  border-radius: 0.75rem;
  box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1);
  padding: 8px;
  font-size: 0.875rem;
  border: 1px solid #e2e8f0;
  max-height: 210px; /* Limit to approx 5 items */
  overflow-y: auto;
}

.custom-v-select :deep(.vs__dropdown-option) {
  border-radius: 0.375rem;
  padding: 8px 12px;
  margin-bottom: 2px;
  color: #475569;
}

.custom-v-select :deep(.vs__dropdown-option--highlight) {
  background: #3b82f6;
  color: white;
}

/* Typography */
.x-small {
  font-size: 0.7rem;
}
.shadow-xs {
  box-shadow: 0 1px 2px 0 rgba(0, 0, 0, 0.05);
}
.tracking-wider {
  letter-spacing: 0.05em;
}

/* Transitions */
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.2s ease;
}
.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
