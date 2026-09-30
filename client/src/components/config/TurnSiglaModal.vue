<script setup lang="ts">
import { reactive, watch, computed } from 'vue'
import type { TurnSigla } from '@/stores/turn-sigla.store'

const props = defineProps<{
  visible: boolean
  sigla: TurnSigla | null
  loading: boolean
}>()

const emit = defineEmits(['close', 'save'])

const isEditing = computed(() => !!props.sigla)
const modalTitle = computed(() => (isEditing.value ? 'Editar Sigla' : 'Nueva Sigla'))
const btnLabel = computed(() => (isEditing.value ? 'Guardar Cambios' : 'Crear Sigla'))

const formData = reactive({
  sigla: '',
  nombre: '',
  descripcion: '',
  color: '#e2e8f0',
  turno_entrada: '',
  turno_salida: '',
  activo: true
})

const errors = reactive({
  sigla: '',
  nombre: ''
})

const presets = [
  '#fca5a5',
  '#fdba74',
  '#fde047', // Reds/Oranges/Yellows
  '#86efac',
  '#6ee7b7', // Greens
  '#93c5fd',
  '#a5b4fc', // Blues
  '#d8b4fe',
  '#f0abfc', // Purples
  '#e2e8f0',
  '#cbd5e1' // Grays
]

watch(
  () => props.visible,
  (val) => {
    if (val) {
      if (props.sigla) {
        formData.sigla = props.sigla.sigla
        formData.nombre = props.sigla.nombre
        formData.descripcion = props.sigla.descripcion || ''
        formData.color = props.sigla.color
        formData.turno_entrada = props.sigla.turno_entrada || ''
        formData.turno_salida = props.sigla.turno_salida || ''
        formData.activo = props.sigla.activo !== false
      } else {
        resetForm()
      }
      errors.sigla = ''
      errors.nombre = ''
    }
  }
)

function resetForm() {
  formData.sigla = ''
  formData.nombre = ''
  formData.descripcion = ''
  formData.color = '#e2e8f0'
  formData.turno_entrada = ''
  formData.turno_salida = ''
  formData.activo = true
}

function getContrastColor() {
  // Simple check for light colors to return dark text
  return '#1e293b'
}

function validate() {
  let isValid = true
  errors.sigla = ''
  errors.nombre = ''

  if (!formData.sigla.trim()) {
    errors.sigla = 'Requerido'
    isValid = false
  }
  if (!formData.nombre.trim()) {
    errors.nombre = 'Requerido'
    isValid = false
  }
  return isValid
}

function handleSubmit() {
  if (!validate()) return
  emit('save', {
    ...props.sigla,
    sigla: formData.sigla.trim().toUpperCase(),
    nombre: formData.nombre.trim(),
    descripcion: formData.descripcion.trim(),
    color: formData.color,
    turno_entrada: formData.turno_entrada || null,
    turno_salida: formData.turno_salida || null,
    activo: formData.activo
  })
}
</script>

