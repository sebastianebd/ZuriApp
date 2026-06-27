<template>
  <div class="historial-view p-4">
    <!-- Header -->
    <div class="d-flex justify-content-between align-items-center mb-4">
      <div class="d-flex align-items-center gap-3">
        <div class="icon-square bg-white shadow-sm text-primary">
          <i class="bi bi-clock-history fs-4"></i>
        </div>
        <div>
          <h4 class="fw-bold mb-0 text-dark">Historial de Reemplazos</h4>
          <p class="text-secondary small mb-0">
            Consulta el registro histórico de movimientos ({{ totalRegistros }} registros
            encontrados)
          </p>
        </div>
      </div>
      <div class="d-flex gap-2">
        <button
          @click="handleExport"
          class="btn btn-light border fw-semibold shadow-sm px-3"
          :disabled="exportLoading"
        >
          <i v-if="exportLoading" class="spinner-border spinner-border-sm me-2"></i>
          <i v-else class="bi bi-file-earmark-pdf text-danger me-2"></i>Exportar PDF
        </button>
        <button @click="limpiarFiltros" class="btn btn-light border fw-semibold shadow-sm px-3">
          <i class="bi bi-eraser me-2"></i>Limpiar Filtros
        </button>
      </div>
    </div>

    <!-- Main Content Card -->
    <div class="card border-0 shadow-sm rounded-4">
      <div class="card-body p-4">
        <!-- Filter Section -->
        <div class="mb-4">
          <HistoryFilter
            v-model="filtros"
            :lista-servicios="listaDeServicios"
            @update:model-value="handleFiltroCambiado"
          />
        </div>

        <!-- History Table Section -->
        <div class="modern-table-container">
          <TableLoader v-if="cargando" text="Cargando historial..." />

          <div v-else-if="reemplazosHistorico.length === 0" class="empty-state text-center py-5">
            <div class="empty-icon-container mb-3 mx-auto">
              <i class="bi bi-journal-x fs-1 text-muted opacity-50"></i>
            </div>
            <h5 class="fw-bold text-dark mb-1">Sin registros históricos</h5>
            <p class="text-muted">No se encontraron movimientos con los filtros aplicados</p>
          </div>

          <table v-else class="table modern-table mb-0">
            <thead>
              <tr>
                <th scope="col" class="ps-4">Código</th>
                <th scope="col">
                  Transacción (Saliente <i class="bi bi-arrow-right mx-1 text-muted"></i> Entrante)
                </th>
                <th scope="col">Contexto</th>
                <th scope="col">Línea de Tiempo</th>
                <th scope="col" class="text-center">Estado</th>
              </tr>
            </thead>
            <tbody>
              <tr
                v-for="(reemplazo, index) in reemplazosHistorico"
                :key="index"
                class="data-row"
                :style="{ animationDelay: `${index * 50}ms` }"
              >
                <!-- Código -->
                <td class="ps-4 first-cell">
                  <div class="d-flex align-items-center" style="height: 100%">
                    <button
                      class="code-badge font-monospace border-0 d-flex align-items-center gap-2"
                      @click.stop="copyCode(reemplazo.id_negocio)"
                      title="Copiar Código"
                    >
                      <span :class="{ 'text-success': copiedId === reemplazo.id_negocio }">
                        {{ reemplazo.id_negocio }}
                      </span>
                      <i
                        class="bi"
                        :class="
                          copiedId === reemplazo.id_negocio
                            ? 'bi-check-lg text-success'
                            : 'bi-clipboard opacity-50'
                        "
                        style="font-size: 0.7rem"
                      ></i>
                    </button>
                  </div>
                </td>

                <!-- Transacción (Saliente -> Entrante) -->
                <td>
                  <div class="d-flex align-items-center py-2 h-100">
                    <!-- Saliente -->
                    <div class="user-node position-relative">
                      <div class="avatar-modern bg-gradient-danger text-white shadow-sm">
                        {{
                          getInitials(reemplazo.nombre_saliente + ' ' + reemplazo.apellido_saliente)
                        }}
                      </div>
                      <div class="user-info ms-3">
                        <div class="fw-bold text-dark text-truncate">
                          {{
                            formatShortName(reemplazo.nombre_saliente, reemplazo.apellido_saliente)
                          }}
                        </div>
                        <div class="rut-text">{{ reemplazo.rut_saliente }}</div>
                      </div>
                    </div>

                    <!-- Connector -->
                    <div
                      class="connector-line mx-3 d-flex align-items-center justify-content-center"
                    >
                      <i class="bi bi-chevron-right text-muted opacity-25"></i>
                    </div>

                    <!-- Entrante -->
                    <div class="user-node">
                      <div class="avatar-modern bg-gradient-success text-white shadow-sm">
                        {{
                          getInitials(reemplazo.nombre_entrante + ' ' + reemplazo.apellido_entrante)
                        }}
                      </div>
                      <div class="user-info ms-3">
                        <div class="fw-bold text-dark text-truncate">
                          {{
                            formatShortName(reemplazo.nombre_entrante, reemplazo.apellido_entrante)
                          }}
                        </div>
                        <div class="rut-text">{{ reemplazo.rut_entrante }}</div>
                      </div>
                    </div>
                  </div>
                </td>

                <!-- Contexto -->
                <td>
                  <div class="d-flex flex-column justify-content-center h-100">
                    <span class="badge-modern-context mb-1">
                      <i class="bi bi-hospital me-1"></i> {{ formatTitleCase(reemplazo.servicio) }}
                    </span>
                    <span class="text-secondary x-small ms-1">
                      {{ formatTitleCase(reemplazo.tipo_turno) }}
                    </span>
                  </div>
                </td>

                <!-- Período -->
                <td>
                  <div
                    class="d-flex flex-column justify-content-center h-100 border-start ps-3 border-light-subtle"
                  >
                    <div class="d-flex align-items-center mb-1">
                      <span class="date-dot start me-2"></span>
                      <span class="date-text fw-medium">{{
                        formatearFecha(reemplazo.fecha_inicio)
                      }}</span>
                    </div>
                    <div class="d-flex align-items-center">
                      <span class="date-dot end me-2"></span>
                      <span class="date-text text-muted">{{
                        formatearFecha(reemplazo.fecha_termino)
                      }}</span>
                    </div>
                  </div>
                </td>

                <!-- Estado -->
                <td class="text-center last-cell">
                  <div class="h-100 d-flex flex-column align-items-center justify-content-center">
                    <span class="status-glass" :class="getStatusClass(reemplazo.status)">
                      {{ formatTitleCase(reemplazo.status) }}
                    </span>
                    <small class="creator-text mt-1">
                      {{ formatTitleCase(getCreatorName(reemplazo).split(' ')[0]) }}
                    </small>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>

          <!-- Pagination -->
          <AppPagination
            :currentPage="currentPage"
            :totalPages="totalPages"
            @changePage="changePage"
          />
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useHistory } from '@/composables/replacement-history/useReplacementHistory'
import { exportHistoryToPDF } from '@/utils/exportHelpers'
import { useAuthStore } from '@/stores/auth.store'
import { obtenerInactivosPaginados } from '@/services/replacement.service'
import { ref } from 'vue'
import HistoryFilter from '@/components/historial/HistorialFilter.vue'
import TableLoader from '@/components/common/TableLoader.vue'
import AppPagination from '@/components/common/AppPagination.vue'
import { type User } from '@/types/user.types'
import { formatTitleCase } from '@/utils/text-formatters'

