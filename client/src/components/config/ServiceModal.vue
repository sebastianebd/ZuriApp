<template>
  <div v-if="visible" class="modal-backdrop fade show"></div>
  <div v-if="visible" class="modal fade show d-block" tabindex="-1" role="dialog" aria-modal="true">
    <div class="modal-dialog modal-dialog-centered modal-lg" role="document">
      <div class="modal-content border-0 shadow-lg rounded-4 overflow-hidden">
        <!-- Header -->
        <div class="modal-header border-bottom-0 p-4 bg-light">
          <div class="d-flex align-items-center gap-3">
            <div class="icon-square bg-primary bg-opacity-10 text-primary">
              <i class="bi bi-hospital fs-5"></i>
            </div>
            <h5 class="modal-title fw-bold text-dark mb-0">
              {{ service ? 'Editar Servicio' : 'Nuevo Servicio' }}
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
            <!-- Section: General -->
            <div class="row g-4 mb-4">
              <div class="col-12 col-md-8">
                <label class="form-label fw-semibold text-secondary small text-uppercase ls-1">
                  Nombre del Servicio <span class="text-danger">*</span>
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
                    placeholder="Ej: UCI, Urgencias, Pabellón"
                  />
                </div>
                <div v-if="errors.nombre" class="invalid-feedback d-block mt-1">
                  {{ errors.nombre }}
                </div>
              </div>

              <div class="col-12 col-md-4">
                <label class="form-label fw-semibold text-secondary small text-uppercase ls-1">
                  Estado
                </label>
                <div
                  class="form-check form-switch d-flex align-items-center gap-2 ps-0 p-2 border rounded bg-light"
                >
                  <input
                    class="form-check-input ms-2"
                    type="checkbox"
                    role="switch"
                    id="activoSwitch"
                    v-model="formData.activo"
                  />
                  <label class="form-check-label fw-medium cursor-pointer" for="activoSwitch">
                    {{ formData.activo ? 'Activo' : 'Inactivo' }}
                  </label>
                </div>
              </div>
            </div>

            <!-- Section: Ubicación & Administrativo -->
            <h6 class="fw-bold text-dark mb-3 pb-2 border-bottom">Ubicación y Administrativo</h6>
            <div class="row g-3 mb-4">
              <div class="col-12 col-md-6">
                <label class="form-label fw-semibold text-secondary small text-uppercase ls-1">
                  Centro de Costos
                </label>
                <input
                  type="text"
                  class="form-control shadow-none"
                  v-model="formData.centro_costo"
                  placeholder="Ej: CC-1020"
                />
              </div>
              <div class="col-12 col-md-6">
                <label class="form-label fw-semibold text-secondary small text-uppercase ls-1">
                  Ubicación Física
                </label>
                <input
                  type="text"
                  class="form-control shadow-none"
                  v-model="formData.ubicacion"
                  placeholder="Ej: Torre A, Piso 3"
                />
              </div>
              <div class="col-12 col-md-6">
                <label class="form-label fw-semibold text-secondary small text-uppercase ls-1">
                  Anexo Telefónico
                </label>
                <div class="input-group">
                  <span class="input-group-text bg-white border-end-0 text-muted">
                    <i class="bi bi-telephone"></i>
                  </span>
                  <input
                    type="text"
                    class="form-control border-start-0 shadow-none ps-0"
                    v-model="formData.anexo"
                    placeholder="Ej: 5500"
                  />
                </div>
              </div>
              <div class="col-12 col-md-6">
                <label class="form-label fw-semibold text-secondary small text-uppercase ls-1">
                  Email de Contacto
                </label>
                <div class="input-group">
                  <span class="input-group-text bg-white border-end-0 text-muted">
                    <i class="bi bi-envelope"></i>
                  </span>
                  <input
                    type="email"
                    class="form-control border-start-0 shadow-none ps-0"
                    :class="{ 'is-invalid': errors.email }"
                    v-model="formData.email"
                    placeholder="servicio@hospital.cl"
                  />
                </div>
                <div v-if="errors.email" class="invalid-feedback d-block mt-1">
                  {{ errors.email }}
                </div>
              </div>
            </div>

            <!-- Section: Liderazgo -->
            <h6 class="fw-bold text-dark mb-3 pb-2 border-bottom">Liderazgo del Servicio</h6>
            <div class="row g-3">
              <div class="col-12 col-md-6">
                <label class="form-label fw-semibold text-secondary small text-uppercase ls-1">
                  Jefe Médico
                </label>
                <select class="form-select shadow-none" v-model="formData.jefe_medico">
                  <option :value="undefined">Seleccionar...</option>
                  <option v-for="user in users" :key="user._id" :value="user._id">
                    {{ user.nombre }} {{ user.apellido }} ({{ user.rut }})
                  </option>
                </select>
                <small class="text-muted d-block mt-1 fst-italic">
                  Responsable clínico del servicio.
                </small>
              </div>
              <div class="col-12 col-md-6">
                <label class="form-label fw-semibold text-secondary small text-uppercase ls-1">
                  Enfermero/a Coordinador/a
                </label>
                <select class="form-select shadow-none" v-model="formData.enfermero_coordinador">
                  <option :value="undefined">Seleccionar...</option>
                  <option v-for="user in users" :key="user._id" :value="user._id">
                    {{ user.nombre }} {{ user.apellido }} ({{ user.rut }})
                  </option>
                </select>
                <small class="text-muted d-block mt-1 fst-italic">
                  Responsable de gestión de turnos.
                </small>
              </div>
            </div>

            <!-- Action Buttons -->
            <div class="d-flex justify-content-end gap-2 mt-5">
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
                <span>{{ service ? 'Guardar Cambios' : 'Crear Servicio' }}</span>
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch, reactive, onMounted } from 'vue'
import type { Service } from '@/stores/service.store'
import { useUserStore } from '@/stores/user.store'

