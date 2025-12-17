<template>
  <div class="table-responsive rounded-4 shadow-sm bg-white">
    <table class="table table-hover align-middle mb-0 tabla-audit">
      <thead class="table-primary text-white">
        <tr>
          <th class="small py-3 ps-4">Fecha / Hora</th>
          <th class="small py-3">Usuario Resp.</th>
          <th class="small py-3">Módulo</th>
          <th class="small py-3">Acción</th>
          <th class="small py-3">Descripción</th>
          <th class="small py-3 text-center">Detalles</th>
        </tr>
      </thead>
      <tbody>
        <tr v-if="logs.length === 0">
          <td colspan="6" class="text-center py-5 text-muted">
            <i class="bi bi-inbox fs-1 d-block mb-2"></i>
            No se encontraron registros de auditoría.
          </td>
        </tr>
        <tr v-for="log in logs" :key="log._id" class="border-bottom hover-row">
          <td class="small ps-4 text-nowrap">
            <div class="fw-bold text-dark">{{ formatDate(log.created_at) }}</div>
            <div class="text-muted small">{{ formatTime(log.created_at) }}</div>
          </td>
          <td class="small">
            <div class="d-flex align-items-center">
              <div
                class="avatar-placeholder me-2 rounded-circle bg-light d-flex align-items-center justify-content-center text-primary fw-bold"
                style="width: 32px; height: 32px"
              >
                {{ getInitials(log.user_name) }}
              </div>
              <div>
                <span class="d-block fw-semibold text-dark">{{
                  log.user_name || 'Desconocido'
                }}</span>
                <span
                  v-if="log.user_id"
                  class="text-xs text-muted d-block"
                  style="font-size: 0.75rem"
                  >ID: ...{{ getUserId(log) }}</span
                >
              </div>
            </div>
          </td>
          <td class="small">
            <span class="badge bg-light text-secondary border fw-normal">{{ log.module }}</span>
          </td>
          <td class="small">
            <span :class="['badge rounded-pill', getActionColor(log.action)]">
              {{ log.action }}
            </span>
          </td>
          <td class="small text-secondary">{{ log.description }}</td>
          <td class="text-center">
            <button
              class="btn btn-sm btn-outline-primary rounded-pill px-3"
              @click="verDetalles(log)"
            >
              Ver JSON
            </button>
          </td>
        </tr>
      </tbody>
    </table>

    <!-- Modal Detalles (Raw JSON) -->
    <div v-if="selectedLog" class="modal fade show d-block" style="background: rgba(0, 0, 0, 0.5)">
      <div class="modal-dialog modal-lg modal-dialog-centered modal-dialog-scrollable">
        <div class="modal-content border-0 rounded-4 shadow-lg">
          <div class="modal-header bg-light border-bottom-0">
            <h5 class="modal-title fw-bold text-primary">Detalle Técnico Log</h5>
            <button type="button" class="btn-close" @click="selectedLog = null"></button>
          </div>
          <div class="modal-body bg-dark text-light font-monospace m-0 p-0">
            <pre class="m-0 p-4" style="max-height: 500px; overflow: auto">{{
              JSON.stringify(selectedLog, null, 2)
            }}</pre>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'

defineProps({
  logs: {
    type: Array as () => any[],
    default: () => []
  }
})

const selectedLog = ref(null)

function verDetalles(log: any) {
  selectedLog.value = log
}

function formatDate(iso: string) {
  if (!iso) return '-'
  return new Date(iso).toLocaleDateString('es-CL', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  })
}

function formatTime(iso: string) {
  if (!iso) return '-'
  return new Date(iso).toLocaleTimeString('es-CL', { hour: '2-digit', minute: '2-digit' })
}

function getInitials(name: string) {
  if (!name) return '?'
  return name
    .split(' ')
    .map((n: string) => n[0])
    .slice(0, 2)
    .join('')
    .toUpperCase()
}

function getUserId(log: any) {
  if (!log.user_id) return ''
  if (typeof log.user_id === 'string') return log.user_id.slice(-6)
  if (log.user_id._id) return log.user_id._id.slice(-6)
  return '?'
}

function getActionColor(action: string) {
  switch (action) {
    case 'CREAR':
      return 'bg-success bg-opacity-10 text-success'
    case 'MODIFICAR':
      return 'bg-primary bg-opacity-10 text-primary'
    case 'ELIMINAR':
      return 'bg-danger bg-opacity-10 text-danger'
    case 'FINALIZAR':
      return 'bg-dark text-white'
    case 'ANULAR':
      return 'bg-danger text-white'
    case 'SUSTITUCION':
      return 'bg-warning text-dark'
    default:
      return 'bg-secondary text-white'
  }
}
</script>

<style scoped>
/* Reutilizando estilos de Tabla User/Replacement para consistencia */
.table th {
  font-weight: 600;
  border-bottom: 0;
  letter-spacing: 0.5px;
}
.table-primary {
  background: linear-gradient(
    90deg,
    #6610f2,
    #6f42c1
  ); /* Un morado auditoría diferente al azul user */
  background: linear-gradient(90deg, #0d6efd, #3d8bfd); /* Mantener azul por consistencia */
}
.hover-row:hover {
  background-color: #f8f9fa;
  transition: all 0.2s;
}
.tabla-audit {
  border-radius: 1rem;
  overflow: hidden;
}
</style>
