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
                <i class="bi bi-pencil-square text-primary fs-5"></i>
              </div>
              <div>
                <div class="d-flex align-items-center gap-2">
                  <h5 class="modal-title fw-bold text-dark mb-0 modal-title-custom">Modificar Usuario</h5>
                  <span class="badge-role-tag" v-if="editableUsuario.rut">
                    {{ editableUsuario.rut }}
                  </span>
                </div>
                <p class="text-secondary small mb-0 mt-1">
                  Actualiza la ficha laboral, parámetros operativos o estado de seguridad del funcionario.
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

          <!-- NAVEGACIÓN EN CÁPSULA (Segmented Capsule Tabs) -->
          <div class="tabs-capsule-wrapper px-4 pt-3 pb-2 bg-white border-bottom">
            <div class="d-inline-flex p-1 bg-light border rounded-pill shadow-xs">
              <button
                class="btn btn-sm px-3 rounded-pill fw-semibold border-0 switcher-pill"
                :class="activeTab === 'datos' ? 'btn-primary text-white shadow-sm' : 'text-secondary bg-transparent'"
                @click="activeTab = 'datos'"
                type="button"
              >
                <i class="bi bi-person-lines-fill me-1"></i> Datos Generales
              </button>
              <button
                v-if="hasSystemAccess"
                class="btn btn-sm px-3 rounded-pill fw-semibold border-0 switcher-pill"
                :class="activeTab === 'seguridad' ? 'btn-primary text-white shadow-sm' : 'text-secondary bg-transparent'"
                @click="activeTab = 'seguridad'"
                type="button"
              >
                <i class="bi bi-shield-lock me-1"></i> Seguridad y Acceso
              </button>
            </div>
          </div>

          <!-- BODY CON DOBLE BISEL -->
          <div class="modal-body p-4 bg-surface">
            <form @submit.prevent="abrirConfirmacion">
              <div class="tab-content" style="min-height: 520px">
                <!-- TAB 1: Datos Generales -->
                <div class="tab-pane fade" :class="{ 'show active': activeTab === 'datos' }">
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

                          <!-- Nombre -->
                          <div class="mb-3">
                            <label class="form-label staff-field-label mb-1">Nombre</label>
                            <input
                              v-model="editableUsuario.firstName"
                              class="form-control form-input-custom"
                              placeholder="Ej: Sebastián"
                            />
                          </div>

                          <!-- Apellido -->
                          <div class="mb-3">
                            <label class="form-label staff-field-label mb-1">Apellido</label>
                            <input
                              v-model="editableUsuario.lastName"
                              class="form-control form-input-custom"
                              placeholder="Ej: Barría"
                            />
                          </div>

                          <!-- Dirección -->
                          <div class="mb-3">
                            <label class="form-label staff-field-label mb-1">Dirección</label>
                            <input
                              v-model="editableUsuario.address"
                              class="form-control form-input-custom"
                              placeholder="Calle, Número"
                            />
                          </div>

                          <!-- Ciudad -->
                          <div class="mb-1">
                            <label class="form-label staff-field-label mb-1">Ciudad</label>
                            <input
                              v-model="editableUsuario.city"
                              class="form-control form-input-custom"
                              placeholder="Ej: Santiago"
                            />
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

                          <!-- Email -->
                          <div class="mb-3">
                            <label class="form-label staff-field-label mb-1">Email</label>
                            <input
                              v-model="editableUsuario.email"
                              type="email"
                              class="form-control form-input-custom"
                              placeholder="correo@ejemplo.com"
                            />
                          </div>

                          <!-- Teléfono -->
                          <div class="mb-3">
                            <label class="form-label staff-field-label mb-1">Teléfono</label>
                            <div class="input-group modern-input-group">
                              <span class="input-group-text fw-bold">+56</span>
                              <input
                                :class="{ 'is-invalid': errors.phone }"
                                v-model="editableUsuario.phone"
                                type="text"
                                class="form-control modern-date-input"
                                placeholder="912345678"
                                maxlength="9"
                                @input="
                                  editableUsuario.phone = String(editableUsuario.phone).replace(
                                    /[^0-9]/g,
                                    ''
                                  )
                                "
                              />
                            </div>
                          </div>

                          <!-- Rol -->
                          <div class="mb-3">
                            <label class="form-label staff-field-label mb-1">Rol (Perfil de Acceso)</label>
                            <v-select
                              v-model="editableUsuario.roleId"
                              :options="listaRoles"
                              label="name"
                              :reduce="(role: any) => role._id"
                              placeholder="Seleccione rol"
                              class="custom-v-select small-select"
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
                          </div>

                          <!-- Cargo Físico -->
                          <div class="mb-3">
                            <label class="form-label staff-field-label mb-1">Cargo Físico (Position)</label>
                            <v-select
                              v-model="editableUsuario.positionId"
                              :options="listaPositions"
                              label="name"
                              :reduce="(pos: any) => pos._id"
                              placeholder="Seleccione cargo"
                              class="custom-v-select small-select"
                              :clearable="false"
                              :searchable="true"
                            />
                          </div>

                          <!-- Tipo Contrato -->
                          <div class="mb-3">
                            <label class="form-label staff-field-label mb-1">Tipo Contrato</label>
                            <v-select
                              v-model="editableUsuario.contractType"
                              :options="listaTipoContrato"
                              placeholder="Seleccione tipo contrato"
                              class="custom-v-select small-select"
                              :clearable="false"
                              :searchable="false"
                            />
                          </div>

                          <!-- Habilitado para Turnos -->
                          <div class="p-3 bg-light rounded-3 border mt-2">
                            <div class="d-flex align-items-center justify-content-between">
                              <div>
                                <span class="staff-field-label d-block mb-0">Disponibilidad Operativa</span>
                                <span class="text-muted x-small">Habilitado para asignación de turnos y coberturas</span>
                              </div>
                              <div class="form-check form-switch fs-5 mb-0">
                                <input
                                  class="form-check-input shadow-none cursor-pointer"
                                  type="checkbox"
                                  role="switch"
                                  v-model="editableUsuario.isActive"
                                />
                              </div>
                            </div>
                            <div class="mt-1">
                              <span
                                class="badge"
                                :class="editableUsuario.isActive ? 'bg-success-subtle text-success border border-success' : 'bg-secondary-subtle text-secondary border border-secondary'"
                                style="font-size: 0.7rem"
                              >
                                {{ editableUsuario.isActive ? 'Habilitado para Turnos' : 'Inactivo en Operaciones' }}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <!-- TAB 2: Seguridad y Acceso -->
                <div
                  class="tab-pane fade"
                  :class="{ 'show active': activeTab === 'seguridad' }"
                  v-if="hasSystemAccess"
                >
                  <div class="vanguard-section-card p-4">
                    <div class="d-flex align-items-center justify-content-between mb-4 pb-2 border-bottom">
                      <div class="d-flex align-items-center gap-2">
                        <span class="section-indicator bg-warning"></span>
                        <h6 class="fw-bold text-dark mb-0 section-heading">Gestión de Acceso y Credenciales</h6>
                      </div>
                      <i class="bi bi-shield-check text-secondary opacity-75"></i>
                    </div>

                    <!-- Loader mientras obtiene status -->
                    <div v-if="loadingStatus" class="text-center py-5">
                      <div class="spinner-border text-primary" role="status">
                        <span class="visually-hidden">Cargando...</span>
                      </div>
                      <p class="text-secondary small mt-2">Consultando estado de cuenta en servidor...</p>
                    </div>

                    <!-- Controles de seguridad -->
                    <template v-else>
                      <!-- Tarjeta 1: Acceso al Sistema -->
                      <div class="d-flex align-items-center justify-content-between p-3 rounded-3 bg-light border mb-3">
                        <div class="d-flex align-items-center gap-3">
                          <div class="access-icon-box shadow-xs">
                            <i class="bi bi-person-lock text-primary fs-5"></i>
                          </div>
                          <div>
                            <div class="d-flex align-items-center gap-2">
                              <h6 class="mb-0 fw-bold text-dark" style="font-size: 0.9rem">Acceso al Sistema</h6>
                              <span class="badge" :class="badgeClass">{{ accessLabel }}</span>
                            </div>
                            <small class="text-muted d-block mt-1">{{ accessDescription }}</small>
                          </div>
                        </div>
                        <div>
                          <button
                            type="button"
                            class="btn btn-sm fw-bold px-3 rounded-pill"
                            :class="buttonClass"
                            @click="abrirConfirmacionAcceso"
                            :disabled="isButtonDisabled || togglingAccess"
                          >
                            <span
                              v-if="togglingAccess"
                              class="spinner-border spinner-border-sm me-2"
                              role="status"
                              aria-hidden="true"
                            ></span>
                            <i v-else class="bi bi-shield-lock me-1"></i> {{ buttonText }}
                          </button>
                        </div>
                      </div>

                      <!-- Tarjeta 2: Restablecer Contraseña -->
                      <div
                        class="d-flex align-items-center justify-content-between p-3 rounded-3 bg-light border"
                        v-if="usuario._id"
                      >
                        <div class="d-flex align-items-center gap-3">
                          <div class="access-icon-box shadow-xs">
                            <i class="bi bi-key-fill text-primary fs-5"></i>
                          </div>
                          <div>
                            <h6 class="mb-0 fw-bold text-dark" style="font-size: 0.9rem">
                              Restablecer Contraseña / Reenviar Link
                            </h6>
                            <small class="text-muted d-block mt-1">
                              Envía un correo con un enlace temporal seguro para configurar o resetear credenciales.
                            </small>
                          </div>
                        </div>
                        <button
                          type="button"
                          class="btn btn-outline-primary btn-sm px-3 rounded-pill fw-semibold"
                          @click="enviarReset"
                          :disabled="sendingReset"
                        >
                          <span
                            v-if="sendingReset"
                            class="spinner-border spinner-border-sm me-2"
                            role="status"
                            aria-hidden="true"
                          ></span>
                          <i v-else class="bi bi-envelope-check me-1"></i> Enviar Link
                        </button>
                      </div>
                    </template>
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
              v-if="activeTab === 'datos'"
            >
              <span class="btn-icon-wrap primary">
                <i class="bi bi-check-lg"></i>
              </span>
              <span>Guardar Cambios</span>
            </button>
          </div>

          <!-- Modales Globales del Componente -->
          <Teleport to="body">
            <!-- Modal para Datos Generales -->
            <ConfirmationModal
              :visible="confirmVisible"
              mensaje="¿Deseas guardar los cambios en este usuario?"
              @confirmar="confirmarGuardar"
              @cancelar="cerrarConfirmacion"
            />

            <!-- Modal para Cambiar Acceso -->
            <ConfirmationModal
              :visible="confirmAccessVisible"
              :mensaje="`¿Estás seguro que deseas ${buttonText.toLowerCase()} el acceso a este usuario?`"
              @confirmar="toggleAcceso"
              @cancelar="cerrarConfirmacionAcceso"
            />

            <!-- Alert de éxito -->
            <AlertMessage
              v-if="alert.show"
              :message="alert.message"
              :type="alert.type"
              :duration="4000"
              @close="alert.show = false"
            />
          </Teleport>
        </div>
      </div>
    </div>
  </Transition>
