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
                <i class="bi bi-person-plus-fill text-primary me-2"></i>Nuevo Usuario
              </h5>
              <p class="text-secondary small mb-0 mt-1">
                Completa la información para registrar al personal.
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
          <div class="modal-body p-4 bg-light bg-opacity-50">
            <form @submit.prevent="abrirConfirmacion">
              <div class="row g-4">
                <!-- Columna izquierda: Datos Personales -->
                <div class="col-md-6">
                  <div class="bg-white p-4 rounded-4 shadow-sm border h-100">
                    <h6
                      class="text-uppercase text-secondary fw-bold x-small mb-4 tracking-wider border-bottom pb-2"
                    >
                      Datos Personales
                    </h6>

                    <!-- RUT -->
                    <div class="mb-4 position-relative">
                      <label class="form-label x-small fw-bold text-secondary text-uppercase"
                        >RUT</label
                      >
                      <input
                        v-model="form.rut"
                        class="form-control"
                        :class="{ 'is-invalid': errors.rut }"
                        placeholder="12.345.678-9"
                        @input="handleRutInput"
                      />
                      <div v-if="errors.rut" class="invalid-feedback fw-bold floating-error">
                        {{ errors.rut }}
                      </div>
                    </div>

                    <!-- Nombre -->
                    <div class="mb-4 position-relative">
                      <label class="form-label x-small fw-bold text-secondary text-uppercase"
                        >Nombre</label
                      >
                      <input
                        v-model="form.nombre"
                        class="form-control"
                        :class="{ 'is-invalid': errors.nombre }"
                        placeholder="Ej: Sebastián"
                      />
                      <div v-if="errors.nombre" class="invalid-feedback fw-bold floating-error">
                        {{ errors.nombre }}
                      </div>
                    </div>

                    <!-- Apellido -->
                    <div class="mb-4 position-relative">
                      <label class="form-label x-small fw-bold text-secondary text-uppercase"
                        >Apellido</label
                      >
                      <input
                        v-model="form.apellido"
                        class="form-control"
                        :class="{ 'is-invalid': errors.apellido }"
                        placeholder="Ej: Barría"
                      />
                      <div v-if="errors.apellido" class="invalid-feedback fw-bold floating-error">
                        {{ errors.apellido }}
                      </div>
                    </div>

                    <!-- Fecha de Nacimiento -->
                    <div class="mb-4 position-relative">
                      <label class="form-label x-small fw-bold text-secondary text-uppercase"
                        >Fecha de Nacimiento</label
                      >
                      <DatePicker
                        v-model="form.fecha_nac"
                        :popover="popoverConfig"
                        :masks="{ input: 'DD/MM/YYYY' }"
                      >
                        <template #default="{ inputValue, inputEvents }">
                          <div class="input-group">
                            <span class="input-group-text bg-white border-end-0 text-muted">
                              <i class="bi bi-calendar3"></i>
                            </span>
                            <input
                              class="form-control border-start-0 ps-0"
                              :class="{ 'is-invalid': errors.fecha_nac }"
                              :value="inputValue"
                              v-on="inputEvents"
                              placeholder="Seleccione fecha"
                              readonly
                            />
                          </div>
                        </template>
                      </DatePicker>
                      <div
                        v-if="errors.fecha_nac"
                        class="text-danger x-small fw-bold floating-error"
                      >
                        {{ errors.fecha_nac }}
                      </div>
                    </div>

                    <!-- Dirección -->
                    <div class="mb-2 position-relative">
                      <label class="form-label x-small fw-bold text-secondary text-uppercase"
                        >Dirección</label
                      >
                      <input
                        v-model="form.direccion"
                        class="form-control"
                        :class="{ 'is-invalid': errors.direccion }"
                        placeholder="Calle, Número"
                      />
                      <div v-if="errors.direccion" class="invalid-feedback fw-bold floating-error">
                        {{ errors.direccion }}
                      </div>
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

                    <!-- Ciudad -->
                    <div class="mb-4 position-relative">
                      <label class="form-label x-small fw-bold text-secondary text-uppercase"
                        >Ciudad</label
                      >
                      <input
                        v-model="form.ciudad"
                        class="form-control"
                        :class="{ 'is-invalid': errors.ciudad }"
                        placeholder="Ej: Santiago"
                      />
                      <div v-if="errors.ciudad" class="invalid-feedback fw-bold floating-error">
                        {{ errors.ciudad }}
                      </div>
                    </div>

                    <!-- Teléfono -->
                    <div class="mb-4 position-relative">
                      <label class="form-label x-small fw-bold text-secondary text-uppercase"
                        >Teléfono</label
                      >
                      <div class="input-group">
                        <span class="input-group-text bg-light text-secondary fw-bold border-end-0">
                          +56
                        </span>
                        <input
                          v-model="form.telefono"
                          type="text"
                          class="form-control border-start-0 ps-1"
                          :class="{ 'is-invalid': errors.telefono }"
                          placeholder="912345678"
                          maxlength="9"
                          @input="form.telefono = form.telefono.replace(/[^0-9]/g, '')"
                        />
                      </div>
                      <div
                        v-if="errors.telefono"
                        class="text-danger x-small fw-bold floating-error"
                      >
                        {{ errors.telefono }}
                      </div>
                    </div>

                    <!-- Email -->
                    <div class="mb-4 position-relative">
                      <label class="form-label x-small fw-bold text-secondary text-uppercase"
                        >Email</label
                      >
                      <input
                        v-model="form.email"
                        type="email"
                        class="form-control"
                        :class="{ 'is-invalid': errors.email }"
                        placeholder="correo@ejemplo.com"
                      />
                      <div v-if="errors.email" class="invalid-feedback fw-bold floating-error">
                        {{ errors.email }}
                      </div>
                    </div>

                    <!-- Cargo -->
                    <div class="mb-4 position-relative">
                      <label class="form-label x-small fw-bold text-secondary text-uppercase"
                        >Cargo</label
                      >
                      <v-select
                        v-model="form.tipo_cargo"
                        :options="listaTipoCargo"
                        placeholder="Seleccione cargo"
                        class="custom-v-select"
                        :class="{ 'is-invalid': errors.tipo_cargo }"
                        :clearable="false"
                        :searchable="true"
                      />
                      <div
                        v-if="errors.tipo_cargo"
                        class="text-danger x-small fw-bold floating-error"
                      >
                        {{ errors.tipo_cargo }}
                      </div>
                    </div>

                    <!-- Habilitado -->
                    <div v-if="shouldShowHabilitado" class="mb-2 position-relative">
                      <label class="form-label x-small fw-bold text-secondary text-uppercase"
                        >Estado Inicial</label
                      >
                      <v-select
                        v-model="form.habilitado"
                        :options="listaHabilitado"
                        placeholder="Seleccione estado"
                        class="custom-v-select"
                        :class="{ 'is-invalid': errors.habilitado }"
                        :clearable="false"
                        :searchable="true"
                      />
                      <div
                        v-if="errors.habilitado"
                        class="text-danger x-small fw-bold floating-error"
                      >
                        {{ errors.habilitado }}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </form>
          </div>

          <!-- FOOTER -->
          <div class="modal-footer border-top bg-light p-3">
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
            >
              <i class="bi bi-person-check-fill me-2"></i>Guardar Usuario
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
import { ref, watch, computed } from 'vue'
import ConfirmationModal from '@/components/common/ConfirmationModal.vue'
import { validateRut } from '@fdograph/rut-utilities'
import { formatRut, cleanRutForStorage } from '@/utils/rut.util'
import { DatePicker } from 'v-calendar'
import 'v-calendar/dist/style.css'

