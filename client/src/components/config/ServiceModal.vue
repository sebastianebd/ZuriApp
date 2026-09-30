<script setup lang="ts">
import { ref, watch, computed } from 'vue'
import { Form, Field, ErrorMessage } from 'vee-validate'
import * as yup from 'yup'
import { useServiceStore, type Service } from '@/stores/service.store'
import { type IStaff } from '@/types/staff.types'
import StaffSelectionModal from '@/components/common/StaffSelectionModal.vue'

const props = defineProps<{
  visible: boolean
  service?: Service | null
  loading?: boolean
}>()

const emit = defineEmits(['close', 'save'])

const isEditing = computed(() => !!props.service)
const modalTitle = computed(() => (isEditing.value ? 'Editar Servicio' : 'Nuevo Servicio'))
const btnLabel = computed(() => (isEditing.value ? 'Guardar Cambios' : 'Crear Servicio'))

// Schema
const schema = yup.object({
  nombre: yup.string().required('El nombre es obligatorio'),
  email: yup.string().email('Formato de email inválido').nullable(),
  centro_costo: yup.string().nullable(),
  ubicacion: yup.string().nullable(),
  anexo: yup.string().nullable(),
  activo: yup.boolean()
})

// Form Data structure must match DTO logic mostly
const formData = ref({
  nombre: '',
  codigo: '',
  jefe_servicio: null as IStaff | null,
  supervisor: null as IStaff | null,
  coordinadores: [] as IStaff[], // Array of Users
  jefes_turno: [] as IStaff[], // Array of Users
  centro_costo: '',
  ubicacion: '',
  anexo: '',
  email: '',
  activo: true
})

// IStaff Selection Modal AuthState
const showUserModal = ref(false)
const userModalConfig = ref({
  title: '',
  multiple: false,
  max: 1,
  targetField: '' as keyof typeof formData.value,
  currentSelection: [] as IStaff[]
})

// Helpers to open modal
function openUserSelector(field: 'jefe_servicio' | 'supervisor') {
  userModalConfig.value = {
    title: field === 'jefe_servicio' ? 'Seleccionar Jefe de Servicio' : 'Seleccionar Supervisor',
    multiple: false,
    max: 1,
    targetField: field,
    currentSelection: formData.value[field] ? [formData.value[field] as IStaff] : []
  }
  showUserModal.value = true
}

function openUserSelectorMultiple(field: 'coordinadores' | 'jefes_turno') {
  const title =
    field === 'coordinadores' ? 'Seleccionar Coordinadores' : 'Seleccionar Jefes de Turno'
  userModalConfig.value = {
    title,
    multiple: true,
    max: 10,
    targetField: field,
    currentSelection: formData.value[field] as IStaff[]
  }
  showUserModal.value = true
}

// Handle Selection
function handleUserSelection(selection: IStaff | IStaff[]) {
  const field = userModalConfig.value.targetField

  if (field === 'jefe_servicio' || field === 'supervisor') {
    // Single
    formData.value[field] = selection as IStaff
  } else {
    // Multiple
    if (Array.isArray(selection)) {
      // Type assertion needed because formData types
      ;(formData.value[field] as IStaff[]) = selection
    } else {
      ;(formData.value[field] as IStaff[]) = [selection]
    }
  }
}

// Remove item from list
function removeUser(field: 'coordinadores' | 'jefes_turno', userId: string) {
  ;(formData.value[field] as IStaff[]) = (formData.value[field] as IStaff[]).filter(
    (u) => u._id !== userId
  )
}

function removeSingleUser(field: 'jefe_servicio' | 'supervisor') {
  formData.value[field] = null
}

const serviceStore = useServiceStore() // Access store for conflict check

// Helper to capitalize
const capitalize = (str: string) => str.charAt(0).toUpperCase() + str.slice(1).toLowerCase()

