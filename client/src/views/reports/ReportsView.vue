<template>
  <div class="page-container">
    <div class="split-layout hide-print">
      <!-- PANEL IZQUIERDO: Contexto -->
      <div class="panel-left">
        <div class="header-context">
          <div class="icon-square bg-white shadow-sm text-primary mb-3">
            <i class="bi bi-file-earmark-bar-graph fs-4"></i>
          </div>
          <h4 class="fw-bold text-dark mb-1">Centro de Reportes</h4>
          <p class="text-secondary small">Explorador del registro históricos</p>
        </div>

        <div class="period-status mt-4">
          <label class="small fw-bold text-secondary mb-2 d-block">ESTADO DEL PERÍODO</label>
          <div class="status-card" :class="periodStore.isClosed ? 'status-closed' : 'status-open'">
            <div class="status-icon">
              <i class="bi" :class="periodStore.isClosed ? 'bi-lock-fill' : 'bi-unlock-fill'"></i>
            </div>
            <div class="status-info">
              <span class="fw-bold">{{
                periodStore.isClosed ? 'Cerrado' : 'Abierto (En curso)'
              }}</span>
            </div>
          </div>
        </div>

        <MonthYearPicker
          v-model:month="month"
          v-model:year="year"
          :months="months"
          :years="years"
        />
      </div>

      <!-- PANEL DERECHO: Acciones (CSS Grid 2 Cards) -->
      <div class="panel-right">
        <!-- Tarjeta: Cartola por Servicio -->
        <div class="action-card">
          <div class="card-header border-0 pb-0">
            <h5 class="fw-bold mb-1">Consulta por Servicio</h5>
            <p class="text-secondary small mb-0">
              Descarga la vista consolidada de todo el personal
            </p>
          </div>
          <div class="card-body">
            <div class="premium-select mb-4">
              <v-select
                v-model="selectedService"
                :options="serviceOptions"
                label="nombre"
                :filterable="true"
                placeholder="Buscar Servicio..."
              >
                <template #option="{ nombre, codigo }">
                  <div>
                    <strong>{{ nombre }}</strong>
                    <small v-if="codigo" class="text-muted ms-2">({{ codigo }})</small>
                  </div>
                </template>
              </v-select>
            </div>

            <div class="d-flex gap-3 justify-content-start">
              <button
                class="btn-action btn-outline"
                :disabled="!selectedServiceId || isExporting === 'excel'"
                @click="downloadExcel"
              >
                <i v-if="isExporting === 'excel'" class="spinner-border spinner-border-sm me-1"></i>
                <span v-else>📊</span>
                {{
                  isExporting === 'excel'
                    ? 'Generando...'
                    : periodStore.isClosed
                    ? 'Descargar Cartola (Excel)'
                    : 'Descargar Avance (Excel)'
                }}
              </button>

              <button
                v-if="periodStore.isClosed"
                class="btn-action btn-primary"
                :disabled="!selectedServiceId || isExporting === 'pdf'"
                @click="downloadServicePDF"
              >
                <i v-if="isExporting === 'pdf'" class="spinner-border spinner-border-sm me-1"></i>
                <i v-else class="bi bi-file-earmark-pdf"></i>
                {{ isExporting === 'pdf' ? 'Obteniendo...' : 'Descargar Cartola (PDF)' }}
              </button>
            </div>
          </div>
        </div>

        <!-- Tarjeta: Consulta Individual -->
        <div class="action-card">
          <div class="card-header border-0 pb-0">
            <h5 class="fw-bold mb-1">Consulta Individual</h5>
            <p class="text-secondary small mb-0">
              Visualiza la cartola detallada de un funcionario
            </p>
          </div>
          <div class="card-body">
            <v-select
              v-model="selectedUser"
              :options="userOptions"
              :filterable="false"
              @search="onSearch"
              :get-option-label="getUserLabel"
              placeholder="Buscar Funcionario (Nombre o RUT)..."
              class="IStaff-search premium-select mb-4"
            >
              <template #option="{ firstName, lastName, rut, positionId }">
                <div class="IStaff-option">
                  <strong>{{ firstName }} {{ lastName }}</strong>
                  <small>{{ rut }} - {{ positionId?.name || 'Sin Cargo' }}</small>
                </div>
              </template>
            </v-select>

            <div class="d-flex gap-3 justify-content-start">
              <button
                class="btn-action btn-outline"
                @click="downloadIndividualExcel"
                :disabled="!selectedUser || isExporting === 'ind-excel'"
              >
                <i
                  v-if="isExporting === 'ind-excel'"
                  class="spinner-border spinner-border-sm me-1"
                ></i>
                <span v-else>📊</span>
                {{
                  isExporting === 'ind-excel'
                    ? 'Generando...'
                    : periodStore.isClosed
                    ? 'Descargar Cartola (Excel)'
                    : 'Descargar Avance (Excel)'
                }}
              </button>

              <button
                class="btn-action"
                :class="periodStore.isClosed ? 'btn-primary' : 'btn-outline'"
                @click="handleGenerateReport"
                :disabled="!selectedUser || isExporting === 'ind-pdf'"
              >
                <i
                  v-if="isExporting === 'ind-pdf'"
                  class="spinner-border spinner-border-sm me-1"
                ></i>
                <i v-else class="bi bi-file-earmark-pdf"></i>
                {{
                  isExporting === 'ind-pdf'
                    ? 'Generando...'
                    : periodStore.isClosed
                    ? 'Descargar Cartola (PDF)'
                    : 'Descargar Avance (PDF)'
                }}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Error/Warning Alert removed in favor of SweetAlert2 -->

    <ReportPrintTemplate
      :report-data="reportStore.reportData"
      :month="month"
      :year="year"
      :months="months"
      :is-open-month="isOpenMonth"
    />
  </div>