const props = defineProps<{
  visible: boolean
  listaTipoCargo: string[]
  listaHabilitado: string[]
  listaServicios: string[]
}>()

const emit = defineEmits<{
  (e: 'cerrar'): void
  (e: 'guardar', nuevoUsuario: any): void
}>()

const initialForm = {
  rut: '',
  nombre: '',
  apellido: '',
  fecha_nac: null,
  direccion: '',
  ciudad: '',
  telefono: '',
  email: '',
  tipo_cargo: '',
  servicio: '',
  habilitado: ''
}

const form = ref({ ...initialForm })

// Estado de errores
const errors = ref<Record<string, string>>({})

// Estado del modal de confirmación
const confirmVisible = ref(false)

// Configuración DatePicker
const popoverConfig = {
  visibility: 'click' as const,
  placement: 'bottom' as const
}

// Logic to conditionally show "Habilitado"
const shouldShowHabilitado = computed(() => {
  const cargo = form.value.tipo_cargo
  if (!cargo) return false
  return !['RECURSOS HUMANOS', 'ADMIN-TI'].includes(cargo)
})

// Watchers
watch(
  () => props.visible,
  (newVal) => {
    if (newVal) {
      resetForm()
    }
  }
)

// Watch for cargo changes to reset hidden fields
watch(
  () => form.value.tipo_cargo,
  () => {
    if (!shouldShowHabilitado.value) {
      form.value.habilitado = ''
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

  // Validar RUT
  if (!form.value.rut) {
    newErrors.rut = 'El RUT es obligatorio'
  } else if (!validateRut(form.value.rut)) {
    newErrors.rut = 'RUT inválido'
  }

  // Validar Nombre
  if (!form.value.nombre) {
    newErrors.nombre = 'El nombre es obligatorio'
  } else if (!/^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$/.test(form.value.nombre)) {
    newErrors.nombre = 'Solo letras permitidas'
  } else if (form.value.nombre.length > 30) {
    newErrors.nombre = 'Máximo 30 caracteres'
  }

  // Validar Apellido
  if (!form.value.apellido) {
    newErrors.apellido = 'El apellido es obligatorio'
  } else if (!/^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$/.test(form.value.apellido)) {
    newErrors.apellido = 'Solo letras permitidas'
  } else if (form.value.apellido.length > 30) {
    newErrors.apellido = 'Máximo 30 caracteres'
  }

  // Validar Fecha Nacimiento
  if (!form.value.fecha_nac) {
    newErrors.fecha_nac = 'La fecha es obligatoria'
  }

  // Validar Dirección
  if (!form.value.direccion) {
    newErrors.direccion = 'La dirección es obligatoria'
  } else if (form.value.direccion.length > 35) {
    newErrors.direccion = 'Máximo 35 caracteres'
  }

  // Validar Ciudad
  if (!form.value.ciudad) {
    newErrors.ciudad = 'La ciudad es obligatoria'
  } else if (form.value.ciudad.length > 35) {
    newErrors.ciudad = 'Máximo 35 caracteres'
  }

  // Validar Teléfono
  if (!form.value.telefono) {
    newErrors.telefono = 'El teléfono es obligatorio'
  } else if (!/^\d{9}$/.test(form.value.telefono)) {
    newErrors.telefono = 'Debe tener 9 dígitos'
  }

  // Validar Email
  if (!form.value.email) {
    newErrors.email = 'El email es obligatorio'
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.value.email)) {
    newErrors.email = 'Email inválido'
  }

  // Validar Cargo
  if (!form.value.tipo_cargo) {
    newErrors.tipo_cargo = 'Debe seleccionar un cargo'
  }

  // Validar Habilitado (Solo si es visible)
  if (shouldShowHabilitado.value && !form.value.habilitado) {
    newErrors.habilitado = 'Debe seleccionar un estado'
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
  // El usuario requiere formato 12345678-9 para la BD (sin puntos, con guion)
  const dbRut = cleanRutForStorage(form.value.rut)

  // Format phone number with +56 prefix
  const formattedPhone = `+56${form.value.telefono}`

  const dataToSave = {
    ...form.value,
    rut: dbRut,
    telefono: formattedPhone,
    fecha_nac: form.value.fecha_nac ? new Date(form.value.fecha_nac as any).toISOString() : null
  }
  emit('guardar', dataToSave)
  confirmVisible.value = false
}
</script>

<style scoped>
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

/* Floating Error */
.floating-error {
  position: absolute;
  bottom: -18px;
  left: 0;
  font-size: 0.7rem;
  white-space: nowrap;
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

/* Invalid States */
.is-invalid {
  border-color: #ef4444 !important;
}

.invalid-feedback,
.text-danger {
  font-size: 0.7rem;
  color: #ef4444;
}
</style>
