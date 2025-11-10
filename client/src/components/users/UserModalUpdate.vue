<template>
  <div class="modal fade show d-block" v-if="visible" tabindex="-1" role="dialog">
    <div class="modal-dialog modal-lg modal-dialog-centered" role="document">
      <div class="modal-content shadow-lg border-0 rounded-3">
        <!-- HEADER -->
        <div class="modal-header bg-primary text-white rounded-top">
          <h5 class="modal-title fst-italic fw-bold">Modificar Usuario</h5>
          <button
            type="button"
            class="btn-close btn-close-white"
            @click="emit('cerrar')"
            aria-label="Close"
          ></button>
        </div>

        <!-- BODY -->
        <div class="modal-body bg-light">
          <div class="row">
            <!-- Columna 1 -->
            <div class="col-md-6 mb-3">
              <div class="border rounded-3 p-3 bg-white shadow-sm h-100">
                <h6 class="text-primary fw-semibold mb-3">Datos Personales</h6>

                <div class="form-floating mb-2">
                  <input
                    v-model="editableUsuario.nombre"
                    type="text"
                    id="nombreUsuario"
                    class="form-control form-control-sm"
                    placeholder="Nombre"
                  />
                  <label for="nombreUsuario">Nombre</label>
                </div>

                <div class="form-floating mb-2">
                  <input
                    v-model="editableUsuario.apellido"
                    type="text"
                    id="apellidoUsuario"
                    class="form-control form-control-sm"
                    placeholder="Apellido"
                  />
                  <label for="apellidoUsuario">Apellido</label>
                </div>

                <div class="form-floating mb-2">
                  <input
                    v-model="editableUsuario.direccion"
                    type="text"
                    id="direccionUsuario"
                    class="form-control form-control-sm"
                    placeholder="Dirección"
                  />
                  <label for="direccionUsuario">Dirección</label>
                </div>

                <div class="form-floating mb-2">
                  <input
                    v-model="editableUsuario.ciudad"
                    type="text"
                    id="ciudadUsuario"
                    class="form-control form-control-sm"
                    placeholder="Ciudad"
                  />
                  <label for="ciudadUsuario">Ciudad</label>
                </div>
              </div>
            </div>

            <!-- Columna 2 -->
            <div class="col-md-6 mb-3">
              <div class="border rounded-3 p-3 bg-white shadow-sm">
                <h6 class="text-primary fw-semibold mb-3">Información de Contacto</h6>

                <div class="form-floating mb-2">
                  <input
                    v-model="editableUsuario.email"
                    type="email"
                    id="emailUsuario"
                    class="form-control form-control-sm"
                    placeholder="Email"
                  />
                  <label for="emailUsuario">Email</label>
                </div>

                <div class="form-floating mb-2">
                  <input
                    v-model="editableUsuario.telefono"
                    type="text"
                    id="telefonoUsuario"
                    class="form-control form-control-sm"
                    placeholder="Teléfono"
                  />
                  <label for="telefonoUsuario">Teléfono</label>
                </div>
              </div>
            </div>

            <div class="col-md-6 mb-3">
              <div class="border rounded-3 p-3 bg-white shadow-sm h-100">
                <h6 class="text-primary fw-semibold mb-3">Información Laboral</h6>

                <div class="form-floating mb-2">
                  <select
                    v-model="editableUsuario.tipo_cargo"
                    id="cargoUsuario"
                    class="form-select form-select-sm"
                  >
                    <option v-for="cargo in listaTipoCargo" :key="cargo" :value="cargo">
                      {{ cargo }}
                    </option>
                  </select>
                  <label for="cargoUsuario">Cargo</label>
                </div>

                <div class="form-floating mb-2">
                  <select
                    v-model="editableUsuario.habilitado"
                    id="habilitadoUsuario"
                    class="form-select form-select-sm"
                  >
                    <option v-for="h in listaHabilitado" :key="h" :value="h">{{ h }}</option>
                  </select>
                  <label for="habilitadoUsuario">Habilitado</label>
                </div>
              </div>
            </div>
          </div>
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
          <button type="button" class="btn btn-primary px-4 fw-semibold" @click="abrirConfirmacion">
            Guardar
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
.modal-content {
  border-radius: 12px;
  overflow: hidden;
  animation: fadeInModal 0.25s ease;
}

@keyframes fadeInModal {
  from {
    opacity: 0;
    transform: translateY(-10px) scale(0.98);
  }
  to {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
}

.modal {
  background-color: rgba(0, 0, 0, 0.5);
}
</style>
