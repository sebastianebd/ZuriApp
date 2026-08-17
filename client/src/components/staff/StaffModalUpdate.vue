<template>
  <Transition name="fade">
    <div
      class="modal fade show d-block"
      v-if="visible"
      tabindex="-1"
      role="dialog"
      style="background-color: rgba(15, 23, 42, 0.6); backdrop-filter: blur(4px)"
    >
      <div class="modal-dialog modal-lg modal-dialog-centered" role="document">
        <div class="modal-content shadow-2xl border-0 rounded-4">
          <!-- HEADER -->
          <div class="modal-header border-bottom p-4">
            <div>
              <h5 class="modal-title fw-bold text-dark">
                <i class="bi bi-pencil-square text-primary me-2"></i>Modificar Usuario
              </h5>
              <p class="text-secondary small mb-0 mt-1">
                Actualiza la información del personal registrado.
              </p>
            </div>
            <button
              type="button"
              class="btn-close"
              @click="emit('cerrar')"
              aria-label="Close"
            ></button>
          </div>

          <!-- BODY -->
          <div class="modal-body p-0 bg-light bg-opacity-50">
            <!-- TABS NAVIGATION -->
            <ul class="nav nav-tabs px-4 pt-3 border-bottom-0 bg-white" role="tablist">
              <li class="nav-item" role="presentation">
                <button
                  class="nav-link fw-bold"
                  :class="{ active: activeTab === 'datos' }"
                  @click="activeTab = 'datos'"
                  type="button"
                >
                  <i class="bi bi-person-lines-fill me-2"></i>Datos Generales
                </button>
              </li>
              <li class="nav-item" role="presentation" v-if="hasSystemAccess">
                <button
                  class="nav-link fw-bold"
                  :class="{ active: activeTab === 'seguridad' }"
                  @click="activeTab = 'seguridad'"
                  type="button"
                >
                  <i class="bi bi-shield-lock me-2"></i>Seguridad y Acceso
                </button>
              </li>
            </ul>

            <form @submit.prevent="abrirConfirmacion">
              <div class="p-4 tab-content" style="min-height: 678px">
                <!-- TAB 1: Datos Personales -->
                <div class="tab-pane fade" :class="{ 'show active': activeTab === 'datos' }">
                  <div class="row g-4">
                    <!-- Columna izquierda: Datos Personales -->
                    <div class="col-md-6">
                      <div class="bg-white p-4 rounded-4 shadow-sm border h-100">
                        <h6
                          class="text-uppercase text-secondary fw-bold x-small mb-4 tracking-wider border-bottom pb-2"
                        >
                          Datos Personales
                        </h6>
                        <!-- Nombre -->
                        <div class="mb-4 position-relative">
                          <label class="form-label x-small fw-bold text-secondary text-uppercase"
                            >Nombre</label
                          >
                          <input
                            v-model="editableUsuario.firstName"
                            class="form-control"
                            placeholder="Ej: Sebastián"
                          />
                        </div>
                        <!-- Apellido -->
                        <div class="mb-4 position-relative">
                          <label class="form-label x-small fw-bold text-secondary text-uppercase"
                            >Apellido</label
                          >
                          <input
                            v-model="editableUsuario.lastName"
                            class="form-control"
                            placeholder="Ej: Barría"
                          />
                        </div>
                        <!-- Dirección -->
                        <div class="mb-4 position-relative">
                          <label class="form-label x-small fw-bold text-secondary text-uppercase"
                            >Dirección</label
                          >
                          <input
                            v-model="editableUsuario.address"
                            class="form-control"
                            placeholder="Calle, Número"
                          />
                        </div>
                        <!-- Ciudad -->
                        <div class="mb-0 position-relative">
                          <label class="form-label x-small fw-bold text-secondary text-uppercase"
                            >Ciudad</label
                          >
                          <input
                            v-model="editableUsuario.city"
                            class="form-control"
                            placeholder="Ej: Santiago"
                          />
                        </div>
                      </div>
                    </div>

                    <!-- Columna derecha: Cuenta y Contacto -->
                    <div class="col-md-6">
                      <div class="bg-white p-4 rounded-4 shadow-sm border h-100">
                        <h6
                          class="text-uppercase text-secondary fw-bold x-small mb-4 tracking-wider border-bottom pb-2"
                        >
                          Contacto y Rol
                        </h6>
                        <!-- Email -->
                        <div class="mb-4 position-relative">
                          <label class="form-label x-small fw-bold text-secondary text-uppercase"
                            >Email</label
                          >
                          <input
                            v-model="editableUsuario.email"
                            type="email"
                            class="form-control"
                            placeholder="correo@ejemplo.com"
                          />
                        </div>
                        <!-- Teléfono -->
                        <div class="mb-4 position-relative">
                          <label class="form-label x-small fw-bold text-secondary text-uppercase"
                            >Teléfono</label
                          >
                          <div class="input-group">
                            <span
                              class="input-group-text bg-light text-secondary fw-bold border-end-0"
                              >+56</span
                            >
                            <input
                              :class="{ 'is-invalid': errors.phone }"
                              v-model="editableUsuario.phone"
                              type="text"
                              class="form-control border-start-0 ps-1"
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
                        <div class="mb-4 position-relative">
                          <label class="form-label x-small fw-bold text-secondary text-uppercase"
                            >Rol (Perfil de Acceso)</label
                          >
                          <v-select
                            v-model="editableUsuario.roleId"
                            :options="listaRoles"
                            label="name"
                            :reduce="(role: any) => role._id"
                            placeholder="Seleccione rol"
                            class="custom-v-select"
                            :clearable="false"
                            :searchable="true"
                          >
                            <template #option="option">
                              {{ option.name }}
                              <small class="text-muted">({{ option.code }})</small>
                            </template>
                          </v-select>
                        </div>
                        <!-- Cargo Físico -->
                        <div class="mb-4 position-relative">
                          <label class="form-label x-small fw-bold text-secondary text-uppercase"
                            >Cargo Físico (Position)</label
                          >
                          <v-select
                            v-model="editableUsuario.positionId"
                            :options="listaPositions"
                            label="name"
                            :reduce="(pos: any) => pos._id"
                            placeholder="Seleccione cargo"
                            class="custom-v-select"
                            :clearable="false"
                            :searchable="true"
                          />
                        </div>
                        <!-- Tipo Contrato -->
                        <div class="mb-4 position-relative">
                          <label class="form-label x-small fw-bold text-secondary text-uppercase"
                            >Tipo Contrato</label
                          >
                          <v-select
                            v-model="editableUsuario.contractType"
                            :options="listaTipoContrato"
                            placeholder="Seleccione tipo contrato"
                            class="custom-v-select"
                            :clearable="false"
                            :searchable="false"
                          />
                        </div>
                        <!-- Habilitado para Turnos -->
                        <div class="mb-2 position-relative">
                          <label class="form-label x-small fw-bold text-secondary text-uppercase"
                            >Disponibilidad Operativa (Turnos)</label
                          >
                          <div class="form-check form-switch mt-1 fs-5">
                            <input
                              class="form-check-input shadow-none cursor-pointer"
                              type="checkbox"
                              role="switch"
                              v-model="editableUsuario.isActive"
                            />
                            <label
                              class="form-check-label x-small text-secondary fw-semibold ms-2 align-middle"
                            >
                              {{ editableUsuario.isActive ? 'Habilitado' : 'Inactivo' }}
                            </label>
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
                  <div class="row">
                    <div class="col-12">
                      <div class="bg-white p-4 rounded-4 shadow-sm border">
                        <h6
                          class="text-uppercase text-secondary fw-bold x-small mb-4 tracking-wider border-bottom pb-2"
                        >
                          Estado de Cuenta
                        </h6>

                        <!-- Loader mientras obtiene status -->
                        <div v-if="loadingStatus" class="text-center py-4">
                          <div class="spinner-border text-primary" role="status">
                            <span class="visually-hidden">Cargando...</span>
                          </div>
                        </div>

                        <!-- Controles de seguridad -->
                        <template v-else>
                          <div
                            class="d-flex align-items-center justify-content-between bg-light p-3 rounded mb-3"
                          >
                            <div>
                              <h6 class="mb-1 fw-bold text-dark">Acceso al Sistema</h6>
                              <div class="d-flex align-items-center gap-2 mt-1">
                                <span class="badge" :class="badgeClass">{{ accessLabel }}</span>
                                <small class="text-muted">{{ accessDescription }}</small>
                              </div>
                            </div>
                            <div class="mb-0">
                              <button
                                type="button"
                                class="btn btn-sm fw-bold"
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
                                <i v-else class="bi bi-shield-lock me-2"></i> {{ buttonText }}
                              </button>
                            </div>
                          </div>

                          <div
                            class="d-flex align-items-center justify-content-between mt-3 bg-light p-3 rounded"
                            v-if="usuario._id"
                          >
                            <div>
                              <h6 class="mb-1 fw-bold text-dark">
                                Restablecer Contraseña / Reenviar Link
                              </h6>
                              <small class="text-muted"
                                >Enviar un correo con un enlace temporal para configurar
                                contraseña.</small
                              >
                            </div>
                            <button
                              type="button"
                              class="btn btn-outline-primary btn-sm px-3"
                              @click="enviarReset"
                              :disabled="sendingReset"
                            >
                              <span
                                v-if="sendingReset"
                                class="spinner-border spinner-border-sm me-2"
                                role="status"
                                aria-hidden="true"
                              ></span>
                              <i v-else class="bi bi-envelope-check me-2"></i> Enviar Link
                            </button>
                          </div>
                        </template>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </form>
          </div>

          <!-- FOOTER -->
          <div class="modal-footer border-top bg-white p-3 rounded-bottom-4">
            <button
              type="button"
              class="btn btn-light border fw-bold text-secondary px-4 me-2"
              @click="emit('cerrar')"
            >
              Cancelar
            </button>
            <button
              type="button"
              class="btn btn-primary fw-bold px-4 shadow-sm"
              @click="abrirConfirmacion"
              v-if="activeTab === 'datos'"
            >
              <i class="bi bi-check-lg me-2"></i>Guardar Cambios
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