interface UserStub {
  _id: string
  nombre: string
  apellido: string
  rut: string
  tipo_cargo?: string
}

const props = defineProps<{
  visible: boolean
  service: Service | null
  loading: boolean
}>()

const emit = defineEmits(['close', 'save'])
const userStore = useUserStore()
const users = ref<UserStub[]>([])

const formData = reactive({
  nombre: '',
  activo: true,
  centro_costo: '',
  ubicacion: '',
  anexo: '',
  email: '',
  jefe_medico: undefined as string | undefined,
  enfermero_coordinador: undefined as string | undefined
})

const errors = reactive({
  nombre: '',
  email: ''
})

// Extract ID helper
const getId = (val: any) => (typeof val === 'object' && val ? val._id : val)

watch(
  () => props.visible,
  async (val) => {
    if (val) {
      // Load users if not loaded
      if (users.value.length === 0) {
        try {
          const res = await userStore.mostrarTodos()
          users.value = res // Assuming res is array of users
        } catch (e) {
          console.error('Failed to load users', e)
        }
      }

      // Populate Form
      if (props.service) {
        formData.nombre = props.service.nombre || ''
        formData.activo = props.service.activo ?? true
        formData.centro_costo = props.service.centro_costo || ''
        formData.ubicacion = props.service.ubicacion || ''
        formData.anexo = props.service.anexo || ''
        formData.email = props.service.email || ''
        formData.jefe_medico = getId(props.service.jefe_medico)
        formData.enfermero_coordinador = getId(props.service.enfermero_coordinador)
      } else {
        // Reset for Create
        formData.nombre = ''
        formData.activo = true
        formData.centro_costo = ''
        formData.ubicacion = ''
        formData.anexo = ''
        formData.email = ''
        formData.jefe_medico = undefined
        formData.enfermero_coordinador = undefined
      }
      errors.nombre = ''
      errors.email = ''
    }
  }
)

function validate() {
  errors.nombre = ''
  errors.email = ''
  let isValid = true

  if (!formData.nombre.trim()) {
    errors.nombre = 'El nombre es requerido'
    isValid = false
  }

  if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
    errors.email = 'Email inválido'
    isValid = false
  }

  return isValid
}

function handleSubmit() {
  if (!validate()) return

  emit('save', {
    ...formData,
    nombre: formData.nombre.trim(),
    centro_costo: formData.centro_costo?.trim() || undefined,
    ubicacion: formData.ubicacion?.trim() || undefined,
    anexo: formData.anexo?.trim() || undefined,
    email: formData.email?.trim() || undefined
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

.form-control:focus,
.form-select:focus {
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

.cursor-pointer {
  cursor: pointer;
}
</style>
