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
                  <div class="p-3 bg-light rounded-3 border border-1 shadow-xs h-100">
                    <h6 class="text-primary fw-bold mb-3 smaller text-uppercase tracking-wider">
                      Datos Personales
                    </h6>

                    <div class="mb-3">
                      <label class="form-label text-secondary fw-semibold small">RUT</label>
                      <input
                        v-model="form.rut"
                        class="form-control bg-white border-0 shadow-sm rounded-3"
                        required
                        placeholder="12.345.678-9"
                      />
                    </div>

                    <div class="mb-3">
                      <label class="form-label text-secondary fw-semibold small">Nombre</label>
                      <input
                        v-model="form.nombre"
                        class="form-control bg-white border-0 shadow-sm rounded-3"
                        required
                        placeholder="Ingrese nombre"
                      />
                    </div>

                    <div class="mb-3">
                      <label class="form-label text-secondary fw-semibold small">Apellido</label>
                      <input
                        v-model="form.apellido"
                        class="form-control bg-white border-0 shadow-sm rounded-3"
                        required
                        placeholder="Ingrese apellido"
                      />
                    </div>

                    <div class="mb-3">
                      <label class="form-label text-secondary fw-semibold small"
                        >Fecha de Nacimiento</label
                      >
                      <input
                        v-model="form.fecha_nac"
                        type="date"
                        class="form-control bg-white border-0 shadow-sm rounded-3"
                        required
                      />
                    </div>

                    <div class="mb-0">
                      <label class="form-label text-secondary fw-semibold small">Dirección</label>
                      <input
                        v-model="form.direccion"
                        class="form-control bg-white border-0 shadow-sm rounded-3"
                        placeholder="Calle, Número, Depto"
                      />
                    </div>
                  </div>
                </div>

                <!-- Columna derecha: Cuenta y Contacto -->
                <div class="col-md-6">
                  <div class="p-3 bg-light rounded-3 border border-1 shadow-xs h-100">
                    <h6 class="text-primary fw-bold mb-3 smaller text-uppercase tracking-wider">
                      Cuenta y Contacto
                    </h6>

                    <div class="mb-3">
                      <label class="form-label text-secondary fw-semibold small">Ciudad</label>
                      <input
                        v-model="form.ciudad"
                        class="form-control bg-white border-0 shadow-sm rounded-3"
                        placeholder="Ingrese ciudad"
                      />
                    </div>

                    <div class="mb-3">
                      <label class="form-label text-secondary fw-semibold small">Teléfono</label>
                      <input
                        v-model="form.telefono"
                        class="form-control bg-white border-0 shadow-sm rounded-3"
                        placeholder="+56 9 ..."
                      />
                    </div>

                    <div class="mb-3">
                      <label class="form-label text-secondary fw-semibold small">Email</label>
                      <input
                        v-model="form.email"
                        type="email"
                        class="form-control bg-white border-0 shadow-sm rounded-3"
                        required
                        placeholder="correo@ejemplo.com"
                      />
                    </div>

                    <div class="mb-3">
                      <label class="form-label text-secondary fw-semibold small">Cargo</label>
                      <v-select
                        v-model="form.tipo_cargo"
                        :options="listaTipoCargo"
                        placeholder="Seleccione cargo"
                        class="custom-v-select"
                        :clearable="false"
                        :searchable="false"
                      />
                    </div>

                    <div class="mb-0">
                      <label class="form-label text-secondary fw-semibold small">Habilitado</label>
                      <v-select
                        v-model="form.habilitado"
                        :options="listaHabilitado"
                        placeholder="Seleccione estado"
                        class="custom-v-select"
                        :clearable="false"
                        :searchable="false"
                      />
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
  fecha_nac: '',
  direccion: '',
  ciudad: '',
  telefono: '',
  email: '',
  tipo_cargo: '',
  servicio: '',
  habilitado: ''
})

// Estado del modal de confirmación
const confirmVisible = ref(false)

function abrirConfirmacion() {
  confirmVisible.value = true
}

function cerrarConfirmacion() {
  confirmVisible.value = false
}

function confirmarGuardar() {
  emit('guardar', { ...form.value })
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
