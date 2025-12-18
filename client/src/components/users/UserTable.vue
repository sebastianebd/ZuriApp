<template>
  <div class="table-responsive rounded-3 border overflow-hidden shadow-sm">
    <table class="table table-hover align-middle mb-0">
      <thead class="bg-primary bg-gradient text-white">
        <tr>
          <th scope="col" class="py-3 px-4 smaller fw-bold text-uppercase tracking-wider">RUT</th>
          <th scope="col" class="py-3 px-3 smaller fw-bold text-uppercase tracking-wider">
            Nombre
          </th>
          <th scope="col" class="py-3 px-3 smaller fw-bold text-uppercase tracking-wider">
            Apellido
          </th>
          <th scope="col" class="py-3 px-3 smaller fw-bold text-uppercase tracking-wider">
            Fecha Nac.
          </th>
          <th scope="col" class="py-3 px-3 smaller fw-bold text-uppercase tracking-wider">
            Ciudad/Dirección
          </th>
          <th scope="col" class="py-3 px-3 smaller fw-bold text-uppercase tracking-wider">
            Contacto
          </th>
          <th
            scope="col"
            class="py-3 px-3 smaller fw-bold text-uppercase tracking-wider text-center"
          >
            Habilitado
          </th>
          <th scope="col" class="py-3 px-3 smaller fw-bold text-uppercase tracking-wider">Cargo</th>
          <th
            scope="col"
            class="py-3 px-4 smaller fw-bold text-uppercase tracking-wider text-center"
          >
            Acciones
          </th>
        </tr>
      </thead>

      <tbody>
        <tr v-for="usuario in usuarios" :key="usuario._id" class="border-bottom hover-row">
          <td class="px-4 py-3">
            <span class="fw-bold text-dark">{{ usuario.rut }}</span>
          </td>
          <td class="px-3 text-dark">{{ usuario.nombre }}</td>
          <td class="px-3 text-dark">{{ usuario.apellido }}</td>
          <td class="px-3">
            <span class="smaller text-secondary">{{ formatearFecha(usuario.fecha_nac) }}</span>
          </td>
          <td class="px-3">
            <div class="d-flex flex-column smaller text-secondary">
              <span class="fw-medium">{{ usuario.ciudad }}</span>
              <span class="text-muted">{{ usuario.direccion }}</span>
            </div>
          </td>
          <td class="px-3">
            <div class="d-flex flex-column smaller text-secondary">
              <span><i class="bi bi-telephone me-1"></i>{{ usuario.telefono }}</span>
              <span><i class="bi bi-envelope me-1"></i>{{ usuario.email }}</span>
            </div>
          </td>
          <td class="px-3 text-center">
            <span
              class="badge px-3 py-2 rounded-pill smaller fw-bold"
              :class="[usuario.habilitado === 'HABILITADO' ? 'bg-success' : 'bg-danger']"
            >
              {{ usuario.habilitado }}
            </span>
          </td>
          <td class="px-3">
            <span
              class="badge bg-primary bg-opacity-10 text-primary border border-primary border-opacity-25 px-2 py-1 rounded-pill smaller fw-bold"
            >
              {{ usuario.tipo_cargo }}
            </span>
          </td>

          <td class="px-4 text-center">
            <div class="d-flex gap-1 justify-content-center">
              <button
                class="btn btn-light btn-sm border shadow-xs"
                @click="$emit('editar', usuario)"
                title="Editar"
              >
                <i class="bi bi-pencil-square text-primary"></i>
              </button>
              <button
                class="btn btn-light btn-sm border shadow-xs"
                @click="$emit('detalle', usuario)"
                title="Ver Historial"
              >
                <i class="bi bi-clock-history text-info"></i>
              </button>
              <button
                v-if="loginUser.tipo_cargo === 'ADMIN-TI'"
                class="btn btn-light btn-sm border shadow-xs"
                @click="confirmarEliminacion(usuario)"
                title="Eliminar"
              >
                <i class="bi bi-trash3 text-danger"></i>
              </button>
            </div>
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

defineProps<{
  usuarios: any[]
  loginUser: any
}>()

const emit = defineEmits(['editar', 'eliminar', 'detalle'])

const mostrarModal = ref(false)
const usuarioAEliminar = ref<any>(null)
const mensajeModal = ref('¿Deseas eliminar este usuario?')

function confirmarEliminacion(usuario: any) {
  usuarioAEliminar.value = usuario
  mensajeModal.value = `¿Seguro que deseas eliminar a ${usuario.nombre} ${usuario.apellido}?`
  mostrarModal.value = true
}

function eliminarUsuarioConfirmado() {
  if (usuarioAEliminar.value) emit('eliminar', usuarioAEliminar.value._id)
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
.hover-row:hover {
  background-color: #f8fafc !important;
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

th {
  border: none !important;
}

.table td {
  border-color: #f1f5f9;
}
</style>