async function toggleAcceso() {
  cerrarConfirmacionAcceso()
  if (!editableUsuario.value._id) return
  try {
    togglingAccess.value = true
    const newState = !accountStatus.value.isActive
    await accountStore.toggleAccountAccess(editableUsuario.value._id, newState)

    // Actualizar estado local
    accountStatus.value.isActive = newState

    // Alerta de éxito
    alert.value = {
      show: true,
      message: newState ? 'Cuenta habilitada exitosamente.' : 'Cuenta suspendida exitosamente.',
      type: 'success'
    }
  } catch (error: any) {
    alert.value = {
      show: true,
      message: error.response?.data?.message || 'Error al cambiar estado de la cuenta',
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
      message: 'Enlace de restablecimiento enviado exitosamente',
      type: 'success'
    }
  } catch (error: any) {
    alert.value = {
      show: true,
      message: error.response?.data?.message || 'Error al enviar enlace de restablecimiento',
      type: 'danger'
    }
  } finally {
    sendingReset.value = false
  }
}

function confirmarGuardar() {
  const payload = { ...editableUsuario.value }
  // Agregar prefijo +56 antes de enviar
  if (payload.phone) {
    payload.phone = `+56${payload.phone}`
  }

  emit('guardar', payload)
  confirmVisible.value = false
}

