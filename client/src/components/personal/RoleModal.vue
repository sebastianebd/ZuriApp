<script setup lang="ts">
import { ref, watch, computed } from 'vue'
import { Form, Field, ErrorMessage } from 'vee-validate'
import * as yup from 'yup'
import { type Role } from '@/stores/role.store'

const props = defineProps<{
  visible: boolean
  role?: Role | null
  loading?: boolean
}>()

const emit = defineEmits(['close', 'save'])

const isEditing = computed(() => !!props.role)
const modalTitle = computed(() => (isEditing.value ? 'Editar Rol' : 'Nuevo Rol'))
const btnLabel = computed(() => (isEditing.value ? 'Guardar Cambios' : 'Crear Rol'))

const schema = yup.object({
  name: yup.string().required('El nombre es obligatorio').min(3, 'Mínimo 3 caracteres'),
  code: yup.string().required('El código es obligatorio'),
  description: yup.string().max(200, 'Máximo 200 caracteres'),
  level: yup.number().required().min(1).max(100),
  hasSystemAccess: yup.boolean()
})

const formData = ref({
  name: '',
  code: '',
  description: '',
  level: 10,
  permissions: [] as string[],
  hasSystemAccess: false
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
const hasPerm = (p: string) => formData.value.permissions.includes(p)

// Logic to toggle permissions with dependencies
const togglePermission = (moduleKey: string, cap: string, checked: boolean) => {
  const perm = `${moduleKey}.${cap}`
  let newPerms = [...formData.value.permissions]

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

  formData.value.permissions = newPerms
}

// Initialize form
watch(
  () => props.role,
  (newVal) => {
    if (newVal) {
      formData.value = {
        name: newVal.name,
        code: newVal.code || '',
        description: newVal.description || '',
        level: newVal.level || 10,
        permissions: newVal.permissions || [],
        hasSystemAccess: newVal.hasSystemAccess || false
      }
    } else {
      formData.value = {
        name: '',
        code: '',
        description: '',
        level: 10, // Default User
        permissions: [],
        hasSystemAccess: false
      }
    }
  },
  { immediate: true }
)

function onSubmit() {
  emit('save', {
    ...formData.value,
    _id: props.role?._id
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
              >Código (SKU)</label
            >
            <Field
              name="code"
              v-model="formData.code"
              type="text"
              class="form-control form-control-lg custom-input font-monospace text-uppercase"
              :class="{ 'is-invalid': errors.code }"
              placeholder="Ej: SYS_ADMIN"
              :disabled="isEditing"
            />
            <ErrorMessage name="code" class="text-danger x-small fw-bold mt-1 d-block" />
          </div>

          <!-- Nombre -->
          <div class="mb-4">
            <label class="form-label x-small fw-bold text-secondary text-uppercase"
              >Nombre del Rol</label
            >
            <Field
              name="name"
              v-model="formData.name"
              type="text"
              class="form-control form-control-lg custom-input"
              :class="{ 'is-invalid': errors.name }"
              placeholder="Ej: Administrador"
            />
            <ErrorMessage name="name" class="text-danger x-small fw-bold mt-1 d-block" />
          </div>

          <!-- Nivel Jerarquico -->
          <div class="mb-4">
            <label class="form-label x-small fw-bold text-secondary text-uppercase"
              >Nivel de Acceso (1-100)</label
            >
            <div class="d-flex align-items-center gap-2">
              <Field
                name="level"
                v-model.number="formData.level"
                type="number"
                min="1"
                max="100"
                class="form-control custom-input w-25 text-center fw-bold"
                :class="{ 'is-invalid': errors.level }"
              />
              <div class="text-muted small lh-sm">
                10: Básico<br />50: Supervisor<br />100: Administrador
              </div>
            </div>
            <ErrorMessage name="level" class="text-danger x-small fw-bold mt-1 d-block" />
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

          <!-- System Access -->
          <div class="mb-4 bg-light p-3 rounded-3 border">
            <div class="d-flex align-items-center mb-2">
              <div class="form-check form-switch custom-switch flex-grow-1">
                <input
                  type="checkbox"
                  class="form-check-input"
                  v-model="formData.hasSystemAccess"
                  id="systemAccessSwitch"
                  :disabled="isEditing"
                />
                <label class="form-check-label fw-bold ms-2 text-dark" for="systemAccessSwitch">
                  Acceso al Sistema
                </label>
              </div>
            </div>
            <div
              v-if="formData.hasSystemAccess && !isEditing"
              class="alert alert-warning x-small fw-bold mb-0 mt-2 d-flex align-items-center"
            >
              <i class="bi bi-exclamation-triangle-fill me-2 fs-6"></i>
              <span>Esta acción es irreversible. Si concedes acceso al sistema, este rol generará permanentemente credenciales para sus usuarios.</span>
            </div>
            <div
              v-else-if="formData.hasSystemAccess && isEditing"
              class="text-muted x-small mt-1"
            >
              <i class="bi bi-info-circle me-1"></i>
              El acceso al sistema no puede ser modificado.
            </div>
            <div
              v-else-if="!formData.hasSystemAccess && isEditing"
              class="text-muted x-small mt-1"
            >
              <i class="bi bi-info-circle me-1"></i>
              El acceso al sistema no puede ser modificado.
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
