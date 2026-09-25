<template>
  <div class="dashboard-view container-fluid py-3 px-4">
    <!-- Header: Selector de Servicio, Filtros y Gobernanza -->
    <div class="d-flex flex-column flex-md-row justify-content-between align-items-start align-items-md-center gap-3 mb-4 pb-3 border-bottom">
      <div>
        <h4 class="fw-bold mb-1 text-dark d-flex align-items-center gap-2">
          <i class="bi bi-speedometer2 text-primary"></i>
          Dashboard de Indicadores por Servicio
        </h4>
        <p class="text-muted small mb-0">
          Métricas de reemplazos, planificación de turnos y cobertura de dotación en tiempo real.
        </p>
      </div>

      <div class="d-flex flex-wrap align-items-center gap-2">
        <!-- Selector de Servicio -->
        <div class="input-group input-group-sm" style="min-width: 200px;">
          <span class="input-group-text bg-light text-muted border-end-0">
            <i class="bi bi-hospital"></i>
          </span>
          <select
            v-model="dashboardStore.selectedServiceId"
            class="form-select form-select-sm border-start-0 fw-semibold"
            @change="onServiceChange"
          >
            <option value="" disabled>Seleccione un servicio...</option>
            <option v-for="srv in services" :key="srv._id" :value="srv._id">
              {{ srv.nombre }}
            </option>
          </select>
        </div>

        <!-- Selector de Mes -->
        <select
          v-model="dashboardStore.selectedMonth"
          class="form-select form-select-sm"
          style="width: 120px;"
          @change="onDateChange"
        >
          <option v-for="(name, idx) in monthNames" :key="idx" :value="idx + 1">
            {{ name }}
          </option>
        </select>

        <!-- Selector de Año -->
        <select
          v-model="dashboardStore.selectedYear"
          class="form-select form-select-sm"
          style="width: 90px;"
          @change="onDateChange"
        >
          <option v-for="y in availableYears" :key="y" :value="y">
            {{ y }}
          </option>
        </select>

        <!-- Botón Refrescar -->
        <button
          class="btn btn-sm btn-outline-secondary d-flex align-items-center gap-1"
          title="Actualizar datos"
          :disabled="dashboardStore.loading"
          @click="refreshData"
        >
          <i class="bi bi-arrow-clockwise" :class="{ 'spin-animation': dashboardStore.loading }"></i>
        </button>

        <!-- Botón Ajustar Dotación (Gobernanza Contextual) -->
        <button
          v-if="dashboardStore.kpiData?.service.canEditStaffing"
          class="btn btn-sm btn-primary d-flex align-items-center gap-1"
          data-test="btn-edit-staffing"
          @click="dashboardStore.showStaffingModal = true"
        >
          <i class="bi bi-gear-fill"></i>
          <span>Ajustar Dotación</span>
        </button>
      </div>
    </div>

    <!-- Contexto del Servicio Activo -->
    <div class="mb-3" v-if="dashboardStore.kpiData">
      <span class="small text-muted">
        Servicio activo: <strong class="text-dark">{{ dashboardStore.kpiData.service.name }}</strong>
      </span>
    </div>

    <!-- Error Banner -->
    <div v-if="dashboardStore.error" class="alert alert-danger py-2 px-3 mb-3 small d-flex align-items-center gap-2">
      <i class="bi bi-exclamation-triangle-fill"></i>
      <span>{{ dashboardStore.error }}</span>
    </div>

    <!-- Loading State -->
    <div v-if="dashboardStore.loading && !dashboardStore.kpiData" class="text-center py-5">
      <div class="spinner-border text-primary" role="status">
        <span class="visually-hidden">Cargando indicadores...</span>
      </div>
      <p class="text-muted small mt-2">Calculando indicadores del servicio...</p>
    </div>

    <!-- Main Content -->
    <div v-else-if="dashboardStore.kpiData" class="d-flex flex-column gap-4">
      <!-- 1. Fila de Tarjetas de Resumen Ejecutivo -->
      <KPICards
        :summary="dashboardStore.kpiData.summary"
        :comparative="dashboardStore.kpiData.comparative"
      />

      <!-- 2. Fila Media: Cobertura vs Gráfico de Reemplazos -->
      <div class="row g-4">
        <div class="col-12 col-lg-6">
          <CoverageGauge
            v-if="dashboardStore.kpiData.coverage.configured"
            :coverage="dashboardStore.kpiData.coverage"
            :can-edit-staffing="dashboardStore.kpiData.service.canEditStaffing"
            @open-staffing-modal="dashboardStore.showStaffingModal = true"
          />
          <EmptyStateCoverage
            v-else
            :can-edit-staffing="dashboardStore.kpiData.service.canEditStaffing"
            @open-staffing-modal="dashboardStore.showStaffingModal = true"
          />
        </div>

        <div class="col-12 col-lg-6">
          <ReplacementChart
            :summary="dashboardStore.kpiData.summary"
            :comparative="dashboardStore.kpiData.comparative"
          />
        </div>
      </div>

      <!-- 3. Fila Inferior: Horas Diurnas/Nocturnas vs Top 5 Salientes -->
      <div class="row g-4">
        <div class="col-12 col-lg-5">
          <HoursBreakdownCard
            :hours-breakdown="dashboardStore.kpiData.hoursBreakdown"
          />
        </div>

        <div class="col-12 col-lg-7">
          <TopReplacedStaff
            :staff-list="dashboardStore.kpiData.topReplacedStaff"
          />
        </div>
      </div>
    </div>

    <!-- Modal de Ajuste de Dotación y Metas -->
    <ServiceStaffingModal
      :show="dashboardStore.showStaffingModal"
      :service-id="dashboardStore.kpiData?.service.id"
      :service-name="dashboardStore.kpiData?.service.name"
      :current-staffing="dashboardStore.kpiData?.coverage.byPosition"
      :current-thresholds="dashboardStore.kpiData?.coverage.thresholds"
      :loading="dashboardStore.loading"
      @close="dashboardStore.showStaffingModal = false"
      @save="onSaveStaffing"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import { useDashboardStore } from '../../stores/dashboard.store'
