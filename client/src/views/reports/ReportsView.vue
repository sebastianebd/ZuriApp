<script setup lang="ts">
import { ref, watch, onMounted } from 'vue'
import { useReportStore } from '../../stores/report.store'
import { useUserStore } from '../../stores/user.store'
import vSelect from 'vue-select'
import 'vue-select/dist/vue-select.css'
import { debounce } from 'lodash-es'

const reportStore = useReportStore()
const userStore = useUserStore()

const selectedUser = ref<any>(null)
const userOptions = ref<any[]>([]) // Local options for autocomplete
const month = ref(1)
const year = ref(2026)

// 🚀 Debounced Search with Lodash (300ms)
const performSearch = debounce(async (search: string, loading: (l: boolean) => void) => {
  try {
    const results = await userStore.buscarUsuarios(search)
    userOptions.value = results
  } catch (e) {
    console.error(e)
  } finally {
    loading(false)
  }
}, 300)

const onSearch = (search: string, loading: (l: boolean) => void) => {
  if (search.length < 1) return

  // 1. Immediate UI Feedback
  loading(true)

  // 2. Debounced API Call
  performSearch(search, loading)
}

const months = [
  'Enero',
  'Febrero',
  'Marzo',
  'Abril',
  'Mayo',
  'Junio',
  'Julio',
  'Agosto',
  'Septiembre',
  'Octubre',
  'Noviembre',
  'Diciembre'
]
const monthOptions = months.map((m, i) => ({ label: m, value: i + 1 }))

const years = [2024, 2025, 2026]

// Fetch users for the dropdown (Load default top 20)
onMounted(async () => {
  const defaults = await userStore.buscarUsuarios('')
  userOptions.value = defaults
})

// Explicit Report Generation Handler
// Watchers to clear report when filters change
watch([month, year, selectedUser], () => {
  reportStore.reportData = null
  reportStore.error = null // Also clear errors
})

const handleGenerateReport = async () => {
  if (!selectedUser.value) return

  // Update store filters explicitely
  reportStore.currentFilters.userId = selectedUser.value._id
  reportStore.currentFilters.month = month.value
  reportStore.currentFilters.year = year.value

  await reportStore.fetchReportSummary()
}

const getServiceBadgeClass = (serviceName: string) => {
  const lower = serviceName.toLowerCase()
  if (lower.includes('urgencia')) return 'badge-urgencias'
  if (lower.includes('uci')) return 'badge-uci'
  if (lower.includes('pediatria')) return 'badge-pediatria'
  if (lower.includes('cirugia')) return 'badge-cirugia'
  return 'badge-default'
}

const getShiftClass = (sigla: string) => {
  if (sigla === 'L' || sigla === 'LARGO') return 'shift-diurno'
  if (sigla === 'N' || sigla === 'NOCHE') return 'shift-nocturno'
  if (sigla === 'X' || sigla === 'LIBRE') return 'shift-libre'
  return ''
}

// Helper to format date dd/mm/yyyy
const formatDate = (dateStr: string | Date) => {
  const d = new Date(dateStr)
  const day = String(d.getDate()).padStart(2, '0')
  const mn = String(d.getMonth() + 1).padStart(2, '0')
  const yr = d.getFullYear()
  return `${day}/${mn}/${yr}`
}

// Helper specifically for backend dates (UTC) to avoid timezone shift
const formatReportDate = (dateStr: string | Date) => {
  const d = new Date(dateStr)
  const day = String(d.getUTCDate()).padStart(2, '0')
  const mn = String(d.getUTCMonth() + 1).padStart(2, '0')
  const yr = d.getUTCFullYear()
  return `${day}/${mn}/${yr}`
}

const downloadPDF = () => {
  const originalTitle = document.title

  if (selectedUser.value && reportStore.reportData) {
    const monthName = months[month.value - 1]
    const fullName = `${selectedUser.value.nombre}_${selectedUser.value.apellido}`.replace(
      /\s+/g,
      '_'
    )
    document.title = `Reporte_${monthName}_${year.value}_${fullName}`
  }

  window.print()
  document.title = originalTitle
}