<template>
  <div v-if="visible" class="modal-backdrop-custom">
    <div class="modal-content-custom slide-up-fade">
      <!-- Header -->
      <div class="modal-header-custom">
        <div class="d-flex align-items-center gap-3">
          <div
            class="icon-square-sm fw-bold d-flex align-items-center justify-content-center shadow-sm"
            :style="{ backgroundColor: formData.color, color: getContrastColor() }"
          >
            {{ formData.sigla || '?' }}
          </div>
          <h5 class="fw-bold m-0 text-dark">{{ modalTitle }}</h5>
        </div>

        <button @click="$emit('close')" class="btn-close-custom">
          <i class="bi bi-x-lg"></i>
        </button>
      </div>

      <!-- Body -->
      <div class="modal-body-custom custom-scrollbar">
        <form @submit.prevent="handleSubmit">
          <!-- SECCIÓN 1: IDENTIFICACIÓN -->
          <div class="vanguard-section-card mb-3 p-3 p-md-4">
            <div class="d-flex align-items-center justify-content-between mb-3 pb-2 border-bottom">
              <div class="d-flex align-items-center gap-2">
                <span class="section-indicator bg-primary"></span>
                <h6 class="fw-bold text-dark mb-0 section-heading">Identidad Visual</h6>
              </div>
              <div class="form-check form-switch m-0 d-flex align-items-center gap-2">
                <label class="form-check-label x-small fw-bold text-muted mb-0" for="siglaActiveSwitch">{{
                  formData.activo ? 'Activa' : 'Inactiva'
                }}</label>
                <input
                  class="form-check-input mt-0"
                  type="checkbox"
                  role="switch"
                  id="siglaActiveSwitch"
                  v-model="formData.activo"
                  style="cursor: pointer;"
                />
              </div>
            </div>

            <div class="row g-3">
              <!-- Sigla -->
              <div class="col-md-3">
                <label class="form-label x-small fw-bold text-secondary text-uppercase mb-2"
                  >Sigla <span class="text-danger">*</span></label
                >
                <input
                  type="text"
                  class="form-control custom-input text-center fw-bold text-uppercase"
                  v-model="formData.sigla"
                  maxlength="4"
                  placeholder="L"
                  :class="{ 'is-invalid': errors.sigla }"
                />
                <div v-if="errors.sigla" class="text-danger x-small fw-bold mt-1">
                  {{ errors.sigla }}
                </div>
              </div>

              <!-- Nombre -->
              <div class="col-md-5">
                <label class="form-label x-small fw-bold text-secondary text-uppercase mb-2"
                  >Nombre de Referencia <span class="text-danger">*</span></label
                >
                <input
                  type="text"
                  class="form-control custom-input"
                  v-model="formData.nombre"
                  placeholder="Ej: Libre"
                  :class="{ 'is-invalid': errors.nombre }"
                />
                <div v-if="errors.nombre" class="text-danger x-small fw-bold mt-1">
                  {{ errors.nombre }}
                </div>
              </div>

              <!-- Color -->
              <div class="col-md-4">
                <label class="form-label x-small fw-bold text-secondary text-uppercase mb-2"
                  >Color Base</label
                >
                <div class="d-flex gap-2 align-items-center">
                  <div
                    class="rounded-circle shadow-sm flex-shrink-0"
                    style="width: 38px; height: 38px; overflow: hidden; cursor: pointer; border: 1px solid rgba(0, 0, 0, 0.1);"
                  >
                    <input
                      type="color"
                      class="border-0 p-0 m-0"
                      style="width: 150%; height: 150%; transform: translate(-15%, -15%); cursor: pointer;"
                      v-model="formData.color"
                      title="Elegir color"
                    />
                  </div>
                  <div class="d-flex gap-1 flex-wrap align-content-start">
                    <button
                      v-for="c in presets"
                      :key="c"
                      type="button"
                      class="btn btn-sm rounded-circle border shadow-sm p-0"
                      style="width: 20px; height: 20px"
                      :style="{ backgroundColor: c }"
                      @click="formData.color = c"
                    ></button>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- SECCIÓN 2: HORARIOS Y NOTAS -->
          <div class="vanguard-section-card mb-3 p-3 p-md-4">
            <div class="d-flex align-items-center justify-content-between mb-3 pb-2 border-bottom">
              <div class="d-flex align-items-center gap-2">
                <span class="section-indicator bg-info"></span>
                <h6 class="fw-bold text-dark mb-0 section-heading">Horarios por Defecto & Notas</h6>
              </div>
            </div>

            <div class="row g-3">
              <div class="col-md-6">
                <label class="form-label x-small fw-bold text-secondary text-uppercase mb-2"
                  >Entrada (Opcional)</label
                >
                <input
                  type="time"
                  class="form-control custom-input text-center"
                  v-model="formData.turno_entrada"
                />
              </div>
              <div class="col-md-6">
                <label class="form-label x-small fw-bold text-secondary text-uppercase mb-2"
                  >Salida (Opcional)</label
                >
                <input
                  type="time"
                  class="form-control custom-input text-center"
                  v-model="formData.turno_salida"
                />
              </div>
              <div class="col-12">
                <div class="form-text x-small text-muted m-0">
                  * Estos horarios se cargarán automáticamente al seleccionar la sigla.
                </div>
              </div>
              
              <div class="col-12 mt-3">
                <label class="form-label x-small fw-bold text-secondary text-uppercase mb-2"
                  >Notas Adicionales</label
                >
                <textarea
                  class="form-control custom-input"
                  v-model="formData.descripcion"
                  rows="2"
                  placeholder="Detalles sobre el uso de esta sigla..."
                ></textarea>
              </div>
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
  max-width: 500px; /* Smaller width for Sigla modal */
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

.vanguard-section-card {
  background: #ffffff;
  border: 1px solid #e2e8f0;
  border-radius: 16px;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.02), 0 2px 4px -1px rgba(0, 0, 0, 0.02);
}

.section-indicator {
  width: 6px;
  height: 18px;
  border-radius: 4px;
  display: inline-block;
}

.section-heading {
  font-size: 0.95rem;
  letter-spacing: -0.01em;
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

.icon-square-sm {
  width: 36px;
  height: 36px;
  border-radius: 10px;
  font-size: 1rem;
  border: 1px solid rgba(0, 0, 0, 0.1);
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
