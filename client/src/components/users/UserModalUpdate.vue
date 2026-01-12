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

                    <!-- Nombre -->
                    <div class="mb-4 position-relative">
                      <label class="form-label x-small fw-bold text-secondary text-uppercase"
                        >Nombre</label
                      >
                      <input
                        v-model="editableUsuario.nombre"
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
                        v-model="editableUsuario.apellido"
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
                        v-model="editableUsuario.direccion"
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
                        v-model="editableUsuario.ciudad"
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
                        <span class="input-group-text bg-light text-secondary fw-bold border-end-0">
                          +56
                        </span>
                        <input
                          v-model="editableUsuario.telefono"
                          type="text"
                          class="form-control border-start-0 ps-1"
                          placeholder="912345678"
                          maxlength="9"
                          @input="
                            editableUsuario.telefono = String(editableUsuario.telefono).replace(
                              /[^0-9]/g,
                              ''
                            )
                          "
                        />
                      </div>
                    </div>

                    <!-- Cargo -->
                    <div class="mb-4 position-relative">
                      <label class="form-label x-small fw-bold text-secondary text-uppercase"
                        >Cargo</label
                      >
                      <v-select
                        v-model="editableUsuario.tipo_cargo"
                        :options="listaTipoCargo"
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
                        v-model="editableUsuario.tipo_contrato"
                        :options="listaTipoContrato"
                        placeholder="Seleccione tipo contrato"
                        class="custom-v-select"
                        :clearable="false"
                        :searchable="false"
                      />
                    </div>

                    <!-- Habilitado -->
                    <div class="mb-0 position-relative">
                      <label class="form-label x-small fw-bold text-secondary text-uppercase"
                        >Estado</label
                      >
                      <v-select
                        v-model="editableUsuario.habilitado"
                        :options="listaHabilitado"
                        placeholder="Seleccione estado"
                        class="custom-v-select"
                        :clearable="false"
                        :searchable="true"
                      />
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
              <i class="bi bi-check-lg me-2"></i>Guardar Cambios
            </button>
          </div>

          <!-- Modal de confirmación -->
          <Teleport to="body">
            <ConfirmationModal
              :visible="confirmVisible"
              mensaje="¿Deseas guardar los cambios en este usuario?"
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
import type { registrarUsuario } from '@/types/models'

const props = defineProps<{
  visible: boolean
  usuario: registrarUsuario
  listaTipoCargo: string[]
  listaTipoContrato: string[]
  listaHabilitado: string[]
}>()

const emit = defineEmits(['cerrar', 'guardar'])

const editableUsuario = ref<registrarUsuario>({ ...props.usuario })

watch(
  () => props.usuario,
  (nuevoUsuario) => {
    // Copiar usuario
    const usuarioCopia = { ...nuevoUsuario }

    // Limpiar teléfono para quitar el +56 si viene del backend
    if (usuarioCopia.telefono) {
      let phoneStr = String(usuarioCopia.telefono)
      if (phoneStr.startsWith('+56')) {
        phoneStr = phoneStr.replace('+56', '')
      }
      usuarioCopia.telefono = phoneStr
    }

    editableUsuario.value = usuarioCopia
  },
  { immediate: true, deep: true }
)

// Estado del modal de confirmación
const confirmVisible = ref(false)

function abrirConfirmacion() {
  confirmVisible.value = true
}

function cerrarConfirmacion() {
  confirmVisible.value = false
}

function confirmarGuardar() {
  const usuarioAGuardar = { ...editableUsuario.value }
  // Agregar prefijo +56 antes de enviar
  if (usuarioAGuardar.telefono) {
    usuarioAGuardar.telefono = `+56${usuarioAGuardar.telefono}`
  }

  emit('guardar', usuarioAGuardar)
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