</template>

<script setup lang="ts">
import { ref, watch, computed } from 'vue'
import ConfirmationModal from '@/components/common/ConfirmationModal.vue'
import AlertMessage from '@/components/common/AlertMessage.vue'
import type { StaffRegistration } from '@/types/staff.types'
import { useAccountStore } from '@/stores/account.store'

const props = defineProps<{
  visible: boolean
  usuario: StaffRegistration & { _id?: string }
  listaRoles: any[]
  listaPositions: any[]
  listaTipoContrato: string[]
  listaHabilitado: string[]
}>()

const emit = defineEmits(['cerrar', 'guardar'])

const errors = ref({ phone: false })
const editableUsuario = ref<StaffRegistration & { _id?: string }>({ ...props.usuario })

const accountStore = useAccountStore()
const sendingReset = ref(false)
const togglingAccess = ref(false)
const loadingStatus = ref(false)
const activeTab = ref('datos')

// Estado interno de la cuenta (FSM)
const accountStatus = ref({ isActive: false, isPendingOnboarding: false, exists: false })

const alert = ref({
  show: false,
  message: '',
  type: 'success' as 'success' | 'danger' | 'warning' | 'info'
})

const hasSystemAccess = computed(() => {
  const selectedRole = props.listaRoles.find((r) => r._id === editableUsuario.value.roleId)
  return selectedRole ? selectedRole.hasSystemAccess : false
})