// Check if IStaff has roles in OTHER services
function getUserConflicts(IStaff: IStaff): string[] {
  if (!IStaff || !IStaff._id) return []

  const conflicts: string[] = []

  // Iterate all services
  serviceStore.services.forEach((svc) => {
    // Skip current service if editing
    if (isEditing.value && svc._id === props.service?._id) return

    // Check Jefe Servicio
    if (svc.jefe_servicio && (svc.jefe_servicio as any)._id === IStaff._id) {
      conflicts.push(`Jefe de Servicio en ${svc.nombre}`)
    }

    // Check Supervisor
    if (svc.supervisor && (svc.supervisor as any)._id === IStaff._id) {
      conflicts.push(`Supervisor en ${svc.nombre}`)
    }

    // Check Coordinadores
    if (svc.coordinadores && Array.isArray(svc.coordinadores)) {
      if (svc.coordinadores.some((u: any) => u._id === IStaff._id)) {
        conflicts.push(`Coordinador en ${svc.nombre}`)
      }
    }

    // Check Jefes de Turno
    if (svc.jefes_turno && Array.isArray(svc.jefes_turno)) {
      if (svc.jefes_turno.some((u: any) => u._id === IStaff._id)) {
        conflicts.push(`Jefe de Turno en ${svc.nombre}`)
      }
    }
  })

  return conflicts
}

// Initialize
watch(
  () => props.service,
  (newVal) => {
    if (newVal) {
      // Mapping populate data back to IStaff structure if possible
      // The store interfaces say `ServiceUserStub | string`.
      // We need to cast carefully.

      const mapUser = (u: any): IStaff | null =>
        u && typeof u === 'object'
          ? ({
              _id: u._id,
              firstName: u.nombre || u.firstName,
              lastName: u.apellido || u.lastName,
              rut: u.rut,
              email: u.email
            } as IStaff)
          : null

      const mapUsers = (list: any[] | undefined): IStaff[] => {
        if (!list) return []
        return list.map((u) => mapUser(u)).filter((u) => u !== null) as IStaff[]
      }

      formData.value = {
        nombre: newVal.nombre,
        codigo: newVal.codigo || '',
        jefe_servicio: mapUser(newVal.jefe_servicio),
        supervisor: mapUser(newVal.supervisor),
        coordinadores: Array.isArray(newVal.coordinadores) ? mapUsers(newVal.coordinadores) : [],
        jefes_turno: Array.isArray(newVal.jefes_turno) ? mapUsers(newVal.jefes_turno) : [],
        centro_costo: newVal.centro_costo || '',
        ubicacion: newVal.ubicacion || '',
        anexo: newVal.anexo || '',
        email: newVal.email || '',
        activo: newVal.activo
      }
    } else {
      formData.value = {
        nombre: '',
        codigo: '',
        jefe_servicio: null,
        supervisor: null,
        coordinadores: [],
        jefes_turno: [],
        centro_costo: '',
        ubicacion: '',
        anexo: '',
        email: '',
        activo: true
      }
    }
  },
  { immediate: true }
)

function onSubmit() {
  // Prepare DTO
  // We need to send IDs only
  const payload = {
    ...formData.value,
    jefe_servicio: formData.value.jefe_servicio?._id || null,
    supervisor: formData.value.supervisor?._id || null,
    coordinadores: formData.value.coordinadores.map((u) => u._id),
    jefes_turno: formData.value.jefes_turno.map((u) => u._id),

    // Pass original ID if editing
    _id: props.service?._id
  }
  emit('save', payload)
}
</script>

