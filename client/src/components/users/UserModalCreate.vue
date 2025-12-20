<template>
  <Transition name="fade">
    <div
      class="modal fade show d-block"
      v-if="visible"
      tabindex="-1"
      role="dialog"
      style="background-color: rgba(30, 41, 59, 0.5); backdrop-filter: blur(4px)"
    >
      <div class="modal-dialog modal-lg modal-dialog-centered" role="document">
        <div class="modal-content shadow-lg border-0 rounded-4">
          <!-- HEADER -->
          <div class="modal-header border-0 bg-primary bg-gradient text-white p-4 rounded-top-4">
            <h5 class="modal-title fw-bold">
              <i class="bi bi-person-plus-fill me-2"></i>CREAR NUEVO USUARIO
            </h5>
            <button
              type="button"
              class="btn-close btn-close-white"
              @click="emit('cerrar')"
              aria-label="Close"
            ></button>
          </div>

          <!-- BODY -->
          <div class="modal-body p-4 bg-white">
            <form @submit.prevent="abrirConfirmacion">
              <div class="row g-4">
                <!-- Columna izquierda: Datos Personales -->
                <div class="col-md-6">
                  <div class="p-4 bg-light rounded-3 border border-1 shadow-xs h-100">
                    <h6 class="text-primary fw-bold mb-4 smaller text-uppercase tracking-wider">
                      Datos Personales
                    </h6>

                    <!-- RUT -->
                    <div class="mb-4">
                      <label class="mb-2 form-label text-secondary fw-semibold small">RUT</label>
                      <input
                        v-model="form.rut"
                        class="form-control bg-white border-0 shadow-sm rounded-3"
                        :class="{ 'is-invalid': errors.rut }"
                        placeholder="12.345.678-9"
                        @input="handleRutInput"
                      />
                      <div v-if="errors.rut" class="text-danger x-small mt-1 px-1 fw-bold">
                        <i class="bi bi-exclamation-circle me-1"></i>{{ errors.rut }}
                      </div>
                    </div>

                    <!-- Nombre -->
                    <div class="mb-4">
                      <label class="mb-2 form-label text-secondary fw-semibold small">Nombre</label>
                      <input
                        v-model="form.nombre"
                        class="form-control bg-white border-0 shadow-sm rounded-3"
                        :class="{ 'is-invalid': errors.nombre }"
                        placeholder="Ingrese nombre"
                      />
                      <div v-if="errors.nombre" class="text-danger x-small mt-1 px-1 fw-bold">
                        <i class="bi bi-exclamation-circle me-1"></i>{{ errors.nombre }}
                      </div>
                    </div>

                    <!-- Apellido -->
                    <div class="mb-4">
                      <label class="mb-2 form-label text-secondary fw-semibold small"
                        >Apellido</label
                      >
                      <input
                        v-model="form.apellido"
                        class="form-control bg-white border-0 shadow-sm rounded-3"
                        :class="{ 'is-invalid': errors.apellido }"
                        placeholder="Ingrese apellido"
                      />
                      <div v-if="errors.apellido" class="text-danger x-small mt-1 px-1 fw-bold">
                        <i class="bi bi-exclamation-circle me-1"></i>{{ errors.apellido }}
                      </div>
                    </div>

                    <!-- Fecha de Nacimiento -->
                    <div class="mb-4">
                      <label class="mb-2 form-label text-secondary fw-semibold small"
                        >Fecha de Nacimiento</label
                      >
                      <DatePicker
                        v-model="form.fecha_nac"
                        :popover="popoverConfig"
                        :masks="{ input: 'DD/MM/YYYY' }"
                      >
                        <template #default="{ inputValue, inputEvents }">
                          <div class="input-group">
                            <span
                              class="input-group-text bg-white border-0 shadow-sm rounded-start-3"
                            >
                              <i class="bi bi-calendar3 text-primary x-small"></i>
                            </span>
                            <input
                              class="form-control bg-white border-0 shadow-sm rounded-end-3"
                              :class="{ 'is-invalid': errors.fecha_nac }"
                              :value="inputValue"
                              v-on="inputEvents"
                              placeholder="Seleccione fecha"
                              readonly
                            />
                          </div>
                        </template>
                      </DatePicker>
                      <div v-if="errors.fecha_nac" class="text-danger x-small mt-1 px-1 fw-bold">
                        <i class="bi bi-exclamation-circle me-1"></i>{{ errors.fecha_nac }}
                      </div>
                    </div>

                    <!-- Dirección -->
                    <div class="mb-0">
                      <label class="mb-2 form-label text-secondary fw-semibold small"
                        >Dirección</label
                      >
                      <input
                        v-model="form.direccion"
                        class="form-control bg-white border-0 shadow-sm rounded-3"
                        :class="{ 'is-invalid': errors.direccion }"
                        placeholder="Calle, Número, Depto"
                      />
                      <div v-if="errors.direccion" class="text-danger x-small mt-1 px-1 fw-bold">
                        <i class="bi bi-exclamation-circle me-1"></i>{{ errors.direccion }}
                      </div>
                    </div>
                  </div>
                </div>

                <!-- Columna derecha: Cuenta y Contacto -->
                <div class="col-md-6">
                  <div class="p-4 bg-light rounded-3 border border-1 shadow-xs h-100">
                    <h6 class="text-primary fw-bold mb-4 smaller text-uppercase tracking-wider">
                      Cuenta y Contacto
                    </h6>

                    <!-- Ciudad -->
                    <div class="mb-4">
                      <label class="mb-2 form-label text-secondary fw-semibold small">Ciudad</label>
                      <input
                        v-model="form.ciudad"
                        class="form-control bg-white border-0 shadow-sm rounded-3"
                        :class="{ 'is-invalid': errors.ciudad }"
                        placeholder="Ingrese ciudad"
                      />
                      <div v-if="errors.ciudad" class="text-danger x-small mt-1 px-1 fw-bold">
                        <i class="bi bi-exclamation-circle me-1"></i>{{ errors.ciudad }}
                      </div>
                    </div>

                    <!-- Teléfono -->
                    <div class="mb-4">
                      <label class="mb-2 form-label text-secondary fw-semibold small"
                        >Teléfono</label
                      >
                      <input
                        v-model="form.telefono"
                        class="form-control bg-white border-0 shadow-sm rounded-3"
                        :class="{ 'is-invalid': errors.telefono }"
                        placeholder="+56 9 1234 5678"
                      />
                      <div v-if="errors.telefono" class="text-danger x-small mt-1 px-1 fw-bold">
                        <i class="bi bi-exclamation-circle me-1"></i>{{ errors.telefono }}
                      </div>
                    </div>

                    <!-- Email -->
                    <div class="mb-4">
                      <label class="mb-2 form-label text-secondary fw-semibold small">Email</label>
                      <input
                        v-model="form.email"
                        type="email"
                        class="form-control bg-white border-0 shadow-sm rounded-3"
                        :class="{ 'is-invalid': errors.email }"
                        placeholder="correo@ejemplo.com"
                      />
                      <div v-if="errors.email" class="text-danger x-small mt-1 px-1 fw-bold">
                        <i class="bi bi-exclamation-circle me-1"></i>{{ errors.email }}
                      </div>
                    </div>

                    <!-- Cargo -->
                    <div class="mb-4">
                      <label class="mb-2 form-label text-secondary fw-semibold small">Cargo</label>
                      <v-select
                        v-model="form.tipo_cargo"
                        :options="listaTipoCargo"
                        placeholder="Seleccione cargo"
                        class="custom-v-select"
                        :class="{ 'is-invalid': errors.tipo_cargo }"
                        :clearable="false"
                        :searchable="false"
                      />
                      <div v-if="errors.tipo_cargo" class="text-danger x-small mt-1 px-1 fw-bold">
                        <i class="bi bi-exclamation-circle me-1"></i>{{ errors.tipo_cargo }}
                      </div>
                    </div>

                    <!-- Habilitado -->
                    <div class="mb-0">
                      <label class="mb-2 form-label text-secondary fw-semibold small"
                        >Habilitado</label
                      >
                      <v-select
                        v-model="form.habilitado"
                        :options="listaHabilitado"
                        placeholder="Seleccione estado"
                        class="custom-v-select"
                        :class="{ 'is-invalid': errors.habilitado }"
                        :clearable="false"
                        :searchable="false"
                      />
                      <div v-if="errors.habilitado" class="text-danger x-small mt-1 px-1 fw-bold">
                        <i class="bi bi-exclamation-circle me-1"></i>{{ errors.habilitado }}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </form>
          </div>

          <!-- FOOTER -->
          <div class="modal-footer border-0 p-4 pt-0 d-flex justify-content-end gap-2">
            <button
              type="button"
              class="btn btn-light fw-bold px-4 border text-secondary"
              @click="emit('cerrar')"
            >
              Cancelar
            </button>
            <button
              type="button"
              class="btn btn-success fw-bold px-4 shadow-sm"
              @click="abrirConfirmacion"
            >
              <i class="bi bi-person-check-fill me-2"></i>Guardar Usuario
            </button>
          </div>

          <!-- Modal de confirmación -->
          <ConfirmationModal
            :visible="confirmVisible"
            mensaje="¿Seguro que deseas crear este usuario?"
            @confirmar="confirmarGuardar"
            @cancelar="cerrarConfirmacion"
          />
        </div>
      </div>
    </div>
  </Transition>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import ConfirmationModal from '@/components/common/ConfirmationModal.vue'
