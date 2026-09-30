<template>
  <div class="dashboard-view container-fluid py-3 px-4">
    <!-- Header: Selector de Servicio, Filtros y Gobernanza -->
    <div class="d-flex flex-column flex-xl-row justify-content-between align-items-start align-items-xl-center gap-3 mb-4 pb-3 border-bottom executive-header">
      <div>
        <div class="d-flex align-items-center gap-2 mb-1 flex-wrap">
          <h4 class="fw-bold mb-0 text-dark d-flex align-items-center gap-2">
            <i class="bi bi-speedometer2 text-primary"></i>
            Dashboard de Indicadores
          </h4>
          <span v-if="dashboardStore.kpiData" class="badge bg-primary-subtle text-primary border border-primary-subtle px-2.5 py-1 rounded-pill small fw-semibold">
            <i class="bi bi-hospital me-1"></i>{{ dashboardStore.kpiData.service.name }}
          </span>
        </div>
        <p class="text-muted small mb-0">
          Métricas operativas de reemplazos, planificación de turnos y cobertura de dotación en tiempo real.
        </p>
      </div>

      <div class="d-flex flex-wrap align-items-center gap-2 dashboard-command-bar">
        <!-- Selector de Servicio -->
        <div class="service-select-pod shadow-xs">
          <span class="service-prefix-icon">
            <i class="bi bi-hospital"></i>
          </span>
          <v-select
            v-model="dashboardStore.selectedServiceId"
            :options="services"
            label="nombre"
            :reduce="(s: any) => s._id"
            placeholder="Seleccione un servicio..."
            class="custom-v-select service-v-select"
            :clearable="false"
            @update:model-value="onServiceChange"
          >
            <template #no-options>
              <div class="p-2 text-muted small text-center">
                <i class="bi bi-search me-1"></i> Sin resultados
              </div>
            </template>
          </v-select>
        </div>

        <!-- Grupo de Período (Mes + Año) -->
        <div class="period-select-pod shadow-xs">
          <span class="period-prefix-icon">
            <i class="bi bi-calendar3"></i>
          </span>
          <v-select
            v-model="dashboardStore.selectedMonth"
            :options="monthOptions"
            label="label"
            :reduce="(m: any) => m.value"
            :searchable="false"
            :clearable="false"
            class="custom-v-select month-v-select"
            @update:model-value="onMonthChange"
          />
          <span class="period-divider"></span>
          <v-select
            v-model="dashboardStore.selectedYear"
            :options="availableYears"
            :searchable="false"
            :clearable="false"
            class="custom-v-select year-v-select"
            @update:model-value="onYearChange"
          />
        </div>

        <!-- Botón Refrescar -->
        <button
          class="btn btn-sm btn-light border bg-white shadow-xs d-flex align-items-center justify-content-center refresh-btn"
          title="Actualizar datos"
          :disabled="dashboardStore.loading"
          @click="refreshData"
        >
          <i class="bi bi-arrow-clockwise fs-6" :class="{ 'spin-animation': dashboardStore.loading }"></i>
        </button>

        <!-- Botón Ajustar Dotación (Gobernanza Contextual) -->
        <button
          v-if="dashboardStore.kpiData?.service.canEditStaffing"
          class="btn btn-sm btn-primary shadow-xs d-flex align-items-center gap-2 fw-semibold px-3 staffing-btn"
          data-test="btn-edit-staffing"
          @click="dashboardStore.showStaffingModal = true"
        >
          <i class="bi bi-gear-fill"></i>
          <span>Ajustar Dotación</span>
        </button>
      </div>
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

      <!-- 3. Fila Inferior: Motivos de Ausentismo (Dona) vs Top 5 Salientes -->
      <div class="row g-4">
        <div class="col-12 col-lg-5">
          <AbsenteeismReasonsCard
            :reasons="dashboardStore.kpiData.absenteeismReasons"
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
import vSelect from 'vue-select'
import { useDashboardStore } from '../../stores/dashboard.store'
import { getServices } from '../../services/service.service'
import KPICards from '../../components/dashboard/KPICards.vue'
import CoverageGauge from '../../components/dashboard/CoverageGauge.vue'
import EmptyStateCoverage from '../../components/dashboard/EmptyStateCoverage.vue'
import ReplacementChart from '../../components/dashboard/ReplacementChart.vue'
import TopReplacedStaff from '../../components/dashboard/TopReplacedStaff.vue'
import AbsenteeismReasonsCard from '../../components/dashboard/AbsenteeismReasonsCard.vue'
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

const monthOptions = monthNames.map((name, idx) => ({
  label: name,
  value: idx + 1,
}))

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

const onServiceChange = async (serviceId?: string) => {
  const id = serviceId || dashboardStore.selectedServiceId
  if (id) {
    await dashboardStore.setSelectedService(id)
  }
}

const onMonthChange = async (month?: any) => {
  const val = typeof month === 'object' && month !== null ? month.value : month
  if (val) {
    dashboardStore.selectedMonth = Number(val)
  }
  await dashboardStore.fetchKPIs()
}