// === MÁQUINA DE ESTADOS (FSM) ===

const accessLabel = computed(() => {
  if (!accountStatus.value.exists) return 'Sin Cuenta'
  if (accountStatus.value.isActive && !accountStatus.value.isPendingOnboarding) return 'Activo'
  if (!accountStatus.value.isActive && accountStatus.value.isPendingOnboarding) return 'Pendiente'
  if (!accountStatus.value.isActive && !accountStatus.value.isPendingOnboarding) return 'Suspendido'
  return 'Desconocido'
})

const badgeClass = computed(() => {
  switch (accessLabel.value) {
    case 'Activo':
      return 'bg-success'
    case 'Pendiente':
      return 'bg-warning text-dark'
    case 'Suspendido':
      return 'bg-danger'
    default:
      return 'bg-secondary'
  }
})

const accessDescription = computed(() => {
  switch (accessLabel.value) {
    case 'Activo':
      return 'El usuario tiene acceso normal al sistema.'
    case 'Pendiente':
      return 'El usuario aún no configura su contraseña.'
    case 'Suspendido':
      return 'El acceso del usuario ha sido revocado.'
    default:
      return 'No se pudo determinar el estado.'
  }
})

const buttonText = computed(() => {
  if (accountStatus.value.isActive) return 'Suspender'
  return 'Habilitar'
})

