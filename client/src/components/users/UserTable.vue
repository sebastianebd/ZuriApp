J
<template>
  <div class="table-responsive tabla-usuarios-container">
    <table
      class="table table-hover align-middle shadow-sm rounded-4 overflow-hidden tabla-usuarios"
    >
      <thead class="table-primary text-white">
        <tr>
          <th class="small">RUT</th>
          <th class="small">Nombre</th>
          <th class="small">Apellido</th>
          <th class="small">Fecha Nac.</th>
          <th class="small">Dirección</th>
          <th class="small">Ciudad</th>
          <th class="small">Teléfono</th>
          <th class="small">Email</th>
          <th class="small">Habilitado</th>
          <th class="small">Cargo</th>
          <th class="small text-center">Editar</th>
          <th class="small text-center">Detalle</th>
          <th class="small text-center" v-if="loginUser.tipo_cargo === 'ADMIN-TI'">Eliminar</th>
        </tr>
      </thead>

      <tbody>
        <tr
          v-for="usuario in usuarios"
          :key="usuario._id"
          class="border-bottom align-middle hover-row"
        >
          <td class="small text-secondary fw-semibold">{{ usuario.rut }}</td>
          <td class="small">{{ usuario.nombre }}</td>
          <td class="small">{{ usuario.apellido }}</td>
          <td class="small">{{ formatearFecha(usuario.fecha_nac) }}</td>
          <td class="small">{{ usuario.direccion }}</td>
          <td class="small">{{ usuario.ciudad }}</td>
          <td class="small">{{ usuario.telefono }}</td>
          <td class="small">{{ usuario.email }}</td>
          <td class="small text-center">
            <span
              :class="[
                'badge rounded-pill',
                usuario.habilitado === 'HABILITADO' ? 'bg-success' : 'bg-danger'
              ]"
            >
              {{ usuario.habilitado }}
            </span>
          </td>
          <td class="small text-primary fw-semibold">{{ usuario.tipo_cargo }}</td>

          <td class="action-cell">
            <button class="btn btn-warning btn-sm shadow-sm" @click="$emit('editar', usuario)">
              <img src="../../assets/icons/update-icon.png" alt="update icon" />
            </button>
          </td>

          <td class="action-cell">
            <button class="btn btn-info btn-sm shadow-sm" @click="$emit('detalle', usuario)">
              <img src="../../assets/icons/detalle-icon.png" alt="detail icon" />
            </button>
          </td>

          <td class="action-cell" v-if="loginUser.tipo_cargo === 'ADMIN-TI'">
            <button class="btn btn-danger btn-sm shadow-sm" @click="confirmarEliminacion(usuario)">
              <img src="../../assets/icons/delete-icon.png" alt="delete icon" />
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
/* 🌙 Contenedor general */
.tabla-usuarios-container {
  border-radius: 0.75rem;
}

/* 🧭 Encabezado */
.table-primary {
  background: linear-gradient(90deg, #0d6efd, #3d8bfd);
  border-bottom: 2px solid #bcd0ff;
}

.table th {
  font-weight: 600;
  vertical-align: middle;
  letter-spacing: 0.3px;
}

/* Alternancia de colores en filas */
.tabla-usuarios tbody tr:nth-child(odd) {
  background-color: #ffffff;
}
.tabla-usuarios tbody tr:nth-child(even) {
  background-color: #f6f8fa;
}

/* ✨ Hover */
.hover-row:hover {
  background-color: #e9f3ff !important;
  transition: background-color 0.25s ease;
}

/* 🔘 Celdas y bordes */
.table td {
  vertical-align: middle;
  border-color: #dee2e6;
  padding: 0.5rem;
  color: #495057;
}

.bg-warning-light {
  background-color: #fff7e0 !important;
}
.bg-success-light {
  background-color: #e3f7ea !important;
}

.bg-created-light {
  background-color: #b3d9f5 !important;
}

.action-cell {
  text-align: center;
  padding: 0.2rem !important;
}

.action-cell img {
  width: 14px;
  height: 14px;
  object-fit: contain;
}

.shadow-sm {
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.08) !important;
}

.table {
  border-collapse: separate;
  border-spacing: 0;
  border-radius: 0.75rem;
  overflow: hidden;
}
</style>
