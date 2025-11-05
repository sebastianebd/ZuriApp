<template>
  <div class="modal modal-dialog " :class="{ show: visible }" style="display: block" v-if="visible">
    <div class="" role="document">
      <div class="modal-content">
        <div class="modal-header">
          <h5 class="modal-title">CREAR NUEVO REEMPLAZO</h5>
          <button type="button" class="close" @click="$emit('cerrar')" aria-label="Close">
            <span aria-hidden="true" class="h1">&times;</span>
          </button>
        </div>

        <div class="modal-body">
          <p v-if="errorMessage" class="text-danger">{{ errorMessage }}</p>

          <div v-if="currentStep === 1">
            <h5>Paso 1: Datos de funcionario (Salida)</h5>
            <button @click.prevent="$emit('buscar-usuario', 1)" class="btn btn-warning btn-sm mb-3">
              Buscar TENS Saliente
            </button>

            <div class="mb-2">
              <label>Rut</label>
              <input
                v-model="registroLocal.rut_saliente"
                type="text"
                class="form-control"
                disabled
              />
            </div>
            <div class="mb-2">
              <label>Nombre</label>
              <input
                v-model="registroLocal.nombre_saliente"
                type="text"
                class="form-control"
                disabled
              />
            </div>
            <div class="mb-2">
              <label>Apellido</label>
              <input
                v-model="registroLocal.apellido_saliente"
                type="text"
                class="form-control"
                disabled
              />
            </div>

            <button @click="nextStep" class="btn btn-primary">Siguiente</button>
          </div>

          <div v-if="currentStep === 2">
            <h5>Paso 2: Datos de TENS (entrante)</h5>
            <button @click.prevent="$emit('buscar-usuario', 2)" class="btn btn-warning btn-sm mb-3">
              Buscar TENS Entrante
            </button>

            <div class="mb-2">
              <label>Rut</label>
              <input
                v-model="registroLocal.rut_entrante"
                type="text"
                class="form-control"
                disabled
              />
            </div>
            <div class="mb-2">
              <label>Nombre</label>
              <input
                v-model="registroLocal.nombre_entrante"
                type="text"
                class="form-control"
                disabled
              />
            </div>
            <div class="mb-2">
              <label>Apellido</label>
              <input
                v-model="registroLocal.apellido_entrante"
                type="text"
                class="form-control"
                disabled
              />
            </div>

            <div class="d-flex justify-content-between">
              <button @click="prevStep" class="btn btn-secondary">Volver</button>
              <button @click="nextStep" class="btn btn-primary">Siguiente</button>
            </div>
          </div>

          <div v-if="currentStep === 3">
            <h5>Paso 3: Configuración de Turno</h5>

            <div class="mb-2">
              <label>Tipo Turno</label>
              <select v-model="registroLocal.tipo_turno" class="form-control form-control-sm">
                <option value="" disabled selected>Seleccione un turno</option>
                <option v-for="turno in listaDeTurnos" :key="turno" :value="turno">
                  {{ turno }}
                </option>
              </select>
            </div>

            <div class="mb-2">
              <label>Fecha Inicio</label>
              <input v-model="registroLocal.fecha_inicio" type="date" class="form-control" />
            </div>

            <div class="mb-2">
              <label>Fecha Término</label>
              <input v-model="registroLocal.fecha_termino" type="date" class="form-control" />
            </div>

            <div class="mb-2">
              <label>Servicio</label>
              <select v-model="registroLocal.servicio" class="form-control form-control-sm">
                <option value="" disabled selected>Seleccione un servicio</option>
                <option v-for="servicio in listaDeServicios" :key="servicio" :value="servicio">
                  {{ servicio }}
                </option>
              </select>
            </div>

            <div class="d-flex justify-content-between">
              <button @click="prevStep" class="btn btn-secondary">Volver</button>
              <button @click="guardar" class="btn btn-success">Guardar</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch, reactive } from 'vue'
import type { RegisterDataReemplazo } from '@/types/models'

// 1. Emits y Props se mantienen
const props = defineProps<{
  visible: boolean
  listaDeTurnos: string[]
  listaDeServicios: string[]
  registro: Partial<RegisterDataReemplazo>
}>()

const emit = defineEmits<{
  (e: 'cerrar'): void
  (e: 'guardar', registro: RegisterDataReemplazo): void
  (e: 'buscar-usuario', grupo: 1 | 2): void
}>()

// 2. Estado local
const registroLocal = reactive({ ...props.registro })
const currentStep = ref(1)
const errorMessage = ref('')

// 3. Watchers
watch(
  () => props.visible,
  (nuevo) => {
    if (nuevo) {
      currentStep.value = 1
      errorMessage.value = ''
    }
  }
)

// Sincronización: Esto es correcto porque el prop.registro se actualiza con la selección del usuario
watch(
  () => props.registro,
  (nuevo) => {
    Object.assign(registroLocal, nuevo)
  },
  { deep: true }
)

// 4. Lógica de Navegación/Validación
function nextStep() {
  errorMessage.value = '' // Limpiar mensaje anterior

  if (currentStep.value === 1) {
    if (!registroLocal.rut_saliente) {
      errorMessage.value = 'Debe seleccionar un TENS saliente para continuar.'
      return
    }
  } else if (currentStep.value === 2) {
    if (!registroLocal.rut_entrante) {
      errorMessage.value = 'Debe seleccionar un TENS entrante para continuar.'
      return
    }
  }

  // Solo avanzar si las validaciones pasan
  currentStep.value++
}

function prevStep() {
  if (currentStep.value > 1) {
    currentStep.value--
    errorMessage.value = '' // Limpiar mensaje al retroceder
  }
}

function guardar() {
  errorMessage.value = '' // Limpiar mensaje anterior
  if (
    !registroLocal.tipo_turno ||
    !registroLocal.fecha_inicio ||
    !registroLocal.fecha_termino ||
    !registroLocal.servicio
  ) {
    errorMessage.value = 'Por favor complete todos los campos de la configuración de turno.'
    return
  }

  // Se lanza el evento al padre con el objeto local que contiene los datos del formulario.
  emit('guardar', registroLocal as RegisterDataReemplazo)
}
</script>
