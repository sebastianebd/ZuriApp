<template>
  <div class="card shadow-xs h-100 coverage-card" :class="statusBorderClass">
    <div class="card-header bg-transparent border-0 pt-3 pb-0 d-flex justify-content-between align-items-center">
      <div class="d-flex align-items-center gap-2">
        <div class="header-icon-mini text-primary">
          <i class="bi bi-shield-check fs-5"></i>
        </div>
        <h5 class="card-title fw-bold mb-0 text-dark">Cobertura de Dotación</h5>
      </div>
      <button
        v-if="canEditStaffing"
        class="btn btn-sm btn-outline-primary d-flex align-items-center gap-2 rounded-pill px-3 fw-semibold shadow-xs"
        data-test="btn-edit-staffing"
        @click="$emit('openStaffingModal')"
      >
        <i class="bi bi-gear"></i>
        <span>Ajustar Dotación y Metas</span>
      </button>
    </div>

    <div class="card-body">
      <!-- Indicador principal (Gauge / Barra con Semáforo) -->
      <div class="d-flex flex-column align-items-center text-center my-2">
        <div class="gauge-percentage-wrapper mb-1">
          <span class="display-3 fw-bolder tabular-nums" :class="statusTextClass">
            {{ coverage.overallPercentage !== null ? `${coverage.overallPercentage}%` : 'N/A' }}
          </span>
        </div>

        <span class="badge px-3 py-1.5 rounded-pill small mb-3 fw-semibold shadow-xs" :class="statusBadgeClass">
          <i class="bi me-1" :class="statusIconClass"></i>
          {{ statusLabel }}
        </span>

        <!-- Barra de Progreso con Marcadores de Umbrales -->
        <div class="w-100 px-2 my-1">
          <div class="threshold-track-wrapper position-relative">
            <div class="progress" style="height: 10px; border-radius: 6px; background-color: #f1f5f9; overflow: visible;">
              <div
                class="progress-bar rounded-pill transition-all"
                role="progressbar"
                :class="progressBarClass"
                :style="{ width: `${Math.min(coverage.overallPercentage ?? 0, 100)}%` }"
                :aria-valuenow="coverage.overallPercentage ?? 0"
                aria-valuemin="0"
                aria-valuemax="100"
              ></div>

              <!-- Marcador Umbral Alerta -->
              <div
                class="threshold-marker marker-alert"
                :style="{ left: `${coverage.thresholds.yellow}%` }"
                :title="`Umbral Alerta: ${coverage.thresholds.yellow}%`"
              >
                <div class="marker-tick"></div>
              </div>

              <!-- Marcador Umbral Meta Óptima -->
              <div
                class="threshold-marker marker-optimal"
                :style="{ left: `${coverage.thresholds.green}%` }"
                :title="`Meta Óptima: ${coverage.thresholds.green}%`"
              >
                <div class="marker-tick"></div>
              </div>
            </div>

            <!-- Leyenda de Metas -->
            <div class="d-flex justify-content-between text-secondary smaller mt-2.5">
              <span>0%</span>
              <span class="threshold-legend-item">
                <i class="bi bi-circle-fill text-warning me-1" style="font-size: 0.45rem;"></i>
                Alerta: <strong>{{ coverage.thresholds.yellow }}%</strong>
              </span>
              <span class="threshold-legend-item">
                <i class="bi bi-circle-fill text-success me-1" style="font-size: 0.45rem;"></i>
                Meta Óptima: <strong>{{ coverage.thresholds.green }}%</strong>
              </span>
              <span>100%</span>
            </div>
          </div>
        </div>
      </div>

      <!-- Turnos no cubiertos -->
      <div class="alert py-2 px-3 mb-3 d-flex align-items-center gap-2 rounded-3 border" :class="uncoveredAlertClass">
        <i class="bi bi-exclamation-circle-fill fs-6"></i>
        <span class="small">
          <strong>{{ coverage.uncoveredSlotsCount }}</strong> puestos-turno sin cobertura según la dotación mínima configurada.
        </span>
      </div>

      <!-- Desglose por Cargo (byPosition) -->
      <div v-if="coverage.byPosition && coverage.byPosition.length > 0" class="mt-3">
        <div class="d-flex justify-content-between align-items-center mb-2">
          <h6 class="fw-bold text-secondary smaller text-uppercase tracking-wider mb-0">Desglose por Cargo</h6>
          <span class="badge bg-light text-muted border px-1.5 py-0.5 rounded smaller">
            {{ coverage.byPosition.length }} {{ coverage.byPosition.length === 1 ? 'cargo' : 'cargos' }}
          </span>
        </div>
        <div class="table-responsive">
          <table class="table table-sm align-middle mb-0 position-breakdown-table">
            <thead class="table-light smaller">
              <tr>
                <th class="ps-2">Cargo</th>
                <th class="text-center">Día Req.</th>
                <th class="text-center">Noche Req.</th>
                <th class="text-end pe-2">Cobertura</th>
              </tr>
            </thead>
            <tbody class="small">
              <tr v-for="pos in coverage.byPosition" :key="pos.positionId">
                <td class="fw-semibold text-dark ps-2">{{ pos.positionName }}</td>
                <td class="text-center text-secondary font-monospace">{{ pos.minDay }}</td>
                <td class="text-center text-secondary font-monospace">{{ pos.minNight }}</td>
                <td class="text-end pe-2">
                  <div class="d-flex align-items-center justify-content-end gap-2">
                    <div class="mini-progress-track d-none d-sm-block" style="width: 50px; height: 5px; background: #e2e8f0; border-radius: 3px;">
                      <div
                        class="h-100 rounded-pill"
                        :class="pos.coveragePercentage >= coverage.thresholds.green ? 'bg-success' : pos.coveragePercentage >= coverage.thresholds.yellow ? 'bg-warning' : 'bg-danger'"
                        :style="{ width: `${Math.min(pos.coveragePercentage, 100)}%` }"
                      ></div>
                    </div>
                    <span
                      class="badge rounded-pill px-2 py-0.5 font-monospace"
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
                  </div>
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
    return 'alert-success border-success-subtle'
  }
  if (props.coverage.status === 'warning') {
    return 'alert-warning border-warning-subtle'
  }
  return 'alert-danger border-danger-subtle'
})
</script>

<style scoped lang="scss">
.coverage-card {
  border-radius: 0.875rem;
  background: #ffffff;
  border: 1px solid #e2e8f0 !important;
  overflow: hidden;
  transition: box-shadow 0.2s ease;
}

.card-header {
  background: transparent !important;
}

.border-success-subtle,
.border-warning-subtle,
.border-danger-subtle {
  border: 1px solid #e2e8f0 !important;
}

.tabular-nums {
  font-variant-numeric: tabular-nums;
  letter-spacing: -0.04em;
}

.threshold-marker {
  position: absolute;
  top: -4px;
  transform: translateX(-50%);
  display: flex;
  flex-direction: column;
  align-items: center;
  pointer-events: none;

  .marker-tick {
    width: 2px;
    height: 18px;
    border-radius: 1px;
    background-color: #64748b;
  }

  &.marker-alert .marker-tick {
    background-color: #f59e0b;
  }

  &.marker-optimal .marker-tick {
    background-color: #10b981;
  }
}

.transition-all {
  transition: all 0.3s ease;
}

.shadow-xs {
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.04);
}

.smaller {
  font-size: 0.725rem;
}

.tracking-wider {
  letter-spacing: 0.05em;
}
</style>
