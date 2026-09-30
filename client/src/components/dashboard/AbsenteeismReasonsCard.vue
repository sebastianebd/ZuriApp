<template>
  <div class="card border shadow-xs h-100 absenteeism-reasons-card">
    <div class="card-header bg-transparent border-0 pt-3 pb-0 d-flex justify-content-between align-items-center">
      <div class="d-flex align-items-center gap-2">
        <div class="header-icon-mini text-primary">
          <i class="bi bi-pie-chart-fill fs-5"></i>
        </div>
        <h5 class="card-title fw-bold mb-0 text-dark">Motivos de Ausentismo</h5>
      </div>
      <span class="badge bg-light text-secondary border smaller">
        Causas Clínicas
      </span>
    </div>

    <div class="card-body d-flex flex-column justify-content-center">
      <div v-if="hasData" class="d-flex flex-column flex-sm-row align-items-center justify-content-between gap-3 h-100 py-1">
        <!-- Donut Chart con Total en el Centro -->
        <div class="donut-chart-container position-relative flex-shrink-0">
          <Doughnut :data="chartData" :options="chartOptions" />
          <div class="donut-center-badge text-center">
            <span class="display-6 fw-bolder text-dark lh-1 tabular-nums">{{ totalEvents }}</span>
            <span class="text-secondary smaller text-uppercase fw-semibold d-block mt-0.5 tracking-wider">Eventos</span>
          </div>
        </div>

        <!-- Leyenda Clínica Personalizada -->
        <div class="reasons-legend-list flex-grow-1 w-100">
          <div
            v-for="(item, idx) in reasons"
            :key="item.motivo || idx"
            class="reason-legend-item d-flex align-items-center justify-content-between py-1.5 px-2 rounded-2"
          >
            <div class="d-flex align-items-center gap-2 text-truncate me-2">
              <span class="legend-color-dot flex-shrink-0" :style="{ backgroundColor: item.color }"></span>
              <span class="small fw-semibold text-dark text-truncate" :title="item.label">{{ item.label }}</span>
            </div>
            <div class="d-flex align-items-center gap-2 flex-shrink-0">
              <span class="smaller text-secondary">{{ item.count }} {{ item.count === 1 ? 'evento' : 'eventos' }}</span>
              <span class="badge bg-light text-dark border smaller font-monospace fw-bold">{{ item.percentage }}%</span>
            </div>
          </div>
        </div>
      </div>

      <!-- Empty State cuando no hay ausencias -->
      <div v-else class="d-flex flex-column align-items-center justify-content-center h-100 text-center text-muted p-4">
        <div class="empty-icon-circle mb-2">
          <i class="bi bi-shield-check fs-2 text-success opacity-75"></i>
        </div>
        <h6 class="fw-bold text-dark mb-1">Sin ausencias registradas</h6>
        <span class="smaller text-secondary" style="max-width: 260px;">
          No se registraron reemplazos ni licencias médicas en este período mensual.
        </span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { Doughnut } from 'vue-chartjs'
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend,
} from 'chart.js'

ChartJS.register(ArcElement, Tooltip, Legend)

interface AbsenteeismReasonItem {
  motivo: string
  label: string
  color: string
  count: number
  percentage: number
}

const props = defineProps<{
  reasons?: AbsenteeismReasonItem[]
}>()

const hasData = computed(() => {
  return Array.isArray(props.reasons) && props.reasons.length > 0 && props.reasons.some((r) => r.count > 0)
})

const totalEvents = computed(() => {
  return props.reasons?.reduce((sum, r) => sum + (r.count || 0), 0) ?? 0
})

const chartData = computed(() => {
  const items = (props.reasons || []).filter((r) => r.count > 0)
  return {
    labels: items.map((i) => i.label),
    datasets: [
      {
        data: items.map((i) => i.count),
        backgroundColor: items.map((i) => i.color || '#64748b'),
        hoverBackgroundColor: items.map((i) => i.color || '#64748b'),
        borderWidth: 2,
        borderColor: '#ffffff',
      },
    ],
  }
})

const chartOptions = computed(() => ({
  responsive: true,
  maintainAspectRatio: false,
  cutout: '72%',
  plugins: {
    legend: {
      display: false,
    },
    tooltip: {
      backgroundColor: '#0f172a',
      titleColor: '#ffffff',
      bodyColor: '#e2e8f0',
      padding: 10,
      cornerRadius: 8,
      callbacks: {
        label: (context: any) => {
          const items = (props.reasons || []).filter((r) => r.count > 0)
          const item = items[context.dataIndex]
          const pct = item?.percentage ?? 0
          return ` ${context.label}: ${context.raw} eventos (${pct}%)`
        },
      },
    },
  },
}))
</script>

<style scoped lang="scss">
.absenteeism-reasons-card {
  border-radius: 0.875rem;
  background: #ffffff;
  border: 1px solid #e2e8f0 !important;
  overflow: hidden;
}

.card-header {
  background: transparent !important;
}

.header-icon-mini {
  width: 32px;
  height: 32px;
  border-radius: 8px;
  background: #eff6ff;
  display: flex;
  align-items: center;
  justify-content: center;
}

.donut-chart-container {
  width: 165px;
  height: 165px;
}

.donut-center-badge {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  pointer-events: none;
}

.tabular-nums {
  font-variant-numeric: tabular-nums;
  letter-spacing: -0.04em;
}

.tracking-wider {
  letter-spacing: 0.05em;
}

.reasons-legend-list {
  max-height: 220px;
  overflow-y: auto;
}

.reason-legend-item {
  transition: background-color 0.15s ease;

  &:hover {
    background-color: #f8fafc;
  }
}

.legend-color-dot {
  width: 10px;
  height: 10px;
  border-radius: 50%;
}

.empty-icon-circle {
  width: 50px;
  height: 50px;
  border-radius: 50%;
  background: #f0fdf4;
  display: flex;
  align-items: center;
  justify-content: center;
}

.shadow-xs {
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.04);
}

.smaller {
  font-size: 0.725rem;
}
</style>
