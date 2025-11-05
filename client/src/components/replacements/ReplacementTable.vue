<template>
  <div>
    <table class="table table-bordered table-sm">
      <thead class="thead-light">
        <tr>
          <th scope="col" class="small">Rut Saliente</th>
          <th scope="col" class="small">Nombre Saliente</th>
          <th scope="col" class="small">Apellido Saliente</th>
          <th scope="col" class="small">Rut Entrante</th>
          <th scope="col" class="small">Nombre Entrante</th>
          <th scope="col" class="small">Apellido Entrante</th>
          <th scope="col" class="small">Tipo de Turno</th>
          <th scope="col" class="small">Fecha Inicio</th>
          <th scope="col" class="small">Fecha Termino</th>
          <th scope="col" class="small">Servicio</th>
          <th scope="col" class="small action-header">Modificar</th>
          <th scope="col" class="small action-header">Exportar</th>
          <th scope="col" class="small action-header">Eliminar</th>
        </tr>
      </thead>

      <tbody class="customtable">
        <tr v-for="reemplazo in reemplazos" :key="reemplazo._id">
          <td class="small bg-warning-light">{{ reemplazo.rut_saliente }}</td>
          <td class="small bg-warning-light">{{ reemplazo.nombre_saliente }}</td>
          <td class="small bg-warning-light">{{ reemplazo.apellido_saliente }}</td>
          <td class="small bg-success-light">{{ reemplazo.rut_entrante }}</td>
          <td class="small bg-success-light">{{ reemplazo.nombre_entrante }}</td>
          <td class="small bg-success-light">{{ reemplazo.apellido_entrante }}</td>
          <td class="small">{{ reemplazo.tipo_turno }}</td>
          <td class="small">{{ formatearFecha(reemplazo.fecha_inicio) }}</td>
          <td class="small">{{ formatearFecha(reemplazo.fecha_termino) }}</td>
          <td class="small">{{ reemplazo.servicio }}</td>

          <!-- Botones -->
          <td class="action-cell">
            <button @click="$emit('modificar', reemplazo)" class="btn btn-warning btn-xs">
              <img src="../../assets/icons/update-icon.png" alt="update icon" />
            </button>
          </td>
          <td class="action-cell">
            <button @click="$emit('exportar', reemplazo)" class="btn btn-info btn-xs">
              <img src="../../assets/icons/export-icon.png" alt="export icon" />
            </button>
          </td>
          <td class="action-cell">
            <button @click="confirmarEliminar(reemplazo._id)" class="btn btn-danger btn-xs">
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

// Mostrar modal de confirmación
function confirmarEliminar(id: string) {
  idAEliminar.value = id
  showConfirmacion.value = true
}

// Si confirma eliminar
function eliminarRegistroConfirmado() {
  if (idAEliminar.value) {
    emit('eliminar', idAEliminar.value)
  }
  showConfirmacion.value = false
  idAEliminar.value = null
}

// Si cancela
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
.bg-warning-light {
  background-color: #fff3cd !important;
}
.bg-success-light {
  background-color: #d1e7dd !important;
}

.action-header {
  width: 80px;
  text-align: center;
}

.action-cell {
  text-align: center;
  white-space: fixed;
  padding: 0.2rem !important;
}

.btn-xs {
  padding: 2px 10px !important;
  font-size: 0.7rem !important;
  line-height: 1;
}

.table {
  width: 100%;
  table-layout: fixed;
}
</style>
