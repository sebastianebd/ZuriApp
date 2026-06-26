<template>
  <div class="modern-table-container">
    <table class="table modern-table mb-0">
      <thead>
        <tr>
          <th scope="col" class="ps-4">Fecha / Hora</th>
          <th scope="col">Usuario Resp.</th>
          <th scope="col">Módulo</th>
          <th scope="col">Acción</th>
          <th scope="col">Descripción</th>
          <th scope="col" class="text-center pe-4">Detalles</th>
        </tr>
      </thead>
      <tbody>
        <tr v-if="logs.length === 0">
          <td colspan="6" class="text-center py-5 text-muted">
            <i class="bi bi-inbox fs-1 d-block mb-2 opacity-25"></i>
            <span class="fw-medium">No se encontraron registros de auditoría.</span>
          </td>
        </tr>

        <tr
          v-for="(log, index) in logs"
          :key="log._id"
          class="data-row"
          :style="{ animationDelay: `${index * 50}ms` }"
        >
          <!-- Fecha / Hora -->
          <td class="ps-4 first-cell">
            <div
              class="d-flex flex-column justify-content-center h-100 border-start ps-3 border-light-subtle"
            >
              <div class="d-flex align-items-center mb-1">
                <i class="bi bi-calendar4-week text-secondary me-2" style="font-size: 0.7rem"></i>
                <span class="fw-medium text-dark x-small">{{ formatDate(log.created_at) }}</span>
              </div>
              <div class="d-flex align-items-center">
                <i class="bi bi-clock text-secondary me-2" style="font-size: 0.7rem"></i>
                <span class="text-muted x-small">{{ formatTime(log.created_at) }} hrs</span>
              </div>
            </div>
          </td>

          <!-- Usuario Resp. -->
          <td>
            <div class="user-node">
              <div class="avatar-modern bg-gradient-dark text-white shadow-sm">
                {{ getInitials(log.user_name) }}
              </div>
              <div class="user-info ms-3">
                <div class="fw-bold text-dark text-truncate">
                  {{ formatTitleCase(log.user_name || 'Desconocido') }}
                </div>
                <div class="rut-text" v-if="log.user_id">
                  ID: ...{{ truncateMongoId(log.user_id) }}
                </div>
              </div>
            </div>
          </td>

          <!-- Módulo -->
          <td>
            <span class="badge-modern-module">
              <i class="bi bi-box-seam me-1"></i> {{ formatTitleCase(log.module) }}
            </span>
          </td>

          <!-- Acción -->
          <td>
            <span class="status-glass" :class="getActionGlassClass(log.action)">
              {{ formatTitleCase(log.action) }}
            </span>
          </td>

          <!-- Descripción -->
          <td>
            <span
              class="text-secondary x-small d-block text-truncate"
              style="max-width: 450px"
              :title="log.description"
            >
              {{ log.description }}
            </span>
          </td>

          <!-- Detalles -->
          <td class="text-center pe-4 last-cell">
            <div class="h-100 d-flex align-items-center justify-content-center">
              <button
                class="btn-glass btn-details"
                @click="emit('view-details', log)"
                title="Ver JSON Técnico"
              >
                <i class="bi bi-file-earmark-code"></i>
              </button>
            </div>
          </td>
        </tr>
      </tbody>
    </table>
  </div>
</template>

<script setup lang="ts">
import { formatTitleCase, getInitials, truncateMongoId } from '@/utils/text-formatters'
import { formatDate, formatTime } from '@/utils/date-utils'
import type { AuditLog } from '@/types/audit.types'

defineProps({
  logs: {
    type: Array as () => AuditLog[],
    default: () => []
  }
})

const emit = defineEmits<{
  (e: 'view-details', log: AuditLog): void
}>()

const ACTION_GLASS_CLASSES: Record<string, string> = {
  CREAR: 'glass-success',
  MODIFICAR: 'glass-primary',
  SUSTITUCION: 'glass-primary',
  ELIMINAR: 'glass-danger',
  ANULAR: 'glass-danger',
  FINALIZAR: 'glass-dark'
}

function getActionGlassClass(action: string) {
  if (!action) return 'glass-secondary'
  return ACTION_GLASS_CLASSES[action.toUpperCase()] || 'glass-secondary'
}
</script>

