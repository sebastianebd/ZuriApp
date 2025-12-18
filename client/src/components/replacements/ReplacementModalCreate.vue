<template>
  <Transition name="fade">
    <div
      class="modal fade show d-block"
      v-if="visible"
      tabindex="-1"
      role="dialog"
      style="background-color: rgba(30, 41, 59, 0.5); backdrop-filter: blur(4px)"
    >
      <div class="modal-dialog modal-md modal-dialog-centered" role="document">
        <div class="modal-content shadow-lg border-0 rounded-4">
          <!-- HEADER -->
          <div class="modal-header border-0 bg-primary bg-gradient text-white p-4 rounded-top-4">
            <h5 class="modal-title fw-bold">
              <i class="bi bi-plus-circle-fill me-2"></i>Creación de Nuevo Reemplazo
            </h5>
            <button
              type="button"
              class="btn-close btn-close-white"
              @click="$emit('cerrar')"
              aria-label="Close"
            ></button>
          </div>

          <!-- BODY -->
          <div class="modal-body p-4 bg-white">
            <p v-if="errorMessage" class="alert alert-danger py-2 border-0 shadow-sm rounded-3">
              <i class="bi bi-exclamation-triangle-fill me-2"></i>{{ errorMessage }}
            </p>

            <transition name="fade-step" mode="out-in">
              <div :key="currentStep">
                <!-- Paso 1 -->
                <div v-if="currentStep === 1">
                  <h5 class="fw-bold mb-3 text-dark smaller text-uppercase tracking-wider">
                    Paso 1: Datos de Funcionario (SALIDA)
                  </h5>

                  <button
                    @click.prevent="$emit('buscar-usuario', 1)"
                    class="btn btn-warning btn-sm mb-4 fw-bold shadow-sm border-0 px-3"
                  >
                    <i class="bi bi-search me-2"></i>Buscar Funcionario
                  </button>

                  <div class="form-floating mb-3">
                    <input
                      v-model="registroLocal.rut_saliente"
                      type="text"
                      class="form-control bg-light border-0 shadow-sm rounded-3"
                      disabled
                      placeholder="RUT"
                    />
                    <label class="text-secondary fw-semibold">RUT Saliente</label>
                  </div>

                  <div class="form-floating mb-3">
                    <input
                      v-model="registroLocal.nombre_saliente"
                      type="text"
                      class="form-control bg-light border-0 shadow-sm rounded-3"
                      disabled
                      placeholder="Nombre"
                    />
                    <label class="text-secondary fw-semibold">Nombre</label>
                  </div>

                  <div class="form-floating mb-4">
                    <input
                      v-model="registroLocal.apellido_saliente"
                      type="text"
                      class="form-control bg-light border-0 shadow-sm rounded-3"
                      disabled
                      placeholder="Apellido"
                    />
                    <label class="text-secondary fw-semibold">Apellido</label>
                  </div>

                  <div class="text-end pt-3 border-top">
                    <button @click="nextStep" class="btn btn-primary px-4 fw-bold shadow-sm">
                      Siguiente<i class="bi bi-arrow-right ms-2"></i>
                    </button>
                  </div>
                </div>

                <!-- Paso 2 -->
                <div v-else-if="currentStep === 2">
                  <h5 class="fw-bold mb-3 text-dark smaller text-uppercase tracking-wider">
                    Paso 2: Datos de Funcionario (ENTRANTE)
                  </h5>

                  <button
                    @click.prevent="$emit('buscar-usuario', 2)"
                    class="btn btn-warning btn-sm mb-4 fw-bold shadow-sm border-0 px-3"
                  >
                    <i class="bi bi-search me-2"></i>Buscar Funcionario
                  </button>

                  <div class="form-floating mb-3">
                    <input
                      v-model="registroLocal.rut_entrante"
                      type="text"
                      class="form-control bg-light border-0 shadow-sm rounded-3"
                      disabled
                      placeholder="RUT"
                    />
                    <label class="text-secondary fw-semibold">RUT Entrante</label>
                  </div>

                  <div class="form-floating mb-3">
                    <input
                      v-model="registroLocal.nombre_entrante"
                      type="text"
                      class="form-control bg-light border-0 shadow-sm rounded-3"
                      disabled
                      placeholder="Nombre"
                    />
                    <label class="text-secondary fw-semibold">Nombre</label>
                  </div>

                  <div class="form-floating mb-4">
                    <input
                      v-model="registroLocal.apellido_entrante"
                      type="text"
                      class="form-control bg-light border-0 shadow-sm rounded-3"
                      disabled
                      placeholder="Apellido"
                    />
                    <label class="text-secondary fw-semibold">Apellido</label>
                  </div>

                  <div class="d-flex justify-content-between pt-3 border-top">
                    <button
                      @click="prevStep"
                      class="btn btn-light border px-3 fw-bold text-secondary"
                    >
                      <i class="bi bi-arrow-left me-2"></i>Volver
                    </button>
                    <button @click="nextStep" class="btn btn-primary px-4 fw-bold shadow-sm">
                      Siguiente<i class="bi bi-arrow-right ms-2"></i>
                    </button>
                  </div>
                </div>

                <!-- Paso 3 -->
                <div v-else-if="currentStep === 3">
                  <h5 class="fw-bold mb-3 text-dark smaller text-uppercase tracking-wider">
                    Paso 3: Configuración de Turno
                  </h5>

                  <div class="mb-3">
                    <label class="form-label text-secondary fw-semibold small">Tipo de Turno</label>
                    <v-select
                      id="tipo_turno"
                      v-model="registroLocal.tipo_turno"
                      :options="listaDeTurnos"
                      :clearable="false"
                      :searchable="true"
                      placeholder="Seleccione un turno"
                      class="custom-v-select"
                    />
                  </div>

                  <!-- Fecha de Inicio -->
                  <div class="mb-3">
                    <label class="form-label text-secondary fw-semibold small"
                      >Fecha de Inicio</label
                    >
                    <DatePicker
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
                          <span class="input-group-text bg-light border-0 shadow-sm"
                            ><i class="bi bi-calendar-event text-primary"></i
                          ></span>
                          <input
                            class="form-control bg-light border-0 shadow-sm"
                            :value="inputValue"
                            v-on="inputEvents"
                            placeholder="Seleccione fecha de Inicio"
                            readonly
                          />
                        </div>
                      </template>
                    </DatePicker>
                  </div>

                  <!-- Fecha de Término -->
                  <div class="mb-3">
                    <label class="form-label text-secondary fw-semibold small"
                      >Fecha de Término</label
                    >
                    <DatePicker
                      v-model="fechaTerminoComputed"
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
                          <span class="input-group-text bg-light border-0 shadow-sm"
                            ><i class="bi bi-calendar-event text-danger"></i
                          ></span>
                          <input
                            class="form-control bg-light border-0 shadow-sm"
                            :value="inputValue"
                            v-on="inputEvents"
                            placeholder="Seleccione fecha de Termino"
                            readonly
                          />
                        </div>
                      </template>
                    </DatePicker>
                  </div>

                  <div class="mb-4">
                    <label class="form-label text-secondary fw-semibold small">Servicio</label>
                    <v-select
                      id="servicio"
                      v-model="registroLocal.servicio"
                      :options="listaDeServicios"
                      :clearable="false"
                      :searchable="true"
                      placeholder="Seleccione un servicio"
                      class="custom-v-select"
                    />
                  </div>

                  <div class="d-flex justify-content-between pt-3 border-top">
                    <button
                      @click="prevStep"
                      class="btn btn-light border px-3 fw-bold text-secondary"
                    >
                      <i class="bi bi-arrow-left me-2"></i>Volver
                    </button>
                    <button
                      @click="abrirConfirmacion"
                      class="btn btn-success px-4 fw-bold shadow-sm"
                    >
                      <i class="bi bi-check-circle me-2"></i>Guardar Reemplazo
                    </button>
                  </div>
                </div>
              </div>
            </transition>
          </div>
        </div>

        <!-- Modal de confirmación -->
        <ConfirmationModal
          :visible="showConfirmacion"
          mensaje="¿Deseas guardar los cambios realizados?"
          @confirmar="confirmarGuardar"
          @cancelar="cancelarConfirmacion"
        />
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
const currentStep = ref(1)
const errorMessage = ref('')