</template>

<script setup lang="ts">
import MonthYearPicker from '../../components/reports/MonthYearPicker.vue'
import ReportPrintTemplate from '../../components/reports/ReportPrintTemplate.vue'
import { useReports } from '../../composables/reports/useReports'
import vSelect from 'vue-select'
import 'vue-select/dist/vue-select.css'

const {
  reportStore,
  selectedUser,
  userOptions,
  month,
  year,
  months,
  years,
  onSearch,
  handleGenerateReport,
  downloadIndividualExcel,
  isOpenMonth,
  selectedService,
  selectedServiceId,
  serviceOptions,
  isExporting,
  downloadExcel,
  downloadServicePDF,
  periodStore,
  getUserLabel
} = useReports()
</script>

<style scoped>
.page-container {
  padding: 30px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: calc(80vh - 80px);
}

.split-layout {
  width: 100%;
  max-width: 1200px;
  display: grid;
  grid-template-columns: 320px 1fr;
  gap: 40px; /* Whitespace maximization */
  margin-bottom: 30px;
}

/* Panel Izquierdo */
.panel-left {
  background: linear-gradient(180deg, #f8fafc 0%, #f1f5f9 100%);
  border: 1px solid #e2e8f0;
  border-radius: 16px;
  padding: 32px; /* Más padding para respirar */
  box-shadow: 0 4px 6px -1px rgba(30, 58, 138, 0.04), 0 2px 4px -2px rgba(30, 58, 138, 0.04);
  display: flex;
  flex-direction: column;
  position: relative;
}

/* Typography Upgrades */
.header-context h4 {
  letter-spacing: -0.02em;
}
.date-filters label,
.period-status label {
  letter-spacing: 0.06em;
  text-transform: uppercase;
}

.icon-square {
  width: 56px;
  height: 56px;
  border-radius: 16px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #eff6ff !important;
}

.status-card {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 16px;
  border-radius: 12px;
  transition: all 0.3s ease;
}

/* Status Indicators */
.status-closed {
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  color: #334155;
}
.status-closed .status-icon i {
  color: #64748b;
}

.status-open {
  background: #f0fdf4;
  border: 1px solid #bbf7d0;
  color: #15803d;
}
.status-open .status-icon i {
  color: #22c55e;
}

/* Panel Derecho */
.panel-right {
  display: grid;
  grid-template-columns: 1fr;
  gap: 24px;
}

.action-card {
  background: white;
  border-radius: 16px;
  border: 1px solid #e2e8f0;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  overflow: visible;
}

.action-card .card-header {
  padding: 32px 32px 0;
}

.action-card .card-header h5 {
  letter-spacing: -0.03em;
  font-size: 1.2rem;
  color: #0f172a;
}

.action-card .card-header p {
  color: #64748b !important;
  line-height: 1.5;
}

.action-card .card-body {
  padding: 24px 32px 32px;
}

/* Botones Premium */
.btn-action {
  padding: 12px 24px;
  border-radius: 10px;
  font-weight: 600;
  font-size: 14px;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  transition: all 0.3s ease;
  border: none;
  cursor: pointer;
}

.btn-action:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.btn-action:not(:disabled):active {
  transform: scale(0.97);
}

.btn-primary {
  background: #0f172a;
  color: white;
}
.btn-primary:not(:disabled):hover {
  background: #1e293b;
}

.btn-outline {
  background: white;
  color: #0f172a;
  border: 1px solid #cbd5e1;
}
.btn-outline:not(:disabled):hover {
  background: #f8fafc;
  border-color: #94a3b8;
}

.IStaff-search {
  flex: 1;
  min-width: 300px;
}

.premium-select {
  font-size: 0.95rem;
  max-width: 500px;
}

/* Base style for v-select inner components */
.premium-select :deep(.vs__dropdown-toggle) {
  border: 1px solid #e2e8f0;
  border-radius: 10px;
  padding: 6px 4px;
  transition: all 0.2s ease;
  background: white;
}

/* Search Input */
.premium-select :deep(.vs__search) {
  font-size: 0.875rem;
  color: #1e293b;
}

.premium-select :deep(.vs__search::placeholder) {
  color: #94a3b8;
}

/* Selected Text */
.premium-select :deep(.vs__selected) {
  font-size: 0.875rem;
  color: #1e293b;
}

/* Arrow/Actions */
.premium-select :deep(.vs__actions svg) {
  fill: #64748b;
  transform: scale(0.8);
}

/* Dropdown Menu */
.premium-select :deep(.vs__dropdown-menu) {
  border: 1px solid #e2e8f0;
  border-radius: 0.5rem;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
  padding: 5px;
  font-size: 0.875rem;
  margin-top: 4px;
  z-index: 1000; /* Ensure on top */
}

/* Options */
.premium-select :deep(.vs__dropdown-option) {
  border-radius: 0.25rem;
  padding: 6px 10px;
  margin-bottom: 2px;
  color: #475569;
}

.premium-select :deep(.vs__dropdown-option--highlight) {
  background: #3b82f6;
  color: white;
}

/* Hover & Focus */
.premium-select:hover :deep(.vs__dropdown-toggle) {
  border-color: #cbd5e1;
}

.premium-select :deep(.vs--open .vs__dropdown-toggle),
.premium-select:focus-within :deep(.vs__dropdown-toggle) {
  border-color: #3b82f6;
  box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.1);
}

