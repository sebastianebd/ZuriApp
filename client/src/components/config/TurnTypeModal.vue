<script setup lang="ts">
import { watch, reactive, onMounted, computed } from 'vue'
import type { TurnType, TurnDaySequence } from '@/stores/turn-type.store'
import { useTurnSiglaStore } from '@/stores/turn-sigla.store'

const props = defineProps<{
  visible: boolean
  turnType: TurnType | null
  loading: boolean
}>()

const emit = defineEmits(['close', 'save'])
const siglaStore = useTurnSiglaStore()

const isEditing = computed(() => !!props.turnType)
const modalTitle = computed(() => (isEditing.value ? 'Editar Turno' : 'Nuevo Turno'))
const btnLabel = computed(() => (isEditing.value ? 'Guardar Cambios' : 'Crear Turno'))

const formData = reactive({
  nombre: '',
  alias: '',
  jornada: 'MIXTO',
  descripcion: '',
  cantidad_dias: 7,
  secuencia: [] as TurnDaySequence[]
})

const errors = reactive({
  nombre: '',
  secuencia: ''
})

// Load Siglas when component mounts
onMounted(() => {
  siglaStore.fetchSiglas()
})

watch(
  () => props.visible,
  (val) => {
    if (val) {
      siglaStore.fetchSiglas() // Ensure up to date
      if (props.turnType) {
        // EDIT MODE
        formData.nombre = props.turnType.nombre
        formData.alias = props.turnType.alias || ''
        formData.jornada = props.turnType.jornada || 'MIXTO'
        formData.descripcion = props.turnType.descripcion || ''
        formData.cantidad_dias = props.turnType.cantidad_dias || 7
        // Clone sequence properly
        formData.secuencia = props.turnType.secuencia
          ? JSON.parse(JSON.stringify(props.turnType.secuencia))
          : []
        if (formData.secuencia.length === 0) updateSequenceLength()
      } else {
        // CREATE MODE
        resetForm()
      }
      errors.nombre = ''
      errors.secuencia = ''
    }
  }
)

function resetForm() {
  formData.nombre = ''
  formData.alias = ''
  formData.jornada = 'MIXTO'
  formData.descripcion = ''
  formData.cantidad_dias = 7
  formData.secuencia = []
  updateSequenceLength() // Init grid
}

// Logic to resize array based on Days Count
function updateSequenceLength() {
  let val = formData.cantidad_dias
  if (val < 1) val = 1
  if (val > 60) val = 60
  formData.cantidad_dias = val // clamp

  const currentLen = formData.secuencia.length
  const targetLen = formData.cantidad_dias

  if (targetLen > currentLen) {
    // Add days
    for (let i = currentLen + 1; i <= targetLen; i++) {
      formData.secuencia.push({
        dia: i,
        turno_entrada: null,
        turno_salida: null,
        es_libre: true,
        sigla: '',
        color: '#e2e8f0'
      })
    }
  } else if (targetLen < currentLen) {
    // Remove days
    formData.secuencia = formData.secuencia.slice(0, targetLen)
  }
}

// Handle Sigla Selection
function onSiglaChange(index: number) {
  const day = formData.secuencia[index]
  const selectedSigla = siglaStore.siglas.find((s) => s.sigla === day.sigla)

  if (selectedSigla) {
    day.color = selectedSigla.color
    // Determine if it's a working shift or free
    if (selectedSigla.turno_entrada && selectedSigla.turno_salida) {
      day.turno_entrada = selectedSigla.turno_entrada
      day.turno_salida = selectedSigla.turno_salida
      day.es_libre = false
    } else {
      // If sigla has no hours, assume it's like a FREE day or special code
      day.turno_entrada = null
      day.turno_salida = null
      day.es_libre = true
    }
  } else {
    // Reset if something weird happens
    day.turno_entrada = null
    day.turno_salida = null
    day.es_libre = true
    day.color = '#e2e8f0'
  }
}

function validate() {
  errors.nombre = ''
  errors.secuencia = ''
  let isValid = true

  if (!formData.nombre.trim()) {
    errors.nombre = 'El nombre es obligatorio'
    isValid = false
  }

  const missingSigla = formData.secuencia.some((d) => !d.sigla || d.sigla.trim() === '')
  if (missingSigla) {
    errors.secuencia = 'Todos los días deben tener una Sigla seleccionada.'
    isValid = false
  }

  return isValid
}

