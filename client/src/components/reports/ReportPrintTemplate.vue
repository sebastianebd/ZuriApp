<template>
  <div v-if="reportData" class="page">
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
              String(reportData.user.rut).slice(-4)
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
              >{{ reportData.user.nombre }}
              {{ reportData.user.apellido }}</span
            >
          </div>
          <div class="employee-item">
            <label>RUT</label>
            <span class="value-text">{{ reportData.user.rut }}</span>
          </div>
          <div class="employee-item">
            <label>Cargo</label>
            <span class="value-text">{{ reportData.user.cargo }}</span>
          </div>
          <div class="employee-item">
            <label>Servicio Principal</label>
            <span class="value-text">{{
              reportData.serviceStats[0]?.serviceName || 'N/A'
            }}</span>
          </div>
          <div class="employee-item">
            <label>Antigüedad</label>
            <span class="value-text">{{ reportData.user.antiguedad }}</span>
          </div>
          <div class="employee-item">
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
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="feather feather-calendar"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line><path d="M9 16l2 2 4-4"></path></svg>
            </div>
            <div class="value">{{ reportData.totals.daysWorked }}</div>
            <div class="label">Días Trabajados</div>
          </div>
          <div class="summary-card">
            <div class="icon">
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="feather feather-clock"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>
            </div>
            <div class="value">{{ reportData.totals.hours }}</div>
            <div class="label">Horas Totales</div>
          </div>
          <div class="summary-card">
            <div class="icon">
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="feather feather-sun"><circle cx="12" cy="12" r="5"></circle><line x1="12" y1="1" x2="12" y2="3"></line><line x1="12" y1="21" x2="12" y2="23"></line><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line><line x1="1" y1="12" x2="3" y2="12"></line><line x1="21" y1="12" x2="23" y2="12"></line><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"></line><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"></line></svg>
            </div>
            <div class="value">{{ reportData.totals.dayHours }}</div>
            <div class="label">Horas Diurnas</div>
          </div>
          <div class="summary-card">
            <div class="icon">
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="feather feather-moon"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path></svg>
            </div>
            <div class="value">{{ reportData.totals.nightHours }}</div>
            <div class="label">Horas Nocturnas</div>
          </div>
        </div>

        <div class="summary-grid">
          <div class="summary-card">
            <div class="icon">
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="feather feather-coffee"><path d="M18 8h1a4 4 0 0 1 0 8h-1"></path><path d="M2 8h16v9a4 4 0 0 1-4 4H6a4 4 0 0 1-4-4V8z"></path><line x1="6" y1="1" x2="6" y2="4"></line><line x1="10" y1="1" x2="10" y2="4"></line><line x1="14" y1="1" x2="14" y2="4"></line></svg>
            </div>
            <div class="value">{{ reportData.totals.freeDays }}</div>
            <div class="label">Días Libres</div>
          </div>
          <div class="summary-card">
            <div class="icon">
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="feather feather-users"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><path d="M23 21v-2a4 4 0 0 0-3-3.87"></path><path d="M16 3.13a4 4 0 0 1 0 7.75"></path></svg>
            </div>
            <div class="value">{{ reportData.totals.replacementsCount }}</div>
            <div class="label">Reemplazos</div>
          </div>
          <div class="summary-card">
            <div class="icon">
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="feather feather-activity"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"></polyline></svg>
            </div>
            <div class="value">{{ reportData.serviceStats.length }}</div>
            <div class="label">Servicios</div>
          </div>
          <div class="summary-card">
            <div class="icon">
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="feather feather-pie-chart"><path d="M21.21 15.89A10 10 0 1 1 8 2.83"></path><path d="M22 12A10 10 0 0 0 12 2v10z"></path></svg>
            </div>
            <div class="value">
              {{
                Math.round(
                  (reportData.totals.daysWorked /
                    reportData.timeline.length) *
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
              v-for="svc in reportData.serviceStats"
              :key="svc.serviceName"
              class="bar-item"
            >
              <div class="bar-label">{{ svc.serviceName }}</div>
              <div class="bar-track">
                <div
                  class="bar-fill"
                  :style="{
                    width: (svc.stats.hours / reportData.totals.hours) * 100 + '%'
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
              <span class="stat-value">{{ reportData.totals.L }} turnos</span>
            </li>
            <li>
              <span>Turnos Noche (N)</span>
              <span class="stat-value">{{ reportData.totals.N }} turnos</span>
            </li>
            <li>
              <span>Días Libres (X)</span>
              <span class="stat-value">{{ reportData.totals.X }} días</span>
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
            <th class="center">Entrada</th>
            <th class="center">Salida</th>
            <th class="center">Hrs Diurnas</th>
            <th class="center">Hrs Nocturnas</th>
            <th class="center">Total Hrs</th>
          </tr>
        </thead>
        <tbody>
          <template v-for="day in reportData.timeline" :key="day.dayNum">
            <template v-if="!day.isOutOfContract">
              <tr
                v-if="
                  day.items.length === 0 ||
                  (day.items.length === 1 && ['X', 'LIBRE'].includes(day.items[0].sigla))
                "
              >
                <td>{{ formatReportDate(day.date) }}</td>
                <td colspan="7" style="text-align: center; color: #10b981; font-weight: 600">
                  <span>Libre</span>
                </td>
              </tr>

              <template v-else>
                <tr v-for="(item, idx) in day.items" :key="idx">
                  <td>{{ formatReportDate(day.date) }}</td>
                  <td>
                    <span class="service-badge badge-default">{{ item.service }}</span>
                  </td>
                  <td>
                    <span>
                      {{ getShiftName(item.sigla) }}
                      <span v-if="item.isReplacement" class="text-xs text-gray-500"
                        >(Reemplazo)</span
                      >
                    </span>
                  </td>
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
            <td colspan="5" style="text-align: right; padding-right: 15px">
              TOTALES DEL PERÍODO:
            </td>
            <td class="center">{{ reportData.totals.dayHours }}</td>
            <td class="center">{{ reportData.totals.nightHours }}</td>
            <td class="center">
              <strong>{{ reportData.totals.hours }}</strong>
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
</template>

<script setup lang="ts">
import { formatDate, formatReportDate } from '@/utils/date-utils'
import { useTurnSiglaStore } from '@/stores/turn-sigla.store'

defineProps<{
  reportData: any
  month: number
  year: number
  months: string[]
  isOpenMonth: boolean
}>()

const siglaStore = useTurnSiglaStore()

const getShiftName = (sigla: string) => {
  return siglaStore.mapSiglaToNombre(sigla)
}
</script>

<style scoped>
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
  border-radius: 8px;
  font-size: 11px;
  font-weight: 600;
  background: #eaeaea;
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

@media screen {
  .page {
    position: absolute;
    left: -9999px;
    top: -9999px;
    opacity: 0;
    pointer-events: none;
  }
}
</style>
