<template>
  <div class="row g-3 executive-kpis">
    <!-- Card 1: Total Reemplazos -->
    <div class="col-12 col-sm-6 col-xl-3">
      <div class="card h-100 border kpi-card shadow-xs">
        <div class="card-body d-flex flex-column justify-content-between p-3.5">
          <div class="d-flex align-items-center justify-content-between mb-2">
            <span class="kpi-label">Total Reemplazos</span>
            <div class="kpi-icon-wrapper bg-primary-subtle text-primary">
              <i class="bi bi-arrow-left-right"></i>
            </div>
          </div>
          <div>
            <div class="d-flex align-items-baseline gap-2 mb-1">
              <h3 class="kpi-value text-dark mb-0">{{ summary?.totalReplacements ?? 0 }}</h3>
              <span class="unit-text text-secondary smaller fw-medium">eventos</span>
            </div>
            <div
              class="d-flex align-items-center gap-2"
              v-if="comparative?.replacementsDeltaPct !== null && comparative?.replacementsDeltaPct !== undefined"
            >
              <span
                class="badge rounded-pill px-2 py-0.5"
                :class="comparative.replacementsDeltaPct <= 0 ? 'bg-success-subtle text-success' : 'bg-danger-subtle text-danger'"
              >
                <i class="bi me-0.5" :class="comparative.replacementsDeltaPct <= 0 ? 'bi-arrow-down' : 'bi-arrow-up'"></i>
                {{ comparative.replacementsDeltaPct > 0 ? '+' : '' }}{{ comparative.replacementsDeltaPct }}%
              </span>
              <span class="text-secondary smaller">vs mes anterior</span>
            </div>
            <span v-else class="badge bg-light text-secondary border px-2 py-0.5 rounded-pill smaller">
              Sin datos previos
            </span>
          </div>
        </div>
      </div>
    </div>

    <!-- Card 2: Tasa de Reemplazos -->
    <div class="col-12 col-sm-6 col-xl-3">
      <div class="card h-100 border kpi-card shadow-xs">
        <div class="card-body d-flex flex-column justify-content-between p-3.5">
          <div class="d-flex align-items-center justify-content-between mb-2">
            <span class="kpi-label">Tasa de Reemplazos</span>
            <div class="kpi-icon-wrapper bg-amber-subtle text-amber">
              <i class="bi bi-percent"></i>
            </div>
          </div>
          <div>
            <div class="d-flex align-items-baseline gap-2 mb-1">
              <h3 class="kpi-value text-dark mb-0">{{ (summary?.replacementRate ?? 0).toFixed(1) }}%</h3>
            </div>
            <div
              class="d-flex align-items-center gap-2"
              v-if="comparative?.replacementRateDeltaPoints !== null && comparative?.replacementRateDeltaPoints !== undefined"
            >
              <span
                class="badge rounded-pill px-2 py-0.5"
                :class="comparative.replacementRateDeltaPoints <= 0 ? 'bg-success-subtle text-success' : 'bg-danger-subtle text-danger'"
              >
                <i class="bi me-0.5" :class="comparative.replacementRateDeltaPoints <= 0 ? 'bi-arrow-down' : 'bi-arrow-up'"></i>
                {{ comparative.replacementRateDeltaPoints > 0 ? '+' : '' }}{{ comparative.replacementRateDeltaPoints }} pts
              </span>
              <span class="text-secondary smaller">vs mes anterior</span>
            </div>
            <span v-else class="badge bg-light text-secondary border px-2 py-0.5 rounded-pill smaller">
              Sin datos previos
            </span>
          </div>
        </div>
      </div>
    </div>

    <!-- Card 3: Jornadas Programadas -->
    <div class="col-12 col-sm-6 col-xl-3">
      <div class="card h-100 border kpi-card shadow-xs">
        <div class="card-body d-flex flex-column justify-content-between p-3.5">
          <div class="d-flex align-items-center justify-content-between mb-2">
            <span class="kpi-label">Jornadas Programadas</span>
            <div class="kpi-icon-wrapper bg-sky-subtle text-sky">
              <i class="bi bi-calendar-check"></i>
            </div>
          </div>
          <div>
            <div class="d-flex align-items-baseline gap-2 mb-1">
              <h3 class="kpi-value text-dark mb-0">{{ summary?.scheduledShiftDays ?? 0 }}</h3>
              <span class="unit-text text-secondary smaller fw-medium">turnos base</span>
            </div>
            <span class="text-secondary smaller d-block text-truncate" title="Turnos oficiales efectivos excluyendo libres">
              Efectivos (excluye libres)
            </span>
          </div>
        </div>
      </div>
    </div>

    <!-- Card 4: Jornadas Reemplazadas -->
    <div class="col-12 col-sm-6 col-xl-3">
      <div class="card h-100 border kpi-card shadow-xs">
        <div class="card-body d-flex flex-column justify-content-between p-3.5">
          <div class="d-flex align-items-center justify-content-between mb-2">
            <span class="kpi-label">Jornadas Reemplazadas</span>
            <div class="kpi-icon-wrapper bg-slate-subtle text-slate">
              <i class="bi bi-clock-history"></i>
            </div>
          </div>
          <div>
            <div class="d-flex align-items-baseline gap-2 mb-1">
              <h3 class="kpi-value text-dark mb-0">{{ summary?.totalShiftsReplaced ?? 0 }}</h3>
              <span class="unit-text text-secondary smaller fw-medium">turnos cubiertos</span>
            </div>
            <span class="text-secondary smaller d-block text-truncate" title="Turnos cubiertos por personal reemplazante">
              Por personal de reemplazo
            </span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