const getUserLabel = (option: any) => {
  return `${option.nombre} ${option.apellido}`
}
</script>

<template>
  <div class="page-container">
    <!-- Controls (Screen Only) -->
    <div class="controls hide-print">
      <v-select
        v-model="selectedUser"
        :options="userOptions"
        :filterable="false"
        @search="onSearch"
        :get-option-label="getUserLabel"
        placeholder="Buscar Funcionario (Nombre o RUT)..."
        class="user-search premium-select"
      >
        <template #option="{ nombre, apellido, rut, tipo_cargo }">
          <div class="user-option">
            <strong>{{ nombre }} {{ apellido }}</strong>
            <small>{{ rut }} - {{ tipo_cargo }}</small>
          </div>
        </template>
      </v-select>

      <!-- Date Filters -->
      <div class="date-filters">
        <div class="premium-select" style="min-width: 140px">
          <v-select
            v-model="month"
            :options="monthOptions"
            :reduce="(opt: any) => opt.value"
            label="label"
            :clearable="false"
            :searchable="false"
          ></v-select>
        </div>

        <div class="premium-select" style="min-width: 100px">
          <v-select
            v-model="year"
            :options="years"
            :clearable="false"
            :searchable="false"
          ></v-select>
        </div>

        <button
          v-if="!reportStore.reportData"
          class="btn-generate"
          @click="handleGenerateReport"
          :disabled="!selectedUser"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            class="btn-icon"
            viewBox="0 0 20 20"
            fill="currentColor"
          >
            <path
              fill-rule="evenodd"
              d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-11a1 1 0 10-2 0v2H7a1 1 0 100 2h2v2a1 1 0 102 0v-2h2a1 1 0 100-2h-2V7z"
              clip-rule="evenodd"
            />
          </svg>
          GENERAR REPORTE
        </button>
      </div>

      <button @click="downloadPDF" class="btn-print" v-if="reportStore.reportData">
        🖨️ Imprimir / PDF
      </button>
    </div>

    <!-- Error/Warning Alert -->
    <div v-if="reportStore.error" class="alert-box warning">⚠️ {{ reportStore.error }}</div>

    <div v-if="reportStore.reportData" class="page">
      <!-- Header -->
      <div class="header">
        <div class="header-top">
          <div class="hospital-info">
            <h1>🏥 Hospital Base San Jose de Osorno</h1>
            <p>Sistema de Gestión de Turnos y Reemplazos</p>
            <p>Departamento de Recursos Humanos</p>
          </div>
          <div class="report-id">
            <strong
              >REPORTE #{{ year }}-{{ month }}-{{
                String(reportStore.reportData.user.rut).slice(-4)
              }}</strong
            >
            <p>Fecha emisión: {{ formatDate(new Date()) }}</p>
          </div>
        </div>
        <div class="header-title">
          <h2>Informe de Turnos y Horas Trabajadas</h2>
          <p>Período: {{ months[month - 1] }} {{ year }}</p>
        </div>
      </div>

      <!-- Content -->
      <div class="content">
        <!-- Employee Info -->
        <div class="employee-card">
          <div class="employee-grid">
            <div class="employee-item">
              <label>Funcionario</label>
              <span class="value-text"
                >{{ reportStore.reportData.user.nombre }}
                {{ reportStore.reportData.user.apellido }}</span
              >
            </div>
            <div class="employee-item">
              <label>RUT</label>
              <span class="value-text">{{ reportStore.reportData.user.rut }}</span>
            </div>
            <div class="employee-item">
              <label>Cargo</label>
              <span class="value-text">{{ reportStore.reportData.user.cargo }}</span>
            </div>
            <div class="employee-item">
              <label>Servicio Principal</label>
              <span class="value-text">{{
                reportStore.reportData.serviceStats[0]?.serviceName || 'N/A'
              }}</span>
            </div>
            <div class="employee-item">
              <label>Antigüedad</label>
              <span class="value-text">{{ reportStore.reportData.user.antiguedad }}</span>
            </div>
            <div class="employee-item">
              <label>Período Analizado</label>
              <label>Período Analizado</label>
              <span class="value-text"
                >01/{{ String(month).padStart(2, '0') }}/{{ year }} -
                {{ new Date(year, month, 0).getDate() }}/{{ String(month).padStart(2, '0') }}/{{
                  year
                }}</span
              >
            </div>
          </div>
        </div>

        <!-- Summary Section -->
        <div class="summary-section">
          <div class="section-title">📊 Resumen General del Período</div>
          <div class="summary-grid">
            <div class="summary-card">
              <div class="icon">
                <!-- Calendar Check (Work Days) -->
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  stroke-width="2"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  class="feather feather-calendar"
                >
                  <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
                  <line x1="16" y1="2" x2="16" y2="6"></line>
                  <line x1="8" y1="2" x2="8" y2="6"></line>
                  <line x1="3" y1="10" x2="21" y2="10"></line>
                  <path d="M9 16l2 2 4-4"></path>
                </svg>
              </div>
              <div class="value">{{ reportStore.reportData.totals.daysWorked }}</div>
              <div class="label">Días Trabajados</div>
            </div>
            <div class="summary-card">
              <div class="icon">
                <!-- Clock (Total Hours) -->
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  stroke-width="2"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  class="feather feather-clock"
                >
                  <circle cx="12" cy="12" r="10"></circle>
                  <polyline points="12 6 12 12 16 14"></polyline>
                </svg>
              </div>
              <div class="value">{{ reportStore.reportData.totals.hours }}</div>
              <div class="label">Horas Totales</div>
            </div>
            <div class="summary-card">
              <div class="icon">
                <!-- Sun (Day Hours) -->
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  stroke-width="2"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  class="feather feather-sun"
                >
                  <circle cx="12" cy="12" r="5"></circle>
                  <line x1="12" y1="1" x2="12" y2="3"></line>
                  <line x1="12" y1="21" x2="12" y2="23"></line>
                  <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line>
                  <line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line>
                  <line x1="1" y1="12" x2="3" y2="12"></line>
                  <line x1="21" y1="12" x2="23" y2="12"></line>
                  <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"></line>
                  <line x1="18.36" y1="5.64" x2="19.78" y2="4.22"></line>
                </svg>
              </div>
              <div class="value">{{ reportStore.reportData.totals.dayHours }}</div>
              <div class="label">Horas Diurnas</div>
            </div>
            <div class="summary-card">
              <div class="icon">
                <!-- Moon (Night Hours) -->
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  stroke-width="2"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  class="feather feather-moon"
                >
                  <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path>
                </svg>
              </div>
              <div class="value">{{ reportStore.reportData.totals.nightHours }}</div>
              <div class="label">Horas Nocturnas</div>
            </div>
          </div>

          <div class="summary-grid">
            <div class="summary-card">
              <div class="icon">
                <!-- Coffee (Free Days) -->
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  stroke-width="2"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  class="feather feather-coffee"
                >
                  <path d="M18 8h1a4 4 0 0 1 0 8h-1"></path>
                  <path d="M2 8h16v9a4 4 0 0 1-4 4H6a4 4 0 0 1-4-4V8z"></path>
                  <line x1="6" y1="1" x2="6" y2="4"></line>
                  <line x1="10" y1="1" x2="10" y2="4"></line>
                  <line x1="14" y1="1" x2="14" y2="4"></line>
                </svg>
              </div>
              <div class="value">{{ reportStore.reportData.totals.freeDays }}</div>
              <div class="label">Días Libres</div>
            </div>
            <div class="summary-card">
              <div class="icon">
                <!-- Repeat/Refresh (Replacements) -->
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  stroke-width="2"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  class="feather feather-users"
                >
                  <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
                  <circle cx="9" cy="7" r="4"></circle>
                  <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
                  <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
                </svg>
              </div>
              <div class="value">{{ reportStore.reportData.totals.replacementsCount }}</div>
              <div class="label">Reemplazos</div>
            </div>
            <div class="summary-card">
              <div class="icon">
                <!-- Activity/Briefcase (Services) -->
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  stroke-width="2"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  class="feather feather-activity"
                >
                  <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"></polyline>
                </svg>
              </div>
              <div class="value">{{ reportStore.reportData.serviceStats.length }}</div>
              <div class="label">Servicios</div>
            </div>
            <div class="summary-card">
              <div class="icon">
                <!-- Percent/Chart (Attendance) -->
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  stroke-width="2"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  class="feather feather-pie-chart"
                >
                  <path d="M21.21 15.89A10 10 0 1 1 8 2.83"></path>
                  <path d="M22 12A10 10 0 0 0 12 2v10z"></path>
                </svg>
              </div>
              <div class="value">
                {{
                  Math.round(
                    (reportStore.reportData.totals.daysWorked /
                      reportStore.reportData.timeline.length) *
                      100
                  )
                }}%
              </div>
              <div class="label">Asistencia</div>
            </div>
          </div>
        </div>

        <!-- Charts -->
        <div class="charts-grid">
          <div class="chart-card">
            <div class="chart-title">📈 Distribución de Horas por Servicio</div>
            <div class="bar-chart">
              <div
                v-for="svc in reportStore.reportData.serviceStats"
                :key="svc.serviceName"
                class="bar-item"
              >
                <div class="bar-label">{{ svc.serviceName }}</div>
                <div class="bar-track">
                  <div
                    class="bar-fill"
                    :style="{
                      width: (svc.stats.hours / reportStore.reportData.totals.hours) * 100 + '%'
                    }"
                  >
                    {{ svc.stats.hours }} hrs
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div class="chart-card">
            <div class="chart-title">📋 Desglose por Tipo de Turno</div>
            <ul class="stats-list">
              <li>
                <span>Turnos Largos (L)</span>
                <span class="stat-value">{{ reportStore.reportData.totals.L }} turnos</span>
              </li>
              <li>
                <span>Turnos Noche (N)</span>
                <span class="stat-value">{{ reportStore.reportData.totals.N }} turnos</span>
              </li>
              <li>
                <span>Días Libres (X)</span>
                <span class="stat-value">{{ reportStore.reportData.totals.X }} días</span>
              </li>
            </ul>
          </div>
        </div>

        <!-- Detailed Table -->
        <div class="section-title">📋 Detalle de Turnos del Período</div>
        <table>
          <thead>
            <tr>
              <th>Fecha</th>
              <th>Servicio</th>
              <th>Tipo Turno</th>
              <th class="center">Sigla</th>
              <th class="center">Entrada</th>
              <th class="center">Salida</th>
              <th class="center">Hrs Diurnas</th>
              <th class="center">Hrs Nocturnas</th>
              <th class="center">Total Hrs</th>
            </tr>
          </thead>
          <tbody>
            <template v-for="day in reportStore.reportData.timeline" :key="day.dayNum">
              <template v-if="!day.isOutOfContract">
                <tr
                  v-if="
                    day.items.length === 0 ||
                    (day.items.length === 1 && ['X', 'LIBRE'].includes(day.items[0].sigla))
                  "
                >
                  <td>{{ formatReportDate(day.date) }}</td>
                  <td colspan="8" style="text-align: center; color: #10b981; font-weight: 600">
                    <span class="shift-type shift-libre">DÍA LIBRE</span>
                  </td>
                </tr>

                <template v-else>
                  <tr v-for="(item, idx) in day.items" :key="idx">
                    <td>{{ formatReportDate(day.date) }}</td>
                    <td>
                      <span class="service-badge" :class="getServiceBadgeClass(item.service)">{{
                        item.service
                      }}</span>
                    </td>
                    <td>
                      <span class="shift-type" :class="getShiftClass(item.sigla)">
                        {{
                          item.sigla === 'L'
                            ? 'Diurno'
                            : item.sigla === 'N'
                            ? 'Nocturno'
                            : item.sigla
                        }}
                        <span v-if="item.isReplacement" class="text-xs text-gray-500"
                          >(Reemplazo)</span
                        >
                      </span>
                    </td>
                    <td class="center">{{ item.sigla }}</td>
                    <td class="center">{{ item.startTime }}</td>
                    <td class="center">{{ item.endTime }}</td>
                    <td class="center">{{ item.dayHrs }}</td>
                    <td class="center">{{ item.nightHrs }}</td>
                    <td class="center">
                      <strong>{{ item.hours }}</strong>
                    </td>
                  </tr>
                </template>
              </template>
            </template>

            <tr style="background: #f0f7ff; font-weight: 600">
              <td colspan="6" style="text-align: right; padding-right: 15px">
                TOTALES DEL PERÍODO:
              </td>
              <td class="center">{{ reportStore.reportData.totals.dayHours }}</td>
              <td class="center">{{ reportStore.reportData.totals.nightHours }}</td>
              <td class="center">
                <strong>{{ reportStore.reportData.totals.hours }}</strong>
              </td>
            </tr>
          </tbody>
        </table>

        <div class="signature-section"></div>
      </div>

      <!-- Footer -->
      <div class="footer">
        <div>
          <strong>Hospital Base San Jose de Osorno</strong><br />
          ZuriApp Sistema de Turnos y Reemplazos | Generado automáticamente
        </div>
      </div>
    </div>

    <div v-else class="empty-state">
      <p class="text-secondary">Seleccione un funcionario para generar su cartola.</p>
    </div>
  </div>