watch(
  () => props.usuario,
  (nuevoUsuario) => {
    activeTab.value = 'datos' // Reset tab on open
    const usuarioCopia = { ...nuevoUsuario }

    if (usuarioCopia.phone) {
      let phoneStr = String(usuarioCopia.phone)
      if (phoneStr.startsWith('+56')) {
        phoneStr = phoneStr.replace('+56', '')
      }
      usuarioCopia.phone = phoneStr
    }

    if (typeof usuarioCopia.isActive === 'string') {
      usuarioCopia.isActive = usuarioCopia.isActive === 'HABILITADO'
    } else if (usuarioCopia.isActive === undefined) {
      usuarioCopia.isActive = true
    }

    if (
      usuarioCopia.roleId &&
      typeof usuarioCopia.roleId === 'object' &&
      '_id' in usuarioCopia.roleId
    ) {
      usuarioCopia.roleId = (usuarioCopia.roleId as any)._id
    }

    if (
      usuarioCopia.positionId &&
      typeof usuarioCopia.positionId === 'object' &&
      '_id' in usuarioCopia.positionId
    ) {
      usuarioCopia.positionId = (usuarioCopia.positionId as any)._id
    }

    editableUsuario.value = usuarioCopia

    // Fetch security status in the background
    if (nuevoUsuario._id) {
      cargarSeguridad()
    }
  },
  { immediate: true, deep: true }
)
</script>

