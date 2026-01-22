<script setup lang="ts">
import { ref, onMounted, watch, computed } from 'vue'
import { useReportStore } from '../../stores/report.store'
import { useUserStore } from '../../stores/user.store'
import { useTurnSiglaStore } from '../../stores/turn-sigla.store'
import vSelect from 'vue-select'
import 'vue-select/dist/vue-select.css'
import { debounce } from 'lodash-es'

const reportStore = useReportStore()
const userStore = useUserStore()
const turnSiglaStore = useTurnSiglaStore()

// --- State ---
const selectedUser = ref<any>(null)
const userOptions = ref<any[]>([])
const month = ref(new Date().getMonth() + 1)
const year = ref(new Date().getFullYear())
const isLoading = ref(false)

// --- Constants ---
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

// --- User Search Logic (Copied & Adapted) ---
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
  loading(true)
  performSearch(search, loading)
}

const getUserLabel = (option: any) => `${option.nombre} ${option.apellido}`

// --- Data Fetching ---
const fetchData = async () => {
  if (!selectedUser.value) return
  isLoading.value = true
  try {
    reportStore.currentFilters.userId = selectedUser.value._id
    reportStore.currentFilters.month = month.value
    reportStore.currentFilters.year = year.value
    await reportStore.fetchReportSummary()
  } catch (error) {
    console.error('Error fetching data:', error)
  } finally {
    isLoading.value = false
  }
}

// Watchers
watch([month, year], () => {
  if (selectedUser.value) fetchData()
})

watch(selectedUser, () => {
  if (selectedUser.value) fetchData()
  else reportStore.reportData = null
})

// Initialize
onMounted(async () => {
  const defaults = await userStore.buscarUsuarios('')
  userOptions.value = defaults
  await turnSiglaStore.fetchSiglas()
})

// --- Computed Helpers ---
const calendarDays = computed(() => {
  if (!reportStore.reportData?.timeline) return []
  return reportStore.reportData.timeline
})

const startOffset = computed(() => {
  const firstDay = new Date(year.value, month.value - 1, 1).getDay()
  // Mon=0 ... Sun=6
  return firstDay === 0 ? 6 : firstDay - 1
})

const getShiftName = (sigla: string) => {
  return turnSiglaStore.mapSiglaToNombre(sigla) // e.g. "Largo", "Noche"
}

// Dynamic Style for Shift Pill
const getShiftStyle = (sigla: string) => {
  const hex = turnSiglaStore.mapSiglaToColor(sigla) || '#64748b'

  // Convert Hex to RGBA for glass effect
  let r = 0,
    g = 0,
    b = 0
  if (hex.length === 4) {
    r = parseInt(hex[1] + hex[1], 16)
    g = parseInt(hex[2] + hex[2], 16)
    b = parseInt(hex[3] + hex[3], 16)
  } else if (hex.length === 7) {
    r = parseInt(hex.substring(1, 3), 16)
    g = parseInt(hex.substring(3, 5), 16)
    b = parseInt(hex.substring(5, 7), 16)
  }

  return {
    backgroundColor: `rgba(${r}, ${g}, ${b}, 0.1)`,
    color: `rgba(${r}, ${g}, ${b}, 1)`,
    border: `1px solid rgba(${r}, ${g}, ${b}, 0.2)`
  }
}

const isToday = (dayNum: number) => {
  const now = new Date()
  return (
    now.getDate() === dayNum &&
    now.getMonth() + 1 === month.value &&
    now.getFullYear() === year.value
  )
}
</script>

