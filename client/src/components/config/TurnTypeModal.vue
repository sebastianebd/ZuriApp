<template>
  <div v-if="visible" class="modal-backdrop fade show"></div>
  <div v-if="visible" class="modal fade show d-block" tabindex="-1" role="dialog" aria-modal="true">
    <div class="modal-dialog modal-dialog-centered" role="document">
      <div class="modal-content border-0 shadow-lg rounded-4 overflow-hidden">
        <!-- Header -->
        <div class="modal-header border-bottom-0 p-4 bg-light">
          <div class="d-flex align-items-center gap-3">
            <div class="icon-square bg-warning bg-opacity-10 text-warning">
              <i class="bi bi-clock-history fs-5"></i>
            </div>
            <h5 class="modal-title fw-bold text-dark mb-0">
              {{ turnType ? 'Editar Tipo de Turno' : 'Nuevo Tipo de Turno' }}
            </h5>
          </div>
          <button
            type="button"
            class="btn-close shadow-none"
            @click="close"
            :disabled="loading"
          ></button>
        </div>

        <!-- Body -->
        <div class="modal-body p-4">
          <form @submit.prevent="handleSubmit">
            <!-- Nombre Input -->
            <div class="mb-4">
              <label class="form-label fw-semibold text-secondary small text-uppercase ls-1">
                Nombre del Turno
              </label>
              <div class="input-group">
                <span class="input-group-text bg-white border-end-0 text-muted ps-3">
                  <i class="bi bi-tag"></i>
                </span>
                <input
                  type="text"
                  class="form-control border-start-0 ps-0 py-2 shadow-none"
                  :class="{ 'is-invalid': errors.nombre }"
                  v-model="formData.nombre"
                  placeholder="Ej: 4to Turno, Diurno"
                />
              </div>
              <div v-if="errors.nombre" class="invalid-feedback d-block mt-1">
                {{ errors.nombre }}
              </div>
            </div>

            <!-- Descripción Input -->
            <div class="mb-4">
              <label class="form-label fw-semibold text-secondary small text-uppercase ls-1">
                Descripción (Opcional)
              </label>
              <div class="input-group">
                <span class="input-group-text bg-white border-end-0 text-muted ps-3">
                  <i class="bi bi-card-text"></i>
                </span>
                <input
                  type="text"
                  class="form-control border-start-0 ps-0 py-2 shadow-none"
                  v-model="formData.descripcion"
                  placeholder="Breve descripción del horario..."
                />
              </div>
            </div>

            <!-- Action Buttons -->
            <div class="d-flex justify-content-end gap-2 mt-2">
              <button
                type="button"
                class="btn btn-light border-0 px-4 py-2 fw-medium"
                @click="close"
                :disabled="loading"
              >
                Cancelar
              </button>
              <button
                type="submit"
                class="btn btn-primary px-4 py-2 fw-bold shadow-sm d-flex align-items-center gap-2"
                :disabled="loading"
              >
                <span
                  v-if="loading"
                  class="spinner-border spinner-border-sm"
                  role="status"
                  aria-hidden="true"
                ></span>
                <span>{{ turnType ? 'Guardar Cambios' : 'Crear Turno' }}</span>
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch, reactive } from 'vue'
import type { TurnType } from '@/stores/turn-type.store'

const props = defineProps<{
  visible: boolean
  turnType: TurnType | null
  loading: boolean
}>()

const emit = defineEmits(['close', 'save'])

const formData = reactive({
  nombre: '',
  descripcion: ''
})

const errors = reactive({
  nombre: ''
})

watch(
  () => props.visible,
  (val) => {
    if (val) {
      // Reset form on open
      formData.nombre = props.turnType?.nombre || ''
      formData.descripcion = props.turnType?.descripcion || ''
      errors.nombre = ''
    }
  }
)

function validate() {
  errors.nombre = ''
  if (!formData.nombre.trim()) {
    errors.nombre = 'El nombre es requerido'
    return false
  }
  return true
}

function handleSubmit() {
  if (!validate()) return

  emit('save', {
    ...props.turnType,
    nombre: formData.nombre.trim(),
    descripcion: formData.descripcion.trim()
  })
}

function close() {
  emit('close')
}
</script>

<style scoped>
.modal-backdrop {
  background-color: rgba(15, 23, 42, 0.4);
  backdrop-filter: blur(4px);
}

.icon-square {
  width: 40px;
  height: 40px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.ls-1 {
  letter-spacing: 0.5px;
}

.form-control:focus {
  border-color: #86b7fe;
  box-shadow: none;
}

.input-group-text {
  border-color: #dee2e6;
}

.input-group:focus-within .input-group-text,
.input-group:focus-within .form-control {
  border-color: #86b7fe;
}
</style>
