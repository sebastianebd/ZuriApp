<template>
  <div
    v-if="modelValue && shift"
    class="bottom-sheet-backdrop"
    @click.self="close"
  >
    <div class="bottom-sheet-content show" data-test="shift-day-detail-sheet">
      <div class="bottom-sheet-handle"></div>

      <div class="d-flex justify-content-between align-items-center mb-3">
        <div class="d-flex align-items-center gap-2">
          <span
            class="badge rounded-circle p-2 d-flex align-items-center justify-content-center sigla-badge"
            :class="getSiglaClass(shift.sigla)"
          >
            {{ shift.sigla }}
          </span>
          <div>
            <h6 class="mb-0 fw-bold" data-test="detail-date">
              {{ formatDate(shift.date) }}
            </h6>
            <small class="text-muted">{{ getShiftName(shift.sigla) }}</small>
          </div>
        </div>

        <button
          type="button"
          class="btn-close"
          aria-label="Close"
          @click="close"
        ></button>
      </div>

      <!-- Detalle Operativo -->
      <div class="card border-0 bg-light rounded-3 p-3 mb-3">
        <div class="mb-2">
          <span class="d-block text-secondary small">Servicio Asignado</span>
          <strong class="text-dark fs-6" data-test="detail-service">
            {{ shift.serviceName }}
          </strong>
        </div>

        <div class="row g-2 pt-2 border-top small text-muted">
          <div class="col-6">
            <span class="d-block text-secondary">Horario de Turno</span>
            <strong class="text-dark" data-test="detail-hours">
              {{ shift.entryTime && shift.exitTime ? `${shift.entryTime} - ${shift.exitTime}` : 'Jornada Libre' }}
            </strong>
          </div>
          <div class="col-6">
            <span class="d-block text-secondary">Estado Confirmación</span>
            <strong
              class="d-block"
              :class="shift.confirmationStatus === 'confirmed' ? 'text-success' : 'text-secondary'"
              data-test="detail-confirmation"
            >
              {{ shift.confirmationStatus === 'confirmed' ? 'Asistencia Confirmada' : (shift.confirmationStatus === 'unavailable' ? 'Indisponibilidad' : 'Pendiente') }}
            </strong>
          </div>
        </div>
      </div>

      <!-- Banner si es reemplazo -->
      <div
        v-if="shift.isReplacement"
        class="alert alert-warning border border-warning d-flex justify-content-between align-items-center p-3 rounded-3 mb-3"
        data-test="replacement-contract-banner"
      >
        <div>
          <span class="badge bg-warning text-dark me-1">🤝 Reemplazo</span>
          <small class="d-block fw-semibold mt-1">
            Turno cubierto bajo Contrato {{ shift.replacementBusinessCode || 'REP-OFICIAL' }}
          </small>
        </div>

        <button
          type="button"
          class="btn btn-sm btn-outline-dark fw-semibold"
          data-test="view-contract-link"
          @click="handleViewContract"
        >
          Ver Contrato ➔
        </button>
      </div>

      <div class="d-grid mt-3">
        <button
          type="button"
          class="btn btn-outline-secondary py-2"
          @click="close"
        >
          Cerrar
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { PortalShiftItem } from '@/types/portal.types'

const props = defineProps<{
  modelValue: boolean
  shift: PortalShiftItem | null
}>()

const emit = defineEmits<{
  (e: 'update:modelValue', value: boolean): void
  (e: 'view-contract', replacementId: string): void
}>()

function close() {
  emit('update:modelValue', false)
}

function formatDate(dateStr: string): string {
  if (!dateStr) return ''
  const parts = dateStr.split('-')
  if (parts.length === 3) {
    return `${parts[2]}/${parts[1]}/${parts[0]}`
  }
  return dateStr
}

function getSiglaClass(sigla: string) {
  switch (sigla) {
    case 'L':
      return 'bg-primary text-white'
    case 'N':
      return 'bg-dark text-white'
    case 'X':
      return 'bg-light text-muted border'
    default:
      return 'bg-secondary text-white'
  }
}

function getShiftName(sigla: string) {
  switch (sigla) {
    case 'L':
      return 'Turno Largo (08:00 - 20:00)'
    case 'N':
      return 'Turno Noche (20:00 - 08:00)'
    case 'X':
      return 'Día Libre'
    default:
      return 'Jornada Hospitalaria'
  }
}

function handleViewContract() {
  if (props.shift?.replacementId) {
    emit('view-contract', props.shift.replacementId)
    close()
  }
}
</script>

<style scoped lang="scss">
.bottom-sheet-backdrop {
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  background-color: rgba(0, 0, 0, 0.5);
  z-index: 1050;
  display: flex;
  justify-content: center;
  align-items: flex-end;
}

.bottom-sheet-content {
  background: #ffffff;
  width: 100%;
  max-width: 540px;
  border-top-left-radius: 20px;
  border-top-right-radius: 20px;
  padding: 1.5rem;
  box-shadow: 0 -4px 16px rgba(0, 0, 0, 0.15);
  animation: slideUp 0.25s ease-out;

  .bottom-sheet-handle {
    width: 40px;
    height: 4px;
    background: #dee2e6;
    border-radius: 2px;
    margin: -0.5rem auto 1rem auto;
  }
}

.sigla-badge {
  width: 38px;
  height: 38px;
  font-weight: 700;
  font-size: 1rem;
}

@keyframes slideUp {
  from {
    transform: translateY(100%);
  }
  to {
    transform: translateY(0);
  }
}
</style>