<template>
  <div class="ficha-container">
    <!-- LEFT PANEL: PROFILE & METRICS -->
    <div class="panel-left">
      <!-- Search -->
      <div class="search-section">
        <label class="section-label">Seleccionar Funcionario</label>
        <v-select
          v-model="selectedUser"
          :options="userOptions"
          :filterable="false"
          @search="onSearch"
          :get-option-label="getUserLabel"
          placeholder="Buscar..."
          class="user-select premium-select"
        >
          <template #option="{ nombre, apellido, rut, tipo_cargo }">
            <div class="user-option">
              <strong>{{ nombre }} {{ apellido }}</strong>
              <small>{{ rut }} - {{ tipo_cargo }}</small>
            </div>
          </template>
        </v-select>
      </div>

      <!-- Profile Card -->
      <div v-if="reportStore.reportData" class="profile-card fade-in">
        <div class="profile-header">
          <div class="avatar-placeholder">
            {{ reportStore.reportData.user.nombre[0] }}{{ reportStore.reportData.user.apellido[0] }}
          </div>
          <div class="profile-info">
            <h3>
              {{ reportStore.reportData.user.nombre }} {{ reportStore.reportData.user.apellido }}
            </h3>
            <p class="role">{{ reportStore.reportData.user.cargo }}</p>
            <p class="meta">{{ reportStore.reportData.user.rut }}</p>
          </div>
        </div>
        <div class="profile-details">
          <div class="detail-row">
            <span>Servicio</span>
            <strong>{{ reportStore.reportData.serviceStats[0]?.serviceName || 'N/A' }}</strong>
          </div>
          <div class="detail-row">
            <span>Antigüedad</span>
            <strong>{{ reportStore.reportData.user.antiguedad || 'N/A' }}</strong>
          </div>
        </div>
      </div>

      <!-- KPI Cards -->
      <div v-if="reportStore.reportData" class="kpi-grid fade-in">
        <div class="kpi-card total">
          <div class="kpi-icon">⏱️</div>
          <div class="kpi-content">
            <span class="kpi-value">{{ reportStore.reportData.totals.hours }}</span>
            <span class="kpi-label">Horas Totales</span>
          </div>
        </div>
        <div class="kpi-card day">
          <div class="kpi-icon">☀️</div>
          <div class="kpi-content">
            <span class="kpi-value">{{ reportStore.reportData.totals.dayHours }}</span>
            <span class="kpi-label">Diurnas</span>
          </div>
        </div>
        <div class="kpi-card night">
          <div class="kpi-icon">🌙</div>
          <div class="kpi-content">
            <span class="kpi-value">{{ reportStore.reportData.totals.nightHours }}</span>
            <span class="kpi-label">Nocturnas</span>
          </div>
        </div>
      </div>

      <!-- Service Distribution -->
      <div v-if="reportStore.reportData" class="service-chart-card fade-in">
        <h4>Distribución de Servicios</h4>
        <div class="service-bars">
          <div
            v-for="svc in reportStore.reportData.serviceStats"
            :key="svc.serviceName"
            class="svc-item"
          >
            <div class="svc-header">
              <span>{{ svc.serviceName }}</span>
              <span
                >{{
                  Math.round((svc.stats.hours / reportStore.reportData.totals.hours) * 100)
                }}%</span
              >
            </div>
            <div class="progress-track">
              <div
                class="progress-fill"
                :style="{
                  width: (svc.stats.hours / reportStore.reportData.totals.hours) * 100 + '%'
                }"
              ></div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- RIGHT PANEL: CALENDAR -->
    <div class="panel-right">
      <div class="calendar-header">
        <div class="title-group">
          <h2>Ficha de Turnos</h2>
          <p>Vista mensual detallada</p>
        </div>
        <div class="current-period">
          <span class="period-text">{{ months[month - 1] }} {{ year }}</span>
        </div>
      </div>

      <div class="calendar-wrapper" v-if="reportStore.reportData">
        <div class="days-header">
          <span>Lun</span><span>Mar</span><span>Mie</span><span>Jue</span><span>Vie</span
          ><span>Sab</span><span>Dom</span>
        </div>
        <div class="calendar-grid">
          <!-- Empty slots for offset -->
          <div v-for="i in startOffset" :key="'empty-' + i" class="calendar-day empty"></div>

          <!-- Actual Days -->
          <div
            v-for="day in calendarDays"
            :key="day.dayNum"
            class="calendar-day"
            :class="{ 'is-today': isToday(day.dayNum) }"
          >
            <div class="day-number">{{ day.dayNum }}</div>

            <!-- Shifts -->
            <div class="shifts-stack">
              <div
                v-for="(item, idx) in day.items"
                :key="idx"
                class="shift-pill"
                :style="getShiftStyle(item.sigla)"
              >
                <span class="shift-name">{{ getShiftName(item.sigla) }}</span>
                <span class="shift-time">{{ item.startTime }}-{{ item.endTime }}</span>
              </div>
              <div v-if="day.items.length === 0" class="shift-empty">-</div>
            </div>
          </div>
        </div>
      </div>

      <div v-else class="empty-state-large">
        <i class="bi bi-person-badge"></i>
        <h3>Seleccione un funcionario</h3>
        <p>Utilice el buscador para ver la ficha de turnos.</p>
      </div>
    </div>
  </div>
</template>

<style scoped>
.ficha-container {
  display: grid;
  grid-template-columns: 320px 1fr;
  gap: 24px;
  padding: 24px;
  background: #f1f5f9;
  min-height: calc(100vh - 70px); /* Adjust based on navbar */
  font-family: 'Inter', sans-serif;
}

/* --- Left Panel --- */
.panel-left {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.section-label {
  font-size: 0.75rem;
  text-transform: uppercase;
  color: #64748b;
  font-weight: 700;
  margin-bottom: 8px;
  display: block;
}

/* Premium Select Overrides */
.premium-select {
  background: white;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
}

/* Profile Card */
.profile-card {
  background: white;
  border-radius: 16px;
  padding: 20px;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.5);
}

.profile-header {
  display: flex;
  align-items: center;
  gap: 16px;
  margin-bottom: 20px;
}

