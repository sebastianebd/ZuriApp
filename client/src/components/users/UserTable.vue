<template>
  <div class="table-responsive">
    <table class="table table-bordered table-sm">
      <thead>
        <tr>
          <th>Rut</th>
          <th>Nombre</th>
          <th>Apellido</th>
          <th>Fecha Nac.</th>
          <th>Dirección</th>
          <th>Ciudad</th>
          <th>Teléfono</th>
          <th>Email</th>
          <th>Servicio</th>
          <th>Habilitado</th>
          <th>Cargo</th>
          <th colspan="2" class="text-center">Acciones</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="(usuario) in usuarios" :key="usuario._id">
          <td>{{ usuario.rut }}</td>
          <td>{{ usuario.nombre }}</td>
          <td>{{ usuario.apellido }}</td>
          <td>{{ formatearFecha(usuario.fecha_nac) }}</td>
          <td>{{ usuario.direccion }}</td>
          <td>{{ usuario.ciudad }}</td>
          <td>{{ usuario.telefono }}</td>
          <td>{{ usuario.email }}</td>
          <td>{{ usuario.servicio }}</td>
          <td>{{ usuario.habilitado }}</td>
          <td>{{ usuario.tipo_cargo }}</td>
          <td>
            <button class="btn btn-warning btn-sm" @click="$emit('editar', usuario)">
              Editar
            </button>
          </td>
          <td>
            <button class="btn btn-danger btn-sm" @click="confirmarEliminacion(usuario)">
              Eliminar
            </button>
          </td>
        </tr>
      </tbody>
    </table>

    <ConfirmationModal
      v-if="mostrarModal"
      :visible="mostrarModal"
      :mensaje="mensajeModal"
      @confirmar="eliminarUsuarioConfirmado"
      @cancelar="cerrarModal"
    />
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import ConfirmationModal from '@/components/common/ConfirmationModal.vue'

defineProps<{ usuarios: any[] }>()
const emit = defineEmits(['editar', 'eliminar'])

const mostrarModal = ref(false)
const usuarioAEliminar = ref<any>(null)
const mensajeModal = ref('¿Deseas eliminar este usuario?')

function confirmarEliminacion(usuario: any) {
  usuarioAEliminar.value = usuario
  mensajeModal.value = `¿Seguro que deseas eliminar a ${usuario.nombre} ${usuario.apellido}?`
  mostrarModal.value = true
}

function eliminarUsuarioConfirmado() {
  if (usuarioAEliminar.value) {
    emit('eliminar', usuarioAEliminar.value._id)
  }
  cerrarModal()
}

function cerrarModal() {
  mostrarModal.value = false
  usuarioAEliminar.value = null
}

function formatearFecha(fecha: string) {
  if (!fecha) return '—'
  try {
    return new Date(fecha).toLocaleDateString('es-CL')
  } catch {
    return '—'
  }
}
</script>
<style scoped>
.table {
  width: 100%;
  table-layout: fixed;
}
</style>

