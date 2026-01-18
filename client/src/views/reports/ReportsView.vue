<script setup lang="ts">
import { ref, watch, onMounted } from 'vue'
import { useReportStore } from '../../stores/report.store'
import { useUserStore } from '../../stores/user.store'
import vSelect from 'vue-select'
import 'vue-select/dist/vue-select.css'

const reportStore = useReportStore()
const userStore = useUserStore()

const selectedUser = ref<any>(null)
const month = ref(1)
const year = ref(2026)

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
const years = [2024, 2025, 2026]

// Fetch users for the dropdown
onMounted(async () => {
  await userStore.mostrarTodos()
})

// Watch for selection of user to fetch report
watch(selectedUser, async (newUser: any) => {
  if (newUser) {
    reportStore.currentFilters.userId = newUser._id
    // Trigger fetch
    await reportStore.fetchReportSummary(month.value, year.value)
  } else {
    reportStore.reportData = null // Clear if deselected
  }
})

// Watch Date changes
watch([month, year], async () => {
  if (selectedUser.value) {
    await reportStore.fetchReportSummary(month.value, year.value)
  }
})

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

const downloadPDF = () => {
  window.print()
}
</script>

<template>
  <div class="page-container">
    <!-- Controls (Screen Only) -->
    <div class="controls hide-print">
      <v-select
        v-model="selectedUser"
        :options="userStore.users"
        label="full_name"
        placeholder="Buscar Funcionario (Nombre o RUT)..."
        class="user-search"
      >
        <template #option="{ nombre, apellido, rut, cargo }">
          <div class="user-option">
            <strong>{{ nombre }} {{ apellido }}</strong>
            <small>{{ rut }} - {{ cargo }}</small>
          </div>
        </template>
      </v-select>

      <!-- Date Filters -->
      <div class="date-filters">
        <select v-model="month" class="form-select">
          <option v-for="(m, i) in months" :key="i" :value="i + 1">{{ m }}</option>
        </select>
        <select v-model="year" class="form-select">
          <option v-for="y in years" :key="y" :value="y">{{ y }}</option>
        </select>
      </div>

      <button @click="downloadPDF" class="btn-print" v-if="reportStore.reportData">
        🖨️ Imprimir / PDF
      </button>
    </div>

    <div v-if="reportStore.reportData" class="page">
      <!-- Header -->
      <div class="header">
        <div class="header-top">
          <div class="hospital-info">
            <h1>🏥 Hospital Regional de Osorno</h1>
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
              <value
                >{{ reportStore.reportData.user.nombre }}
                {{ reportStore.reportData.user.apellido }}</value
              >
            </div>
            <div class="employee-item">
              <label>RUT</label>
              <value
                >{{ reportStore.reportData.user.rut }}-{{ reportStore.reportData.user.dv }}</value
              >
            </div>
            <div class="employee-item">
              <label>Cargo</label>
              <value>{{ reportStore.reportData.user.cargo }}</value>
            </div>
            <div class="employee-item">
              <label>Servicio Principal</label>
              <value>{{ reportStore.reportData.serviceStats[0]?.serviceName || 'N/A' }}</value>
            </div>
            <div class="employee-item">
              <label>Antigüedad</label>
              <value>{{ reportStore.reportData.user.antiguedad }}</value>
            </div>
            <div class="employee-item">
              <label>Período Analizado</label>
              <value
                >01/{{ String(month).padStart(2, '0') }}/{{ year }} -
                {{ new Date(year, month, 0).getDate() }}/{{ String(month).padStart(2, '0') }}/{{
                  year
                }}</value
              >
            </div>
          </div>
        </div>

        <!-- Summary Section -->
        <div class="summary-section">
          <div class="section-title">📊 Resumen General del Período</div>
          <div class="summary-grid">
            <div class="summary-card">
              <div class="icon">📅</div>
              <div class="value">{{ reportStore.reportData.totals.daysWorked }}</div>
              <div class="label">Días Trabajados</div>
            </div>
            <div class="summary-card">
              <div class="icon">⏰</div>
              <div class="value">{{ reportStore.reportData.totals.hours }}</div>
              <div class="label">Horas Totales</div>
            </div>
            <div class="summary-card">
              <div class="icon">☀️</div>
              <div class="value">{{ reportStore.reportData.totals.dayHours }}</div>
              <div class="label">Horas Diurnas</div>
            </div>
            <div class="summary-card">
              <div class="icon">🌙</div>
              <div class="value">{{ reportStore.reportData.totals.nightHours }}</div>
              <div class="label">Horas Nocturnas</div>
            </div>
          </div>

          <div class="summary-grid">
            <div class="summary-card">
              <div class="icon">🏖️</div>
              <div class="value">{{ reportStore.reportData.totals.freeDays }}</div>
              <div class="label">Días Libres</div>
            </div>
            <div class="summary-card">
              <div class="icon">🔄</div>
              <div class="value">{{ reportStore.reportData.totals.replacementsCount }}</div>
              <div class="label">Reemplazos</div>
            </div>
            <div class="summary-card">
              <div class="icon">🏥</div>
              <div class="value">{{ reportStore.reportData.serviceStats.length }}</div>
              <div class="label">Servicios</div>
            </div>
            <div class="summary-card">
              <div class="icon">💼</div>
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
              <!-- Case 1: Free Day (Empty OR Explicit 'X') -->
              <tr
                v-if="
                  day.items.length === 0 ||
                  (day.items.length === 1 && ['X', 'LIBRE'].includes(day.items[0].sigla))
                "
              >
                <td>{{ formatDate(day.date) }}</td>
                <td colspan="8" style="text-align: center; color: #10b981; font-weight: 600">
                  <span class="shift-type shift-libre">DÍA LIBRE</span>
                </td>
              </tr>

              <!-- Case 2: Regular Shifts -->
              <template v-else>
                <tr v-for="(item, idx) in day.items" :key="idx">
                  <td>{{ formatDate(day.date) }}</td>
                  <td>
                    <span class="service-badge" :class="getServiceBadgeClass(item.service)">{{
                      item.service
                    }}</span>
                  </td>
                  <td>
                    <span class="shift-type" :class="getShiftClass(item.sigla)">
                      {{
                        item.sigla === 'L' ? 'Diurno' : item.sigla === 'N' ? 'Nocturno' : item.sigla
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

        <!-- Signature Section -->
        <div class="signature-section">
          <div class="section-title">✍️ Validación y Firmas</div>
          <div class="signatures">
            <div class="signature-box">
              <div class="signature-line"></div>
              <div class="signature-label">JEFE DE SERVICIO</div>
              <div class="signature-label">Nombre y Firma</div>
            </div>
            <div class="signature-box">
              <div class="signature-line"></div>
              <div class="signature-label">RECURSOS HUMANOS</div>
              <div class="signature-label">Nombre y Firma</div>
            </div>
          </div>
        </div>
      </div>

      <!-- Footer -->
      <div class="footer">
        <div>
          <strong>Hospital Regional de Osorno</strong><br />
          ZuriApp Sistema de Turnos y Reemplazos | Generado automáticamente
        </div>
        <div style="text-align: right">
          Página 1 de 1<br />
          Documento confidencial
        </div>
      </div>
    </div>

    <div v-else class="empty-state">
      <p>Seleccione un funcionario para generar su cartola.</p>
    </div>
  </div>
</template>

<style scoped>
.page-container {
  background: #f5f5f5;
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

.user-search {
  flex: 1;
  background: white;
  border-radius: 4px;
}

.date-filters {
  display: flex;
  gap: 10px;
}

.form-select {
  padding: 8px;
  border: 1px solid #ccc;
  border-radius: 4px;
  background: white;
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
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
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
  background: linear-gradient(135deg, #e0e7ff 0%, #f0e7ff 100%);
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

.employee-item value {
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
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
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
}

.badge-urgencias {
  background: #fee;
  color: #c00;
}
.badge-uci {
  background: #ffe;
  color: #c90;
}
.badge-pediatria {
  background: #efe;
  color: #0a0;
}
.badge-cirugia {
  background: #eef;
  color: #00a;
}
.badge-default {
  background: #eee;
  color: #666;
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
  background: linear-gradient(90deg, #667eea 0%, #764ba2 100%);
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
</style>
