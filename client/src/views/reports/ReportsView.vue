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

        <div class="date-filters mt-auto">
          <!-- Label con el periodo actualmente seleccionado (Arriba del botón) -->
          <div class="mb-3">
            <label class="small fw-bold text-secondary mb-1 d-block">PERÍODO SELECCIONADO</label>
            <div class="fs-5 fw-bold" style="color: #0f172a; text-transform: capitalize">
              {{ formattedSelectedPeriod }}
            </div>
          </div>

          <!-- Botón "Buscar por fecha" -->
          <div class="premium-month-picker position-relative w-100" ref="pickerRef">
            <button class="btn-bank-outline w-100" @click="togglePicker">
              <div class="d-flex align-items-center justify-content-center gap-2">
                <i class="bi bi-calendar3"></i>
                <span>Buscar por fecha</span>
              </div>
            </button>

            <!-- Custom Popover -->
            <div v-if="isPickerOpen" class="custom-picker-popover">
              <!-- Header -->
              <div class="picker-header d-flex justify-content-between align-items-center mb-3">
                <span class="fw-bold" style="color: #475569; font-size: 1rem">
                  {{
                    pickerMode === 'years' ? `${years[0]} - ${years[years.length - 1]}` : tempYear
                  }}
                </span>
                <div class="d-flex gap-1">
                  <button
                    v-if="pickerMode === 'months'"
                    class="btn btn-sm btn-light p-1 lh-1"
                    @click.stop="pickerMode = 'years'"
                    title="Elegir otro año"
                  >
                    <i
                      class="bi bi-chevron-left"
                      style="font-size: 14px; font-weight: bold; color: #ef4444"
                    ></i>
                  </button>
                </div>
              </div>

              <!-- Years Grid -->
              <div v-if="pickerMode === 'years'" class="grid-years">
                <button
                  v-for="y in years"
                  :key="y"
                  class="grid-btn year-btn"
                  :class="{ 'is-selected': y === tempYear }"
                  @click="selectYear(y)"
                >
                  {{ y }}
                </button>
              </div>

              <!-- Months Grid -->
              <div v-if="pickerMode === 'months'" class="grid-months">
                <button
                  v-for="(m, i) in months"
                  :key="i"
                  class="grid-btn month-btn"
                  :class="{
                    'is-selected': tempYear === year && i + 1 === month,
                    'is-disabled': isFutureMonth(tempYear, i + 1)
                  }"
                  :disabled="isFutureMonth(tempYear, i + 1)"
                  @click="selectMonth(i + 1)"
                >
                  {{ m.substring(0, 3).toUpperCase() }}.
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- PANEL DERECHO: Acciones (CSS Grid 2 Cards) -->
      <div class="panel-right">
        <!-- Tarjeta: Cartola por Servicio -->
        <div class="action-card">
          <div class="card-header border-0 pb-0">
            <h5 class="fw-bold mb-1">Cartola por Servicio</h5>
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
                📊
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
                <i class="bi bi-file-earmark-pdf"></i>
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
              class="user-search premium-select mb-4"
            >
              <template #option="{ nombre, apellido, rut, tipo_cargo }">
                <div class="user-option">
                  <strong>{{ nombre }} {{ apellido }}</strong>
                  <small>{{ rut }} - {{ tipo_cargo }}</small>
                </div>
              </template>
            </v-select>

            <div class="d-flex gap-3 justify-content-start">
              <button
                class="btn-action"
                :class="periodStore.isClosed ? 'btn-primary' : 'btn-outline'"
                @click="handleGenerateReport"
                :disabled="!selectedUser"
              >
                <i class="bi bi-file-earmark-pdf"></i>
                {{ periodStore.isClosed ? 'Descargar Cartola (PDF)' : 'Descargar Avance (PDF)' }}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Error/Warning Alert -->
    <div v-if="reportStore.error" class="alert-box warning mt-4 hide-print">
      ⚠️ {{ reportStore.error }}
    </div>

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
          <h2>
            {{
              isOpenMonth
                ? 'Avance de Movimientos - En Curso'
                : 'Informe de Turnos y Horas Trabajadas'
            }}
          </h2>
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
                      <span class="service-badge badge-default">{{ item.service }}</span>
                    </td>
                    <td>
                      <span
                        class="shift-type"
                        :style="{
                          backgroundColor: getShiftColor(item.sigla),
                          color: '#ffffff',
                          border: 'none'
                        }"
                      >
                        {{ getShiftName(item.sigla) }}
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
  </div>
</template>

<script setup lang="ts">
import { ref, watch, computed, onMounted, onUnmounted } from 'vue'
import { useReports } from '../../composables/reports/useReports'
import { usePeriodStore } from '../../stores/period.store'
import { useServiceStore } from '../../stores/service.store'
import vSelect from 'vue-select'
import 'vue-select/dist/vue-select.css'

const periodStore = usePeriodStore()
const serviceStore = useServiceStore()

// Carga la lista de servicios para el autocomplete
serviceStore.fetchServices()

const selectedService = ref<{ _id: string; nombre: string; codigo?: string } | null>(null)
const selectedServiceId = computed(() => selectedService.value?._id ?? '')

const serviceOptions = computed(() =>
  serviceStore.services
    .filter((s) => s.activo)
    .map((s) => ({ _id: s._id, nombre: s.nombre, codigo: s.codigo }))
)

const isExporting = ref<'excel' | 'pdf' | null>(null)

