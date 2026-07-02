<script setup lang="ts">
import { ref, watch, computed } from 'vue'
import { Form, Field, ErrorMessage } from 'vee-validate'
import * as yup from 'yup'
import { type JobRole } from '@/types/job-role.types'

const props = defineProps<{
  visible: boolean
  cargo?: JobRole | null
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
  nivel: yup.number().required().min(1).max(100),
  activo: yup.boolean()
})

const formData = ref({
  nombre: '',
  codigo: '',
  descripcion: '',
  nivel: 10,
  permisos: [] as string[],
  activo: true
})

// Definition of Modules and their Capabilities
const permissionModules = [
  {
    key: 'users',
    label: 'Funcionarios',
    capabilities: ['view', 'create', 'update', 'delete']
  },
  {
    key: 'cargos',
    label: 'Cargos',
    capabilities: ['view', 'create', 'update', 'delete']
  },
  {
    key: 'shifts',
    label: 'Turnos (Operaciones)',
    capabilities: ['view', 'create', 'update', 'delete']
  },
  {
    key: 'replacement',
    label: 'Reemplazos',
    capabilities: ['view', 'create', 'update', 'delete']
  },
  {
    key: 'config',
    label: 'Configuración (Servicios/Tipos)',
    capabilities: ['view', 'create', 'update', 'delete']
  },
  {
    key: 'audit',
    label: 'Auditoría',
    capabilities: ['view'] // Only View
  }
]

// Helper to check if a permission is selected
const hasPerm = (p: string) => formData.value.permisos.includes(p)

// Logic to toggle permissions with dependencies
const togglePermission = (moduleKey: string, cap: string, checked: boolean) => {
  const perm = `${moduleKey}.${cap}`
  let newPerms = [...formData.value.permisos]

  if (checked) {
    // Add permission
    if (!newPerms.includes(perm)) newPerms.push(perm)

    // If adding create/update/delete, MUST remove view? NO, MUST ADD view.
    if (['create', 'update', 'delete'].includes(cap)) {
      const viewPerm = `${moduleKey}.view`
      if (!newPerms.includes(viewPerm)) newPerms.push(viewPerm)
    }
  } else {
    // Remove permission
    newPerms = newPerms.filter((p) => p !== perm)

    // If removing view, MUST remove create/update/delete
    if (cap === 'view') {
      ;['create', 'update', 'delete'].forEach((c) => {
        newPerms = newPerms.filter((p) => p !== `${moduleKey}.${c}`)
      })
    }
  }

  formData.value.permisos = newPerms
}

// Initialize form
watch(
  () => props.cargo,
  (newVal) => {
    if (newVal) {
      formData.value = {
        nombre: newVal.nombre,
        codigo: newVal.codigo || '',
        descripcion: newVal.descripcion || '',
        nivel: newVal.nivel || 10,
        permisos: newVal.permisos || [],
        activo: newVal.activo
      }
    } else {
      formData.value = {
        nombre: '',
        codigo: '',
        descripcion: '',
        nivel: 10, // Default User
        permisos: [],
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

      <!-- Body (Scrollable) -->
      <div class="modal-body-custom">
        <Form @submit="onSubmit" :validation-schema="schema" v-slot="{ errors }">
          <!-- CODIGO (Read Only) -->
          <div v-if="formData.codigo" class="mb-4">
            <label class="form-label x-small fw-bold text-secondary text-uppercase mb-2"
              >Código (SKU)</label
            >
            <div class="d-flex align-items-center">
              <span
                class="badge bg-light text-dark border px-3 py-2 rounded-3 fw-bold font-monospace fs-6"
              >
                {{ formData.codigo }}
              </span>
            </div>
          </div>

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

          <!-- Nivel Jerarquico -->
          <div class="mb-4">
            <label class="form-label x-small fw-bold text-secondary text-uppercase"
              >Nivel de Acceso (1-100)</label
            >
            <div class="d-flex align-items-center gap-2">
              <Field
                name="nivel"
                v-model.number="formData.nivel"
                type="number"
                min="1"
                max="100"
                class="form-control custom-input w-25 text-center fw-bold"
                :class="{ 'is-invalid': errors.nivel }"
              />
              <div class="text-muted small lh-sm">
                10: Básico<br />50: Supervisor<br />100: Administrador
              </div>
            </div>
            <ErrorMessage name="nivel" class="text-danger x-small fw-bold mt-1 d-block" />
          </div>

          <!-- Descripcion -->
          <div class="mb-4">
            <label class="form-label x-small fw-bold text-secondary text-uppercase"
              >Descripción</label
            >
            <Field
              name="descripcion"
              v-model="formData.descripcion"
              as="textarea"
              rows="2"
              class="form-control custom-input"
              :class="{ 'is-invalid': errors.descripcion }"
              placeholder="Breve descripción..."
            />
          </div>

          <!-- Permisos Granulares -->
          <div class="mb-4">
            <label class="form-label x-small fw-bold text-secondary text-uppercase mb-2"
              >Permisos del Sistema</label
            >
            <div class="permissions-container border rounded-3 overflow-hidden">
              <div
                v-for="mod in permissionModules"
                :key="mod.key"
                class="module-row p-3 border-bottom bg-white"
              >
                <div class="d-flex align-items-center justify-content-between mb-2">
                  <span class="fw-bold text-dark small">{{ mod.label }}</span>
                  <!-- If NO View, show 'Oculto' tag -->
                  <span v-if="!hasPerm(`${mod.key}.view`)" class="badge bg-secondary x-small-badge"
                    >Oculto</span
                  >
                  <span v-else class="badge bg-success x-small-badge">Visible</span>
                </div>

                <div class="d-flex gap-3 flex-wrap">
                  <div
                    v-for="cap in mod.capabilities"
                    :key="cap"
                    class="form-check custom-checkbox"
                  >
                    <input
                      class="form-check-input"
                      type="checkbox"
                      :id="`${mod.key}-${cap}`"
                      :checked="hasPerm(`${mod.key}.${cap}`)"
                      @change="(e) => togglePermission(mod.key, cap, (e.target as HTMLInputElement).checked)"
                    />
                    <label
                      class="form-check-label x-small text-uppercase"
                      :for="`${mod.key}-${cap}`"
                    >
                      {{
                        cap === 'view'
                          ? 'Ver'
                          : cap === 'create'
                          ? 'Crear'
                          : cap === 'update'
                          ? 'Editar'
                          : 'Eliminar'
                      }}
                    </label>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- Activo -->
          <div v-if="isEditing" class="mb-4 d-flex align-items-center">
            <div class="form-check form-switch custom-switch">
              <input
                type="checkbox"
                class="form-check-input"
                v-model="formData.activo"
                id="activoSwitch"
              />
              <label class="form-check-label fw-bold ms-2 text-dark" for="activoSwitch">
                Cargo Activo
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