<style scoped>
/* Bootstrap Nav Tabs Styles Reset for a cleaner look */
.nav-tabs .nav-link {
  color: #64748b;
  border: none;
  border-bottom: 2px solid transparent;
  padding: 0.75rem 1rem;
  transition: all 0.2s ease;
}

.nav-tabs .nav-link:hover {
  border-color: transparent;
  color: #3b82f6;
}

.nav-tabs .nav-link.active {
  color: #0f172a;
  border-bottom-color: #3b82f6;
  background-color: transparent;
}

.badge {
  font-size: 0.75em;
  padding: 0.35em 0.65em;
  font-weight: 600;
}

/* Transitions */
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.2s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

.shadow-2xl {
  box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
}

.x-small {
  font-size: 0.7rem;
}

.tracking-wider {
  letter-spacing: 0.05em;
}

/* Inputs & Forms */
.form-control {
  border: 1px solid #e2e8f0;
  padding: 0.5rem 0.75rem;
  font-size: 0.875rem;
  border-radius: 0.375rem;
  color: #1e293b;
  background-color: #fff;
  transition: all 0.2s ease;
}

.form-control:focus {
  border-color: #3b82f6;
  box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.1);
  background-color: #fff;
}

.form-control::placeholder {
  color: #94a3b8;
}

.input-group-text {
  border-color: #e2e8f0;
  color: #64748b;
}

/* Custom v-select */
.custom-v-select :deep(.vs__dropdown-toggle) {
  border: 1px solid #e2e8f0;
  border-radius: 0.375rem;
  padding: 3px;
  background: white;
  box-shadow: none;
}

.custom-v-select :deep(.vs__selected) {
  font-size: 0.875rem;
  color: #1e293b;
}

.custom-v-select :deep(.vs__search::placeholder) {
  color: #94a3b8;
}

.custom-v-select :deep(.vs__actions svg) {
  fill: #64748b;
  transform: scale(0.8);
}

.custom-v-select :deep(.vs__dropdown-menu) {
  border: 1px solid #e2e8f0;
  border-radius: 0.5rem;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
  padding: 5px;
  font-size: 0.875rem;
  max-height: 200px;
  overflow-y: auto;
}

.custom-v-select :deep(.vs__dropdown-option) {
  border-radius: 0.25rem;
  padding: 6px 10px;
  margin-bottom: 2px;
  color: #475569;
}

.custom-v-select :deep(.vs__dropdown-option--highlight) {
  background: #3b82f6;
  color: white;
}
</style>
