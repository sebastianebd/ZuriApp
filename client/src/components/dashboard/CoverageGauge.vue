<template>
  <div class="card shadow-sm border-0 h-100 coverage-card" :class="statusBorderClass">
    <div class="card-header bg-white border-0 pt-3 pb-0 d-flex justify-content-between align-items-center">
      <div class="d-flex align-items-center gap-2">
        <i class="bi bi-shield-check text-primary fs-5"></i>
        <h5 class="card-title fw-bold mb-0">Cobertura de Dotación</h5>
      </div>
      <button
        v-if="canEditStaffing"
        class="btn btn-sm btn-outline-primary d-flex align-items-center gap-1"
        data-test="btn-edit-staffing"
        @click="$emit('openStaffingModal')"
      >
        <i class="bi bi-gear"></i>
        <span>Ajustar Dotación y Metas</span>
      </button>
    </div>

    <div class="card-body">
      <!-- Indicador principal (Gauge / Barra con Semáforo) -->
      <div class="d-flex flex-column align-items-center text-center my-3">
        <div class="gauge-percentage-wrapper mb-2">
          <span class="display-4 fw-bold" :class="statusTextClass">
            {{ coverage.overallPercentage !== null ? `${coverage.overallPercentage}%` : 'N/A' }}
          </span>
        </div>

        <span class="badge px-3 py-2 rounded-pill fs-6 mb-3" :class="statusBadgeClass">
          <i class="bi me-1" :class="statusIconClass"></i>
          {{ statusLabel }}
        </span>

        <!-- Barra de Progreso con Umbrales -->
        <div class="w-100 px-3">
          <div class="progress" style="height: 12px; border-radius: 6px;">
            <div
              class="progress-bar"
              role="progressbar"
              :class="progressBarClass"
              :style="{ width: `${Math.min(coverage.overallPercentage ?? 0, 100)}%` }"
              :aria-valuenow="coverage.overallPercentage ?? 0"
              aria-valuemin="0"
              aria-valuemax="100"
            ></div>
          </div>
          <div class="d-flex justify-content-between text-muted small mt-1">
            <span>0%</span>
            <span>Alerta: {{ coverage.thresholds.yellow }}%</span>
            <span>Meta Óptima: {{ coverage.thresholds.green }}%</span>
            <span>100%</span>
          </div>
        </div>
      </div>

      <!-- Turnos no cubiertos -->
      <div class="alert py-2 px-3 mb-3 d-flex align-items-center gap-2" :class="uncoveredAlertClass">
        <i class="bi bi-exclamation-circle-fill"></i>
        <span class="small">
          <strong>{{ coverage.uncoveredSlotsCount }}</strong> puestos-turno sin cobertura según la dotación mínima configurada.
        </span>
      </div>

      <!-- Desglose por Cargo (byPosition) -->
      <div v-if="coverage.byPosition && coverage.byPosition.length > 0" class="mt-3">
        <h6 class="fw-bold text-muted small text-uppercase mb-2">Desglose por Cargo</h6>
        <div class="table-responsive">
          <table class="table table-sm align-middle mb-0">
            <thead class="table-light small">
              <tr>
                <th>Cargo</th>
                <th class="text-center">Día Req.</th>
                <th class="text-center">Noche Req.</th>
                <th class="text-end">Cobertura</th>
              </tr>
            </thead>
            <tbody class="small">
              <tr v-for="pos in coverage.byPosition" :key="pos.positionId">
                <td class="fw-semibold">{{ pos.positionName }}</td>
                <td class="text-center">{{ pos.minDay }}</td>
                <td class="text-center">{{ pos.minNight }}</td>
                <td class="text-end">
                  <span
                    class="badge"
                    :class="
                      pos.coveragePercentage >= coverage.thresholds.green
                        ? 'bg-success'
                        : pos.coveragePercentage >= coverage.thresholds.yellow
                        ? 'bg-warning text-dark'
                        : 'bg-danger'
                    "
                  >
                    {{ pos.coveragePercentage }}%
                  </span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'

const props = defineProps<{
  coverage: {
    configured: boolean
    overallPercentage: number | null
    status: 'optimal' | 'warning' | 'critical'
    thresholds: {
      green: number
      yellow: number
    }
    uncoveredSlotsCount: number
    byPosition: Array<{
      positionId: string
      positionName: string
      minDay: number
      minNight: number
      coveragePercentage: number
    }>
  }
  canEditStaffing?: boolean
}>()

defineEmits(['openStaffingModal'])

const statusLabel = computed(() => {
  switch (props.coverage.status) {
    case 'optimal':
      return 'Dotación Óptima'
    case 'warning':
      return 'Alerta de Cobertura'
    case 'critical':
      return 'Déficit Crítico'
    default:
      return 'Normal'
  }
})

const statusBadgeClass = computed(() => {
  switch (props.coverage.status) {
    case 'optimal':
      return 'bg-success'
    case 'warning':
      return 'bg-warning text-dark'
    case 'critical':
      return 'bg-danger'
    default:
      return 'bg-secondary'
  }
})

const statusTextClass = computed(() => {
  switch (props.coverage.status) {
    case 'optimal':
      return 'text-success'
    case 'warning':
      return 'text-warning'
    case 'critical':
      return 'text-danger'
    default:
      return 'text-secondary'
  }
})

const statusBorderClass = computed(() => {
  switch (props.coverage.status) {
    case 'optimal':
      return 'border-success-subtle'
    case 'warning':
      return 'border-warning-subtle'
    case 'critical':
      return 'border-danger-subtle'
    default:
      return ''
  }
})

const progressBarClass = computed(() => {
  switch (props.coverage.status) {
    case 'optimal':
      return 'bg-success'
    case 'warning':
      return 'bg-warning'
    case 'critical':
      return 'bg-danger'
    default:
      return 'bg-primary'
  }
})

const statusIconClass = computed(() => {
  switch (props.coverage.status) {
    case 'optimal':
      return 'bi-check-circle-fill'
    case 'warning':
      return 'bi-exclamation-triangle-fill'
    case 'critical':
      return 'bi-x-octagon-fill'
    default:
      return 'bi-info-circle-fill'
  }
})

const uncoveredAlertClass = computed(() => {
  if (props.coverage.uncoveredSlotsCount === 0) {
    return 'alert-success'
  }
  if (props.coverage.status === 'warning') {
    return 'alert-warning'
  }
  return 'alert-danger'
})
</script>

<style scoped>
.coverage-card {
  border-radius: 0.75rem;
}
.border-success-subtle {
  border: 1px solid #198754 !important;
}
.border-warning-subtle {
  border: 1px solid #ffc107 !important;
}
.border-danger-subtle {
  border: 1px solid #dc3545 !important;
}
</style>