import { getServices } from '../../services/service.service'
import KPICards from '../../components/dashboard/KPICards.vue'
import CoverageGauge from '../../components/dashboard/CoverageGauge.vue'
import EmptyStateCoverage from '../../components/dashboard/EmptyStateCoverage.vue'
import ReplacementChart from '../../components/dashboard/ReplacementChart.vue'
import TopReplacedStaff from '../../components/dashboard/TopReplacedStaff.vue'
import HoursBreakdownCard from '../../components/dashboard/HoursBreakdownCard.vue'
import ServiceStaffingModal from '../../components/dashboard/ServiceStaffingModal.vue'
import type { UpdateServiceStaffingPayload } from '../../types/dashboard.types'

const dashboardStore = useDashboardStore()
const services = ref<Array<{ _id: string; nombre: string }>>([])

const monthNames = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre',
]

const currentYear = new Date().getFullYear()
const availableYears = [currentYear - 2, currentYear - 1, currentYear, currentYear + 1]

onMounted(async () => {
  dashboardStore.initSocketListeners()

  const preferred = localStorage.getItem('zuriapp_preferred_service')
  if (preferred) {
    dashboardStore.setSelectedService(preferred)
  }

  try {
    const list = await getServices()
    if (Array.isArray(list)) {
      services.value = list
      if (!preferred && services.value.length > 0) {
        await dashboardStore.setSelectedService(services.value[0]._id)
      }
    }
  } catch (e) {
    console.error('Error fetching service list:', e)
  }
})

onUnmounted(() => {
  dashboardStore.removeSocketListeners()
})

const onServiceChange = async () => {
  if (dashboardStore.selectedServiceId) {
    await dashboardStore.setSelectedService(dashboardStore.selectedServiceId)
  }
}

const onDateChange = async () => {
  await dashboardStore.fetchKPIs()
}

const refreshData = async () => {
  await dashboardStore.fetchKPIs(undefined, undefined, undefined, true)
}

const onSaveStaffing = async (payload: UpdateServiceStaffingPayload) => {
  await dashboardStore.saveStaffing(payload)
}
</script>

<style scoped>
.dashboard-view {
  min-height: 100vh;
  background-color: #f8fafc;
}

.spin-animation {
  animation: spin 1s linear infinite;
}

@keyframes spin {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}
</style>
