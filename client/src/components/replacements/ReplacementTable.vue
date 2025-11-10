<template>
  <div class="table-responsive tabla-reemplazos-container">
    <table class="table table-hover align-middle shadow-sm rounded-3 overflow-hidden tabla-reemplazos">
      <thead class="table-primary text-white">
        <tr>
          <th class="small">Código</th>
          <th class="small">Rut Saliente</th>
          <th class="small">Nombre Saliente</th>
          <th class="small">Apellido Saliente</th>
          <th class="small">Rut Entrante</th>
          <th class="small">Nombre Entrante</th>
          <th class="small">Apellido Entrante</th>
          <th class="small">Tipo de Turno</th>
          <th class="small">Fecha Inicio</th>
          <th class="small">Fecha Término</th>
          <th class="small">Servicio</th>
          <th class="small text-center">Editar</th>
          <th class="small text-center">Exportar</th>
          <th class="small text-center">Eliminar</th>
        </tr>
      </thead>

      <tbody>
        <tr
          v-for="reemplazo in reemplazos"
          :key="reemplazo._id"
          class="border-bottom align-middle hover-row"
        >
          <td class="small text-secondary bg-warning-light">RP10125</td>
          <td class="small text-secondary bg-warning-light">{{ reemplazo.rut_saliente }}</td>
          <td class="small bg-warning-light">{{ reemplazo.nombre_saliente }}</td>
          <td class="small bg-warning-light">{{ reemplazo.apellido_saliente }}</td>
          <td class="small text-secondary bg-success-light">{{ reemplazo.rut_entrante }}</td>
          <td class="small bg-success-light">{{ reemplazo.nombre_entrante }}</td>
          <td class="small bg-success-light">{{ reemplazo.apellido_entrante }}</td>
          <td class="small">{{ reemplazo.tipo_turno }}</td>
          <td class="small">{{ formatearFecha(reemplazo.fecha_inicio) }}</td>
          <td class="small">{{ formatearFecha(reemplazo.fecha_termino) }}</td>
          <td class="small text-primary fw-semibold">{{ reemplazo.servicio }}</td>

          <td class="action-cell">
            <button @click="$emit('modificar', reemplazo)" class="btn btn-warning btn-sm shadow-sm">
              <img src="../../assets/icons/update-icon.png" alt="update icon" />
            </button>
          </td>
          <td class="action-cell">
            <button @click="$emit('exportar', reemplazo)" class="btn btn-info btn-sm shadow-sm">
              <img src="../../assets/icons/export-icon.png" alt="export icon" />
            </button>
          </td>
          <td class="action-cell">
            <button @click="confirmarEliminar(reemplazo._id)" class="btn btn-danger btn-sm shadow-sm">
              <img src="../../assets/icons/delete-icon.png" alt="delete icon" />
            </button>
          </td>
        </tr>
      </tbody>
    </table>

    <!-- Modal de confirmación -->
    <ConfirmationModal
      :visible="showConfirmacion"
      @confirmar="eliminarRegistroConfirmado"
      mensaje="¿Deseas eliminar este registro?"
      @cancelar="cancelarEliminacion"
    />
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import ConfirmationModal from '../common/ConfirmationModal.vue'
import type { RegisterDataReemplazo } from '@/types/models'

defineProps({
  reemplazos: {
    type: Array as () => RegisterDataReemplazo[],
    required: true
  }
})

const emit = defineEmits<{
  (e: 'modificar', registro: RegisterDataReemplazo): void
  (e: 'exportar', registro: RegisterDataReemplazo): void
  (e: 'eliminar', id: string): void
}>()

const showConfirmacion = ref(false)
const idAEliminar = ref<string | null>(null)

function confirmarEliminar(id: string) {
  idAEliminar.value = id
  showConfirmacion.value = true
}

function eliminarRegistroConfirmado() {
  if (idAEliminar.value) emit('eliminar', idAEliminar.value)
  showConfirmacion.value = false
  idAEliminar.value = null
}

function cancelarEliminacion() {
  showConfirmacion.value = false
  idAEliminar.value = null
}

const formatearFecha = (fecha: string) => {
  if (!fecha) return ''
  return fecha.split('-').reverse().join('-')
}
</script>

<style scoped>
/* 🌙 Contenedor general */
.tabla-reemplazos-container {
  background-color: #f8f9fb;
  border-radius: 0.75rem;
  padding: 1rem;
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

.tabla-reemplazos tbody tr:nth-child(odd) {
  background-color: #ffffff;
}
.tabla-reemplazos tbody tr:nth-child(even) {
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

