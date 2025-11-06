<template>
  <div class="modal" :class="{ show: visible }" v-if="visible" style="display:block">
    <div class="modal-dialog modal-lg">
      <div class="modal-content">
        
        <!-- Header -->
        <div class="modal-header">
          <h5 class="modal-title">Crear Nuevo Usuario</h5>
          <button type="button" class="btn-close" @click="emit('cerrar')"></button>
        </div>

        <!-- Body -->
        <div class="modal-body">
          <form @submit.prevent="abrirConfirmacion">
            <div class="row">
              <!-- Columna izquierda -->
              <div class="col-md-6">
                <label class="form-label">RUT</label>
                <input v-model="form.rut" class="form-control form-control-sm" required />

                <label class="form-label mt-2">Nombre</label>
                <input v-model="form.nombre" class="form-control form-control-sm" required />

                <label class="form-label mt-2">Apellido</label>
                <input v-model="form.apellido" class="form-control form-control-sm" required />

                <label class="form-label mt-2">Fecha de Nacimiento</label>
                <input
                  v-model="form.fecha_nac"
                  type="date"
                  class="form-control form-control-sm"
                  required
                />

                <label class="form-label mt-2">Dirección</label>
                <input v-model="form.direccion" class="form-control form-control-sm" />
              </div>

              <!-- Columna derecha -->
              <div class="col-md-6">
                <label class="form-label">Ciudad</label>
                <input v-model="form.ciudad" class="form-control form-control-sm" />

                <label class="form-label mt-2">Teléfono</label>
                <input v-model="form.telefono" class="form-control form-control-sm" />

                <label class="form-label mt-2">Email</label>
                <input
                  v-model="form.email"
                  type="email"
                  class="form-control form-control-sm"
                  required
                />

                <label class="form-label mt-2">Cargo</label>
                <select v-model="form.tipo_cargo" class="form-select form-select-sm" required>
                  <option value="">Seleccione cargo</option>
                  <option v-for="cargo in listaTipoCargo" :key="cargo" :value="cargo">
                    {{ cargo }}
                  </option>
                </select>

                <label class="form-label mt-2">Servicio</label>
                <input v-model="form.servicio" class="form-control form-control-sm" />
              </div>
            </div>
          </form>
        </div>

        <!-- Footer -->
        <div class="modal-footer">
          <button class="btn btn-secondary btn-sm" @click="emit('cerrar')">Cancelar</button>
          <button class="btn btn-success btn-sm" @click="abrirConfirmacion">Guardar</button>
        </div>
      </div>
    </div>

    <!-- 🔸 Modal de confirmación -->
    <ConfirmationModal
      :visible="confirmVisible"
      mensaje="¿Seguro que deseas crear este usuario?"
      @confirmar="confirmarGuardar"
      @cancelar="cerrarConfirmacion"
    />
  </div>
</template>

<script setup lang="ts">
import { ref } from "vue";
import ConfirmationModal from "@/components/common/ConfirmationModal.vue";


defineProps<{
  visible: boolean;
  listaTipoCargo: string[];
}>();

const emit = defineEmits<{
  (e: "cerrar"): void;
  (e: "guardar", nuevoUsuario: any): void;
}>();

const form = ref({
  rut: "",
  nombre: "",
  apellido: "",
  fecha_nac: "",
  direccion: "",
  ciudad: "",
  telefono: "",
  email: "",
  tipo_cargo: "",
  servicio: "",
});

// Estado del modal de confirmación
const confirmVisible = ref(false);

function abrirConfirmacion() {
  confirmVisible.value = true;
}

function cerrarConfirmacion() {
  confirmVisible.value = false;
}

function confirmarGuardar() {
  emit("guardar", { ...form.value });
  confirmVisible.value = false;
}
</script>

<style scoped>
.modal {
  background-color: rgba(0, 0, 0, 0.6);
}
</style>

