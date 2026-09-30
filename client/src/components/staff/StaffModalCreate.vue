<template>
  <Transition name="fade">
    <div
      class="modal fade show d-block"
      v-if="visible"
      tabindex="-1"
      role="dialog"
      aria-modal="true"
      style="background-color: rgba(15, 23, 42, 0.65); backdrop-filter: blur(8px)"
    >
      <div class="modal-dialog modal-lg modal-dialog-centered modal-custom-width" role="document">
        <div class="modal-content vanguard-modal-content border-0 shadow-2xl rounded-4 overflow-hidden">
          <!-- HEADER VANGUARDISTA -->
          <div class="modal-header vanguard-modal-header p-4 border-bottom d-flex align-items-center justify-content-between">
            <div class="d-flex align-items-center gap-3">
              <div class="modal-icon-box shadow-sm">
                <i class="bi bi-person-plus-fill text-primary fs-5"></i>
              </div>
              <div>
                <div class="d-flex align-items-center gap-2">
                  <h5 class="modal-title fw-bold text-dark mb-0 modal-title-custom">Nuevo Usuario</h5>
                  <span class="badge-role-tag">Alta de Personal</span>
                </div>
                <p class="text-secondary small mb-0 mt-1">
                  Completa la ficha para registrar y habilitar al funcionario en el sistema.
                </p>
              </div>
            </div>
            <button
              type="button"
              class="btn-close-modal"
              @click="emit('cerrar')"
              aria-label="Cerrar modal"
            >
              <i class="bi bi-x-lg"></i>
            </button>
          </div>

          <!-- BODY CON DOBLE BISEL -->
          <div class="modal-body p-4 bg-surface">
            <form @submit.prevent="abrirConfirmacion">
              <div class="row g-3">
                <!-- Columna izquierda: Datos Personales -->
                <div class="col-12 col-md-6">
                  <div class="vanguard-section-card p-3 p-md-4 h-100 d-flex flex-column justify-content-between">
                    <div>
                      <div class="d-flex align-items-center justify-content-between mb-3 pb-2 border-bottom">
                        <div class="d-flex align-items-center gap-2">
                          <span class="section-indicator bg-primary"></span>
                          <h6 class="fw-bold text-dark mb-0 section-heading">Datos Personales</h6>
                        </div>
                        <i class="bi bi-person-vcard text-secondary opacity-75"></i>
                      </div>

                      <!-- RUT -->
                      <div class="mb-3">
                        <label class="form-label staff-field-label mb-1">
                          RUT <span class="text-danger">*</span>
                        </label>
                        <input
                          v-model="form.rut"
                          class="form-control form-input-custom font-monospace"
                          :class="{ 'is-invalid': errors.rut }"
                          placeholder="12.345.678-9"
                          @input="handleRutInput"
                        />
                        <div v-if="errors.rut" class="text-danger x-small fw-semibold mt-1">
                          {{ errors.rut }}
                        </div>
                      </div>

                      <!-- Nombre -->
                      <div class="mb-3">
                        <label class="form-label staff-field-label mb-1">
                          Nombre <span class="text-danger">*</span>
                        </label>
                        <input
                          v-model="form.firstName"
                          class="form-control form-input-custom"
                          :class="{ 'is-invalid': errors.firstName }"
                          placeholder="Ej: Sebastián"
                        />
                        <div v-if="errors.firstName" class="text-danger x-small fw-semibold mt-1">
                          {{ errors.firstName }}
                        </div>
                      </div>

                      <!-- Apellido -->
                      <div class="mb-3">
                        <label class="form-label staff-field-label mb-1">
                          Apellido <span class="text-danger">*</span>
                        </label>
                        <input
                          v-model="form.lastName"
                          class="form-control form-input-custom"
                          :class="{ 'is-invalid': errors.lastName }"
                          placeholder="Ej: Barría"
                        />
                        <div v-if="errors.lastName" class="text-danger x-small fw-semibold mt-1">
                          {{ errors.lastName }}
                        </div>
                      </div>

                      <!-- Fecha de Nacimiento -->
                      <div class="mb-3">
                        <label class="form-label staff-field-label mb-1">
                          Fecha de Nacimiento <span class="text-danger">*</span>
                        </label>
                        <DatePicker
                          v-model="form.birthDate"
                          :popover="popoverConfig"
                          :masks="{ input: 'DD/MM/YYYY' }"
                        >
                          <template #default="{ inputValue, inputEvents }">
                            <div class="input-group modern-input-group">
                              <span class="input-group-text">
                                <i class="bi bi-calendar3"></i>
                              </span>
                              <input
                                class="form-control modern-date-input"
                                :class="{ 'is-invalid': errors.birthDate }"
                                :value="inputValue"
                                v-on="inputEvents"
                                placeholder="Seleccione fecha"
                                readonly
                              />
                            </div>
                          </template>
                        </DatePicker>
                        <div v-if="errors.birthDate" class="text-danger x-small fw-semibold mt-1">
                          {{ errors.birthDate }}
                        </div>
                      </div>

                      <!-- Dirección -->
                      <div class="mb-3">
                        <label class="form-label staff-field-label mb-1">
                          Dirección <span class="text-danger">*</span>
                        </label>
                        <input
                          v-model="form.address"
                          class="form-control form-input-custom"
                          :class="{ 'is-invalid': errors.address }"
                          placeholder="Calle, Número"
                        />
                        <div v-if="errors.address" class="text-danger x-small fw-semibold mt-1">
                          {{ errors.address }}
                        </div>
                      </div>

                      <!-- Ciudad -->
                      <div class="mb-1">
                        <label class="form-label staff-field-label mb-1">
                          Ciudad <span class="text-danger">*</span>
                        </label>
                        <input
                          v-model="form.city"
                          class="form-control form-input-custom"
                          :class="{ 'is-invalid': errors.city }"
                          placeholder="Ej: Santiago"
                        />
                        <div v-if="errors.city" class="text-danger x-small fw-semibold mt-1">
                          {{ errors.city }}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <!-- Columna derecha: Cuenta y Contacto -->
                <div class="col-12 col-md-6">
                  <div class="vanguard-section-card p-3 p-md-4 h-100 d-flex flex-column justify-content-between">
                    <div>
                      <div class="d-flex align-items-center justify-content-between mb-3 pb-2 border-bottom">
                        <div class="d-flex align-items-center gap-2">
                          <span class="section-indicator bg-indigo"></span>
                          <h6 class="fw-bold text-dark mb-0 section-heading">Contacto y Cargo</h6>
                        </div>
                        <i class="bi bi-briefcase text-secondary opacity-75"></i>
                      </div>

                      <!-- Teléfono -->
                      <div class="mb-3">
                        <label class="form-label staff-field-label mb-1">
                          Teléfono <span class="text-danger">*</span>
                        </label>
                        <div class="input-group modern-input-group">
                          <span class="input-group-text fw-bold">
                            +56
                          </span>
                          <input
                            v-model="form.phone"
                            type="text"
                            class="form-control modern-date-input"
                            :class="{ 'is-invalid': errors.phone }"
                            placeholder="912345678"
                            maxlength="9"
                            @input="form.phone = form.phone.replace(/[^0-9]/g, '')"
                          />
                        </div>
                        <div v-if="errors.phone" class="text-danger x-small fw-semibold mt-1">
                          {{ errors.phone }}
                        </div>
                      </div>

                      <!-- Email -->
                      <div class="mb-3">
                        <label class="form-label staff-field-label mb-1">
                          Email <span class="text-danger">*</span>
                        </label>
                        <input
                          v-model="form.email"
                          type="email"
                          class="form-control form-input-custom"
                          :class="{ 'is-invalid': errors.email }"
                          placeholder="correo@ejemplo.com"
                        />
                        <div v-if="errors.email" class="text-danger x-small fw-semibold mt-1">
                          {{ errors.email }}
                        </div>
                      </div>

                      <!-- Rol -->
                      <div class="mb-3">
                        <label class="form-label staff-field-label mb-1">
                          Rol (Perfil de Acceso) <span class="text-danger">*</span>
                        </label>
                        <v-select
                          v-model="form.roleId"
                          :options="listaRoles"
                          label="name"
                          :reduce="(role: any) => role._id"
                          placeholder="Seleccione rol"
                          class="custom-v-select small-select"
                          :class="{ 'is-invalid': errors.roleId }"
                          :clearable="false"
                          :searchable="true"
                        >
                          <template #option="option">
                            <div class="d-flex justify-content-between align-items-center py-1">
                              <span class="fw-semibold text-dark">{{ option.name }}</span>
                              <span class="badge bg-light text-secondary border x-small">{{ option.code }}</span>
                            </div>
                          </template>
                        </v-select>
                        <div v-if="errors.roleId" class="text-danger x-small fw-semibold mt-1">
                          {{ errors.roleId }}
                        </div>
                      </div>

                      <!-- Cargo Físico -->
                      <div class="mb-3">
                        <label class="form-label staff-field-label mb-1">
                          Cargo Físico (Position) <span class="text-danger">*</span>
                        </label>
                        <v-select
                          v-model="form.positionId"
                          :options="listaPositions"
                          label="name"
                          :reduce="(pos: any) => pos._id"
                          placeholder="Seleccione cargo"
                          class="custom-v-select small-select"
                          :class="{ 'is-invalid': errors.positionId }"
                          :clearable="false"
                          :searchable="true"
                        />
                        <div v-if="errors.positionId" class="text-danger x-small fw-semibold mt-1">
                          {{ errors.positionId }}
                        </div>
                      </div>

                      <!-- Tipo Contrato -->
                      <div class="mb-3">
                        <label class="form-label staff-field-label mb-1">
                          Tipo Contrato <span class="text-danger">*</span>
                        </label>
                        <v-select
                          v-model="form.contractType"
                          :options="listaTipoContrato"
                          placeholder="Seleccione contrato"
                          class="custom-v-select small-select"
                          :class="{ 'is-invalid': errors.contractType }"
                          :clearable="false"
                          :searchable="false"
                        />
                        <div v-if="errors.contractType" class="text-danger x-small fw-semibold mt-1">
                          {{ errors.contractType }}
                        </div>
                      </div>

                      <!-- Disponibilidad Operativa -->
                      <div class="p-3 bg-light rounded-3 border mt-2">
                        <div class="d-flex align-items-center justify-content-between">
                          <div>
                            <span class="staff-field-label d-block mb-0">Disponibilidad Operativa</span>
                            <span class="text-muted x-small">Habilita al funcionario para turnos y coberturas</span>
                          </div>
                          <div class="form-check form-switch fs-5 mb-0">
                            <input
                              class="form-check-input shadow-none cursor-pointer"
                              type="checkbox"
                              role="switch"
                              v-model="form.isActive"
                            />
                          </div>
                        </div>
                        <div class="mt-1">
                          <span
                            class="badge"
                            :class="form.isActive ? 'bg-success-subtle text-success border border-success' : 'bg-secondary-subtle text-secondary border border-secondary'"
                            style="font-size: 0.7rem"
                          >
                            {{ form.isActive ? 'Habilitado para Turnos' : 'Inactivo en Operaciones' }}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </form>
          </div>

          <!-- FOOTER VANGUARDISTA -->
          <div class="modal-footer vanguard-modal-footer p-3 px-4 border-top d-flex justify-content-between align-items-center bg-white">
            <button
              type="button"
              class="btn btn-secondary-pill"
              @click="emit('cerrar')"
            >
              Cancelar
            </button>
            <button
              type="button"
              class="btn btn-primary btn-primary-pill d-flex align-items-center gap-2"
              @click="abrirConfirmacion"
            >
              <span class="btn-icon-wrap primary">
                <i class="bi bi-person-check-fill"></i>
              </span>
              <span>Guardar Usuario</span>
            </button>
          </div>

          <!-- Modal de confirmación -->
          <Teleport to="body">
            <ConfirmationModal
              v-if="confirmVisible"
              :visible="confirmVisible"
              mensaje="¿Seguro que deseas crear este usuario?"
              @confirmar="confirmarGuardar"
              @cancelar="cerrarConfirmacion"
            />
          </Teleport>
        </div>
      </div>
    </div>
  </Transition>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'