const onYearChange = async (year?: any) => {
  const val = typeof year === 'object' && year !== null ? year.value : year
  if (val) {
    dashboardStore.selectedYear = Number(val)
  }
  await dashboardStore.fetchKPIs()
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

<style scoped lang="scss">
.dashboard-view {
  min-height: 100vh;
  background-color: #f8fafc;
}

.shadow-xs {
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.04);
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

/* ========================================================
   DROPDOWNS PREMIUM (SERVICIO, MES, AÑO) ESTILO TURNOS
   ======================================================== */
.service-select-pod {
  display: flex;
  align-items: center;
  background: white;
  border: 1px solid #e2e8f0;
  border-radius: 12px;
  padding: 2px 8px 2px 14px;
  min-width: 240px;
  max-width: 320px;
  position: relative;
  z-index: 102;
  transition: border-color 0.2s ease, box-shadow 0.2s ease;

  &:focus-within {
    border-color: #3b82f6;
    box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.12);
  }
}

.service-prefix-icon {
  color: #3b82f6;
  font-size: 1.15rem;
  margin-right: 8px;
  display: flex;
  align-items: center;
}

.service-v-select {
  flex: 1;
}

.period-select-pod {
  display: flex;
  align-items: center;
  background: white;
  border: 1px solid #e2e8f0;
  border-radius: 12px;
  padding: 2px 8px 2px 12px;
  position: relative;
  z-index: 101;
  transition: border-color 0.2s ease, box-shadow 0.2s ease;

  &:focus-within {
    border-color: #3b82f6;
    box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.12);
  }
}

.period-prefix-icon {
  color: #3b82f6;
  font-size: 1.05rem;
  margin-right: 8px;
  display: flex;
  align-items: center;
}

.period-divider {
  width: 1px;
  height: 20px;
  background-color: #e2e8f0;
  margin: 0 6px;
  display: inline-block;
  flex-shrink: 0;
}

.month-v-select {
  min-width: 140px;
}

.year-v-select {
  min-width: 82px;
}

.refresh-btn {
  height: 42px;
  width: 42px;
  border-radius: 12px;
  border-color: #e2e8f0 !important;
  color: #64748b;
  transition: all 0.15s ease;

  &:hover {
    background-color: #f1f5f9 !important;
    color: #1e293b;
    border-color: #cbd5e1 !important;
  }
}

.staffing-btn {
  height: 42px;
  border-radius: 12px;
  font-weight: 600;
  background-color: #2563eb;
  border-color: #2563eb;
  transition: all 0.15s ease;

  &:hover {
    background-color: #1d4ed8;
    border-color: #1d4ed8;
  }
}

/* Reglas compartidas vue-select (idénticas al módulo de Turnos) */
.custom-v-select :deep(.vs__dropdown-toggle) {
  border: none;
  background: transparent;
  padding: 0;
  display: flex;
  align-items: center;
  box-shadow: none;
  min-height: 38px;
  cursor: pointer;
}

.custom-v-select :deep(.vs__selected-options) {
  display: flex;
  align-items: center;
  flex-wrap: nowrap;
  padding: 0;
  margin: 0;
  min-height: 38px;
}

.custom-v-select :deep(.vs__selected) {
  font-size: 0.875rem;
  font-weight: 600;
  color: #0f172a;
  margin: 0;
  padding: 0;
  line-height: 1;
  display: inline-flex;
  align-items: center;
  white-space: nowrap;
}

.custom-v-select :deep(.vs__search) {
  margin: 0;
  padding: 0;
  font-size: 0.85rem;
  line-height: 1;
}

.custom-v-select :deep(.vs__search::placeholder) {
  color: #94a3b8;
  font-size: 0.85rem;
}

.custom-v-select :deep(.vs__actions) {
  padding: 0 4px 0 4px !important;
  margin: 0;
  display: flex;
  align-items: center;
  align-self: center;
  gap: 4px;
}

.custom-v-select :deep(.vs__clear) {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  background: transparent;
  border: none;
  padding: 0 !important;
  margin: 0 !important;
  line-height: 1;
  cursor: pointer;
}

.custom-v-select :deep(.vs__open-indicator) {
  display: block;
  fill: #64748b;
  width: 13px;
  height: 13px;
  transform: none;
  transition: transform 0.2s ease;
}

.custom-v-select.vs--open :deep(.vs__open-indicator) {
  transform: rotate(180deg);
}

.custom-v-select :deep(.vs__dropdown-menu) {
  border: 1px solid #e2e8f0;
  border-radius: 12px;
  box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.12), 0 8px 10px -6px rgba(0, 0, 0, 0.06);
  padding: 6px;
  font-size: 0.875rem;
  max-height: 260px;
  overflow-y: auto;
  z-index: 1060;
  top: calc(100% + 6px);
  min-width: 100%;
  width: max-content;
  max-width: 380px;

  &::-webkit-scrollbar {
    width: 6px;
  }
  &::-webkit-scrollbar-track {
    background: transparent;
  }
  &::-webkit-scrollbar-thumb {
    background-color: #cbd5e1;
    border-radius: 9999px;

    &:hover {
      background-color: #94a3b8;
    }
  }
}

.custom-v-select :deep(.vs__dropdown-option) {
  border-radius: 8px;
  padding: 8px 14px;
  margin-bottom: 2px;
  color: #334155;
  font-weight: 500;
  transition: all 0.15s ease;
  white-space: nowrap;
}

.custom-v-select :deep(.vs__dropdown-option--highlight) {
  background: #3b82f6;
  color: white;
}

@media (max-width: 768px) {
  .service-select-pod,
  .period-select-pod {
    width: 100%;
    max-width: 100%;
  }
}
</style>
