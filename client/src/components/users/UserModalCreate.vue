<template>
  <div class="modal fade show d-block" v-if="visible" tabindex="-1" role="dialog">
    <div class="modal-dialog modal-lg modal-dialog-centered" role="document">
      <div class="modal-content shadow-lg border-0 rounded-3">
        <!-- HEADER -->
        <div class="modal-header bg-primary text-white rounded-top">
          <h5 class="modal-title fst-italic fw-bold">CREAR NUEVO USUARIO</h5>
          <button
            type="button"
            class="btn-close btn-close-white"
            @click="emit('cerrar')"
            aria-label="Close"
          ></button>
        </div>

        <!-- BODY -->
        <div class="modal-body bg-light">
          <form @submit.prevent="abrirConfirmacion">
            <div class="row">
              <!-- Columna izquierda -->
              <div class="col-md-6 mb-3">
                <div class="border rounded-3 p-3 bg-white shadow-sm h-100">
                  <label class="form-label fw-semibold text-primary">RUT</label>
                  <input v-model="form.rut" class="form-control form-control-sm mb-2" required />

                  <label class="form-label fw-semibold text-primary">Nombre</label>
                  <input v-model="form.nombre" class="form-control form-control-sm mb-2" required />

                  <label class="form-label fw-semibold text-primary">Apellido</label>
                  <input
                    v-model="form.apellido"
                    class="form-control form-control-sm mb-2"
                    required
                  />

                  <label class="form-label fw-semibold text-primary">Fecha de Nacimiento</label>
                  <input
                    v-model="form.fecha_nac"
                    type="date"
                    class="form-control form-control-sm mb-2"
                    required
                  />

                  <label class="form-label fw-semibold text-primary">Dirección</label>
                  <input v-model="form.direccion" class="form-control form-control-sm" />
                </div>
              </div>

              <!-- Columna derecha -->
              <div class="col-md-6 mb-3">
                <div class="border rounded-3 p-3 bg-white shadow-sm h-100">
                  <label class="form-label fw-semibold text-primary">Ciudad</label>
                  <input v-model="form.ciudad" class="form-control form-control-sm mb-2" />

                  <label class="form-label fw-semibold text-primary">Teléfono</label>
                  <input v-model="form.telefono" class="form-control form-control-sm mb-2" />

                  <label class="form-label fw-semibold text-primary">Email</label>
                  <input
                    v-model="form.email"
                    type="email"
                    class="form-control form-control-sm mb-2"
                    required
                  />

                  <label class="form-label fw-semibold text-primary">Cargo</label>
                  <select
                    v-model="form.tipo_cargo"
                    class="form-select form-select-sm mb-2 form-option-sm"
                    required
                  >
                    <option value="">Seleccione cargo</option>
                    <option v-for="cargo in listaTipoCargo" :key="cargo" :value="cargo">
                      {{ cargo }}
                    </option>
                  </select>

                    <label class="form-label fw-semibold text-primary">Habilitado</label>
                    <select v-model="form.habilitado" class="form-control form-control-sm" required>
                      <option value="">Seleccione habilitado</option>
                      <option
                        v-for="habilitado in listaHabilitado"
                        :key="habilitado"
                        :value="habilitado"
                      >
                        {{ habilitado }}
                      </option>
                    </select>
                </div>
              </div>
            </div>
          </form>
        </div>

        <!-- FOOTER -->
        <div class="modal-footer d-flex justify-content-center border-0 pb-4">
          <button
            type="button"
            class="btn btn-secondary px-4 fw-semibold me-2"
            @click="emit('cerrar')"
          >
            Cancelar
          </button>
          <button type="button" class="btn btn-success px-4 fw-semibold" @click="abrirConfirmacion">
            Guardar
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
</template>

<script setup lang="ts">
import {  ref } from 'vue'
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
.modal {
  background-color: rgba(0, 0, 0, 0.6);
}
</style>