import ConfirmationModal from '@/components/common/ConfirmationModal.vue'
import { validateRut } from '@fdograph/rut-utilities'
import { formatRut, cleanRutForStorage } from '@/utils/rut.util'
import { DatePicker } from 'v-calendar'
import 'v-calendar/style.css'

const props = defineProps<{
  visible: boolean
  listaRoles: any[]
  listaPositions: any[]
  listaTipoContrato: string[]
  listaHabilitado: string[]
  listaServicios: any[]
}>()

const emit = defineEmits<{
  (e: 'cerrar'): void
  (e: 'guardar', nuevoUsuario: any): void
}>()

const initialForm = {
  rut: '',
  firstName: '',
  lastName: '',
  birthDate: null,
  address: '',
  city: '',
  phone: '',
  email: '',
  roleId: '',
  positionId: '',
  servicio: '',
  contractType: '',
  isActive: true
}

const form = ref({ ...initialForm })
const errors = ref<Record<string, string>>({})
const confirmVisible = ref(false)

const popoverConfig = {
  visibility: 'click' as const,
  placement: 'bottom' as const
}

watch(
  () => props.visible,
  (newVal) => {
    if (newVal) {
      resetForm()
    }
  }
)

function resetForm() {
  form.value = { ...initialForm }
  errors.value = {}
  confirmVisible.value = false
}

