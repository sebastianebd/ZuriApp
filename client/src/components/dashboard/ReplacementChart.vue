<template>
  <div class="card border shadow-xs h-100 replacement-chart-card">
    <div class="card-header bg-transparent border-0 pt-3 pb-0 d-flex justify-content-between align-items-center">
      <div class="d-flex align-items-center gap-2">
        <div class="header-icon-mini text-primary">
          <i class="bi bi-bar-chart-line-fill fs-5"></i>
        </div>
        <h5 class="card-title fw-bold mb-0 text-dark">Evolución y Comparativa de Reemplazos</h5>
      </div>
      <span class="badge bg-light text-secondary border smaller">
        Histórico Mensual
      </span>
    </div>
    <div class="card-body">
      <div v-if="hasData" class="chart-container" style="position: relative; height: 260px;">
        <Bar :data="chartData" :options="chartOptions" />
      </div>
      <div v-else class="d-flex flex-column align-items-center justify-content-center h-100 text-muted p-4">
        <i class="bi bi-graph-up fs-2 mb-2 text-secondary opacity-50"></i>
        <span class="small">Sin datos suficientes para graficar en este período</span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { Bar } from 'vue-chartjs'
import {
  Chart as ChartJS,
  Title,
  Tooltip,
  Legend,
  BarElement,
  CategoryScale,
  LinearScale,
} from 'chart.js'

ChartJS.register(Title, Tooltip, Legend, BarElement, CategoryScale, LinearScale)

const props = defineProps<{
  summary?: {
    totalReplacements: number
    replacementRate: number
    scheduledShiftDays: number
    totalShiftsReplaced: number
  }
  comparative?: {
    previousPeriod: { month: number; year: number }
    replacementsDeltaPct: number | null
  }
}>()

const hasData = computed(() => {
  return (props.summary?.totalReplacements ?? 0) > 0 || (props.summary?.totalShiftsReplaced ?? 0) > 0
})

const monthNames = [
  'Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun',
  'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic',
]

const chartData = computed(() => {
  const prevMonthNum = props.comparative?.previousPeriod?.month
  const prevLabel = prevMonthNum ? monthNames[prevMonthNum - 1] : 'Mes Anterior'
  const currentLabel = 'Mes Actual'

  return {
    labels: [prevLabel, currentLabel],
    datasets: [
      {
        label: 'Total Reemplazos',
        backgroundColor: '#2563eb',
        borderRadius: 6,
        data: [
          props.comparative?.replacementsDeltaPct !== null && props.comparative?.replacementsDeltaPct !== undefined
            ? Math.max(0, Math.round((props.summary?.totalReplacements ?? 0) / (1 + props.comparative.replacementsDeltaPct / 100)))
            : 0,
          props.summary?.totalReplacements ?? 0,
        ],
      },
      {
        label: 'Jornadas Reemplazadas',
        backgroundColor: '#059669',
        borderRadius: 6,
        data: [
          0,
          props.summary?.totalShiftsReplaced ?? 0,
        ],
      },
    ],
  }
})

const chartOptions = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: {
      position: 'bottom' as const,
      labels: {
        usePointStyle: true,
        pointStyle: 'circle' as const,
        boxWidth: 8,
        padding: 16,
        font: {
          family: 'Inter, system-ui, sans-serif',
          size: 12,
          weight: 500,
        },
      },
    },
    tooltip: {
      backgroundColor: '#0f172a',
      titleFont: {
        family: 'Inter, system-ui, sans-serif',
        size: 13,
        weight: 600,
      },
      bodyFont: {
        family: 'Inter, system-ui, sans-serif',
        size: 12,
      },
      padding: 12,
      cornerRadius: 8,
      boxPadding: 4,
    },
  },
  scales: {
    y: {
      beginAtZero: true,
      grid: {
        color: '#f1f5f9',
      },
      ticks: {
        precision: 0,
        font: {
          family: 'Inter, system-ui, sans-serif',
          size: 11,
        },
      },
      border: {
        dash: [4, 4],
      },
    },
    x: {
      grid: {
        display: false,
      },
      ticks: {
        font: {
          family: 'Inter, system-ui, sans-serif',
          size: 12,
          weight: 600,
        },
      },
    },
  },
}
</script>

<style scoped lang="scss">
.replacement-chart-card {
  border-radius: 0.875rem;
  background: #ffffff;
  border: 1px solid #e2e8f0 !important;
  overflow: hidden;
}

.card-header {
  background: transparent !important;
}

.shadow-xs {
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.04);
}

.smaller {
  font-size: 0.75rem;
}
</style>
