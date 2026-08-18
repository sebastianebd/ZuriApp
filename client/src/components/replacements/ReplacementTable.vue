<template>
  <div class="modern-table-container">
    <table class="table modern-table mb-0">
      <thead>
        <tr>
          <th scope="col" class="ps-4">Código</th>
          <th scope="col">
            Transacción (Saliente <i class="bi bi-arrow-right mx-1 text-muted"></i> Entrante)
          </th>
          <th scope="col">Contexto</th>
          <th scope="col">Línea de Tiempo</th>
          <th scope="col" class="text-center">Estado</th>
          <th scope="col" class="text-end pe-4">Acciones</th>
        </tr>
      </thead>

      <tbody>
        <tr
          v-for="(reemplazo, index) in reemplazos"
          :key="reemplazo._id"
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
              <div class="IStaff-node position-relative">
                <div class="avatar-modern bg-gradient-danger text-white shadow-sm">
                  {{ getInitials(reemplazo.nombre_saliente + ' ' + reemplazo.apellido_saliente) }}
                </div>
                <div class="IStaff-info ms-3">
                  <div class="fw-bold text-dark text-truncate">
                    {{ formatShortName(reemplazo.nombre_saliente, reemplazo.apellido_saliente) }}
                  </div>
                  <div class="rut-text">{{ reemplazo.rut_saliente }}</div>
                </div>
              </div>

              <!-- Connector -->
              <div class="connector-line mx-3 d-flex align-items-center justify-content-center">
                <i class="bi bi-chevron-right text-muted opacity-25"></i>
              </div>

              <!-- Entrante -->
              <div class="IStaff-node">
                <div class="avatar-modern bg-gradient-success text-white shadow-sm">
                  {{ getInitials(reemplazo.nombre_entrante + ' ' + reemplazo.apellido_entrante) }}
                </div>
                <div class="IStaff-info ms-3">
                  <div class="fw-bold text-dark text-truncate">
                    {{ formatShortName(reemplazo.nombre_entrante, reemplazo.apellido_entrante) }}
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
                <i class="bi bi-hospital me-1"></i> {{ formatTitleCase(getServiceName(reemplazo.servicio)) }}
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
          <td class="text-center">
            <div class="h-100 d-flex flex-column align-items-center justify-content-center">
              <span class="status-glass" :class="getStatusClass(reemplazo.status)">
                {{ formatTitleCase(reemplazo.status) }}
              </span>
              <small class="creator-text mt-1">
                {{ getCreatorName(reemplazo) }}
              </small>
            </div>
          </td>

          <!-- Acciones -->
          <td class="pe-4 text-end last-cell">
            <div class="actions-wrapper h-100 d-flex align-items-center justify-content-end gap-2">
              <button
                v-if="authStore.hasPermission('replacement.update')"
                @click="$emit('modificar', reemplazo)"
                class="btn-glass btn-edit"
                title="Editar"
              >
                <i class="bi bi-pencil-fill"></i>
              </button>

              <button
                @click="$emit('exportar', reemplazo)"
                class="btn-glass btn-export"
                title="Exportar"
              >
                <i class="bi bi-file-earmark-pdf-fill"></i>
              </button>

              <div class="vr mx-1 opacity-25"></div>

              <template v-if="authStore.hasPermission('replacement.update')">
                <button
                  v-if="turnoEnCurso(reemplazo)"
                  @click="confirmarFinalizar(reemplazo._id)"
                  class="btn-glass btn-finalize"
                  title="Finalizar Turno"
                >
                  <i class="bi bi-check-lg"></i>
                </button>
                <button
                  v-else
                  @click="confirmarAnular(reemplazo._id)"
                  class="btn-glass btn-delete"
                  title="Anular"
                >
                  <i class="bi bi-x-lg"></i>
                </button>
              </template>
            </div>
          </td>
        </tr>
      </tbody>
    </table>

    <!-- Modal de confirmación -->
    <ConfirmationModal
      :visible="showConfirmacion"
      :mensaje="
        accion === 'finalizar'
          ? '¿Deseas FINALIZAR este registro?'
          : '¿Deseas ANULAR este registro?'
      "
      @confirmar="confirmarAccion"
      @cancelar="cancelarAccion"
    />
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import ConfirmationModal from '../common/ConfirmationModal.vue'
import { type ReplacementRegistration } from '@/types/replacement.types'
import { type IStaff } from '@/types/staff.types'
import { useAuthStore } from '@/stores/auth.store'
import { formatTitleCase } from '@/utils/text-formatters'
import { useServiceStore } from '@/stores/service.store'

const serviceStore = useServiceStore()
const getServiceName = (id: any) => {
  return serviceStore.getServiceName(id)
}

const authStore = useAuthStore()

defineProps({
  reemplazos: {
    type: Array as () => ReplacementRegistration[],
    required: true
  }
})

function turnoEnCurso(reemplazo: ReplacementRegistration) {
  if (!reemplazo.status) return false
  const s = String(reemplazo.status).trim().toUpperCase()
  // console.log('DEBUG Status:', s, s === 'EN CURSO')
  return s === 'EN CURSO'
}

const emit = defineEmits<{
  (e: 'modificar', registro: ReplacementRegistration): void
  (e: 'exportar', registro: ReplacementRegistration): void
  (e: 'finalizar', id: string): void
  (e: 'anular', id: string): void
}>()

const showConfirmacion = ref(false)
const idRegistro = ref<string | null>(null)
const accion = ref<'finalizar' | 'anular' | null>(null)
const copiedId = ref<string | null>(null)

const getCreatorName = (reemplazo: ReplacementRegistration): string => {
  const creator = reemplazo.creado_por

  if (typeof creator !== 'string' && creator && 'firstName' in creator && 'lastName' in creator) {
    const IStaff = creator as IStaff
    return `${IStaff.firstName} ${IStaff.lastName}`
  }
  return String(creator) || 'N/A'
}

function confirmingAction(id: string, actionType: 'finalizar' | 'anular') {
  idRegistro.value = id
  accion.value = actionType
  showConfirmacion.value = true
}

function confirmarFinalizar(id: string) {
  confirmingAction(id, 'finalizar')
}

function confirmarAnular(id: string) {
  confirmingAction(id, 'anular')
}

function confirmarAccion() {
  if (!idRegistro.value || !accion.value) return

  if (accion.value === 'finalizar') {
    emit('finalizar', idRegistro.value)
  } else {
    emit('anular', idRegistro.value)
  }

  showConfirmacion.value = false
  idRegistro.value = null
  accion.value = null
}

function cancelarAccion() {
  showConfirmacion.value = false
  idRegistro.value = null
}

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

const formatearFecha = (fecha: string) => {
  if (!fecha) return ''
  return fecha.split('-').reverse().join('-')
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

.IStaff-node {
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

.IStaff-info {
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

/* Glass Buttons */
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
  font-size: 0.9rem;
  color: #cbd5e1; /* Hidden-ish by default */
}

.data-row:hover .btn-glass {
  color: #64748b; /* Visible on row hover */
  background: #f8fafc;
}

.btn-glass:hover {
  transform: scale(1.1);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.btn-edit:hover {
  background: #eff6ff;
  color: #3b82f6;
}
.btn-export:hover {
  background: #fef2f2;
  color: #ef4444;
}
.btn-finalize:hover {
  background: #f0fdf4;
  color: #22c55e;
}
.btn-delete:hover {
  background: #fef2f2;
  color: #ef4444;
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
