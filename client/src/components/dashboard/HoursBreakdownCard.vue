<template>
  <div class="card shadow-sm border-0 h-100">
    <div class="card-header bg-white border-0 pt-3 pb-0 d-flex justify-content-between align-items-center">
      <div class="d-flex align-items-center gap-2">
        <i class="bi bi-clock text-primary fs-5"></i>
        <h5 class="card-title fw-bold mb-0">Distribución Horaria (Día vs Noche)</h5>
      </div>
    </div>
    <div class="card-body">
      <div class="d-flex align-items-baseline justify-content-between mb-3">
        <div>
          <span class="text-muted small text-uppercase fw-semibold">Horas Totales Reemplazadas</span>
          <h3 class="fw-bold mb-0">{{ hoursBreakdown?.totalHours ?? 0 }} hrs</h3>
        </div>
        <span class="badge bg-dark-subtle text-dark px-2 py-1">
          <i class="bi bi-moon-stars me-1"></i>
          {{ hoursBreakdown?.nightPercentage ?? 0 }}% Nocturno
        </span>
      </div>

      <!-- Barra visual de proporción -->
      <div class="progress mb-3" style="height: 16px; border-radius: 8px;">
        <div
          class="progress-bar bg-warning text-dark fw-bold small"
          role="progressbar"
          :style="{ width: `${dayPercentage}%` }"
          :title="`Diurno: ${hoursBreakdown?.dayHours ?? 0}h`"
        >
          {{ dayPercentage > 15 ? `${dayPercentage}%` : '' }}
        </div>
        <div
          class="progress-bar bg-dark text-white fw-bold small"
          role="progressbar"
          :style="{ width: `${hoursBreakdown?.nightPercentage ?? 0}%` }"
          :title="`Nocturno: ${hoursBreakdown?.nightHours ?? 0}h`"
        >
          {{ (hoursBreakdown?.nightPercentage ?? 0) > 15 ? `${hoursBreakdown?.nightPercentage}%` : '' }}
        </div>
      </div>

      <!-- Leyenda y Detalle -->
      <div class="row g-2 text-center small">
        <div class="col-6">
          <div class="p-2 border rounded bg-light">
            <div class="d-flex align-items-center justify-content-center gap-1 text-warning mb-1">
              <i class="bi bi-sun-fill"></i>
              <span class="fw-semibold text-dark">Horario Diurno</span>
            </div>
            <div class="fs-5 fw-bold text-dark">{{ hoursBreakdown?.dayHours ?? 0 }} hrs</div>
            <div class="text-muted" style="font-size: 0.75rem;">(08:00 a 20:00)</div>
          </div>
        </div>
        <div class="col-6">
          <div class="p-2 border rounded bg-light">
            <div class="d-flex align-items-center justify-content-center gap-1 text-primary mb-1">
              <i class="bi bi-moon-stars-fill"></i>
              <span class="fw-semibold text-dark">Horario Nocturno</span>
            </div>
            <div class="fs-5 fw-bold text-dark">{{ hoursBreakdown?.nightHours ?? 0 }} hrs</div>
            <div class="text-muted" style="font-size: 0.75rem;">(20:00 a 08:00)</div>
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

<style scoped>
.bg-dark-subtle {
  background-color: #e2e8f0 !important;
}
</style>