</template>

<style scoped>
.page-container {
  background: #f8fafc;
  padding: 20px;
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  align-items: center;
}

.controls {
  width: 210mm;
  margin-bottom: 20px;
  display: flex;
  gap: 10px;
  justify-content: space-between;
}

/* Premium Input Container (v-select) */
/* Premium Input Container (v-select) - Matched to UserModalCreate */
/* Premium Input Container (v-select) - Matched to UserModalCreate */
.user-search {
  flex: 1;
  min-width: 300px;
}

/* Base Styles for Premium Selects (User Search + Dates) */
.premium-select ::v-deep .vs__dropdown-toggle {
  border: 1px solid #e2e8f0;
  border-radius: 0.375rem;
  padding: 3px;
  background: white;
  box-shadow: none;
  transition: all 0.2s ease;
  min-height: 42px;
}

/* Search Input */
.premium-select ::v-deep .vs__search {
  font-size: 0.875rem;
  color: #1e293b;
}

.premium-select ::v-deep .vs__search::placeholder {
  color: #94a3b8;
}

/* Selected Text */
.premium-select ::v-deep .vs__selected {
  font-size: 0.875rem;
  color: #1e293b;
}

/* Arrow/Actions */
.premium-select ::v-deep .vs__actions svg {
  fill: #64748b;
  transform: scale(0.8);
}