<style scoped>
/* --- Animation Keyframes --- */
@keyframes slideUpFade {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

/* --- Container & Table Reset --- */
.modern-table-container {
  padding: 0 4px 10px 4px;
}

.modern-table {
  border-collapse: separate;
  border-spacing: 0 8px;
  width: 100%;
}

.modern-table thead th {
  border: none;
  font-size: 0.75rem;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  font-weight: 700;
  color: #94a3b8;
  padding-bottom: 8px;
  background: transparent;
}

/* --- Row Styling --- */
.data-row {
  animation: slideUpFade 0.5s ease-out forwards;
  opacity: 0;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.02);
}

.data-row td {
  background-color: white;
  border-top: 1px solid rgba(0, 0, 0, 0.02);
  border-bottom: 1px solid rgba(0, 0, 0, 0.02);
  padding: 1rem 0.5rem;
  vertical-align: middle;
  transition: all 0.2s cubic-bezier(0.25, 0.8, 0.25, 1);
}

.data-row td.first-cell {
  border-left: 1px solid rgba(0, 0, 0, 0.02);
  border-top-left-radius: 12px;
  border-bottom-left-radius: 12px;
}

.data-row td.last-cell {
  border-right: 1px solid rgba(0, 0, 0, 0.02);
  border-top-right-radius: 12px;
  border-bottom-right-radius: 12px;
}

.data-row:hover {
  transform: translateY(-2px);
  box-shadow: 0 12px 24px rgba(0, 0, 0, 0.06);
  z-index: 10;
  position: relative;
}

/* --- Components --- */
.user-node {
  display: flex;
  align-items: center;
}

.avatar-modern {
  width: 38px;
  height: 38px;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.85rem;
  font-weight: 700;
  flex-shrink: 0;
}

.bg-gradient-dark {
  background: linear-gradient(135deg, #64748b 0%, #334155 100%);
  color: white;
}

.user-info {
  line-height: 1.2;
}
.rut-text {
  font-size: 0.7rem;
  color: #94a3b8;
  font-family: monospace;
}
.x-small {
  font-size: 0.72rem;
}

/* Badges */
.badge-modern-module {
  display: inline-flex;
  align-items: center;
  font-size: 0.75rem;
  font-weight: 600;
  color: #475569;
  background-color: #f1f5f9;
  padding: 4px 8px;
  border-radius: 6px;
  border: 1px solid #e2e8f0;
}

.status-glass {
  padding: 5px 10px;
  border-radius: 6px;
  font-size: 0.65rem;
  font-weight: 700;
  letter-spacing: 0.05em;
  backdrop-filter: blur(4px);
}

.glass-success {
  background: rgba(34, 197, 94, 0.1);
  color: #15803d;
  border: 1px solid rgba(34, 197, 94, 0.2);
}
.glass-primary {
  background: rgba(59, 130, 246, 0.1);
  color: #1d4ed8;
  border: 1px solid rgba(59, 130, 246, 0.2);
}
.glass-danger {
  background: rgba(239, 68, 68, 0.1);
  color: #b91c1c;
  border: 1px solid rgba(239, 68, 68, 0.2);
}
.glass-warning {
  background: rgba(234, 179, 8, 0.1);
  color: #a16207;
  border: 1px solid rgba(234, 179, 8, 0.2);
}
.glass-secondary {
  background: rgba(148, 163, 184, 0.1);
  color: #475569;
  border: 1px solid rgba(148, 163, 184, 0.2);
}
.glass-dark {
  background: rgba(15, 23, 42, 0.05);
  color: #0f172a;
  border: 1px solid rgba(15, 23, 42, 0.1);
}

/* Buttons */
.btn-glass {
  width: 34px;
  height: 34px;
  border-radius: 8px;
  border: none;
  background: transparent;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s;
  font-size: 1rem;
  color: #cbd5e1;
}

.data-row:hover .btn-glass {
  color: #64748b;
  background: #f8fafc;
}

.btn-glass:hover {
  transform: scale(1.1);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.btn-details:hover {
  background: #eff6ff;
  color: #3b82f6;
}

/* Custom Scrollbar */
.custom-scrollbar::-webkit-scrollbar {
  width: 6px;
}
.custom-scrollbar::-webkit-scrollbar-track {
  background: transparent;
}
.custom-scrollbar::-webkit-scrollbar-thumb {
  background-color: #475569;
  border-radius: 20px;
}
</style>
