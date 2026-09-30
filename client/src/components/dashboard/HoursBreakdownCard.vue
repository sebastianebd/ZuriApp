<template>
  <div class="card border shadow-xs h-100 hours-breakdown-card">
    <div class="card-header bg-transparent border-0 pt-3 pb-0 d-flex justify-content-between align-items-center">
      <div class="d-flex align-items-center gap-2">
        <div class="header-icon-mini text-primary">
          <i class="bi bi-clock-history fs-5"></i>
        </div>
        <h5 class="card-title fw-bold mb-0 text-dark">Distribución Horaria (Día vs Noche)</h5>
      </div>
      <span class="badge bg-indigo-subtle text-indigo px-2.5 py-1 rounded-pill smaller fw-semibold">
        <i class="bi bi-moon-stars-fill me-1"></i>
        {{ hoursBreakdown?.nightPercentage ?? 0 }}% Nocturno
      </span>
    </div>

    <div class="card-body">
      <div class="d-flex align-items-baseline justify-content-between mb-3">
        <div>
          <span class="kpi-micro-label text-secondary fw-semibold">Horas Totales Reemplazadas</span>
          <div class="d-flex align-items-baseline gap-2 mt-0.5">
            <h3 class="fw-bold mb-0 text-dark tabular-nums">{{ hoursBreakdown?.totalHours ?? 0 }}</h3>
            <span class="unit-text text-secondary fw-medium smaller">hrs</span>
          </div>
        </div>
      </div>

      <!-- Barra visual de proporción Día / Noche -->
      <div class="day-night-progress-track mb-3 shadow-xs">
        <div
          class="progress-segment segment-day"
          :style="{ width: `${dayPercentage}%` }"
          :title="`Diurno: ${hoursBreakdown?.dayHours ?? 0}h (${dayPercentage}%)`"
        >
          <span v-if="dayPercentage >= 15" class="segment-label">
            <i class="bi bi-sun-fill me-1"></i>{{ dayPercentage }}%
          </span>
        </div>
        <div
          class="progress-segment segment-night"
          :style="{ width: `${hoursBreakdown?.nightPercentage ?? 0}%` }"
          :title="`Nocturno: ${hoursBreakdown?.nightHours ?? 0}h (${hoursBreakdown?.nightPercentage ?? 0}%)`"
        >
          <span v-if="(hoursBreakdown?.nightPercentage ?? 0) >= 15" class="segment-label">
            <i class="bi bi-moon-stars-fill me-1"></i>{{ hoursBreakdown?.nightPercentage ?? 0 }}%
          </span>
        </div>
      </div>

      <!-- Leyenda y Detalle de Tarjetas -->
      <div class="row g-2 text-center small mt-1">
        <!-- Diurno Card -->
        <div class="col-6">
          <div class="p-2.5 border rounded-3 bg-amber-light h-100 d-flex flex-column justify-content-center">
            <div class="d-flex align-items-center justify-content-center gap-2 text-amber mb-1">
              <i class="bi bi-sun-fill"></i>
              <span class="fw-bold text-dark">Horario Diurno</span>
            </div>
            <div class="fs-4 fw-bold text-dark tabular-nums">
              {{ hoursBreakdown?.dayHours ?? 0 }} <span class="smaller fw-medium text-secondary">hrs</span>
            </div>
            <div class="text-secondary smaller mt-0.5 font-monospace">(08:00 a 20:00)</div>
          </div>
        </div>

        <!-- Nocturno Card -->
        <div class="col-6">
          <div class="p-2.5 border rounded-3 bg-indigo-light h-100 d-flex flex-column justify-content-center">
            <div class="d-flex align-items-center justify-content-center gap-2 text-indigo mb-1">
              <i class="bi bi-moon-stars-fill"></i>
              <span class="fw-bold text-dark">Horario Nocturno</span>
            </div>
            <div class="fs-4 fw-bold text-dark tabular-nums">
              {{ hoursBreakdown?.nightHours ?? 0 }} <span class="smaller fw-medium text-secondary">hrs</span>
            </div>
            <div class="text-secondary smaller mt-0.5 font-monospace">(20:00 a 08:00)</div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'

const props = defineProps<{
  hoursBreakdown?: {
    totalHours: number
    dayHours: number
    nightHours: number
    nightPercentage: number
  }
}>()

const dayPercentage = computed(() => {
  if (!props.hoursBreakdown?.totalHours) return 0
  return Number((100 - (props.hoursBreakdown.nightPercentage || 0)).toFixed(1))
})
</script>

<style scoped lang="scss">
.hours-breakdown-card {
  border-radius: 0.875rem;
  background: #ffffff;
  border-color: rgba(226, 232, 240, 0.9);
}

.kpi-micro-label {
  font-size: 0.725rem;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.tabular-nums {
  font-variant-numeric: tabular-nums;
  letter-spacing: -0.03em;
}

/* Day/Night Progress Track */
.day-night-progress-track {
  display: flex;
  height: 20px;
  border-radius: 10px;
  overflow: hidden;
  background: #f1f5f9;
}

.progress-segment {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 100%;
  transition: width 0.3s ease;

  .segment-label {
    font-size: 0.7rem;
    font-weight: 700;
    letter-spacing: 0.02em;
  }

  &.segment-day {
    background: linear-gradient(90deg, #f59e0b, #fbbf24);
    color: #78350f;
  }

  &.segment-night {
    background: linear-gradient(90deg, #3730a3, #1e1b4b);
    color: #ffffff;
  }
}

.bg-amber-light {
  background: #fffdf5;
  border-color: rgba(245, 158, 11, 0.25) !important;
}

.bg-indigo-light {
  background: #f8faff;
  border-color: rgba(79, 70, 229, 0.25) !important;
}

.text-amber {
  color: #d97706 !important;
}

.text-indigo {
  color: #4f46e5 !important;
}

.bg-indigo-subtle {
  background-color: #eef2ff !important;
}

.shadow-xs {
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.04);
}

.smaller {
  font-size: 0.725rem;
}

.hours-breakdown-card {
  border-radius: 0.875rem;
  background: #ffffff;
  border: 1px solid #e2e8f0 !important;
  overflow: hidden;
}

.card-header {
  background: transparent !important;
}

.unit-text {
  margin-left: 0.25rem;
  white-space: nowrap;
}
</style>
