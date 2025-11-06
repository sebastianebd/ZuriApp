<template>
  <div class="modal" :class="{ show: visible }" v-if="visible" style="display:block">
    <div class="modal-dialog modal-lg">
      <div class="modal-content">

        <div class="modal-header">
          <h5 class="modal-title">Modificar Usuario</h5>
          <button type="button" class="btn-close" @click="emit('cerrar')"></button>
        </div>

        <div class="modal-body">
          <div class="row">
            <div class="col-md-6">
              <label class="form-label">Dirección</label>
              <input v-model="editableUsuario.direccion" class="form-control form-control-sm" />

              <label class="form-label mt-2">Ciudad</label>
              <input v-model="editableUsuario.ciudad" class="form-control form-control-sm" />

              <label class="form-label mt-2">Teléfono</label>
              <input v-model="editableUsuario.telefono" class="form-control form-control-sm" />
            </div>

            <div class="col-md-6">
              <label class="form-label">Email</label>
              <input v-model="editableUsuario.email" class="form-control form-control-sm" />

              <label class="form-label mt-2">Cargo</label>
              <select v-model="editableUsuario.tipo_cargo" class="form-select form-select-sm">
                <option v-for="cargo in listaTipoCargo" :key="cargo" :value="cargo">
                  {{ cargo }}
                </option>
              </select>

              <div class="mt-2" v-if="showHabilitado">
                <label class="form-label">Habilitado</label>
                <select v-model="editableUsuario.habilitado" class="form-select form-select-sm">
                  <option v-for="h in listaHabilitado" :key="h" :value="h">{{ h }}</option>
                </select>
              </div>
            </div>
          </div>
        </div>

        <div class="modal-footer">
          <button class="btn btn-secondary btn-sm" @click="emit('cerrar')">Cancelar</button>
          <button class="btn btn-primary btn-sm" @click="abrirConfirmacion">Guardar</button>
        </div>
      </div>
    </div>

    <!-- 🔸 Modal de confirmación -->
    <ConfirmationModal
      :visible="confirmVisible"
      mensaje="¿Deseas guardar los cambios en este usuario?"
      @confirmar="confirmarGuardar"
      @cancelar="cerrarConfirmacion"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, watch, computed } from 'vue'
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

const showHabilitado = computed(() => editableUsuario.value?.tipo_cargo === 'TENS')

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