const validateForm = () => {
  const newErrors: Record<string, string> = {}

  if (!form.value.rut) {
    newErrors.rut = 'El RUT es obligatorio'
  } else if (!validateRut(form.value.rut)) {
    newErrors.rut = 'RUT inválido'
  }

  if (!form.value.firstName) {
    newErrors.firstName = 'El nombre es obligatorio'
  } else if (!/^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$/.test(form.value.firstName)) {
    newErrors.firstName = 'Solo letras permitidas'
  } else if (form.value.firstName.length > 30) {
    newErrors.firstName = 'Máximo 30 caracteres'
  }

  if (!form.value.lastName) {
    newErrors.lastName = 'El apellido es obligatorio'
  } else if (!/^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$/.test(form.value.lastName)) {
    newErrors.lastName = 'Solo letras permitidas'
  } else if (form.value.lastName.length > 30) {
    newErrors.lastName = 'Máximo 30 caracteres'
  }

  if (!form.value.birthDate) {
    newErrors.birthDate = 'La fecha es obligatoria'
  }

  if (!form.value.address) {
    newErrors.address = 'La dirección es obligatoria'
  } else if (form.value.address.length > 35) {
    newErrors.address = 'Máximo 35 caracteres'
  }

  if (!form.value.city) {
    newErrors.city = 'La ciudad es obligatoria'
  } else if (form.value.city.length > 35) {
    newErrors.city = 'Máximo 35 caracteres'
  }

  if (!form.value.phone) {
    newErrors.phone = 'El teléfono es obligatorio'
  } else if (!/^\d{9}$/.test(form.value.phone)) {
    newErrors.phone = 'Debe tener 9 dígitos'
  }

  if (!form.value.email) {
    newErrors.email = 'El email es obligatorio'
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.value.email)) {
    newErrors.email = 'Email inválido'
  }

  if (!form.value.roleId) {
    newErrors.roleId = 'Debe seleccionar un rol'
  }

  if (!form.value.positionId) {
    newErrors.positionId = 'Debe seleccionar un cargo'
  }

  if (!form.value.contractType) {
    newErrors.contractType = 'Debe seleccionar tipo contrato'
  }

  if (typeof form.value.isActive !== 'boolean') {
    newErrors.isActive = 'Debe seleccionar un estado'
  }

  errors.value = newErrors
  return Object.keys(newErrors).length === 0
}

