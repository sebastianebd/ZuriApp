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

          <!-- Usamos <transition> para animar entre pasos.
              mode="out-in" garantiza que la salida termine antes de la entrada -->
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

                <div class="form-floating mb-3">
                  <select v-model="registroLocal.tipo_turno" class="form-select">
                    <option value="" disabled>Seleccione un turno</option>
                    <option v-for="turno in listaDeTurnos" :key="turno" :value="turno">
                      {{ turno }}
                    </option>
                  </select>
                  <label>Tipo de Turno</label>
                </div>

                <div class="mb-3">
                  <label>Fecha de Inicio</label>
                  <DatePicker
                    :model-value="
                      registroLocal.fecha_inicio ? registroLocal.fecha_inicio + 'T00:00:00' : null
                    "
                    @update:model-value="(newDate) => (registroLocal.fecha_inicio = newDate)"
                    :disabled-dates="isDisabled"
                    :min-date="new Date()"
                    :masks="{ input: 'DD/MM/YYYY' }"
                    :model-config="{
                      type: 'string',
                      mask: 'YYYY-MM-DD',
                      timeAdjust: '00:00:00'
                    }"
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

                <div class="mb-3">
                  <label>Fecha de Término</label>
                  <DatePicker
                    :model-value="
                      registroLocal.fecha_termino ? registroLocal.fecha_termino + 'T00:00:00' : null
                    "
                    @update:model-value="(newDate) => (registroLocal.fecha_termino = newDate)"
                    :disabled-dates="isDisabled"
                    :min-date="new Date()"
                    :masks="{ input: 'DD/MM/YYYY' }"
                    :model-config="{
                      type: 'string',
                      mask: 'YYYY-MM-DD',
                      timeAdjust: '00:00:00'
                    }"
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

                <div class="form-floating mb-4">
                  <select v-model="registroLocal.servicio" class="form-select">
                    <option value="" disabled>Seleccione un servicio</option>
                    <option v-for="servicio in listaDeServicios" :key="servicio" :value="servicio">
                      {{ servicio }}
                    </option>
                  </select>
                  <label>Servicio</label>
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
import { ref, watch, reactive } from 'vue'
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

watch(
  () => props.visible,
  (nuevo) => {
    if (nuevo) {
      currentStep.value = 1
      errorMessage.value = ''
      console.log('🔔 Modal CREATE abierto. props.registro:', JSON.parse(JSON.stringify(props.registro)))
      console.log('registroLocal al abrir:', JSON.parse(JSON.stringify(registroLocal)))
    }
  }
)

// --- Configuración de calendario
const { popoverConfig, dateAttributes, isDisabled } = useDatePicker(props)

watch(
  () => props.registro,
  (nuevo) => {
    console.log('🛰 props.registro cambiado:', JSON.parse(JSON.stringify(nuevo)))
    Object.assign(registroLocal, nuevo)
    console.log('=> registroLocal después de assign:', JSON.parse(JSON.stringify(registroLocal)))
  },
  { deep: true }
)

watch(
  () => registroLocal.fecha_inicio,
  (val) => {
    console.log('📥 registroLocal.fecha_inicio cambió -> raw:', val)
    try {
      const asDate = val ? new Date(val) : null
      console.log('   typeof:', typeof val, ' new Date(val):', asDate, ' toISOString (if valid):', asDate && !isNaN(asDate.getTime()) ? asDate.toISOString() : 'invalid')
    } catch (e) {
      console.log('   error parse fecha_inicio:', e)
    }
  }
)

watch(
  () => registroLocal.fecha_termino,
  (val) => {
    console.log('📥 registroLocal.fecha_termino cambió -> raw:', val)
    try {
      const asDate = val ? new Date(val) : null
      console.log('   typeof:', typeof val, ' new Date(val):', asDate, ' toISOString (if valid):', asDate && !isNaN(asDate.getTime()) ? asDate.toISOString() : 'invalid')
    } catch (e) {
      console.log('   error parse fecha_termino:', e)
    }
  }
)



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