/* Dropdown Menu */
.premium-select ::v-deep .vs__dropdown-menu {
  border: 1px solid #e2e8f0;
  border-radius: 0.5rem;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
  padding: 5px;
  font-size: 0.875rem;
  margin-top: 4px;
  z-index: 1000; /* Ensure on top */
}

/* Options */
.premium-select ::v-deep .vs__dropdown-option {
  border-radius: 0.25rem;
  padding: 6px 10px;
  margin-bottom: 2px;
  color: #475569;
}

.premium-select ::v-deep .vs__dropdown-option--highlight {
  background: #3b82f6;
  color: white;
}

/* Hover & Focus */
.premium-select:hover ::v-deep .vs__dropdown-toggle {
  border-color: #cbd5e1;
}

.premium-select ::v-deep .vs--open .vs__dropdown-toggle,
.premium-select:focus-within ::v-deep .vs__dropdown-toggle {
  border-color: #3b82f6;
  box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.1);
}

.date-filters {
  display: flex;
  gap: 10px;
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

.page {
  background: white;
  width: 210mm;
  min-height: 297mm;
  margin: 0 auto;
  box-shadow: 0 0 10px rgba(0, 0, 0, 0.1);
  position: relative;
  font-family: 'Segoe UI', Arial, sans-serif;
  color: #333;
}

/* Header */
.header {
  background: linear-gradient(135deg, #667eea 0%, #4b5ea2 100%);
  padding: 30px 40px;
  color: white;
}

.header-top {
  display: flex;
  justify-content: space-between;
  align-items: start;
  margin-bottom: 20px;
}

.hospital-info h1 {
  font-size: 24px;
  margin-bottom: 5px;
  font-weight: bold;
}

.hospital-info p {
  font-size: 12px;
  opacity: 0.9;
  margin: 0;
}

.report-id {
  text-align: right;
  font-size: 11px;
}

.report-id strong {
  display: block;
  font-size: 14px;
  margin-bottom: 3px;
}
.report-id p {
  margin: 0;
}

.header-title {
  border-top: 1px solid rgba(255, 255, 255, 0.3);
  padding-top: 15px;
}

.header-title h2 {
  font-size: 20px;
  margin-bottom: 5px;
  font-weight: bold;
}

.header-title p {
  font-size: 13px;
  opacity: 0.9;
}

/* Content */
.content {
  padding: 30px 40px;
}

/* Employee Info Card */
.employee-card {
  background: linear-gradient(135deg, #e0e7ff 0%, #a9baf9 100%);
  border-left: 4px solid #667eea;
  padding: 20px;
  border-radius: 8px;
  margin-bottom: 25px;
}

.employee-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 15px;
}

.employee-item label {
  display: block;
  font-size: 11px;
  color: #666;
  margin-bottom: 3px;
  font-weight: 600;
  text-transform: uppercase;
}

.employee-item .value-text {
  display: block;
  font-size: 14px;
  color: #333;
  font-weight: 600;
}

/* Summary Cards */
.summary-section {
  margin-bottom: 30px;
}

.section-title {
  font-size: 16px;
  font-weight: 700;
  color: #333;
  margin-bottom: 15px;
  padding-bottom: 8px;
  border-bottom: 2px solid #667eea;
  display: flex;
  align-items: center;
  gap: 8px;
}

.summary-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 15px;
  margin-bottom: 20px;
}

.summary-card {
  background: white;
  border: 2px solid #e0e0e0;
  border-radius: 8px;
  padding: 15px;
  text-align: center;
  transition: all 0.3s;
}

.summary-card .icon {
  font-size: 24px;
  margin-bottom: 8px;
  color: #667eea;
}

.summary-card .value {
  font-size: 28px;
  font-weight: 700;
  color: #667eea;
  margin-bottom: 5px;
}

.summary-card .label {
  font-size: 11px;
  color: #666;
  font-weight: 600;
  text-transform: uppercase;
}

/* Table */
table {
  width: 100%;
  border-collapse: collapse;
  margin-bottom: 0px;
  font-size: 12px;
}

thead {
  background: linear-gradient(135deg, #8194ea 0%, #4b5ea2 100%);
  color: white;
}

th {
  padding: 12px 10px;
  text-align: left;
  font-weight: 600;
  font-size: 11px;
  text-transform: uppercase;
}

th.center,
td.center {
  text-align: center;
}

tbody tr {
  border-bottom: 1px solid #e0e0e0;
}

td {
  padding: 12px 10px;
}

.service-badge {
  display: inline-block;
  padding: 4px 10px;
  border-radius: 12px;
  font-size: 11px;
  font-weight: 600;
  background: #eaeaea;
}

.shift-type {
  font-weight: 600;
}

.shift-diurno {
  color: #f59e0b;
}
.shift-nocturno {
  color: #6366f1;
}
.shift-libre {
  color: #10b981;
}

/* Charts Section */
.charts-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 20px;
  margin-bottom: 25px;
}

.chart-card {
  background: white;
  border: 2px solid #e0e0e0;
  border-radius: 8px;
  padding: 20px;
}

.chart-title {
  font-size: 14px;
  font-weight: 600;
  margin-bottom: 15px;
  color: #333;
}

.bar-chart {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.bar-item {
  display: flex;
  align-items: center;
  gap: 10px;
}

.bar-label {
  min-width: 80px;
  font-size: 11px;
  font-weight: 600;
}

.bar-track {
  flex: 1;
  height: 24px;
  background: #f0f0f0;
  border-radius: 12px;
  overflow: hidden;
  position: relative;
}

.bar-fill {
  height: 100%;
  background: linear-gradient(90deg, #6c83eb 0%, #384fa2 100%);
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: flex-end;
  padding-right: 8px;
  color: white;
  font-size: 11px;
  font-weight: 600;
}

.stats-list {
  list-style: none;
  padding: 0;
  margin: 0;
}

.stats-list li {
  display: flex;
  justify-content: space-between;
  padding: 10px 0;
  border-bottom: 1px solid #f0f0f0;
  font-size: 13px;
}

.stats-list li:last-child {
  border-bottom: none;
}

.stats-list .stat-value {
  font-weight: 700;
  color: #667eea;
}

/* Footer */
.footer {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  background: #f8f9fa;
  padding: 15px 40px;
  border-top: 2px solid #e0e0e0;
  font-size: 10px;
  color: #666;
  display: flex;
  justify-content: space-between;
}

.signature-section {
  padding-top: 20px;
  margin-top: 40px;
  border-top: 2px solid #e0e0e0;
}

.signatures {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 40px;
  margin-top: 60px;
}

.signature-box {
  text-align: center;
}

.signature-line {
  border-top: 2px solid #333;
  margin-bottom: 8px;
}

.signature-label {
  font-size: 11px;
  color: #666;
  font-weight: 600;
}

.user-option {
  display: flex;
  flex-direction: column;
  padding: 2px 0;
}

@media print {
  .hide-print {
    display: none !important;
  }
  .page-container {
    padding: 0;
    background: white;
  }
  .page {
    box-shadow: none;
    margin: 0;
  }
}

/* Premium Generate Button */
.btn-generate {
  background: linear-gradient(135deg, hsl(222, 47%, 55%) 0%, hsl(222, 47%, 50%) 100%);
  color: white;
  border: none;
  padding: 0.65rem 1.75rem;
  border-radius: 8px;
  cursor: pointer;
  font-weight: 600;
  font-size: 0.85rem;
  box-shadow: 0 4px 6px -1px rgba(102, 126, 234, 0.25), 0 2px 4px -1px rgba(102, 126, 234, 0.15);
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  letter-spacing: 0.05em;
  text-transform: uppercase;
}

.btn-generate:hover:not(:disabled) {
  background: linear-gradient(135deg, hsl(222, 47%, 60%) 0%, hsl(222, 47%, 52%) 100%);
  box-shadow: 0 10px 15px -3px rgba(102, 126, 234, 0.35), 0 4px 6px -2px rgba(102, 126, 234, 0.2);
  transform: translateY(-2px);
}

.btn-generate:active:not(:disabled) {
  transform: translateY(0);
  box-shadow: 0 2px 4px -1px rgba(102, 126, 234, 0.2);
}

.btn-generate:disabled {
  background: #e2e8f0;
  color: #94a3b8;
  cursor: not-allowed;
  box-shadow: none;
  transform: none;
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
@media print {
  @page {
    margin: 5mm; /* Small margin for content */
    size: auto;
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
  .user-search,
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
</style>