defineProps<{
  summary?: {
    totalReplacements: number
    replacementRate: number
    scheduledShiftDays: number
    totalShiftsReplaced: number
  }
  comparative?: {
    previousPeriod: { month: number; year: number }
    replacementsDeltaPct: number | null
    replacementRateDeltaPoints: number | null
    coverageDeltaPoints: number | null
  }
}>()
</script>

<style scoped lang="scss">
.kpi-card {
  border-radius: 0.875rem;
  background: #ffffff;
  border-color: rgba(226, 232, 240, 0.9) !important;
  transition: transform 0.15s ease, box-shadow 0.15s ease;

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 6px 16px rgba(15, 23, 42, 0.06) !important;
  }
}

.kpi-label {
  font-size: 0.72rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: #64748b;
}

.kpi-value {
  font-size: 1.85rem;
  font-weight: 800;
  font-variant-numeric: tabular-nums;
  letter-spacing: -0.03em;
  line-height: 1.1;
}

.unit-text {
  font-size: 0.8125rem;
  font-weight: 500;
  margin-left: 0.25rem;
  letter-spacing: -0.01em;
  white-space: nowrap;
}

.kpi-icon-wrapper {
  width: 2.35rem;
  height: 2.35rem;
  border-radius: 0.625rem;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.15rem;
}

/* Colores Clínicos Refinados */
.bg-primary-subtle {
  background-color: #eff6ff !important;
}
.text-primary {
  color: #2563eb !important;
}

.bg-amber-subtle {
  background-color: #fffbeb !important;
}
.text-amber {
  color: #d97706 !important;
}

.bg-sky-subtle {
  background-color: #f0f9ff !important;
}
.text-sky {
  color: #0284c7 !important;
}

.bg-slate-subtle {
  background-color: #f1f5f9 !important;
}
.text-slate {
  color: #475569 !important;
}

.bg-success-subtle {
  background-color: #f0fdf4 !important;
}
.text-success {
  color: #166534 !important;
}

.bg-danger-subtle {
  background-color: #fef2f2 !important;
}
.text-danger {
  color: #991b1b !important;
}

.shadow-xs {
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.04);
}

.smaller {
  font-size: 0.75rem;
}
</style>