const isButtonDisabled = computed(() => {
  return accountStatus.value.isPendingOnboarding || !accountStatus.value.exists
})

const buttonClass = computed(() => {
  if (isButtonDisabled.value) return 'btn-secondary'
  if (accountStatus.value.isActive) return 'btn-outline-danger'
  return 'btn-outline-success'
})

// === ACCIONES DE TABS ===

async function cargarSeguridad() {
  if (!editableUsuario.value._id || !hasSystemAccess.value) return

  try {
    loadingStatus.value = true
    accountStatus.value = await accountStore.fetchAccountStatus(editableUsuario.value._id)
  } catch (error) {
    console.error('Error cargando estado de cuenta', error)
  } finally {
    loadingStatus.value = false
  }
}

// === LÓGICA DE CONFIRMACIÓN ===

const confirmVisible = ref(false)
const confirmAccessVisible = ref(false)

function abrirConfirmacion() {
  confirmVisible.value = true
}

function cerrarConfirmacion() {
  confirmVisible.value = false
}

function abrirConfirmacionAcceso() {
  confirmAccessVisible.value = true
}

function cerrarConfirmacionAcceso() {
  confirmAccessVisible.value = false
}

function confirmarGuardar() {
  confirmVisible.value = false
  emit('guardar', editableUsuario.value)
}

// === LÓGICA DE GESTIÓN DE ACCESO ===

async function toggleAcceso() {
  confirmAccessVisible.value = false
  if (!editableUsuario.value._id) return

  try {
    togglingAccess.value = true
    const nuevoEstado = !accountStatus.value.isActive
    await accountStore.toggleAccountAccess(editableUsuario.value._id, nuevoEstado)

    // Actualizar estado local tras éxito
    accountStatus.value.isActive = nuevoEstado
    alert.value = {
      show: true,
      message: `Acceso ${nuevoEstado ? 'habilitado' : 'suspendido'} exitosamente`,
      type: 'success'
    }
  } catch (error: any) {
    alert.value = {
      show: true,
      message: error.message || 'Error al cambiar el estado de acceso',
      type: 'danger'
    }
  } finally {
    togglingAccess.value = false
  }
}

async function enviarReset() {
  if (!editableUsuario.value._id) return

  try {
    sendingReset.value = true
    await accountStore.sendResetLink(editableUsuario.value._id)
    alert.value = {
      show: true,
      message: 'Enlace enviado al correo institucional exitosamente',
      type: 'success'
    }
  } catch (error: any) {
    alert.value = {
      show: true,
      message: error.message || 'Error al enviar enlace de restablecimiento',
      type: 'danger'
    }
  } finally {
    sendingReset.value = false
  }
}

// Watchers
watch(
  () => props.usuario,
  (newVal) => {
    editableUsuario.value = { ...newVal }
  },
  { deep: true }
)

watch(
  () => props.visible,
  (newVal) => {
    if (newVal) {
      activeTab.value = 'datos'
      editableUsuario.value = { ...props.usuario }
    }
  }
)

watch(activeTab, (newTab) => {
  if (newTab === 'seguridad') {
    cargarSeguridad()
  }
})
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
  font-variant-numeric: tabular-nums;
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

/* Switcher / Pills */
.switcher-pill {
  transition: all 0.2s cubic-bezier(0.32, 0.72, 0, 1);
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

.access-icon-box {
  width: 40px;
  height: 40px;
  border-radius: 10px;
  background: #eff6ff;
  display: flex;
  align-items: center;
  justify-content: center;
  border: 1px solid #dbeafe;
  flex-shrink: 0;
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

.shadow-xs {
  box-shadow: 0 1px 2px 0 rgba(0, 0, 0, 0.05);
}
</style>
