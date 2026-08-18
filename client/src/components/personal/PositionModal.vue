<script setup lang="ts">
import { ref, watch, computed } from 'vue'
import { Form, Field, ErrorMessage } from 'vee-validate'
import * as yup from 'yup'
import { type Position } from '@/stores/position.store'

const props = defineProps<{
  visible: boolean
  position?: Position | null
  loading?: boolean
}>()

const emit = defineEmits(['close', 'save'])

const isEditing = computed(() => !!props.position)
const modalTitle = computed(() => (isEditing.value ? 'Editar Cargo Físico' : 'Nuevo Cargo Físico'))
const btnLabel = computed(() => (isEditing.value ? 'Guardar Cambios' : 'Crear Cargo Físico'))

const schema = yup.object({
  name: yup.string().required('El nombre es obligatorio').min(3, 'Mínimo 3 caracteres'),
  position_code: yup.string().required('El código es obligatorio'),
  description: yup.string().max(200, 'Máximo 200 caracteres'),
  isActive: yup.boolean()
})

const formData = ref({
  name: '',
  position_code: '',
  description: '',
  isActive: true
})

// Initialize form
watch(
  () => props.position,
  (newVal) => {
    if (newVal) {
      formData.value = {
        name: newVal.name,
        position_code: newVal.position_code || '',
        description: newVal.description || '',
        isActive: newVal.isActive ?? true
      }
    } else {
      formData.value = {
        name: '',
        position_code: '',
        description: '',
        isActive: true
      }
    }
  },
  { immediate: true }
)

function onSubmit() {
  emit('save', {
    ...formData.value,
    _id: props.position?._id
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
      <div class="modal-body-custom">
        <Form @submit="onSubmit" :validation-schema="schema" v-slot="{ errors }">
          <!-- CODIGO (Editable on Create, Read Only on Update) -->
          <div class="mb-4">
            <label class="form-label x-small fw-bold text-secondary text-uppercase"
              >Código de Cargo</label
            >
            <Field
              name="position_code"
              v-model="formData.position_code"
              type="text"
              class="form-control form-control-lg custom-input font-monospace text-uppercase"
              :class="{ 'is-invalid': errors.position_code }"
              placeholder="Ej: MED_1"
              :disabled="isEditing"
            />
            <ErrorMessage name="position_code" class="text-danger x-small fw-bold mt-1 d-block" />
          </div>

          <!-- Nombre -->
          <div class="mb-4">
            <label class="form-label x-small fw-bold text-secondary text-uppercase"
              >Nombre del Cargo</label
            >
            <Field
              name="name"
              v-model="formData.name"
              type="text"
              class="form-control form-control-lg custom-input"
              :class="{ 'is-invalid': errors.name }"
              placeholder="Ej: TENS, MÉDICO"
            />
            <ErrorMessage name="name" class="text-danger x-small fw-bold mt-1 d-block" />
          </div>

          <!-- Descripcion -->
          <div class="mb-4">
            <label class="form-label x-small fw-bold text-secondary text-uppercase"
              >Descripción</label
            >
            <Field
              name="description"
              v-model="formData.description"
              as="textarea"
              rows="2"
              class="form-control custom-input"
              :class="{ 'is-invalid': errors.description }"
              placeholder="Breve descripción..."
            />
          </div>

          <!-- Activo -->
          <div v-if="isEditing" class="mb-4 d-flex align-items-center">
            <div class="form-check form-switch custom-switch">
              <input
                type="checkbox"
                class="form-check-input"
                v-model="formData.isActive"
                id="activoSwitch"
              />
              <label class="form-check-label fw-bold ms-2 text-dark" for="activoSwitch">
                Cargo Físico Activo
              </label>
            </div>
          </div>

          <!-- Footer Actions -->
          <div class="d-flex justify-content-end gap-2 mt-4">
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
  max-width: 550px;
  /* Fixed Height Implementation */
  max-height: 85vh;
  display: flex;
  flex-direction: column;

  border-radius: 24px;
  padding: 0; /* Padding moved to children */
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
  overflow-y: auto; /* Scrollable body */
  flex: 1;
}

.permissions-container {
  background-color: #f8fafc;
  border-color: #e2e8f0 !important;
}

.x-small-badge {
  font-size: 0.65rem;
  text-transform: uppercase;
  letter-spacing: 0.05em;
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
