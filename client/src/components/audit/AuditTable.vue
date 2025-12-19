<template>
  <div class="table-responsive rounded-3 border overflow-hidden shadow-sm bg-white">
    <table class="table table-hover align-middle mb-0">
      <thead class="bg-primary bg-gradient text-white">
        <tr>
          <th scope="col" class="py-2 px-4 x-small fw-bold text-uppercase tracking-wider">
            Fecha / Hora
          </th>
          <th scope="col" class="py-2 px-3 x-small fw-bold text-uppercase tracking-wider">
            Usuario Resp.
          </th>
          <th scope="col" class="py-2 px-3 x-small fw-bold text-uppercase tracking-wider">
            Módulo
          </th>
          <th scope="col" class="py-2 px-3 x-small fw-bold text-uppercase tracking-wider">
            Acción
          </th>
          <th scope="col" class="py-2 px-3 x-small fw-bold text-uppercase tracking-wider">
            Descripción
          </th>
          <th
            scope="col"
            class="py-2 px-4 x-small fw-bold text-uppercase tracking-wider text-center"
          >
            Detalles
          </th>
        </tr>
      </thead>
      <tbody>
        <tr v-if="logs.length === 0">
          <td colspan="6" class="text-center py-5 text-muted">
            <i class="bi bi-inbox fs-1 d-block mb-2 opacity-25"></i>
            <span class="fw-medium">No se encontraron registros de auditoría.</span>
          </td>
        </tr>
        <tr v-for="log in logs" :key="log._id" class="border-bottom hover-row">
          <td class="px-4 py-2">
            <div class="d-flex flex-column">
              <span class="fw-bold text-dark x-small">{{ formatDate(log.created_at) }}</span>
              <span class="x-small text-secondary">{{ formatTime(log.created_at) }} hrs</span>
            </div>
          </td>
          <td class="px-3 py-2">
            <div class="d-flex align-items-center">
              <div
                class="avatar-placeholder me-2 rounded-3 bg-primary bg-opacity-10 d-flex align-items-center justify-content-center text-primary fw-bold x-small border border-primary border-opacity-10"
                style="width: 28px; height: 28px"
              >
                {{ getInitials(log.user_name) }}
              </div>
              <div class="d-flex flex-column">
                <span class="fw-semibold text-dark x-small">{{
                  log.user_name || 'Desconocido'
                }}</span>
                <span v-if="log.user_id" class="text-muted" style="font-size: 0.65rem">
                  ID: ...{{ getUserId(log) }}
                </span>
              </div>
            </div>
          </td>
          <td class="px-3 py-2">
            <span
              class="badge bg-secondary bg-opacity-10 text-secondary border border-secondary border-opacity-25 px-2 py-1 rounded-pill x-small fw-bold"
            >
              {{ log.module }}
            </span>
          </td>
          <td class="px-3 py-2">
            <span
              :class="['badge rounded-pill px-2 py-1 x-small fw-bold', getActionColor(log.action)]"
            >
              {{ log.action }}
            </span>
          </td>
          <td class="px-3 py-2">
            <span class="x-small text-secondary fw-medium">{{ log.description }}</span>
          </td>
          <td class="px-4 py-2 text-center">
            <button
              class="btn btn-light btn-sm border shadow-xs py-0 px-2"
              @click="verDetalles(log)"
              title="Ver Detalles Técnicos"
            >
              <i class="bi bi-braces text-primary me-1" style="font-size: 0.7rem"></i>
              <span class="x-small fw-bold">JSON</span>
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
.hover-row:hover {
  background-color: #f8fafc !important;
}

.smaller {
  font-size: 0.75rem;
}

.x-small {
  font-size: 0.71rem;
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