.date-filters {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.btn-print {
  background: #667eea;
  color: white;
  border: none;
  padding: 0 20px;
  border-radius: 4px;
  cursor: pointer;
  font-weight: 600;
}

.btn-generate:disabled,
.btn-disabled {
  background-color: #94a3b8;
  cursor: not-allowed;
  opacity: 0.8;
}

.btn-icon {
  width: 16px;
  height: 16px;
}

.alert-box {
  padding: 1rem;
  border-radius: 8px;
  margin: 1rem 0;
  font-weight: 500;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  animation: fadeIn 0.3s ease;
}

.alert-box.warning {
  background-color: #fff3cd;
  color: #856404;
  border: 1px solid #ffeeba;
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(-10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
@media screen {
  .page {
    position: absolute;
    left: -9999px;
    top: -9999px;
    opacity: 0;
    pointer-events: none;
  }
}

@media print {
  @page {
    size: letter;
    margin: 1.5cm;
  }

  .page-container {
    padding: 0 !important;
    background: white !important;
    display: block !important;
    min-height: auto !important;
  }

  .controls,
  .btn-print,
  .btn-generate,
  .premium-select,
  .IStaff-search,
  .date-filters {
    display: none !important;
  }

  .report-paper {
    box-shadow: none !important;
    margin: 0 !important;
    padding: 0 !important;
    width: 100% !important;
    max-width: none !important;
    border: none !important;
  }

  /* Ensure header logos and text are visible and clear */
  .header {
    display: flex !important;
    flex-direction: column !important;
    padding-bottom: 20px !important;
  }

  .footer {
    display: flex !important;
    justify-content: space-between !important;
  }

  .header-top {
    display: flex !important;
    justify-content: space-between !important;
    align-items: flex-start !important;
    width: 100% !important;
  }

  .header-title {
    display: block !important;
    width: 100% !important;
    margin-top: 10px !important;
    padding-top: 10px !important;
    border-top: 1px solid rgba(0, 0, 0, 0.1) !important;
  }

  .hospital-info {
    text-align: left !important;
  }

  .report-id {
    text-align: right !important;
  }

  /* Force background graphics for badges */
  * {
    -webkit-print-color-adjust: exact !important;
    print-color-adjust: exact !important;
  }
}

/* === Nuevos Estilos: Períodos, Tabs y Excepciones === */

.period-badge {
  display: inline-flex;
  align-items: center;
  padding: 6px 14px;
  border-radius: 20px;
  font-weight: 600;
  font-size: 0.8rem;
  white-space: nowrap;
}
.badge-open {
  background: #dcfce7;
  color: #15803d;
}
.badge-closed {
  background: #fee2e2;
  color: #b91c1c;
}

.btn-action {
  min-width: 220px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
}

.btn-danger {
  background: #ef4444;
  color: white;
  border: none;
  padding: 8px 16px;
  border-radius: 8px;
  font-weight: 600;
  cursor: pointer;
  font-size: 0.85rem;
  transition: background 0.2s;
}
.btn-danger:hover:not(:disabled) {
  background: #dc2626;
}
.btn-danger:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.btn-danger-sm {
  background: #fca5a5;
  color: #7f1d1d;
  border: none;
  padding: 4px 10px;
  border-radius: 6px;
  font-size: 0.78rem;
  cursor: pointer;
  font-weight: 600;
}
.btn-danger-sm:hover {
  background: #f87171;
}

.btn-seal {
  background: linear-gradient(135deg, #f59e0b, #d97706);
  color: white;
  border: none;
  padding: 8px 16px;
  border-radius: 8px;
  font-weight: 600;
  font-size: 0.85rem;
  cursor: pointer;
  transition: all 0.2s;
}
.btn-seal:hover:not(:disabled) {
  filter: brightness(1.08);
  transform: translateY(-1px);
}
.btn-seal:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.btn-outline {
  background: transparent;
  color: #64748b;
  border: 1px solid #e2e8f0;
  padding: 8px 16px;
  border-radius: 8px;
  font-size: 0.85rem;
  cursor: pointer;
}

.tabs-nav {
  width: 210mm;
  display: flex;
  gap: 4px;
  border-bottom: 2px solid #e2e8f0;
  margin-bottom: 0;
}
.tab-btn {
  background: transparent;
  border: none;
  border-bottom: 2px solid transparent;
  margin-bottom: -2px;
  padding: 10px 18px;
  font-weight: 600;
  font-size: 0.875rem;
  color: #64748b;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 6px;
  transition: color 0.15s, border-color 0.15s;
}
.tab-btn.active {
  color: #4b5ea2;
  border-bottom-color: #4b5ea2;
}
.tab-btn:hover:not(.active) {
  color: #334155;
}

.badge-count {
  background: #ef4444;
  color: white;
  border-radius: 10px;
  padding: 1px 7px;
  font-size: 0.72rem;
}

.tab-content {
  width: 210mm;
  margin-bottom: 16px;
}

.export-card {
  background: white;
  border: 1px solid #e2e8f0;
  border-radius: 10px;
  padding: 24px;
  margin-top: 12px;
}

.controls-inner {
  display: flex;
  gap: 10px;
  align-items: center;
  flex-wrap: wrap;
  padding: 14px 0;
}

.table-exceptions {
  width: 100%;
  border-collapse: collapse;
  font-size: 0.875rem;
}
.table-exceptions th,
.table-exceptions td {
  padding: 10px 12px;
  border-bottom: 1px solid #f1f5f9;
  text-align: left;
}
.table-exceptions thead {
  background: #f8fafc;
}

.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.4);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}
.modal-box {
  background: white;
  border-radius: 12px;
  padding: 28px;
  width: 380px;
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.15);
}
.form-input {
  width: 100%;
  border: 1px solid #e2e8f0;
  border-radius: 6px;
  padding: 8px 12px;
  font-size: 0.875rem;
  margin-top: 12px;
}
.btn-outline-primary {
  background: transparent;
  color: #4b5ea2;
  border: 1.5px solid #4b5ea2;
  padding: 8px 16px;
  border-radius: 8px;
  font-weight: 600;
  font-size: 0.85rem;
  cursor: pointer;
  transition: all 0.2s;
}
.btn-outline-primary:hover:not(:disabled) {
  background: #4b5ea2;
  color: white;
}
.btn-outline-primary:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

@media print {
  .hide-print {
    display: none !important;
  }
}
</style>
