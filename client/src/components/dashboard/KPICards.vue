<template>
  <div class="row g-3">
    <!-- Card 1: Total Reemplazos -->
    <div class="col-12 col-sm-6 col-xl-3">
      <div class="card h-100 shadow-sm border-0 kpi-card">
        <div class="card-body d-flex flex-column justify-content-between p-3">
          <div class="d-flex align-items-center justify-content-between mb-2">
            <span class="text-muted small fw-semibold text-uppercase">Total Reemplazos</span>
            <div class="kpi-icon-wrapper bg-primary-subtle text-primary">
              <i class="bi bi-arrow-left-right"></i>
            </div>
          </div>
          <div>
            <h3 class="fw-bold mb-1 fs-2">{{ summary?.totalReplacements ?? 0 }}</h3>
            <div class="d-flex align-items-center small" v-if="comparative?.replacementsDeltaPct !== null && comparative?.replacementsDeltaPct !== undefined">
              <span
                class="badge me-1"
                :class="comparative.replacementsDeltaPct <= 0 ? 'bg-success-subtle text-success' : 'bg-danger-subtle text-danger'"
              >
                <i class="bi" :class="comparative.replacementsDeltaPct <= 0 ? 'bi-arrow-down' : 'bi-arrow-up'"></i>
                {{ comparative.replacementsDeltaPct > 0 ? '+' : '' }}{{ comparative.replacementsDeltaPct }}%
              </span>
              <span class="text-muted">vs mes anterior</span>
            </div>
            <span v-else class="text-muted small">Sin datos previos</span>
          </div>
        </div>
      </div>
    </div>

    <!-- Card 2: Tasa de Reemplazos -->
    <div class="col-12 col-sm-6 col-xl-3">
      <div class="card h-100 shadow-sm border-0 kpi-card">
        <div class="card-body d-flex flex-column justify-content-between p-3">
          <div class="d-flex align-items-center justify-content-between mb-2">
            <span class="text-muted small fw-semibold text-uppercase">Tasa de Reemplazos</span>
            <div class="kpi-icon-wrapper bg-warning-subtle text-warning">
              <i class="bi bi-percent"></i>
            </div>
          </div>
          <div>
            <h3 class="fw-bold mb-1 fs-2">{{ (summary?.replacementRate ?? 0).toFixed(1) }}%</h3>
            <div class="d-flex align-items-center small" v-if="comparative?.replacementRateDeltaPoints !== null && comparative?.replacementRateDeltaPoints !== undefined">
              <span
                class="badge me-1"
                :class="comparative.replacementRateDeltaPoints <= 0 ? 'bg-success-subtle text-success' : 'bg-danger-subtle text-danger'"
              >
                <i class="bi" :class="comparative.replacementRateDeltaPoints <= 0 ? 'bi-arrow-down' : 'bi-arrow-up'"></i>
                {{ comparative.replacementRateDeltaPoints > 0 ? '+' : '' }}{{ comparative.replacementRateDeltaPoints }} pts
              </span>
              <span class="text-muted">vs mes anterior</span>
            </div>
            <span v-else class="text-muted small">Sin datos previos</span>
          </div>
        </div>
      </div>
    </div>

    <!-- Card 3: Jornadas Programadas -->
    <div class="col-12 col-sm-6 col-xl-3">
      <div class="card h-100 shadow-sm border-0 kpi-card">
        <div class="card-body d-flex flex-column justify-content-between p-3">
          <div class="d-flex align-items-center justify-content-between mb-2">
            <span class="text-muted small fw-semibold text-uppercase">Jornadas Programadas</span>
            <div class="kpi-icon-wrapper bg-info-subtle text-info">
              <i class="bi bi-calendar-check"></i>
            </div>
          </div>
          <div>
            <h3 class="fw-bold mb-1 fs-2">{{ summary?.scheduledShiftDays ?? 0 }}</h3>
            <span class="text-muted small">Turnos oficiales efectivos (excluye libres)</span>
          </div>
        </div>
      </div>
    </div>

    <!-- Card 4: Jornadas Reemplazadas -->
    <div class="col-12 col-sm-6 col-xl-3">
      <div class="card h-100 shadow-sm border-0 kpi-card">
        <div class="card-body d-flex flex-column justify-content-between p-3">
          <div class="d-flex align-items-center justify-content-between mb-2">
            <span class="text-muted small fw-semibold text-uppercase">Jornadas Reemplazadas</span>
            <div class="kpi-icon-wrapper bg-secondary-subtle text-secondary">
              <i class="bi bi-clock-history"></i>
            </div>
          </div>
          <div>
            <h3 class="fw-bold mb-1 fs-2">{{ summary?.totalShiftsReplaced ?? 0 }}</h3>
            <span class="text-muted small">Turnos cubiertos por personal reemplazante</span>
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

<style scoped>
.kpi-card {
  border-radius: 0.75rem;
  background: #ffffff;
  transition: transform 0.2s ease, box-shadow 0.2s ease;
}
.kpi-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 0.5rem 1rem rgba(0, 0, 0, 0.08) !important;
}
.kpi-icon-wrapper {
  width: 2.5rem;
  height: 2.5rem;
  border-radius: 0.5rem;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.25rem;
}
.bg-success-subtle {
  background-color: #d1e7dd !important;
}
.text-success {
  color: #0f5132 !important;
}
.bg-danger-subtle {
  background-color: #f8d7da !important;
}
.text-danger {
  color: #842029 !important;
}
.bg-primary-subtle {
  background-color: #cfe2ff !important;
}
.text-primary {
  color: #084298 !important;
}
.bg-warning-subtle {
  background-color: #fff3cd !important;
}
.text-warning {
  color: #664d03 !important;
}
.bg-info-subtle {
  background-color: #cff4fc !important;
}
.text-info {
  color: #055160 !important;
}
.bg-secondary-subtle {
  background-color: #e2e3e5 !important;
}
</style>