import { validateRut } from '@fdograph/rut-utilities'
import { formatRut, cleanRutForStorage } from '@/utils/rut.util'
import { DatePicker } from 'v-calendar'
import 'v-calendar/dist/style.css'

defineProps<{
  visible: boolean
  listaTipoCargo: string[]
  listaHabilitado: string[]
  listaServicios: string[]
}>()

const emit = defineEmits<{
  (e: 'cerrar'): void
  (e: 'guardar', nuevoUsuario: any): void
}>()

const form = ref({
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
})

// Estado de errores
const errors = ref<Record<string, string>>({})

// Estado del modal de confirmación
const confirmVisible = ref(false)

// Configuración DatePicker
const popoverConfig = {
  visibility: 'click' as const,
  placement: 'bottom' as const
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
  } else if (!/^\+569\d{8}$/.test(form.value.telefono)) {
    newErrors.telefono = 'Formato inválido (+569XXXXXXXX)'
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

  // Validar Habilitado
  if (!form.value.habilitado) {
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

  const dataToSave = {
    ...form.value,
    rut: dbRut,
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
  transition: opacity 0.3s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

.smaller {
  font-size: 0.75rem;
}

.tracking-wider {
  letter-spacing: 0.05em;
}

.shadow-xs {
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
}

/* Custom v-select */
.custom-v-select :deep(.vs__dropdown-toggle) {
  background: white;
  border: none;
  border-radius: 0.5rem;
  padding: 4px 8px;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.075);
}

.custom-v-select :deep(.vs__selected) {
  font-size: 0.875rem;
  color: #1e293b;
  font-weight: 500;
  line-height: 27px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 100%;
}

.custom-v-select :deep(.vs__actions svg) {
  fill: #64748b;
  transform: scale(0.8);
}

.custom-v-select :deep(.vs__dropdown-menu) {
  border: none;
  border-radius: 0.75rem;
  box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1);
  padding: 8px;
  font-size: 0.875rem;
  overflow: hidden;
}

.custom-v-select :deep(.vs__dropdown-option) {
  border-radius: 0.375rem;
  padding: 8px 12px;
  margin-bottom: 2px;
}

.custom-v-select :deep(.vs__dropdown-option--highlight) {
  background: #3b82f6;
  color: white;
}

.custom-v-select.is-invalid :deep(.vs__dropdown-toggle) {
  border: 1px solid #dc3545 !important;
}

button {
  transition: all 0.2s ease;
}

button:hover:not(:disabled) {
  transform: translateY(-1px);
  filter: brightness(1.05);
}

button:active {
  transform: translateY(0);
}
</style>
