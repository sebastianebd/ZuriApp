<template>
  <div class="card shadow-sm border-0 h-100">
    <div class="card-header bg-white border-0 pt-3 pb-0 d-flex justify-content-between align-items-center">
      <div class="d-flex align-items-center gap-2">
        <i class="bi bi-bar-chart text-primary fs-5"></i>
        <h5 class="card-title fw-bold mb-0">Evolución y Comparativa de Reemplazos</h5>
      </div>
    </div>
    <div class="card-body">
      <div v-if="hasData" class="chart-container" style="position: relative; height: 260px;">
        <Bar :data="chartData" :options="chartOptions" />
      </div>
      <div v-else class="d-flex flex-column align-items-center justify-content-center h-100 text-muted p-4">
        <i class="bi bi-graph-up fs-2 mb-2"></i>
        <span class="small">Sin datos suficientes para graficar</span>
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
        backgroundColor: '#3b82f6',
        borderRadius: 4,
        data: [
          props.comparative?.replacementsDeltaPct !== null && props.comparative?.replacementsDeltaPct !== undefined
            ? Math.max(0, Math.round((props.summary?.totalReplacements ?? 0) / (1 + props.comparative.replacementsDeltaPct / 100)))
            : 0,
          props.summary?.totalReplacements ?? 0,
        ],
      },
      {
        label: 'Jornadas Reemplazadas',
        backgroundColor: '#10b981',
        borderRadius: 4,
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
        boxWidth: 12,
        padding: 15,
      },
    },
    tooltip: {
      backgroundColor: '#1e293b',
      padding: 10,
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
      },
    },
    x: {
      grid: {
        display: false,
      },
    },
  },
}
</script>
