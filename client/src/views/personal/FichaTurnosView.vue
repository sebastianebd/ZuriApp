<script setup lang="ts">
import { ref, onMounted, watch, computed, onUnmounted, onActivated } from 'vue'
import { useReportStore } from '../../stores/report.store'
import { useUserStore } from '../../stores/user.store'
import { useTurnSiglaStore } from '../../stores/turn-sigla.store'
import { useReplacementStore } from '../../stores/replacement.store'
import socket from '../../plugins/socket'
import vSelect from 'vue-select'
import 'vue-select/dist/vue-select.css'
import { debounce } from 'lodash-es'

const reportStore = useReportStore()
const userStore = useUserStore()
const turnSiglaStore = useTurnSiglaStore()
const replacementStore = useReplacementStore()

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

  // Silent Refresh: Only show loading if data is missing or belongs to another user
  const isDifferentUser = reportStore.reportData?.user?._id !== selectedUser.value._id
  if (!reportStore.reportData || isDifferentUser) {
    isLoading.value = true
  }

  try {
    reportStore.currentFilters.userId = selectedUser.value._id
    reportStore.currentFilters.month = month.value
    reportStore.currentFilters.year = year.value
    await Promise.all([
      reportStore.fetchReportSummary({ preview: true }),
      // Fetch replacements where user is involved (search by RUT covers both, looking for Saliente)
      replacementStore.fetchActiveReplacementsPaginated({
        search: selectedUser.value.rut,
        limit: 100 // Ensure we catch all relevant ones
      })
    ])
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

// Socket Handler
const handleSocketUpdate = async (payload: { userId: string }) => {
  if (selectedUser.value) {
    const currentId = String(selectedUser.value._id)
    const targetId = String(payload.userId)
    console.log(`[Socket] Event received. Target: ${targetId}, Current: ${currentId}`)

    if (currentId === targetId) {
      console.log('[Socket] Match found! Refreshing...')
      await fetchData()
    }
  }
}

// Refresh on Tab Focus
const handleVisibilityChange = () => {
  if (document.visibilityState === 'visible' && selectedUser.value) {
    console.log('Tab active: Refreshing data...')
    fetchData()
  }
}

// Refresh upon Keep-Alive activation (Safety net)
onActivated(() => {
  if (selectedUser.value) {
    console.log('View Activated: Refreshing...')
    fetchData()
  }
})

// Initialize
onMounted(async () => {
  document.addEventListener('visibilitychange', handleVisibilityChange)

  // Socket Connection
  if (!socket.connected) socket.connect()
  socket.on('turn:update', handleSocketUpdate)

  // 1. Capture cached user from Store (to persist selection)
  const cachedUser = reportStore.reportData?.user

  // 2. Load Options
  const defaults = await userStore.buscarUsuarios('')
  userOptions.value = defaults
  await turnSiglaStore.fetchSiglas()

  // 3. Restore Selection (triggers watcher -> fetchData)
  if (cachedUser) {
    console.log('Restoring user context...')
    selectedUser.value = cachedUser
  }
})

onUnmounted(() => {
  document.removeEventListener('visibilitychange', handleVisibilityChange)
  socket.off('turn:update', handleSocketUpdate)
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

import { formatTitleCase } from '../../utils/text-formatters'

// ... existing imports ...

// ... inside script ...

const getShiftName = (sigla: string) => {
  const rawName = turnSiglaStore.mapSiglaToNombre(sigla) // e.g. "LARGO", "NOCHE"
  return formatTitleCase(rawName)
}

// Dynamic Style for Calendar Day
const getDayStyle = (day: any) => {
  if (!day.items || day.items.length === 0) {
    // Check for Absence
    if (isAbsent(day.dayNum)) {
      return {
        backgroundColor: '#e2e8f0', // Gray-200
        color: '#94a3b8',
        borderColor: '#cbd5e1',
        cursor: 'not-allowed'
      }
    }
    return {}
  }

  // Take the first breakdown item to color the cell
  // In this domain, usually 1 shift per day or replacement overrides it.
  const sigla = day.items[0].sigla
  const hex = turnSiglaStore.mapSiglaToColor(sigla) || '#64748b'

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
    backgroundColor: `rgba(${r}, ${g}, ${b}, 1)`,
    color: '#ffffff',
    borderColor: `rgba(${r}, ${g}, ${b}, 1)`
  }
}

const isAbsent = (dayNum: number) => {
  if (!selectedUser.value) return false
  const dateStr = `${year.value}-${String(month.value).padStart(2, '0')}-${String(dayNum).padStart(
    2,
    '0'
  )}`
  const absenceDates = replacementStore.getFechasAusencia(selectedUser.value._id)
  return absenceDates.includes(dateStr)
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
          placeholder="Buscar Funcionario (Nombre o RUT)..."
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
        </div>
      </div>

      <div v-if="reportStore.reportData" class="kpi-grid fade-in">
        <div class="kpi-card total">
          <div class="kpi-icon">
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
          <div class="kpi-content">
            <span class="kpi-value">{{ reportStore.reportData.totals.hours }}</span>
            <span class="kpi-label">Horas Totales</span>
          </div>
        </div>
        <div class="kpi-card day">
          <div class="kpi-icon">
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
          <div class="kpi-content">
            <span class="kpi-value">{{ reportStore.reportData.totals.dayHours }}</span>
            <span class="kpi-label">Horas Diurnas</span>
          </div>
        </div>
        <div class="kpi-card night">
          <div class="kpi-icon">
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
          <div class="kpi-content">
            <span class="kpi-value">{{ reportStore.reportData.totals.nightHours }}</span>
            <span class="kpi-label">Horas Nocturnas</span>
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
        <div class="d-flex align-items-center gap-3">
          <div class="icon-square bg-white shadow-sm text-primary">
            <i class="bi bi-calendar-week fs-4"></i>
          </div>
          <div class="title-group">
            <h2 class="mb-0" style="font-size: 1.5rem">Ficha de Turnos</h2>
            <p class="mb-0 text-secondary small">Vista mensual detallada</p>
          </div>
        </div>
        <div class="current-period">
          <span class="period-text">{{ months[month - 1] }} {{ year }}</span>
        </div>
      </div>

      <!-- Calendar View (Only if data exists) -->
      <div class="calendar-wrapper position-relative" v-if="reportStore.reportData">
        <!-- Overlay for Refreshing Data -->
        <div v-if="isLoading" class="loading-overlay">
          <div class="spinner-border text-primary" role="status">
            <span class="visually-hidden">Cargando...</span>
          </div>
          <span class="ms-2 fw-bold text-dark">Actualizando...</span>
        </div>

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
            :style="getDayStyle(day)"
          >
            <div class="day-number">{{ day.dayNum }}</div>

            <!-- Shifts -->
            <div class="shifts-stack">
              <div v-for="(item, idx) in day.items" :key="idx" class="shift-info">
                <span class="shift-name">{{ getShiftName(item.sigla) }}</span>
                <span class="shift-time">{{ item.startTime }}-{{ item.endTime }}</span>
              </div>
            </div>
            <!-- Empty state handling via CSS or just empty div -->
            <div v-if="!day.items?.length && isAbsent(day.dayNum)" class="absence-marker">
              <span>AUSENTE</span>
            </div>
          </div>
        </div>
      </div>

      <!-- Empty State / Loading State (Initial Load) -->
      <div v-else class="empty-state-large">
        <div v-if="isLoading" class="d-flex flex-column align-items-center">
          <div
            class="spinner-border text-primary mb-3"
            role="status"
            style="width: 3rem; height: 3rem"
          >
            <span class="visually-hidden">Cargando...</span>
          </div>
          <h4 class="text-muted fw-bold">Cargando Ficha...</h4>
        </div>
        <div v-else class="d-flex flex-column align-items-center">
          <i class="bi bi-person-badge display-1 text-muted mb-3"></i>
          <h4 class="text-muted">Seleccione un funcionario</h4>
          <p class="text-muted">Utilice el buscador para ver la ficha de turnos.</p>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.icon-square {
  width: 48px;
  height: 48px;
  border-radius: 14px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.ficha-container {
  display: grid;
  grid-template-columns: 320px 1fr;
  gap: 24px;
  padding: 24px;
  background: #f8fafc;
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

/* User Option Dropdown Item */
.user-option {
  display: flex;
  flex-direction: column;
  line-height: 1.2;
}
.user-option strong {
  font-size: 0.9rem;
  color: #1e293b;
  text-transform: uppercase;
}
.user-option small {
  font-size: 0.75rem;
  color: #64748b;
}

/* Premium Select Overrides */
.premium-select ::v-deep .vs__dropdown-toggle {
  border: 1px solid #e2e8f0;
  border-radius: 0.375rem;
  padding: 3px;
  background: white;
  box-shadow: none;
  transition: all 0.2s ease;
  min-height: 42px;
}

.premium-select ::v-deep .vs__search {
  font-size: 0.875rem;
  color: #1e293b;
}

.premium-select ::v-deep .vs__search::placeholder {
  color: #94a3b8;
}

.premium-select ::v-deep .vs__selected {
  font-size: 0.875rem;
  color: #1e293b;
}

.premium-select ::v-deep .vs__actions svg {
  fill: #64748b;
  transform: scale(0.8);
}

.premium-select ::v-deep .vs__dropdown-menu {
  border: 1px solid #e2e8f0;
  border-radius: 0.5rem;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
  padding: 5px;
  font-size: 0.875rem;
  margin-top: 4px;
  z-index: 1000;
}

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

.premium-select:hover ::v-deep .vs__dropdown-toggle {
  border-color: #cbd5e1;
}

.premium-select ::v-deep .vs--open .vs__dropdown-toggle,
.premium-select:focus-within ::v-deep .vs__dropdown-toggle {
  border-color: #3b82f6;
  box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.1);
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
  width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #f8fafc;
  border-radius: 8px;
  color: #64748b; /* Ensure SVG takes this color */
}
.kpi-icon svg {
  width: 24px;
  height: 24px;
  stroke-width: 2;
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
  padding: 8px;
  min-height: 100px;
  border: 1px solid transparent;
  transition: all 0.2s ease;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
}
.calendar-day:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}
.calendar-day.is-today {
  box-shadow: 0 0 0 2px #3b82f6;
  z-index: 2;
}

.calendar-day.empty {
  background: transparent;
}

.day-number {
  font-size: 1rem;
  font-weight: 800;
  color: inherit;
  opacity: 0.9;
}

.shifts-stack {
  flex: 1;
  display: flex;
  justify-content: center;
}

.shift-info {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 2px;
  text-align: center;
  width: 100%;
}
.shift-name {
  font-weight: 800;
  font-size: 1rem;
  line-height: 1.2;
  letter-spacing: 0.02em;
  text-shadow: 0 2px 4px rgba(0, 0, 0, 0.35);
}
.shift-time {
  opacity: 0.9;
  font-size: 0.7rem;
  font-weight: 600;
  text-shadow: 0 2px 4px rgba(0, 0, 0, 0.5);
}

/* Empty State */
.empty-state-large,
.loading-state-large {
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

.absence-marker {
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.75rem;
  font-weight: 700;
  color: #64748b;
  letter-spacing: 0.05em;
  opacity: 0.7;
}

@media (max-width: 1024px) {
  .ficha-container {
    grid-template-columns: 1fr;
  }
}
</style>