<template>
  <div v-if="visible" class="modal-backdrop-custom">
    <div class="modal-content-custom slide-up-fade modal-custom-width">
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
          
          <!-- SECCIÓN 1: INFORMACIÓN GENERAL -->
          <div class="vanguard-section-card mb-3 p-3 p-md-4">
            <div class="d-flex align-items-center justify-content-between mb-3 pb-2 border-bottom">
              <div class="d-flex align-items-center gap-2">
                <span class="section-indicator bg-primary"></span>
                <h6 class="fw-bold text-dark mb-0 section-heading">Información General</h6>
              </div>
            </div>

            <div class="row g-3">
              <div class="col-md-4" v-if="formData.codigo">
                <label class="form-label staff-field-label d-flex align-items-center gap-1 mb-1">
                  <i class="bi bi-upc-scan text-secondary"></i>
                  <span>Código</span>
                </label>
                <div class="p-2 bg-light rounded-3 border text-center font-monospace fw-bold small">
                  {{ formData.codigo }}
                </div>
              </div>
              
              <div :class="formData.codigo ? 'col-md-8' : 'col-12'">
                <label class="form-label staff-field-label d-flex align-items-center gap-1 mb-1">
                  <i class="bi bi-hospital text-secondary"></i>
                  <span>Nombre del Servicio</span>
                  <span class="text-danger">*</span>
                </label>
                <Field
                  name="nombre"
                  v-model="formData.nombre"
                  type="text"
                  class="form-control form-control-sm modern-input"
                  :class="{ 'is-invalid': errors.nombre }"
                  placeholder="Ej: UCI Pediátrica"
                />
                <ErrorMessage name="nombre" class="text-danger x-small fw-bold mt-1 d-block" />
              </div>
            </div>

            <!-- Activo Switch -->
            <div v-if="isEditing" class="mt-3 pt-3 border-top d-flex align-items-center justify-content-between">
              <div>
                <span class="d-block text-dark fw-bold small">Estado Operativo</span>
                <span class="d-block text-muted x-small">Determina si el servicio está habilitado</span>
              </div>
              <div class="form-check form-switch m-0">
                <input
                  type="checkbox"
                  class="form-check-input"
                  v-model="formData.activo"
                  style="width: 2.5rem; height: 1.25rem; cursor: pointer;"
                />
              </div>
            </div>
          </div>

          <!-- SECCIÓN 2: LIDERAZGO Y GESTIÓN -->
          <div class="vanguard-section-card mb-3 p-3 p-md-4">
            <div class="d-flex align-items-center justify-content-between mb-3 pb-2 border-bottom">
              <div class="d-flex align-items-center gap-2">
                <span class="section-indicator bg-info"></span>
                <h6 class="fw-bold text-dark mb-0 section-heading">Liderazgo & Gestión</h6>
              </div>
            </div>

            <!-- Row 1: Jefe Servicio + Supervisor -->
            <div class="row g-3 mb-3">
              <!-- Jefe Servicio -->
              <div class="col-md-6">
                <label class="form-label staff-field-label d-flex justify-content-between align-items-center mb-1">
                  <span class="d-flex align-items-center gap-1">
                    <i class="bi bi-person-check text-secondary"></i>
                    <span>Jefe de Servicio (1)</span>
                  </span>
                  <button type="button" class="btn btn-link p-0 text-decoration-none x-small fw-bold text-primary" @click="openUserSelector('jefe_servicio')">
                    <i class="bi bi-search me-1"></i>Buscar
                  </button>
                </label>

                <div v-if="formData.jefe_servicio">
                  <div class="selected-IStaff-card">
                    <div class="d-flex align-items-center gap-2">
                      <div class="avatar-sm bg-light text-dark border">
                        {{ formData.jefe_servicio.firstName.charAt(0) }}
                      </div>
                      <div class="lh-sm">
                        <div class="fw-bold x-small text-dark">
                          {{ formData.jefe_servicio.firstName }} {{ formData.jefe_servicio.lastName }}
                        </div>
                        <div class="text-muted x-xx-small">{{ formData.jefe_servicio.rut }}</div>
                      </div>
                    </div>
                    <button type="button" class="btn-remove" @click="removeSingleUser('jefe_servicio')">
                      <i class="bi bi-x"></i>
                    </button>
                  </div>
                </div>
                <div v-else class="empty-selection" @click="openUserSelector('jefe_servicio')">
                  <i class="bi bi-person-plus text-muted fs-4"></i>
                  <span class="text-muted x-small mt-1">Asignar Jefe</span>
                </div>
              </div>

              <!-- Supervisor -->
              <div class="col-md-6">
                <label class="form-label staff-field-label d-flex justify-content-between align-items-center mb-1">
                  <span class="d-flex align-items-center gap-1">
                    <i class="bi bi-person-badge text-secondary"></i>
                    <span>Supervisor (1)</span>
                  </span>
                  <button type="button" class="btn btn-link p-0 text-decoration-none x-small fw-bold text-primary" @click="openUserSelector('supervisor')">
                    <i class="bi bi-search me-1"></i>Buscar
                  </button>
                </label>

                <div v-if="formData.supervisor">
                  <div class="selected-IStaff-card">
                    <div class="d-flex align-items-center gap-2">
                      <div class="avatar-sm bg-light text-dark border">
                        {{ formData.supervisor.firstName.charAt(0) }}
                      </div>
                      <div class="lh-sm">
                        <div class="fw-bold x-small text-dark">
                          {{ formData.supervisor.firstName }} {{ formData.supervisor.lastName }}
                        </div>
                        <div class="text-muted x-xx-small">{{ formData.supervisor.rut }}</div>
                      </div>
                    </div>
                    <button type="button" class="btn-remove" @click="removeSingleUser('supervisor')">
                      <i class="bi bi-x"></i>
                    </button>
                  </div>
                </div>
                <div v-else class="empty-selection" @click="openUserSelector('supervisor')">
                  <i class="bi bi-person-plus text-muted fs-4"></i>
                  <span class="text-muted x-small mt-1">Asignar Supervisor</span>
                </div>
              </div>
            </div>

            <!-- Row 2: Coordinadores -->
            <div class="mb-3">
              <label class="form-label staff-field-label d-flex justify-content-between align-items-center mb-1">
                <span class="d-flex align-items-center gap-1">
                  <i class="bi bi-people text-secondary"></i>
                  <span>Coordinadores (Max 10)</span>
                </span>
                <button type="button" class="btn btn-link p-0 text-decoration-none x-small fw-bold text-primary" @click="openUserSelectorMultiple('coordinadores')">
                  <i class="bi bi-plus-lg me-1"></i>Agregar
                </button>
              </label>
              <div class="d-flex flex-wrap gap-2">
                <div v-for="IStaff in formData.coordinadores" :key="IStaff._id" class="chip-IStaff">
                  <span class="x-small fw-bold text-dark">{{ IStaff.firstName }} {{ IStaff.lastName }}</span>
                  <i class="bi bi-x ms-2 cursor-pointer text-muted" @click="removeUser('coordinadores', IStaff._id)"></i>
                </div>
                <div v-if="formData.coordinadores.length === 0" class="text-muted x-small fst-italic py-1">
                  Sin coordinadores asignados
                </div>
              </div>
            </div>

            <!-- Row 3: Jefes de Turno -->
            <div class="mb-2">
              <label class="form-label staff-field-label d-flex justify-content-between align-items-center mb-1">
                <span class="d-flex align-items-center gap-1">
                  <i class="bi bi-diagram-3 text-secondary"></i>
                  <span>Jefes de Turno (Max 10)</span>
                </span>
                <button type="button" class="btn btn-link p-0 text-decoration-none x-small fw-bold text-primary" @click="openUserSelectorMultiple('jefes_turno')">
                  <i class="bi bi-plus-lg me-1"></i>Agregar
                </button>
              </label>
              <div class="d-flex flex-wrap gap-2">
                <div v-for="IStaff in formData.jefes_turno" :key="IStaff._id" class="chip-IStaff bg-dark text-white border-0">
                  <span class="x-small fw-bold">{{ IStaff.firstName }} {{ IStaff.lastName }}</span>
                  <i class="bi bi-x ms-2 cursor-pointer text-white-50" @click="removeUser('jefes_turno', IStaff._id)"></i>
                </div>
                <div v-if="formData.jefes_turno.length === 0" class="text-muted x-small fst-italic py-1">
                  Sin jefes de turno asignados
                </div>
              </div>
            </div>
          </div>

          <!-- SECCIÓN 3: UBICACIÓN & CONTACTO -->
          <div class="vanguard-section-card mb-3 p-3 p-md-4">
            <div class="d-flex align-items-center justify-content-between mb-3 pb-2 border-bottom">
              <div class="d-flex align-items-center gap-2">
                <span class="section-indicator bg-warning"></span>
                <h6 class="fw-bold text-dark mb-0 section-heading">Ubicación y Contacto</h6>
              </div>
            </div>
            
            <div class="row g-3">
              <div class="col-md-6">
                <label class="form-label staff-field-label d-flex align-items-center gap-1 mb-1">
                  <i class="bi bi-hash text-secondary"></i>
                  <span>Centro de Costo</span>
                </label>
                <Field
                  name="centro_costo"
                  v-model="formData.centro_costo"
                  type="text"
                  class="form-control form-control-sm modern-input"
                  placeholder="Ej: CC-2024"
                />
              </div>
              
              <div class="col-md-6">
                <label class="form-label staff-field-label d-flex align-items-center gap-1 mb-1">
                  <i class="bi bi-geo-alt text-secondary"></i>
                  <span>Ubicación Física</span>
                </label>
                <Field
                  name="ubicacion"
                  v-model="formData.ubicacion"
                  type="text"
                  class="form-control form-control-sm modern-input"
                  placeholder="Ej: Piso 3, Ala Norte"
                />
              </div>
              
              <div class="col-md-6">
                <label class="form-label staff-field-label d-flex align-items-center gap-1 mb-1">
                  <i class="bi bi-telephone text-secondary"></i>
                  <span>Anexo Telefónico</span>
                </label>
                <Field
                  name="anexo"
                  v-model="formData.anexo"
                  type="text"
                  class="form-control form-control-sm modern-input"
                  placeholder="Ej: 5544"
                />
              </div>
              
              <div class="col-md-6">
                <label class="form-label staff-field-label d-flex align-items-center gap-1 mb-1">
                  <i class="bi bi-envelope text-secondary"></i>
                  <span>Email de Contacto</span>
                </label>
                <Field
                  name="email"
                  v-model="formData.email"
                  type="email"
                  class="form-control form-control-sm modern-input"
                  placeholder="servicio@hospital.cl"
                />
              </div>
            </div>
          </div>

          <!-- Footer Actions -->
          <div class="vanguard-modal-footer mt-4 pt-3 d-flex justify-content-end gap-2">
            <button
              type="button"
              class="btn btn-secondary-pill"
              @click="$emit('close')"
            >
              Cancelar
            </button>
            <button
              type="submit"
              class="btn btn-primary-pill"
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

  <!-- IStaff Selection Modal -->
  <StaffSelectionModal
    :visible="showUserModal"
    :title="userModalConfig.title"
    :multiple="userModalConfig.multiple"
    :max="userModalConfig.max"
    :initial-selected="userModalConfig.currentSelection"
    @close="showUserModal = false"
    @select="handleUserSelection"
  />
