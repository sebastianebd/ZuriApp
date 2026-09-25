<template>
  <div class="modern-table-container">
    <table class="table modern-table mb-0">
      <thead>
        <tr>
          <th scope="col" class="ps-4">Código</th>
          <th scope="col">
            Transacción (Saliente <i class="bi bi-arrow-right mx-1 text-primary"></i> Entrante)
          </th>
          <th scope="col">Causal Saliente</th>
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
          :style="{ animationDelay: `${index * 30}ms` }"
        >
          <!-- Código -->
          <td class="ps-4 first-cell">
            <div class="d-flex align-items-center" style="height: 100%">
              <button
                class="code-badge font-monospace border-0 d-flex align-items-center gap-2"
                @click.stop="copyCode(reemplazo.id_negocio)"
                title="Copiar Código"
              >
                <span :class="{ 'text-success fw-bold': copiedId === reemplazo.id_negocio }">
                  {{ reemplazo.id_negocio }}
                </span>
                <i
                  class="bi"
                  :class="
                    copiedId === reemplazo.id_negocio
                      ? 'bi-check-lg text-success'
                      : 'bi-clipboard opacity-75'
                  "
                  style="font-size: 0.75rem"
                ></i>
              </button>
            </div>
          </td>

          <!-- Transacción (Saliente -> Entrante) -->
          <td>
            <div class="d-flex align-items-center py-2 h-100">
              <!-- Saliente -->
              <div class="staff-node position-relative">
                <div class="avatar-modern bg-gradient-danger text-white shadow-sm">
                  {{ getInitials(reemplazo.nombre_saliente + ' ' + reemplazo.apellido_saliente) }}
                </div>
                <div class="staff-info ms-3">
                  <div class="fw-bold text-dark text-truncate staff-name-truncate">
                    {{ formatShortName(reemplazo.nombre_saliente, reemplazo.apellido_saliente) }}
                  </div>
                  <div class="rut-text">{{ reemplazo.rut_saliente }}</div>
                </div>
              </div>

              <!-- Connector -->
              <div class="connector-line mx-3 d-flex align-items-center justify-content-center">
                <i class="bi bi-arrow-right text-primary opacity-50"></i>
              </div>

              <!-- Entrante -->
              <div class="staff-node">
                <div class="avatar-modern bg-gradient-success text-white shadow-sm">
                  {{ getInitials(reemplazo.nombre_entrante + ' ' + reemplazo.apellido_entrante) }}
                </div>
                <div class="staff-info ms-3">
                  <div class="fw-bold text-dark text-truncate staff-name-truncate">
                    {{ formatShortName(reemplazo.nombre_entrante, reemplazo.apellido_entrante) }}
                  </div>
                  <div class="rut-text">{{ reemplazo.rut_entrante }}</div>
                </div>
              </div>
            </div>
          </td>

          <!-- Causal Saliente -->
          <td>
            <div class="d-flex flex-column justify-content-center h-100">
              <span
                class="badge rounded-pill text-truncate px-3 py-1.5 causal-pill"
                :class="getCausalBadgeClass(reemplazo.motivo)"
                style="max-width: 180px; font-size: 0.75rem;"
                :title="reemplazo.observaciones ? `${getCausalLabel(reemplazo.motivo)}: ${reemplazo.observaciones}` : getCausalLabel(reemplazo.motivo)"
              >
                {{ getCausalLabel(reemplazo.motivo) }}
              </span>
              <small
                v-if="reemplazo.observaciones"
                class="text-secondary text-truncate mt-1 d-flex align-items-center gap-1"
                style="max-width: 180px; font-size: 0.7rem;"
                :title="reemplazo.observaciones"
              >
                <i class="bi bi-chat-left-text text-muted"></i>{{ reemplazo.observaciones }}
              </small>
            </div>
          </td>

          <!-- Contexto -->
          <td>
            <div class="d-flex flex-column justify-content-center h-100">
              <span class="badge-modern-context mb-1">
                <i class="bi bi-hospital me-1 text-primary"></i> {{ formatTitleCase(getServiceName(reemplazo.servicio)) }}
              </span>
              <span class="shift-type-pill text-secondary x-small">
                {{ formatTitleCase(reemplazo.tipo_turno) }}
              </span>
            </div>
          </td>

          <!-- Línea de Tiempo -->
          <td>
            <div
              class="d-flex flex-column justify-content-center h-100 border-start ps-3 border-slate-200"
            >
              <div class="d-flex align-items-center mb-1">
                <span class="date-dot start me-2"></span>
                <span class="date-text fw-semibold text-dark">{{
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
              <small class="creator-text mt-1.5" :title="`Registrado por: ${getCreatorName(reemplazo)}`">
                <i class="bi bi-person-check me-0.5 opacity-50"></i> {{ getCreatorName(reemplazo) }}
              </small>
            </div>
          </td>

          <!-- Acciones -->
          <td class="pe-4 text-end last-cell">
            <div class="actions-wrapper h-100 d-flex align-items-center justify-content-end gap-1.5">
              <button
                v-if="authStore.hasPermission('replacement.update')"
                @click="$emit('modificar', reemplazo)"
                class="btn-glass btn-edit"
                title="Editar Reemplazo"
              >
                <i class="bi bi-pencil-fill"></i>
              </button>

              <button
                @click="$emit('exportar', reemplazo)"
                class="btn-glass btn-export"
                title="Exportar a PDF"
              >
                <i class="bi bi-file-earmark-pdf-fill"></i>
              </button>

              <div class="vr mx-1 opacity-25" v-if="authStore.hasPermission('replacement.update')"></div>

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
                  title="Anular Reemplazo"
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
import { type ReplacementRegistration, MOTIVOS_AUSENCIA_LABELS, type AusenciaSalienteMotivo } from '@/types/replacement.types'
import { type IStaff } from '@/types/staff.types'
import { useAuthStore } from '@/stores/auth.store'
import { formatTitleCase } from '@/utils/text-formatters'
import { useServiceStore } from '@/stores/service.store'

const serviceStore = useServiceStore()
const getServiceName = (id: any) => {
  return serviceStore.getServiceName(id)
}

function getCausalLabel(motivo?: AusenciaSalienteMotivo | string) {
  if (!motivo) return 'No especificado'
  return MOTIVOS_AUSENCIA_LABELS[motivo as AusenciaSalienteMotivo] || motivo
}

function getCausalBadgeClass(motivo?: AusenciaSalienteMotivo | string) {
  switch (motivo) {
    case 'LICENCIA_MEDICA':
      return 'causal-medical'
    case 'PRE_POST_NATAL':
      return 'causal-maternal'
    case 'PERMISO_ADMINISTRATIVO':
      return 'causal-admin'
    case 'FERIADO_LEGAL':
      return 'causal-vacation'
    case 'DIA_COMPENSATORIO':
      return 'causal-compensatory'
    case 'COMISION_SERVICIO':
      return 'causal-commission'
    case 'PERMISO_GREMIAL':
      return 'causal-union'
    case 'OTRO':
    default:
      return 'causal-default'
  }
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
    transform: translateY(12px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

/* --- Container & Table Reset --- */
.modern-table-container {
  padding: 0 4px 6px 4px;
}

.modern-table {
  border-collapse: separate;
  border-spacing: 0 8px;
  width: 100%;
}

.modern-table thead th {
  border: none;
  font-size: 0.72rem;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  font-weight: 700;
  color: #64748b;
  padding: 10px 14px 10px 14px;
  background: #f8fafc;
  border-radius: 8px;
}

/* --- Row Styling --- */
.data-row {
  animation: slideUpFade 0.35s cubic-bezier(0.32, 0.72, 0, 1) forwards;
  opacity: 0;
}

.data-row td {
  background-color: white;
  border-top: 1px solid #e2e8f0;
  border-bottom: 1px solid #e2e8f0;
  padding: 0.95rem 0.75rem;
  vertical-align: middle;
  transition: all 0.2s cubic-bezier(0.32, 0.72, 0, 1);
}

.data-row td.first-cell {
  border-left: 1px solid #e2e8f0;
  border-top-left-radius: 14px;
  border-bottom-left-radius: 14px;
}

.data-row td.last-cell {
  border-right: 1px solid #e2e8f0;
  border-top-right-radius: 14px;
  border-bottom-right-radius: 14px;
}

.data-row:hover {
  transform: translateY(-2px);
}

.data-row:hover td {
  background-color: #fdfdfd;
  box-shadow: 0 8px 20px -4px rgba(15, 23, 42, 0.06);
  border-color: #cbd5e1;
}

/* --- Typography & Components --- */
.code-badge {
  color: #334155;
  font-size: 0.78rem;
  font-weight: 700;
  letter-spacing: 0.02em;
  background: #f1f5f9;
  border: 1px solid #e2e8f0 !important;
  padding: 4px 9px;
  border-radius: 8px;
  transition: all 0.2s cubic-bezier(0.32, 0.72, 0, 1);
  cursor: pointer;
  font-variant-numeric: tabular-nums;
}

.code-badge:hover {
  background: #e2e8f0;
  color: #0f172a;
  transform: translateY(-1px);
}

.staff-node {
  display: flex;
  align-items: center;
  width: 175px;
  flex-shrink: 0;
}

.avatar-modern {
  width: 36px;
  height: 36px;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.78rem;
  font-weight: 700;
  flex-shrink: 0;
}

.bg-gradient-danger {
  background: linear-gradient(135deg, #fecaca 0%, #f87171 100%);
  color: #7f1d1d;
  border: 1px solid rgba(248, 113, 113, 0.4);
}

.bg-gradient-success {
  background: linear-gradient(135deg, #bbf7d0 0%, #4ade80 100%);
  color: #14532d;
  border: 1px solid rgba(74, 222, 128, 0.4);
}

.staff-info {
  line-height: 1.25;
}

.staff-name-truncate {
  max-width: 125px;
  font-size: 0.875rem;
}

.rut-text {
  font-size: 0.72rem;
  color: #64748b;
  font-family: var(--bs-font-monospace, monospace);
  font-variant-numeric: tabular-nums;
}

.connector-line {
  width: 24px;
  height: 24px;
  border-radius: 50%;
  background: #f1f5f9;
  flex-shrink: 0;
}

/* Causal Pills */
.causal-pill {
  font-weight: 600;
  letter-spacing: 0.01em;
}

.causal-medical {
  background-color: #eff6ff;
  color: #1e40af;
  border: 1px solid #bfdbfe;
}

.causal-maternal {
  background-color: #fdf2f8;
  color: #9d174d;
  border: 1px solid #fbcfe8;
}

.causal-admin {
  background-color: #f8fafc;
  color: #475569;
  border: 1px solid #e2e8f0;
}

.causal-vacation {
  background-color: #fefce8;
  color: #854d0e;
  border: 1px solid #fef08a;
}

.causal-compensatory {
  background-color: #fffbeb;
  color: #b45309;
  border: 1px solid #fde68a;
}

.causal-commission {
  background-color: #eef2ff;
  color: #4338ca;
  border: 1px solid #c7d2fe;
}

.causal-union {
  background-color: #f1f5f9;
  color: #334155;
  border: 1px solid #cbd5e1;
}

.causal-default {
  background-color: #f8fafc;
  color: #475569;
  border: 1px solid #e2e8f0;
}

/* Context Badges */
.badge-modern-context {
  display: inline-flex;
  align-items: center;
  font-size: 0.78rem;
  font-weight: 700;
  color: #1e293b;
  background-color: #f8fafc;
  border: 1px solid #e2e8f0;
  padding: 3px 8px;
  border-radius: 6px;
  max-width: fit-content;
}

.shift-type-pill {
  font-size: 0.72rem;
  font-weight: 600;
  color: #64748b;
  margin-left: 2px;
}

/* Timeline */
.date-dot {
  width: 7px;
  height: 7px;
  border-radius: 50%;
  flex-shrink: 0;
}

.date-dot.start {
  background-color: #10b981;
  box-shadow: 0 0 0 2px rgba(16, 185, 129, 0.2);
}

.date-dot.end {
  background-color: #f43f5e;
  box-shadow: 0 0 0 2px rgba(244, 63, 94, 0.2);
}

.date-text {
  font-size: 0.78rem;
  width: 82px;
  font-variant-numeric: tabular-nums;
}

/* Status Glass Pills */
.status-glass {
  padding: 5px 12px;
  border-radius: 9999px;
  font-size: 0.72rem;
  font-weight: 700;
  letter-spacing: 0.02em;
}

.glass-success {
  background: #ecfdf5;
  color: #047857;
  border: 1px solid #a7f3d0;
}

.glass-warning {
  background: #fef3c7;
  color: #92400e;
  border: 1px solid #fde68a;
}

.glass-danger {
  background: #fff1f2;
  color: #be123c;
  border: 1px solid #fecdd3;
}

.glass-primary {
  background: #eff6ff;
  color: #1d4ed8;
  border: 1px solid #bfdbfe;
}

.glass-secondary {
  background: #f1f5f9;
  color: #475569;
  border: 1px solid #e2e8f0;
}

.creator-text {
  font-size: 0.68rem;
  color: #64748b;
  font-weight: 500;
  max-width: 110px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

/* Glass Buttons */
.btn-glass {
  width: 32px;
  height: 32px;
  border-radius: 8px;
  border: 1px solid #e2e8f0;
  background: #ffffff;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s cubic-bezier(0.32, 0.72, 0, 1);
  font-size: 0.85rem;
  color: #64748b;
}

.btn-glass:hover {
  transform: translateY(-1px);
  box-shadow: 0 4px 10px rgba(15, 23, 42, 0.08);
}

.btn-glass:active {
  transform: scale(0.96);
}

.btn-edit:hover {
  background: #eff6ff;
  border-color: #bfdbfe;
  color: #2563eb;
}

.btn-export:hover {
  background: #fef2f2;
  border-color: #fecaca;
  color: #dc2626;
}

.btn-finalize:hover {
  background: #ecfdf5;
  border-color: #a7f3d0;
  color: #059669;
}

.btn-delete:hover {
  background: #fff1f2;
  border-color: #fecdd3;
  color: #e11d48;
}
</style>