// --- Configuración de calendario
const { popoverConfig, isDisabled, dateAttributes } = useDatePicker(props)

watch(
  () => props.registro,
  (nuevo) => {
    Object.assign(registroLocal, nuevo)
  },
  { deep: true }
)

function todayString() {
  const d = new Date()
  const yyyy = d.getFullYear()
  const mm = String(d.getMonth() + 1).padStart(2, '0')
  const dd = String(d.getDate()).padStart(2, '0')
  return `${yyyy}-${mm}-${dd}`
}

watch(
  () => props.visible,
  (nuevoValor) => {
    if (nuevoValor) {
      currentStep.value = 1
      errorMessage.value = ''

      Object.assign(registroLocal, props.registro)

      if (!registroLocal.fecha_inicio) registroLocal.fecha_inicio = todayString()

      if (!registroLocal.fecha_termino) registroLocal.fecha_termino = todayString()
    }
  }
)

const today = new Date()
today.setHours(0, 0, 0, 0)

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

function nextStep() {
  errorMessage.value = ''
  if (currentStep.value === 1 && !registroLocal.rut_saliente) {
    errorMessage.value = 'Debe seleccionar un usuario para continuar.'
    return
  }
  if (currentStep.value === 2 && !registroLocal.rut_entrante) {
    errorMessage.value = 'Debe seleccionar un usuario para continuar.'
    return
  }
  if (currentStep.value === 2 && registroLocal.rut_entrante === registroLocal.rut_saliente) {
    errorMessage.value =
      'El funcionario entrante no puede ser el mismo que el funcionario saliente. Por favor, seleccione otro funcionario.'
    return
  }
  currentStep.value++
}

function prevStep() {
  if (currentStep.value > 1) {
    currentStep.value--
    errorMessage.value = ''
  }
}

const showConfirmacion = ref(false)

function abrirConfirmacion() {
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
/* Transitions */
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

.fade-step-enter-active,
.fade-step-leave-active {
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.fade-step-enter-from {
  opacity: 0;
  transform: translateX(20px);
}
.fade-step-leave-to {
  opacity: 0;
  transform: translateX(-20px);
}

/* Custom v-select */
.custom-v-select :deep(.vs__dropdown-toggle) {
  background: white;
  border: none;
  border-radius: 0.5rem;
  padding: 4px 8px;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.075);
}

.custom-v-select :deep(.vs__selected) {
  font-size: 0.875rem;
  color: #1e293b;
  font-weight: 500;
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
}

.custom-v-select :deep(.vs__dropdown-option) {
  border-radius: 0.375rem;
  padding: 8px 12px;
  margin-bottom: 2px;
}

.custom-v-select :deep(.vs__dropdown-option--highlight) {
  background: #3b82f6;
  color: white;
}

.smaller {
  font-size: 0.75rem;
}

.tracking-wider {
  letter-spacing: 0.05em;
}

button {
  transition: all 0.2s ease;
}

button:hover:not(:disabled) {
  transform: translateY(-1px);
  filter: brightness(1.05);
}

button:active {
  transform: translateY(0);
}
</style>