const {
  // Data & AuthState
  reemplazosHistorico,
  listaDeServicios,
  cargando,

  // Filters
  filtros,
  handleFiltroCambiado,
  limpiarFiltros,

  // Pagination
  currentPage,
  totalPages,
  totalRegistros,
  changePage,

  // Helpers
  formatearFecha
  // getInitials // Using local refined version
} = useHistory()


const authStore = useAuthStore()
const api = authStore.usePrivateApi()
const copiedId = ref<string | null>(null)

const exportLoading = ref(false)

const handleExport = async () => {
  exportLoading.value = true
  try {
    // 5000 limit to simulate "fetch all" for report
    const { registros } = await obtenerInactivosPaginados(api, filtros.value, 1, 5000)
    exportHistoryToPDF(registros, filtros.value)
  } catch (error) {
    console.error('Error exporting PDF:', error)
  } finally {
    exportLoading.value = false
  }
}

// Reuse logic from ReplacementTable for consistency
function getInitials(name: string) {
  if (!name) return '?'
  return name
    .split(' ')
    .filter((n) => n.length > 0)
    .map((n: string) => n[0])
    .slice(0, 2)
    .join('')
    .toUpperCase()
}

function formatShortName(nombre: string, apellido: string) {
  if (!nombre) return ''
  const n = nombre.split(' ')[0]
  const a = apellido ? apellido.split(' ')[0].charAt(0) + '.' : ''
  return formatTitleCase(`${n} ${a}`)
}

function getStatusClass(status: string) {
  if (!status) return 'glass-secondary'

  const s = status.toUpperCase()
  switch (s) {
    case 'CONFIRMADO':
    case 'EN CURSO':
    case 'COMETIDO':
      return 'glass-success'
    case 'PENDIENTE':
      return 'glass-warning'
    case 'ANULADO':
    case 'RECHAZADO':
      return 'glass-danger'
    case 'FINALIZADO':
      return 'glass-primary'
    default:
      return 'glass-secondary'
  }
}

const getCreatorName = (reemplazo: any): string => {
  const creator = reemplazo.creado_por
  if (typeof creator !== 'string' && creator && 'nombre' in creator && 'apellido' in creator) {
    const user = creator as User
    return `${user.nombre} ${user.apellido}`
  }
  return String(creator) || 'N/A'
}