</template>

<style scoped>
/* Transición Modal */
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.25s cubic-bezier(0.32, 0.72, 0, 1);
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

/* Modal Dialog Width & Elevation */
.modal-custom-width {
  max-width: 820px;
}

.modal-backdrop-custom {
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  background: rgba(15, 23, 42, 0.5);
  backdrop-filter: blur(4px);
  z-index: 1050;
  display: flex;
  align-items: center;
  justify-content: center;
}

.modal-content-custom {
  background: white;
  width: 90%;
  max-height: 90vh;
  display: flex;
  flex-direction: column;
  border-radius: 20px;
  padding: 0;
  border: 1px solid #e2e8f0;
  box-shadow: 0 25px 50px -12px rgba(15, 23, 42, 0.25);
  animation: slideUp 0.3s cubic-bezier(0.16, 1, 0.3, 1);
  overflow: hidden;
}

.modal-header-custom {
  background: white;
  border-bottom: 1px solid #f1f5f9;
  padding: 1.5rem 2rem;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.modal-body-custom {
  padding: 1.5rem 2rem;
  overflow-y: auto;
  flex: 1;
  background-color: #f8fafc;
}

.btn-close-custom {
  width: 34px;
  height: 34px;
  border-radius: 50%;
  border: 1px solid #e2e8f0;
  background: #ffffff;
  color: #64748b;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.8rem;
  cursor: pointer;
  transition: all 0.2s cubic-bezier(0.32, 0.72, 0, 1);
}

.btn-close-custom:hover {
  background: #f1f5f9;
  color: #0f172a;
  transform: rotate(90deg);
}

/* Vanguard Section Card (Double-Bezel Inner Card) */
.vanguard-section-card {
  background: white;
  border: 1px solid #e2e8f0;
  border-radius: 16px;
  box-shadow: 0 2px 6px rgba(15, 23, 42, 0.02);
}

.section-indicator {
  width: 4px;
  height: 16px;
  border-radius: 9999px;
  display: inline-block;
}

.section-heading {
  font-size: 0.88rem;
  letter-spacing: -0.01em;
}

/* Fields & Labels */
.staff-field-label {
  font-size: 0.74rem;
  font-weight: 700;
  color: #475569;
  letter-spacing: 0.01em;
}

.modern-input {
  font-size: 0.82rem;
  border-radius: 10px;
  border: 1px solid #cbd5e1;
  background-color: #ffffff;
  padding: 0.5rem 0.75rem;
  color: #1e293b;
  transition: all 0.2s cubic-bezier(0.32, 0.72, 0, 1);
}

.modern-input:focus {
  border-color: #3b82f6;
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.12);
  outline: none;
}