function handleRutInput() {
  form.value.rut = formatRut(form.value.rut)
  delete errors.value.rut
}

function abrirConfirmacion() {
  if (validateForm()) {
    confirmVisible.value = true
  }
}

function cerrarConfirmacion() {
  confirmVisible.value = false
}

function confirmarGuardar() {
  const dbRut = cleanRutForStorage(form.value.rut)
  const formattedPhone = `+56${form.value.phone}`

  const dataToSave = {
    ...form.value,
    rut: dbRut,
    phone: formattedPhone,
    birthDate: form.value.birthDate ? new Date(form.value.birthDate as any).toISOString() : null,
    isActive: form.value.isActive
  }
  emit('guardar', dataToSave)
  confirmVisible.value = false
}
</script>

<style scoped>
/* Transitions */
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.25s cubic-bezier(0.32, 0.72, 0, 1);
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

/* Modal Dialog */
.modal-custom-width {
  max-width: 840px;
}

.vanguard-modal-content {
  background: white;
  border: 1px solid #e2e8f0 !important;
  box-shadow: 0 25px 50px -12px rgba(15, 23, 42, 0.25) !important;
}

.bg-surface {
  background-color: #f8fafc;
}

/* Header Styles */
.vanguard-modal-header {
  background: white;
  border-bottom: 1px solid #f1f5f9;
}