async function copyCode(code: string) {
  if (!code) return
  try {
    await navigator.clipboard.writeText(code)
    copiedId.value = code
    setTimeout(() => {
      copiedId.value = null
    }, 2000)
  } catch (err) {
    console.error('Failed to copy', err)
  }
}
</script>

<style scoped>
.icon-square {
  width: 48px;
  height: 48px;
  border-radius: 14px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.historial-view {
  background-color: #f8fafc;
}

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
  padding: 0 4px 10px 4px; /* Space for shadows + bottom padding, NO MAX-HEIGHT */
}

.modern-table {
  border-collapse: separate;
  border-spacing: 0 8px; /* Vertical gap between rows */
  width: 100%;
}

.modern-table thead th {
  border: none;
  font-size: 0.75rem;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  font-weight: 700;
  color: #94a3b8; /* slate-400 */
  padding-bottom: 8px;
  background: transparent;
}

/* --- Row Styling --- */
.data-row {
  animation: slideUpFade 0.5s ease-out forwards;
  opacity: 0; /* Init hidden for animation */
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

/* --- Typography & Components --- */
.code-badge {
  color: #64748b;
  font-size: 0.75rem;
  font-weight: 600;
  letter-spacing: 0.5px;
  background: #f1f5f9;
  padding: 4px 8px;
  border-radius: 6px;
  transition: all 0.2s ease;
  cursor: pointer;
}

.code-badge:hover {
  background: #e2e8f0;
  color: #334155;
}

.user-node {
  display: flex;
  align-items: center;
  width: 180px; /* Fixed width for alignment */
  flex-shrink: 0; /* Don't shrink */
}

.avatar-modern {
  width: 38px;
  height: 38px;
  border-radius: 10px; /* Squircle */
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.85rem;
  font-weight: 700;
  flex-shrink: 0;
}

.bg-gradient-danger {
  background: linear-gradient(135deg, #fecaca 0%, #ef4444 100%);
  color: white;
}
.bg-gradient-success {
  background: linear-gradient(135deg, #bbf7d0 0%, #22c55e 100%);
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

.badge-modern-context {
  display: inline-flex;
  align-items: center;
  font-size: 0.75rem;
  font-weight: 600;
  color: #334155;
  background-color: #f1f5f9;
  padding: 4px 8px;
  border-radius: 6px;
  max-width: fit-content;
}

.x-small {
  font-size: 0.72rem;
}

/* Timeline */
.date-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
}
.date-dot.start {
  background-color: #22c55e;
  box-shadow: 0 0 0 2px rgba(34, 197, 94, 0.2);
}
.date-dot.end {
  background-color: #ef4444;
  box-shadow: 0 0 0 2px rgba(239, 68, 68, 0.2);
}
.date-text {
  font-size: 0.78rem;
  width: 80px;
}

/* Glass Status Pills */
.status-glass {
  padding: 6px 12px;
  border-radius: 99px;
  font-size: 0.7rem;
  font-weight: 700;
  letter-spacing: 0.05em;
  backdrop-filter: blur(4px);
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.05);
}

.glass-success {
  background: rgba(34, 197, 94, 0.1);
  color: #15803d;
  border: 1px solid rgba(34, 197, 94, 0.2);
}
.glass-warning {
  background: rgba(234, 179, 8, 0.1);
  color: #a16207;
  border: 1px solid rgba(234, 179, 8, 0.2);
}
.glass-danger {
  background: rgba(239, 68, 68, 0.1);
  color: #b91c1c;
  border: 1px solid rgba(239, 68, 68, 0.2);
}
.glass-primary {
  background: rgba(59, 130, 246, 0.1);
  color: #1d4ed8;
  border: 1px solid rgba(59, 130, 246, 0.2);
}
.glass-secondary {
  background: rgba(148, 163, 184, 0.1);
  color: #475569;
  border: 1px solid rgba(148, 163, 184, 0.2);
}

.creator-text {
  font-size: 0.65rem;
  color: #cbd5e1;
}

/* Pagination Styles */
.pagination .page-link {
  color: #475569;
  font-weight: 500;
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.pagination .active .page-link {
  background-color: #3b82f6 !important;
  color: white !important;
}

.pagination .page-item.disabled .page-link {
  opacity: 0.5;
}

.shadow-xs {
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
}

.empty-state {
  min-height: 400px;
}

.empty-icon-container {
  width: 80px;
  height: 80px;
  background-color: #f1f5f9;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
}

/* Custom Scrollbar */
.custom-scrollbar::-webkit-scrollbar {
  width: 6px;
}
.custom-scrollbar::-webkit-scrollbar-track {
  background: transparent;
}
.custom-scrollbar::-webkit-scrollbar-thumb {
  background-color: #cbd5e1;
  border-radius: 20px;
}
</style>