/* Footer & Buttons */
.vanguard-modal-footer {
  border-top: 1px solid #f1f5f9;
}

.btn-secondary-pill {
  background: white;
  color: #334155;
  border: 1px solid #cbd5e1;
  border-radius: 9999px;
  padding: 0.45rem 1.25rem;
  font-weight: 600;
  font-size: 0.85rem;
  box-shadow: 0 1px 3px rgba(15, 23, 42, 0.05);
  transition: all 0.2s cubic-bezier(0.32, 0.72, 0, 1);
}

.btn-secondary-pill:hover {
  background: #f8fafc;
  border-color: #94a3b8;
  color: #0f172a;
  transform: translateY(-1px);
}

.btn-primary-pill {
  background: linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%);
  color: white;
  border: 1px solid rgba(255, 255, 255, 0.15);
  border-radius: 9999px;
  padding: 0.45rem 1.25rem;
  font-weight: 600;
  font-size: 0.85rem;
  box-shadow: 0 4px 12px rgba(37, 99, 235, 0.25);
  transition: all 0.2s cubic-bezier(0.32, 0.72, 0, 1);
}

.btn-primary-pill:hover:not(:disabled) {
  background: linear-gradient(135deg, #1d4ed8 0%, #1e40af 100%);
  transform: translateY(-1px);
  box-shadow: 0 6px 16px rgba(37, 99, 235, 0.35);
  color: white;
}

.btn-primary-pill:disabled {
  opacity: 0.6;
  cursor: not-allowed;
  box-shadow: none;
}

@keyframes slideUp {
  from {
    opacity: 0;
    transform: translateY(20px) scale(0.98);
  }
  to {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
}

.empty-selection {
  border: 2px dashed #e2e8f0;
  border-radius: 12px;
  height: 60px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.2s;
  background: #f8fafc;
}
.empty-selection:hover {
  border-color: #3b82f6;
  background: #eff6ff;
}
.selected-IStaff-card {
  border: 1px solid #e2e8f0;
  border-radius: 12px;
  padding: 0.4rem 0.75rem;
  display: flex;
  align-items: center;
  justify-content: space-between;
  background: #fff;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
}
.avatar-sm {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: bold;
  font-size: 0.8rem;
}
.btn-remove {
  border: none;
  background: transparent;
  color: #94a3b8;
  width: 24px;
  height: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
}
.btn-remove:hover {
  background: #fee2e2;
  color: #ef4444;
}
.chip-IStaff {
  display: inline-flex;
  align-items: center;
  background: #f1f5f9;
  padding: 4px 10px;
  border-radius: 20px;
  border: 1px solid #e2e8f0;
  transition: all 0.2s;
}
.chip-IStaff:hover {
  background: #e2e8f0;
}
</style>