.modal-icon-box {
  width: 44px;
  height: 44px;
  border-radius: 12px;
  background: linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  border: 1px solid rgba(191, 219, 254, 0.6);
  flex-shrink: 0;
}

.modal-title-custom {
  letter-spacing: -0.02em;
  font-size: 1.15rem;
}

.badge-role-tag {
  font-size: 0.72rem;
  font-weight: 700;
  color: #2563eb;
  background-color: #eff6ff;
  border: 1px solid #bfdbfe;
  padding: 2px 8px;
  border-radius: 6px;
}

.btn-close-modal {
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

.btn-close-modal:hover {
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

.bg-indigo {
  background-color: #6366f1;
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

.form-input-custom {
  font-size: 0.82rem;
  border-radius: 10px;
  border: 1px solid #cbd5e1;
  background-color: #ffffff;
  padding: 0.45rem 0.75rem;
  color: #1e293b;
  transition: all 0.2s cubic-bezier(0.32, 0.72, 0, 1);
}

.form-input-custom:focus {
  border-color: #3b82f6;
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.12);
  outline: none;
}

.modern-input-group .input-group-text {
  background-color: #ffffff;
  border-color: #cbd5e1;
  border-top-left-radius: 10px;
  border-bottom-left-radius: 10px;
  color: #64748b;
  font-size: 0.85rem;
}

.modern-date-input {
  border-color: #cbd5e1;
  border-top-right-radius: 10px;
  border-bottom-right-radius: 10px;
  font-size: 0.82rem;
  background-color: #ffffff;
  padding: 0.45rem 0.75rem;
  color: #1e293b;
  transition: all 0.2s cubic-bezier(0.32, 0.72, 0, 1);
}

.modern-date-input:focus {
  border-color: #3b82f6;
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.12);
}

/* Custom vue-select styling */
.custom-v-select :deep(.vs__dropdown-toggle) {
  border: 1px solid #cbd5e1;
  border-radius: 10px;
  padding: 3px 6px;
  background: white;
  box-shadow: none;
  min-height: 38px;
  transition: all 0.2s cubic-bezier(0.32, 0.72, 0, 1);
}

.custom-v-select.small-select :deep(.vs__dropdown-toggle) {
  min-height: 36px;
}

.custom-v-select :deep(.vs__dropdown-toggle:focus-within) {
  border-color: #3b82f6;
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.12);
}

.custom-v-select :deep(.vs__selected) {
  font-size: 0.82rem;
  color: #1e293b;
  margin: 2px 2px 0;
}

.custom-v-select :deep(.vs__search::placeholder) {
  color: #94a3b8;
  font-size: 0.82rem;
}

.custom-v-select :deep(.vs__actions svg) {
  fill: #64748b;
  transform: scale(0.75);
}

.custom-v-select :deep(.vs__dropdown-menu) {
  border: 1px solid #e2e8f0;
  border-radius: 12px;
  box-shadow: 0 10px 25px -5px rgba(15, 23, 42, 0.1);
  padding: 6px;
  font-size: 0.82rem;
  max-height: 220px;
  overflow-y: auto;
  z-index: 1050;
}

.custom-v-select :deep(.vs__dropdown-option) {
  border-radius: 6px;
  padding: 6px 10px;
  margin-bottom: 2px;
  color: #334155;
}

.custom-v-select :deep(.vs__dropdown-option--highlight) {
  background: #3b82f6;
  color: white;
}

/* Invalid States */
.is-invalid {
  border-color: #ef4444 !important;
}

.is-invalid:focus {
  box-shadow: 0 0 0 3px rgba(239, 68, 68, 0.12) !important;
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
  padding: 0.45rem 1.25rem 0.45rem 0.65rem;
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

.btn-icon-wrap {
  width: 26px;
  height: 26px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.85rem;
}

.btn-icon-wrap.primary {
  background: rgba(255, 255, 255, 0.2);
  color: white;
}

.x-small {
  font-size: 0.7rem;
}
</style>