.avatar-placeholder {
  width: 56px;
  height: 56px;
  background: linear-gradient(135deg, #3b82f6, #2563eb);
  color: white;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 700;
  font-size: 1.25rem;
}

.profile-info h3 {
  margin: 0;
  font-size: 1.1rem;
  font-weight: 700;
  color: #0f172a;
}
.profile-info .role {
  margin: 2px 0 0;
  font-size: 0.875rem;
  color: #64748b;
}
.profile-info .meta {
  margin: 2px 0 0;
  font-size: 0.75rem;
  color: #94a3b8;
}

.profile-details {
  padding-top: 16px;
  border-top: 1px solid #f1f5f9;
  display: flex;
  flex-direction: column;
  gap: 12px;
}
.detail-row {
  display: flex;
  justify-content: space-between;
  font-size: 0.875rem;
  color: #475569;
}

/* KPIs */
.kpi-grid {
  display: grid;
  grid-template-columns: 1fr;
  gap: 12px;
}

.kpi-card {
  background: white;
  padding: 16px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  gap: 16px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.02);
  border: 1px solid #f8fafc;
  transition: transform 0.2s;
}
.kpi-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.05);
}

.kpi-icon {
  font-size: 1.5rem;
  width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #f8fafc;
  border-radius: 8px;
}

.kpi-content {
  display: flex;
  flex-direction: column;
}
.kpi-value {
  font-size: 1.25rem;
  font-weight: 800;
  color: #0f172a;
}
.kpi-label {
  font-size: 0.75rem;
  color: #64748b;
}

/* Service Chart */
.service-chart-card {
  background: white;
  padding: 20px;
  border-radius: 16px;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05);
}
.service-chart-card h4 {
  margin: 0 0 16px;
  font-size: 0.9rem;
  color: #334155;
  font-weight: 600;
}
.svc-item {
  margin-bottom: 12px;
}
.svc-header {
  display: flex;
  justify-content: space-between;
  font-size: 0.8rem;
  color: #475569;
  margin-bottom: 4px;
}
.progress-track {
  height: 6px;
  background: #f1f5f9;
  border-radius: 3px;
  overflow: hidden;
}
.progress-fill {
  height: 100%;
  background: #3b82f6;
  border-radius: 3px;
}

/* --- Right Panel --- */
.panel-right {
  background: white;
  border-radius: 20px;
  padding: 32px;
  box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.05);
  display: flex;
  flex-direction: column;
}

.calendar-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 32px;
}

.title-group h2 {
  font-size: 1.75rem;
  font-weight: 800;
  color: #0f172a;
  letter-spacing: -0.02em;
  margin: 0;
}
.title-group p {
  margin: 4px 0 0;
  color: #64748b;
}

.current-period {
  background: #e2e8f0;
  padding: 8px 16px;
  border-radius: 8px;
  font-weight: 600;
  color: #475569;
}

/* Calendar Grid */
.calendar-wrapper {
  flex: 1;
  display: flex;
  flex-direction: column;
}

.days-header {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  margin-bottom: 12px;
  text-align: center;
}
.days-header span {
  font-size: 0.875rem;
  font-weight: 600;
  color: #94a3b8;
  text-transform: uppercase;
}

.calendar-grid {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  gap: 12px;
  grid-auto-rows: minmax(100px, 1fr);
}

.calendar-day {
  background: #f8fafc;
  border-radius: 12px;
  padding: 10px;
  min-height: 100px;
  border: 1px solid transparent;
  transition: all 0.2s ease;
}
.calendar-day:hover {
  background: white;
  border-color: #e2e8f0;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05);
}
.calendar-day.is-today {
  background: #eff6ff;
  border: 2px solid #3b82f6;
  box-shadow: 0 0 15px rgba(59, 130, 246, 0.2);
}

.calendar-day.empty {
  background: transparent;
}

.day-number {
  font-size: 0.9rem;
  font-weight: 700;
  color: #334155;
  margin-bottom: 8px;
}

.shifts-stack {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.shift-pill {
  padding: 6px 8px;
  border-radius: 6px;
  border: 1px solid transparent;
  font-size: 0.75rem;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 2px;
  text-align: center;
}
.shift-name {
  font-weight: 700;
  font-size: 0.8rem;
  line-height: 1.2;
}
.shift-time {
  opacity: 0.9;
  font-size: 0.65rem;
}
.shift-empty {
  text-align: center;
  color: #cbd5e1;
  font-size: 1.5rem;
  line-height: 1;
  margin-top: 10px;
}

/* Empty State */
.empty-state-large {
  height: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  color: #94a3b8;
  text-align: center;
}
.empty-state-large i {
  font-size: 4rem;
  margin-bottom: 16px;
  opacity: 0.3;
}
.empty-state-large h3 {
  font-size: 1.25rem;
  color: #64748b;
  margin: 0 0 8px;
}

/* Animations */
.fade-in {
  animation: fadeIn 0.4s ease-out;
}
@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@media (max-width: 1024px) {
  .ficha-container {
    grid-template-columns: 1fr;
  }
}
</style>