function handleSubmit() {
  if (!validate()) return

  emit('save', {
    ...props.turnType, // keep ID if exists
    nombre: formData.nombre.trim(),
    alias: formData.alias.trim(),
    jornada: formData.jornada,
    descripcion: formData.descripcion.trim(),
    cantidad_dias: formData.cantidad_dias,
    secuencia: formData.secuencia
  })
}
</script>

<template>
  <div v-if="visible" class="modal-backdrop-custom">
    <div class="modal-content-custom slide-up-fade">
      <!-- Header -->
      <div class="modal-header-custom">
        <h5 class="fw-bold m-0 text-dark">{{ modalTitle }}</h5>
        <button @click="$emit('close')" class="btn-close-custom">
          <i class="bi bi-x-lg"></i>
        </button>
      </div>

      <!-- Body (Scrollable) -->
      <div class="modal-body-custom custom-scrollbar">
        <form @submit.prevent="handleSubmit">
          <!-- Row 1: Basic Info -->
          <div class="row g-3 mb-4">
            <!-- Nombre -->
            <div class="col-md-5">
              <label class="form-label x-small fw-bold text-secondary text-uppercase mb-2"
                >Nombre</label
              >
              <input
                type="text"
                class="form-control custom-input"
                :class="{ 'is-invalid': errors.nombre }"
                v-model="formData.nombre"
                placeholder="Ej: 3er Turno"
              />
              <div v-if="errors.nombre" class="text-danger x-small fw-bold mt-1">
                {{ errors.nombre }}
              </div>
            </div>

            <!-- Alias -->
            <div class="col-md-3">
              <label class="form-label x-small fw-bold text-secondary text-uppercase mb-2"
                >Alias <small class="text-muted">(Opc)</small></label
              >
              <input
                type="text"
                class="form-control custom-input"
                v-model="formData.alias"
                placeholder="Ej: 3T"
              />
            </div>

            <!-- Jornada -->
            <div class="col-md-4">
              <label class="form-label x-small fw-bold text-secondary text-uppercase mb-2"
                >Jornada</label
              >
              <select class="form-select custom-input" v-model="formData.jornada">
                <option value="MIXTO">Mixto</option>
                <option value="DIURNO">Diurno</option>
                <option value="NOCTURNO">Nocturno</option>
              </select>
            </div>
          </div>

          <!-- Description & Days -->
          <div class="mb-4">
            <div class="d-flex gap-3">
              <div class="flex-grow-1">
                <label class="form-label x-small fw-bold text-secondary text-uppercase mb-2"
                  >Descripción</label
                >
                <input
                  type="text"
                  class="form-control custom-input"
                  v-model="formData.descripcion"
                  placeholder="Descripción opcional..."
                />
              </div>
              <div style="width: 140px">
                <label class="form-label x-small fw-bold text-secondary text-uppercase mb-2"
                  >Días (Ciclo)</label
                >
                <input
                  type="number"
                  min="1"
                  max="45"
                  class="form-control custom-input text-center fw-bold"
                  v-model.number="formData.cantidad_dias"
                  @change="updateSequenceLength"
                />
              </div>
            </div>
          </div>

          <!-- GRID / PATTERN -->
          <div class="mb-4">
            <div class="d-flex justify-content-between align-items-center mb-2">
              <label class="form-label x-small fw-bold text-secondary text-uppercase m-0">
                Configuración del Ciclo
              </label>
              <small class="text-muted x-small" v-if="siglaStore.loading">Cargando...</small>
            </div>

            <div class="pattern-container border rounded-3 overflow-hidden">
              <table class="table table-borderless align-middle mb-0 text-center">
                <thead class="bg-light border-bottom">
                  <tr>
                    <th class="x-small text-secondary fw-bold py-2">Día</th>
                    <th class="x-small text-secondary fw-bold py-2" style="width: 35%">Sigla</th>
                    <th class="x-small text-secondary fw-bold py-2">Horario</th>
                    <th class="x-small text-secondary fw-bold py-2">Color</th>
                  </tr>
                </thead>
                <tbody>
                  <tr
                    v-for="(day, index) in formData.secuencia"
                    :key="index"
                    class="border-bottom last-no-border"
                  >
                    <td class="fw-bold fs-6 text-muted">{{ day.dia }}</td>
                    <td class="p-2">
                      <select
                        class="form-select form-select-sm custom-input py-1"
                        v-model="day.sigla"
                        @change="onSiglaChange(index)"
                        :class="{ 'text-muted': !day.sigla }"
                        style="font-size: 0.85rem"
                      >
                        <option value="" disabled>-- Selec --</option>
                        <option
                          v-for="sigla in siglaStore.siglas"
                          :key="sigla._id"
                          :value="sigla.sigla"
                        >
                          {{ sigla.sigla }} - {{ sigla.nombre }}
                        </option>
                      </select>
                    </td>
                    <td>
                      <span
                        v-if="day.es_libre"
                        class="badge bg-light text-secondary border fw-normal"
                        >Libre</span
                      >
                      <span v-else class="x-small fw-bold text-dark">
                        {{ day.turno_entrada }} - {{ day.turno_salida }}
                      </span>
                    </td>
                    <td>
                      <div
                        class="mx-auto rounded-circle shadow-sm border"
                        :style="{
                          backgroundColor: day.color || '#e2e8f0',
                          width: '20px',
                          height: '20px'
                        }"
                      ></div>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
            <div v-if="errors.secuencia" class="text-danger x-small fw-bold mt-2 text-center">
              {{ errors.secuencia }}
            </div>
          </div>

          <!-- Footer -->
          <div class="d-flex justify-content-end gap-2 mt-4 pt-2">
            <button
              type="button"
              class="btn btn-light btn-sm fw-bold px-4 rounded-pill border-0 text-secondary"
              @click="$emit('close')"
            >
              Cancelar
            </button>
            <button
              type="submit"
              class="btn btn-primary btn-sm fw-bold px-4 rounded-pill shadow-sm"
              :disabled="loading"
            >
              <span v-if="loading" class="spinner-border spinner-border-sm me-2"></span>
              {{ btnLabel }}
            </button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>