async function downloadExcel() {
  if (!selectedServiceId.value) return
  isExporting.value = 'excel'
  reportStore.error = null // Limpiar error previo
  try {
    const { axiosPrivateInstance: axios } = await import('@/config/axios')
    const response = await axios.get('/reports/export/excel', {
      params: { month: month.value, year: year.value, serviceId: selectedServiceId.value },
      responseType: 'blob'
    })
    const url = window.URL.createObjectURL(new Blob([response.data]))
    const link = document.createElement('a')
    link.href = url
    link.setAttribute(
      'download',
      `Reporte_Servicio_${selectedServiceId.value}_${month.value}_${year.value}.xlsx`
    )
    document.body.appendChild(link)
    link.click()
    link.remove()
  } catch (error: any) {
    if (error.response?.status === 404) {
      reportStore.error =
        'No se encontraron registros para este servicio en el periodo seleccionado.'
    } else {
      reportStore.error = 'Error al descargar avance.'
    }
  } finally {
    isExporting.value = null
  }
}

// Nueva función E2: Descarga PDF firmado desde S3
async function downloadServicePDF() {
  if (!selectedServiceId.value) return
  isExporting.value = 'pdf'
  reportStore.error = null // limpiar error previo
  try {
    const { axiosPrivateInstance: axios } = await import('@/config/axios')
    const response = await axios.get('/reports/service/pdf', {
      params: { month: month.value, year: year.value, serviceId: selectedServiceId.value }
    })
    if (response.data.url) {
      window.open(response.data.url, '_blank')
    }
  } catch (error: any) {
    reportStore.error = error.response?.data?.error || 'El PDF no se encuentra disponible.'
  } finally {
    isExporting.value = null
  }
}

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
  getShiftColor,
  getShiftName,
  formatDate,
  formatReportDate,
  getUserLabel,
  isOpenMonth
} = useReports()

// --- LÓGICA DEL CUSTOM MONTH PICKER ---
const isPickerOpen = ref(false)
const pickerMode = ref<'years' | 'months'>('months')
const tempYear = ref(year.value)
const pickerRef = ref<HTMLElement | null>(null)

const togglePicker = () => {
  isPickerOpen.value = !isPickerOpen.value
  if (isPickerOpen.value) {
    tempYear.value = year.value
    pickerMode.value = 'years' // Abrir directamente en modo Años primero
  }
}

const selectYear = (y: number) => {
  tempYear.value = y
  pickerMode.value = 'months'
}

const selectMonth = (m: number) => {
  year.value = tempYear.value
  month.value = m
  isPickerOpen.value = false
}

const isFutureMonth = (y: number, m: number) => {
  const now = new Date()
  if (y > now.getFullYear()) return true
  if (y === now.getFullYear() && m > now.getMonth() + 1) return true
  return false
}

const formattedSelectedPeriod = computed(() => {
  const monthName = months[month.value - 1]
  return `${monthName} ${year.value}`
})

const handleClickOutside = (e: MouseEvent) => {
  const target = e.target as Node
  // Si el elemento clickeado ya no existe en el DOM (porque un v-if lo desmontó, como la flecha), lo ignoramos.
  if (!document.contains(target)) return

  if (pickerRef.value && !pickerRef.value.contains(target)) {
    isPickerOpen.value = false
  }
}

onMounted(() => document.addEventListener('click', handleClickOutside))
onUnmounted(() => document.removeEventListener('click', handleClickOutside))
// --------------------------------------

// Carga el estado del período cuando cambia mes/año
watch(
  [month, year],
  ([m, y]) => {
    periodStore.fetchPeriod(m, y)
    // Limpiar selección de usuario/reporte al cambiar mes
    reportStore.reportData = null
  },
  { immediate: true }
)
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

.user-search {
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

/* ==================================
   CUSTOM MONTH/YEAR PICKER (GLASS)
   ================================== */
.custom-picker-popover {
  position: absolute;
  top: 100%;
  left: 0;
  margin-top: 8px;
  width: 100%;
  z-index: 100;
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(12px);
  border: 1px solid rgba(255, 255, 255, 0.8);
  box-shadow: 0 15px 30px -5px rgba(30, 58, 138, 0.15), 0 8px 10px -6px rgba(30, 58, 138, 0.08);
  border-radius: 12px;
  padding: 16px;
}

.grid-years,
.grid-months {
  display: grid;
  gap: 8px;
}
.grid-years {
  grid-template-columns: repeat(2, 1fr);
}
.grid-months {
  grid-template-columns: repeat(4, 1fr);
}

.grid-btn {
  background: transparent;
  border: 1px solid transparent;
  border-radius: 30px; /* Forma de pastilla elegante */
  padding: 8px 0;
  font-weight: 500;
  color: #475569;
  transition: all 0.2s ease;
  font-size: 0.9rem;
  cursor: pointer;
}

.grid-btn:hover:not(.is-disabled) {
  background: #fef2f2; /* Fondo rojo clarito estilo banco */
  color: #dc2626; /* Texto rojo intenso */
  border-color: #fca5a5; /* Borde sutil al pasar el mouse */
}

.grid-btn.is-selected {
  background: #0f172a;
  color: white;
  border-color: #0f172a;
  box-shadow: 0 4px 6px -1px rgba(15, 23, 42, 0.2);
}

.grid-btn.is-disabled {
  opacity: 0.4;
  cursor: not-allowed;
  text-decoration: line-through;
}

.btn-bank-outline {
  background: white;
  border: 1px solid #cbd5e1;
  color: #334155;
  border-radius: 10px;
  padding: 10px 24px;
  font-weight: 500;
  font-size: 0.95rem;
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 42px;
}

.btn-bank-outline:hover {
  background: #f8fafc;
  color: #0f172a;
  border-color: #94a3b8;
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

/* Removed old .btn-generate dead code */

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
</style>
