<template>
  <div class="modal fade show d-block" v-if="visible" tabindex="-1" role="dialog">
    <div class="modal-dialog modal-md modal-dialog-centered" role="document">
      <div class="modal-content shadow-lg border-0 rounded-3">
        <!-- HEADER -->
        <div class="modal-header bg-primary text-white rounded-top">
          <h5 class="modal-title fw-bold">Creación de Nuevo Reemplazo</h5>
          <button
            type="button"
            class="btn-close btn-close-white"
            @click="$emit('cerrar')"
            aria-label="Close"
          ></button>
        </div>

        <!-- BODY -->
        <div class="modal-body bg-light">
          <p v-if="errorMessage" class="alert alert-danger py-2">{{ errorMessage }}</p>

          <transition name="fade-step" mode="out-in">
            <div :key="currentStep">
              <!-- Paso 1 -->
              <div v-if="currentStep === 1">
                <h5 class="fw-semibold mb-3 text-primary">Paso 1: Datos de Funcionario (SALIDA)</h5>

                <button
                  @click.prevent="$emit('buscar-usuario', 1)"
                  class="btn btn-warning btn-sm mb-3 fw-semibold"
                >
                  <i class="bi bi-search">Buscar Funcionario</i>
                </button>

                <div class="form-floating mb-2">
                  <input
                    v-model="registroLocal.rut_saliente"
                    type="text"
                    class="form-control"
                    disabled
                  />
                  <label>RUT</label>
                </div>

                <div class="form-floating mb-2">
                  <input
                    v-model="registroLocal.nombre_saliente"
                    type="text"
                    class="form-control"
                    disabled
                  />
                  <label>Nombre</label>
                </div>

                <div class="form-floating mb-3">
                  <input
                    v-model="registroLocal.apellido_saliente"
                    type="text"
                    class="form-control"
                    disabled
                  />
                  <label>Apellido</label>
                </div>

                <div class="text-end">
                  <button @click="nextStep" class="btn btn-primary px-4 fw-semibold">
                    Siguiente
                  </button>
                </div>
              </div>

              <!-- Paso 2 -->
              <div v-else-if="currentStep === 2">
                <h5 class="fw-semibold mb-3 text-primary">
                  Paso 2: Datos de Funcionario (ENTRANTE)
                </h5>

                <button
                  @click.prevent="$emit('buscar-usuario', 2)"
                  class="btn btn-warning btn-sm mb-3 fw-semibold"
                >
                  <i class="bi bi-search">Buscar Funcionario</i>
                </button>

                <div class="form-floating mb-2">
                  <input
                    v-model="registroLocal.rut_entrante"
                    type="text"
                    class="form-control"
                    disabled
                  />
                  <label>RUT</label>
                </div>

                <div class="form-floating mb-2">
                  <input
                    v-model="registroLocal.nombre_entrante"
                    type="text"
                    class="form-control"
                    disabled
                  />
                  <label>Nombre</label>
                </div>

                <div class="form-floating mb-3">
                  <input
                    v-model="registroLocal.apellido_entrante"
                    type="text"
                    class="form-control"
                    disabled
                  />
                  <label>Apellido</label>
                </div>

                <div class="d-flex justify-content-between">
                  <button @click="prevStep" class="btn btn-secondary px-3 fw-semibold">
                    Volver
                  </button>
                  <button @click="nextStep" class="btn btn-primary px-3 fw-semibold">
                    Siguiente
                  </button>
                </div>
              </div>

              <!-- Paso 3 -->
              <div v-else-if="currentStep === 3">
                <h5 class="fw-semibold mb-3 text-primary">Paso 3: Configuración de Turno</h5>

                <label for="tipo_turno" class="">Tipo de Turno</label>
                <div class="mb-3 bg-white ">
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
                  <label>Fecha de Inicio</label>
                  <DatePicker
                    v-model="fechaInicioComputed"
                    :disabled-dates="isDisabled"
                    :min-date="today"
                    :masks="{ input: 'DD/MM/YYYY' }"
                    :popover="popoverConfig"
                    :attributes="dateAttributes"
                    is-required
                    trim-weeks
                    color="blue"
                  >
                    <template #default="{ inputValue, inputEvents }">
                      <input
                        class="form-control"
                        :value="inputValue"
                        v-on="inputEvents"
                        placeholder="Seleccione fecha de Inicio"
                        readonly
                      />
                    </template>
                  </DatePicker>
                </div>

                <!-- Fecha de Término -->
                <div class="mb-3">
                  <label>Fecha de Término</label>
                  <DatePicker
                    v-model="fechaTerminoComputed"
                    :disabled-dates="isDisabled"
                    :min-date="today"
                    :masks="{ input: 'DD/MM/YYYY' }"
                    :popover="popoverConfig"
                    :attributes="dateAttributes"
                    is-required
                    trim-weeks
                    color="blue"
                  >
                    <template #default="{ inputValue, inputEvents }">
                      <input
                        class="form-control"
                        :value="inputValue"
                        v-on="inputEvents"
                        placeholder="Seleccione fecha de Termino"
                        readonly
                      />
                    </template>
                  </DatePicker>
                </div>

                <label for="servicio">Servicio</label>
                <div class="form-floating mb-4 bg-white">
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

                <div class="d-flex justify-content-between">
                  <button @click="prevStep" class="btn btn-secondary px-3 fw-semibold">
                    Volver
                  </button>
                  <button @click="abrirConfirmacion" class="btn btn-success px-4 fw-semibold">
                    Guardar
                  </button>
                </div>
              </div>
            </div>
          </transition>
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
  </div>
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
.modal {
  background-color: rgba(0, 0, 0, 0.5);
}

.modal-content {
  border-radius: 12px;
  overflow: hidden;
  animation: fadeInModal 0.25s ease;
}

@keyframes fadeInModal {
  from {
    opacity: 0;
    transform: translateY(-10px) scale(0.98);
  }
  to {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
}

.fade-step-enter-active,
.fade-step-leave-active {
  transition: all 260ms cubic-bezier(0.2, 0.9, 0.2, 1);
  transition-property: opacity, transform;
  will-change: opacity, transform;
}

.fade-step-enter-from {
  opacity: 0;
  transform: translateY(8px) scale(0.995);
}
.fade-step-enter-to {
  opacity: 1;
  transform: translateY(0) scale(1);
}

.fade-step-leave-from {
  opacity: 1;
  transform: translateY(0) scale(1);
}
.fade-step-leave-to {
  opacity: 0;
  transform: translateY(-6px) scale(0.995);
}

/* Estilos generales */
.modal-header {
  border-bottom: none;
}

.modal-footer {
  border-top: none;
}

h5 {
  font-weight: 600;
}

.form-control,
.form-select {
  border-radius: 6px;
}

button {
  transition: transform 0.12s ease-in-out;
}

button:hover {
  transform: translateY(-1px);
}
:deep(.modal-content) {
  overflow: visible;
}
</style>
