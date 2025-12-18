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
              <i class="bi bi-pencil-square me-2"></i>MODIFICAR USUARIO
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
            <div class="row g-4">
              <!-- Columna 1: Datos Personales -->
              <div class="col-md-6">
                <div class="p-3 bg-light rounded-3 border border-1 shadow-xs h-100">
                  <h6 class="text-primary fw-bold mb-3 smaller text-uppercase tracking-wider">
                    Datos Personales
                  </h6>

                  <div class="mb-3">
                    <label class="form-label text-secondary fw-semibold small">Nombre</label>
                    <input
                      v-model="editableUsuario.nombre"
                      type="text"
                      class="form-control bg-white border-0 shadow-sm rounded-3"
                      placeholder="Nombre"
                    />
                  </div>

                  <div class="mb-3">
                    <label class="form-label text-secondary fw-semibold small">Apellido</label>
                    <input
                      v-model="editableUsuario.apellido"
                      type="text"
                      class="form-control bg-white border-0 shadow-sm rounded-3"
                      placeholder="Apellido"
                    />
                  </div>

                  <div class="mb-3">
                    <label class="form-label text-secondary fw-semibold small">Dirección</label>
                    <input
                      v-model="editableUsuario.direccion"
                      type="text"
                      class="form-control bg-white border-0 shadow-sm rounded-3"
                      placeholder="Dirección"
                    />
                  </div>

                  <div class="mb-0">
                    <label class="form-label text-secondary fw-semibold small">Ciudad</label>
                    <input
                      v-model="editableUsuario.ciudad"
                      type="text"
                      class="form-control bg-white border-0 shadow-sm rounded-3"
                      placeholder="Ciudad"
                    />
                  </div>
                </div>
              </div>

              <!-- Columna 2: Contacto y Laboral -->
              <div class="col-md-6">
                <div class="d-flex flex-column gap-4 h-100">
                  <!-- Info Contacto -->
                  <div class="p-3 bg-light rounded-3 border border-1 shadow-xs flex-grow-1">
                    <h6 class="text-primary fw-bold mb-3 smaller text-uppercase tracking-wider">
                      Información de Contacto
                    </h6>

                    <div class="mb-3">
                      <label class="form-label text-secondary fw-semibold small">Email</label>
                      <input
                        v-model="editableUsuario.email"
                        type="email"
                        class="form-control bg-white border-0 shadow-sm rounded-3"
                        placeholder="Email"
                      />
                    </div>

                    <div class="mb-0">
                      <label class="form-label text-secondary fw-semibold small">Teléfono</label>
                      <input
                        v-model="editableUsuario.telefono"
                        type="text"
                        class="form-control bg-white border-0 shadow-sm rounded-3"
                        placeholder="Teléfono"
                      />
                    </div>
                  </div>

                  <!-- Info Laboral -->
                  <div
                    class="p-3 bg-light rounded-3 border border-1 shadow-xs flex-grow-1 text-deep"
                  >
                    <h6 class="text-primary fw-bold mb-3 smaller text-uppercase tracking-wider">
                      Información Laboral
                    </h6>

                    <div class="mb-3">
                      <label class="form-label text-secondary fw-semibold small">Cargo</label>
                      <v-select
                        v-model="editableUsuario.tipo_cargo"
                        :options="listaTipoCargo"
                        :clearable="false"
                        :searchable="false"
                        placeholder="Seleccione un cargo"
                        class="custom-v-select"
                      />
                    </div>

                    <div class="mb-0">
                      <label class="form-label text-secondary fw-semibold small">Habilitado</label>
                      <v-select
                        v-model="editableUsuario.habilitado"
                        :options="listaHabilitado"
                        :clearable="false"
                        :searchable="false"
                        placeholder="Seleccione estado"
                        class="custom-v-select"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>
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
              class="btn btn-primary fw-bold px-4 shadow-sm"
              @click="abrirConfirmacion"
            >
              <i class="bi bi-check-lg me-2"></i>Guardar Cambios
            </button>
          </div>

          <!-- MODAL CONFIRMACIÓN -->
          <ConfirmationModal
            :visible="confirmVisible"
            mensaje="¿Deseas guardar los cambios en este usuario?"
            @confirmar="confirmarGuardar"
            @cancelar="cerrarConfirmacion"
          />
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
  listaHabilitado: string[]
}>()

const emit = defineEmits(['cerrar', 'guardar'])

const editableUsuario = ref<registrarUsuario>({ ...props.usuario })

watch(
  () => props.usuario,
  (nuevoUsuario) => {
    editableUsuario.value = { ...nuevoUsuario }
  },
  { immediate: true }
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
  emit('guardar', editableUsuario.value)
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

button {
  transition: all 0.2s ease;
}

button:hover:not(:disabled) {
  transform: translateY(-1px);
}

/* Custom styles for v-select */
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
</style>