<style scoped>
.modal-backdrop-custom {
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  background: rgba(15, 23, 42, 0.4);
  backdrop-filter: blur(8px);
  z-index: 1050;
  display: flex;
  align-items: center;
  justify-content: center;
}

.modal-content-custom {
  background: white;
  width: 90%;
  max-width: 650px; /* Slightly wider for the grid */
  max-height: 85vh;
  display: flex;
  flex-direction: column;
  border-radius: 24px;
  box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
  animation: slideUp 0.3s cubic-bezier(0.16, 1, 0.3, 1);
  overflow: hidden;
}

.modal-header-custom {
  padding: 1.5rem 2rem;
  border-bottom: 1px solid #f1f5f9;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.modal-body-custom {
  padding: 2rem;
  overflow-y: auto;
  flex: 1;
}

.btn-close-custom {
  background: #f1f5f9;
  border: none;
  width: 32px;
  height: 32px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #64748b;
  transition: all 0.2s;
}

.btn-close-custom:hover {
  background: #e2e8f0;
  color: #0f172a;
  transform: rotate(90deg);
}

.custom-input {
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  border-radius: 12px;
  font-size: 0.9rem;
  padding: 0.6rem 1rem;
  transition: all 0.2s;
}

.custom-input:focus {
  background: white;
  border-color: #3b82f6;
  box-shadow: 0 0 0 4px rgba(59, 130, 246, 0.1);
}

.x-small {
  font-size: 0.75rem;
  letter-spacing: 0.05em;
}

.pattern-container {
  background-color: #f8fafc;
  border: 1px solid #e2e8f0;
}

.last-no-border:last-child {
  border-bottom: 0 !important;
}

/* Scrollbar */
.custom-scrollbar::-webkit-scrollbar {
  width: 6px;
}
.custom-scrollbar::-webkit-scrollbar-track {
  background: transparent;
}
.custom-scrollbar::-webkit-scrollbar-thumb {
  background-color: #cbd5e1;
  border-radius: 20px;
}

@keyframes slideUp {
  from {
    opacity: 0;
    transform: translateY(20px) scale(0.95);
  }
  to {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
}
</style>
