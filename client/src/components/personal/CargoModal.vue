<script setup lang="ts">
import { ref, watch, computed } from 'vue'
import { Form, Field, ErrorMessage, useForm } from 'vee-validate'
import * as yup from 'yup'
import type { ICargo } from '@/types/models'

const props = defineProps<{
  visible: boolean
  cargo?: ICargo | null // If null, creating. If present, editing.
  loading?: boolean
}>()

const emit = defineEmits(['close', 'save'])

const isEditing = computed(() => !!props.cargo)
const modalTitle = computed(() => (isEditing.value ? 'Editar Cargo' : 'Nuevo Cargo'))
const btnLabel = computed(() => (isEditing.value ? 'Guardar Cambios' : 'Crear Cargo'))

// Schema
const schema = yup.object({
  nombre: yup.string().required('El nombre es obligatorio').min(3, 'Mínimo 3 caracteres'),
  descripcion: yup.string().max(200, 'Máximo 200 caracteres'),
  activo: yup.boolean()
})

const formData = ref({
  nombre: '',
  descripcion: '',
  activo: true
})

// Initialize form
watch(
  () => props.cargo,
  (newVal) => {
    if (newVal) {
      formData.value = {
        nombre: newVal.nombre,
        descripcion: newVal.descripcion || '',
        activo: newVal.activo
      }
    } else {
      formData.value = {
        nombre: '',
        descripcion: '',
        activo: true
      }
    }
  },
  { immediate: true }
)

function onSubmit() {
  emit('save', {
    ...formData.value,
    _id: props.cargo?._id
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

      <!-- Body -->
      <div class="modal-body-custom">
        <Form @submit="onSubmit" :validation-schema="schema" v-slot="{ errors }">
          <!-- Nombre -->
          <div class="mb-4">
            <label class="form-label x-small fw-bold text-secondary text-uppercase"
              >Nombre del Cargo</label
            >
            <Field
              name="nombre"
              v-model="formData.nombre"
              type="text"
              class="form-control form-control-lg custom-input"
              :class="{ 'is-invalid': errors.nombre }"
              placeholder="Ej: TENS, MÉDICO"
            />
            <ErrorMessage name="nombre" class="text-danger x-small fw-bold mt-1 d-block" />
          </div>

          <!-- Descripcion -->
          <div class="mb-4">
            <label class="form-label x-small fw-bold text-secondary text-uppercase"
              >Descripción (Opcional)</label
            >
            <Field
              name="descripcion"
              v-model="formData.descripcion"
              as="textarea"
              rows="3"
              class="form-control custom-input"
              :class="{ 'is-invalid': errors.descripcion }"
              placeholder="Breve descripción de las responsabilidades..."
            />
            <ErrorMessage name="descripcion" class="text-danger x-small fw-bold mt-1 d-block" />
          </div>

          <!-- Activo (Only editing) -->
          <div v-if="isEditing" class="mb-4 d-flex align-items-center">
            <div class="form-check form-switch custom-switch">
              <Field
                name="activo"
                type="checkbox"
                class="form-check-input"
                v-model="formData.activo"
                :value="true"
                id="activoSwitch"
              />
              <label class="form-check-label fw-bold ms-2 text-dark" for="activoSwitch">
                Cargo Activo
              </label>
            </div>
          </div>

          <!-- Footer Actions -->
          <div class="d-flex justify-content-end gap-2 mt-5">
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
        </Form>
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
  background: rgba(15, 23, 42, 0.4); /* Slate-900 with opacity */
  backdrop-filter: blur(8px);
  z-index: 1050;
  display: flex;
  align-items: center;
  justify-content: center;
}

.modal-content-custom {
  background: white;
  width: 90%;
  max-width: 500px;
  border-radius: 24px;
  padding: 2rem;
  box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
  animation: slideUp 0.3s cubic-bezier(0.16, 1, 0.3, 1);
}

.modal-header-custom {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 2rem;
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
  padding: 0.75rem 1rem;
  transition: all 0.2s;
}

.custom-input:focus {
  background: white;
  border-color: #3b82f6;
  box-shadow: 0 0 0 4px rgba(59, 130, 246, 0.1);
}

.custom-switch .form-check-input {
  width: 3em;
  height: 1.5em;
  cursor: pointer;
}

.x-small {
  font-size: 0.75rem;
  letter-spacing: 0.05em;
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
