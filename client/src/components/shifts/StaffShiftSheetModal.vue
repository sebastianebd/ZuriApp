<template>
  <Transition name="fade">
    <div
      v-if="visible"
      class="staff-sheet-modal-overlay"
      role="dialog"
      aria-modal="true"
      @click.self="emit('cerrar')"
    >
      <div class="staff-sheet-modal-dialog shadow-2xl">
        <!-- HEADER VANGUARD -->
        <div class="staff-sheet-modal-header d-flex justify-content-between align-items-center p-3 px-4 border-bottom bg-white">
          <div class="d-flex align-items-center gap-3">
            <div class="header-icon-box shadow-xs">
              <i class="bi bi-calendar2-week-fill fs-5 text-primary"></i>
            </div>
            <div>
              <div class="d-flex align-items-center gap-2 mb-0">
                <h5 class="fw-bold mb-0 text-dark header-title">
                  Ficha Mensual de Turnos
                </h5>
                <span class="badge bg-primary-subtle text-primary border border-primary-subtle px-2.5 py-0.5 rounded-pill small fw-semibold">
                  {{ monthName }}
                </span>
              </div>
              <p class="text-secondary smaller mb-0 mt-0.5">
                Auditoría clínica y cómputo de horas programadas por funcionario.
              </p>
            </div>
          </div>

          <!-- NAVEGACIÓN DE MES & CIERRE -->
          <div class="d-flex align-items-center gap-2.5">
            <div class="btn-group shadow-xs bg-light rounded-pill p-1 border">
              <button
                type="button"
                class="btn btn-sm btn-icon-round btn-prev-month"
                title="Mes anterior"
                @click="prevMonth"
              >
                <i class="bi bi-chevron-left"></i>
              </button>
              <span class="px-3 d-flex align-items-center fw-bold text-dark month-display-label">
                {{ monthName }}
              </span>
              <button
                type="button"
                class="btn btn-sm btn-icon-round btn-next-month"
                title="Mes siguiente"
                @click="nextMonth"
              >
                <i class="bi bi-chevron-right"></i>
              </button>
            </div>

            <button
              type="button"
              class="btn btn-sm btn-outline-secondary rounded-pill px-3 fw-semibold shadow-xs"
              @click="goToCurrentMonth"
            >
              Hoy
            </button>

            <button
              type="button"
              class="btn-close shadow-none ms-2"
              aria-label="Cerrar modal"
              @click="emit('cerrar')"
            ></button>
          </div>
        </div>

        <!-- CUERPO DEL MODAL (2 COLUMNAS) -->
        <div class="staff-sheet-modal-body p-4 position-relative">
          <!-- Spinner de Carga -->
          <div v-if="isLoading" class="loading-overlay">
            <div class="spinner-border text-primary mb-2" role="status">
              <span class="visually-hidden">Cargando...</span>
            </div>
            <span class="fw-semibold text-dark small">Cargando ficha mensual...</span>
          </div>

          <div class="row g-4">
            <!-- COLUMNA IZQUIERDA: TARJETA DE FUNCIONARIO Y HORAS -->
            <div class="col-lg-4 col-xl-3.5 panel-left">
              <!-- Tarjeta de Funcionario -->
              <div class="card border rounded-3 p-3 bg-white shadow-xs staff-profile-card">
                <div class="d-flex align-items-center gap-3">
                  <div class="staff-avatar-box shadow-xs">
                    {{ staffInitials }}
                  </div>
                  <div class="text-truncate min-w-0">
                    <h6 class="fw-bold text-dark mb-0 text-truncate" :title="staffFullName">
                      {{ staffFullName }}
                    </h6>
                    <div class="d-flex align-items-center gap-1.5 mt-1">
                      <span class="badge bg-light text-secondary border px-1.5 py-0.5 rounded font-monospace smaller">
                        RUT: {{ staffRut }}
                      </span>
                    </div>
                  </div>
                </div>

                <div class="staff-meta-badges mt-3 pt-2.5 border-top d-flex flex-column gap-1.5 smaller">
                  <div class="d-flex align-items-center justify-content-between">
                    <span class="text-muted fw-semibold">Cargo:</span>
                    <span class="fw-bold text-dark text-truncate ms-2">{{ staffCargo }}</span>
                  </div>
                  <div class="d-flex align-items-center justify-content-between">
                    <span class="text-muted fw-semibold">Servicio:</span>
                    <span class="badge bg-primary-subtle text-primary border border-primary-subtle px-2 py-0.5 rounded-pill fw-semibold">
                      <i class="bi bi-hospital me-1"></i>{{ staffServiceName }}
                    </span>
                  </div>
                </div>
              </div>

              <!-- Tarjetas de Métricas de Horas -->
              <div class="hours-stats-container d-flex flex-column gap-2 mt-3">
                <!-- Horas Totales -->
                <div class="stat-card stat-total border rounded-3 p-3 shadow-xs d-flex align-items-center justify-content-between bg-white">
                  <div class="d-flex align-items-center gap-3">
                    <div class="stat-icon-wrapper bg-primary bg-opacity-10 text-primary">
                      <i class="bi bi-clock-history fs-4"></i>
                    </div>
                    <div>
                      <span class="stat-label text-secondary fw-semibold">Horas Totales</span>
                      <div class="d-flex align-items-baseline gap-1 mt-0.5">
                        <h3 class="fw-bold mb-0 text-dark tabular-nums">{{ totalHours }}</h3>
                        <span class="unit-text text-secondary fw-medium smaller">hrs</span>
                      </div>
                    </div>
                  </div>
                </div>

                <!-- Horas Diurnas -->
                <div class="stat-card stat-day border rounded-3 p-3 shadow-xs d-flex align-items-center justify-content-between bg-white">
                  <div class="d-flex align-items-center gap-3">
                    <div class="stat-icon-wrapper bg-warning bg-opacity-10 text-warning">
                      <i class="bi bi-sun-fill fs-4"></i>
                    </div>
                    <div>
                      <span class="stat-label text-secondary fw-semibold">Horas Diurnas</span>
                      <div class="d-flex align-items-baseline gap-1 mt-0.5">
                        <h3 class="fw-bold mb-0 text-dark tabular-nums">{{ dayHours }}</h3>
                        <span class="unit-text text-secondary fw-medium smaller">hrs</span>
                      </div>
                    </div>
                  </div>
                </div>

                <!-- Horas Nocturnas -->
                <div class="stat-card stat-night border rounded-3 p-3 shadow-xs d-flex align-items-center justify-content-between bg-white">
                  <div class="d-flex align-items-center gap-3">
                    <div class="stat-icon-wrapper bg-indigo bg-opacity-10 text-indigo">
                      <i class="bi bi-moon-stars-fill fs-4"></i>
                    </div>
                    <div>
                      <span class="stat-label text-secondary fw-semibold">Horas Nocturnas</span>
                      <div class="d-flex align-items-baseline gap-1 mt-0.5">
                        <h3 class="fw-bold mb-0 text-dark tabular-nums">{{ nightHours }}</h3>
                        <span class="unit-text text-secondary fw-medium smaller">hrs</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <!-- Distribución de Servicios -->
              <div v-if="serviceStats.length > 0" class="card border rounded-3 p-3 bg-white mt-3 shadow-xs">
                <div class="d-flex justify-content-between align-items-center mb-2">
                  <span class="smaller text-secondary fw-bold text-uppercase tracking-wider">
                    Distribución de Servicios
                  </span>
                  <span class="badge bg-light text-muted border px-1.5 py-0.5 rounded smaller">
                    {{ serviceStats.length }} {{ serviceStats.length === 1 ? 'servicio' : 'servicios' }}
                  </span>
                </div>
                <div v-for="(svc, sIdx) in serviceStats" :key="sIdx" class="mb-2 last-mb-0">
                  <div class="d-flex justify-content-between smaller mb-1">
                    <span class="fw-semibold text-dark">{{ formatTitleCase(svc.serviceName || 'General') }}</span>
                    <span class="text-secondary fw-bold">{{ svc.percentage }}%</span>
                  </div>
                  <div class="progress" style="height: 6px">
                    <div
                      class="progress-bar bg-primary rounded-pill"
                      role="progressbar"
                      :style="{ width: `${svc.percentage}%` }"
                    ></div>
                  </div>
                </div>
              </div>
            </div>

            <!-- COLUMNA DERECHA: CALENDARIO MENSUAL DE TURNOS -->
            <div class="col-lg-8 col-xl-8.5 panel-right">
              <div class="calendar-card border rounded-3 overflow-hidden shadow-xs bg-white">
                <!-- Días de la semana -->
                <div class="days-header-row">
                  <span class="day-col-header">LUN</span>
                  <span class="day-col-header">MAR</span>
                  <span class="day-col-header">MIÉ</span>
                  <span class="day-col-header">JUE</span>
                  <span class="day-col-header">VIE</span>
                  <span class="day-col-header weekend-col">SÁB</span>
                  <span class="day-col-header weekend-col">DOM</span>
                </div>

                <!-- Grilla de Días -->
                <div class="month-days-grid">
                  <!-- Días fantasma previos para alinear el primer día de la semana -->
                  <div
                    v-for="ghost in prevMonthGhostDays"
                    :key="'prev-' + ghost"
                    class="calendar-day-cell ghost-slot"
                  >
                    <div class="day-number-header">
                      <span class="ghost-day-num">{{ ghost }}</span>
                    </div>
                  </div>

                  <!-- Celdas activas del mes -->
                  <div
                    v-for="day in calendarDays"
                    :key="day.dayNum"
                    class="calendar-day-cell"
                    :class="{
                      'is-today': isToday(day.dayNum),
                      'has-shift': day.items && day.items.length > 0
                    }"
                  >
                    <div class="day-number-header">
                      <span class="day-num" :class="{ 'today-badge': isToday(day.dayNum) }">
                        {{ day.dayNum }}
                      </span>
                    </div>

                    <!-- Items de turno (Soft-pills de alto contraste) -->
                    <div v-if="day.items && day.items.length > 0" class="shifts-content-stack">
                      <div
                        v-for="(item, idx) in day.items"
                        :key="idx"
                        class="shift-pill-badge"
                        :style="getShiftPillStyle(item.sigla)"
                      >
                        <div class="d-flex align-items-center gap-1.5">
                          <span
                            class="shift-dot"
                            :style="{ backgroundColor: getShiftTheme(item.sigla).dot }"
                          ></span>
                          <span class="shift-name-text">{{ getShiftName(item.sigla) }}</span>
                        </div>
                        <span v-if="item.startTime && item.startTime !== '-'" class="shift-time-text">
                          <i class="bi bi-clock me-1 opacity-75"></i>{{ item.startTime }} - {{ item.endTime }}
                        </span>
                      </div>
                    </div>
                  </div>

                  <!-- Días fantasma posteriores para completar la última semana -->
                  <div
                    v-for="ghost in nextMonthGhostDays"
                    :key="'next-' + ghost"
                    class="calendar-day-cell ghost-slot"
                  >
                    <div class="day-number-header">
                      <span class="ghost-day-num">{{ ghost }}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- FOOTER ELEGANTE CON ACCIÓN DE IMPRESIÓN -->
        <div class="staff-sheet-modal-footer p-3 px-4 bg-light border-top d-flex justify-content-between align-items-center">
          <div class="d-flex align-items-center gap-2 text-secondary smaller">
            <i class="bi bi-shield-check text-success fs-6"></i>
            <span>Cómputo en tiempo real sincronizado con asignaciones y reemplazos</span>
          </div>

          <div class="d-flex align-items-center gap-2">
            <button
              type="button"
              class="btn btn-dark rounded-pill px-4 btn-sm fw-bold shadow-xs"
              @click="emit('cerrar')"
            >
              Cerrar
            </button>
          </div>
        </div>
      </div>
    </div>
  </Transition>
</template>

<script setup lang="ts">
import { ref, watch, computed, onMounted } from 'vue'
import { useReportStore } from '@/stores/report.store'
import { useTurnSiglaStore } from '@/stores/turn-sigla.store'
import { useServiceStore } from '@/stores/service.store'
import { formatTitleCase } from '@/utils/text-formatters'

const props = withDefaults(
  defineProps<{
    visible: boolean
    staff: any
    initialMonth?: number
    initialYear?: number
  }>(),
  {
    visible: false,
    staff: null
  }
)

const emit = defineEmits<{
  (e: 'cerrar'): void
}>()

const reportStore = useReportStore()
const turnSiglaStore = useTurnSiglaStore()
const serviceStore = useServiceStore()

const now = new Date()
const month = ref(props.initialMonth ?? now.getMonth() + 1)
const year = ref(props.initialYear ?? now.getFullYear())
const isLoading = ref(false)

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

const monthName = computed(() => {
  const idx = Math.max(0, Math.min(11, month.value - 1))
  return `${months[idx]} ${year.value}`
})

// Offset de inicio de mes (Lunes = 0, Domingo = 6)
const startOffset = computed(() => {
  const firstDay = new Date(year.value, month.value - 1, 1).getDay()
  return firstDay === 0 ? 6 : firstDay - 1
})

// Días fantasma del mes anterior para rellenar la primera semana
const prevMonthGhostDays = computed(() => {
  const count = startOffset.value
  if (count === 0) return []
  const prevMonthLastDate = new Date(year.value, month.value - 1, 0).getDate()
  const days: number[] = []
  for (let i = count - 1; i >= 0; i--) {
    days.push(prevMonthLastDate - i)
  }
  return days
})

// Días fantasma del mes siguiente para completar la cuadrícula de 7 columnas
const nextMonthGhostDays = computed(() => {
  const currentTotal = startOffset.value + calendarDays.value.length
  const remainder = currentTotal % 7
  if (remainder === 0) return []
  const count = 7 - remainder
  const days: number[] = []
  for (let i = 1; i <= count; i++) {
    days.push(i)
  }
  return days
})

// Cargar Ficha del funcionario
const fetchFichaData = async () => {
  const uid = props.staff?.userId || props.staff?._id
  if (!uid) return

  isLoading.value = true
  try {
    reportStore.currentFilters.userId = uid
    reportStore.currentFilters.month = month.value
    reportStore.currentFilters.year = year.value
    await reportStore.fetchReportSummary({ preview: true })
  } catch (err) {
    console.error('Error al cargar ficha de turnos:', err)
  } finally {
    isLoading.value = false
  }
}

watch(
  () => props.visible,
  (isVis) => {
    if (isVis && props.staff) {
      if (props.initialMonth) month.value = props.initialMonth
      if (props.initialYear) year.value = props.initialYear
      fetchFichaData()
    }
  },
  { immediate: true }
)

watch([month, year], () => {
  if (props.visible && props.staff) {
    fetchFichaData()
  }
})

onMounted(() => {
  if (turnSiglaStore.siglas.length === 0) {
    turnSiglaStore.fetchSiglas()
  }
  if (serviceStore.services.length === 0) {
    serviceStore.fetchServices()
  }
})

// Navegación de mes
function nextMonth() {
  if (month.value === 12) {
    month.value = 1
    year.value++
  } else {
    month.value++
  }
}

function prevMonth() {
  if (month.value === 1) {
    month.value = 12
    year.value--
  } else {
    month.value--
  }
}

function goToCurrentMonth() {
  const today = new Date()
  month.value = today.getMonth() + 1
  year.value = today.getFullYear()
}

// Datos del funcionario
const staffFullName = computed(() => {
  const s = props.staff
  if (!s) return 'Funcionario'
  const rep = reportStore.reportData?.staff
  const first = s.nombre || s.firstName || rep?.firstName || rep?.nombre || ''
  const last = s.apellido || s.lastName || rep?.lastName || rep?.apellido || ''
  return formatTitleCase(`${first} ${last}`.trim()) || 'Funcionario'
})

const staffCargo = computed(() => {
  const s = props.staff
  const rep = reportStore.reportData?.staff
  const cargo = s?.cargo || s?.positionId?.name || s?.roleId?.name || rep?.cargo || ''
  return formatTitleCase(cargo) || 'Personal Clínico'
})

const staffRut = computed(() => {
  return props.staff?.rut || reportStore.reportData?.staff?.rut || 'Sin RUT'
})

const staffServiceName = computed(() => {
  const raw = props.staff?.servicio || reportStore.reportData?.staff?.servicio
  const resolved = serviceStore.getServiceName(raw)
  return resolved && resolved !== '—' && resolved !== 'undefined' ? formatTitleCase(resolved) : 'General'
})

const staffInitials = computed(() => {
  const name = staffFullName.value
  const parts = name.split(/\s+/)
  if (parts.length >= 2) {
    return (parts[0][0] + parts[1][0]).toUpperCase()
  }
  return name.slice(0, 2).toUpperCase()
})

// Helper para cálculo horario (diurno/nocturno) estándar
function calculateDayNightFromTimes(entry?: string | null, exit?: string | null) {
  if (!entry || !exit || !entry.includes(':') || !exit.includes(':')) {
    return { total: 0, day: 0, night: 0 }
  }
  const [startH, startM] = entry.split(':').map(Number)
  const [endH, endM] = exit.split(':').map(Number)
  if (isNaN(startH) || isNaN(startM) || isNaN(endH) || isNaN(endM)) {
    return { total: 0, day: 0, night: 0 }
  }

  const start = startH * 60 + startM
  const end = endH * 60 + endM

  let durationMinutes = end - start
  if (durationMinutes <= 0) durationMinutes += 24 * 60
  const total = Number((durationMinutes / 60).toFixed(1))

  const DAY_START = 8 * 60 // 08:00
  const DAY_END = 20 * 60 // 20:00

  let dayMinutes = 0
  if (end > start) {
    const workStart = Math.max(start, DAY_START)
    const workEnd = Math.min(end, DAY_END)
    if (workEnd > workStart) {
      dayMinutes = workEnd - workStart
    }
  } else {
    const firstLegStart = Math.max(start, DAY_START)
    const firstLegEnd = Math.min(24 * 60, DAY_END)
    if (firstLegEnd > firstLegStart) {
      dayMinutes += firstLegEnd - firstLegStart
    }
    const secondLegStart = Math.max(0, DAY_START)
    const secondLegEnd = Math.min(end, DAY_END)
    if (secondLegEnd > secondLegStart) {
      dayMinutes += secondLegEnd - secondLegStart
    }
  }

  const day = Number((dayMinutes / 60).toFixed(1))
  const night = Number(Math.max(0, total - day).toFixed(1))
  return { total, day, night }
}

// Horas calculadas con soporte para contrato oficial backend (totals), mocks (hours) y fallback dinámico sobre timeline
const computedHours = computed(() => {
  const rep = reportStore.reportData
  if (!rep) return { total: 0, day: 0, night: 0 }

  // 1. Contrato oficial del backend: rep.totals { hours, dayHours, nightHours }
  const totals = rep.totals
  if (totals && typeof totals.hours === 'number' && totals.hours > 0) {
    return {
      total: totals.hours,
      day: totals.dayHours ?? 0,
      night: totals.nightHours ?? 0
    }
  }

  // 2. Mocks / contratos alternativos: rep.hours { totalHours, dayHours, nightHours }
  const h = rep.hours
  if (h && typeof h.totalHours === 'number' && h.totalHours > 0) {
    return {
      total: h.totalHours,
      day: h.dayHours ?? 0,
      night: h.nightHours ?? 0
    }
  }

  // 3. Suma desde serviceStats
  if (Array.isArray(rep.serviceStats) && rep.serviceStats.length > 0) {
    let sTot = 0
    let sDay = 0
    let sNight = 0
    for (const svc of rep.serviceStats) {
      if (svc.stats) {
        sTot += svc.stats.hours || 0
        sDay += svc.stats.dayHours || 0
        sNight += svc.stats.nightHours || 0
      }
    }
    if (sTot > 0) {
      return {
        total: Number(sTot.toFixed(1)),
        day: Number(sDay.toFixed(1)),
        night: Number(sNight.toFixed(1))
      }
    }
  }

  // 4. Fallback dinámico sobre timeline (suma día a día e inferencia por horarios de entrada/salida)
  if (Array.isArray(rep.timeline)) {
    let tTot = 0
    let tDay = 0
    let tNight = 0

    for (const day of rep.timeline) {
      if (Array.isArray(day.items)) {
        for (const item of day.items) {
          if (item.hours && item.hours > 0) {
            tTot += item.hours
            tDay += item.dayHrs || 0
            tNight += item.nightHrs || 0
          } else if (item.startTime && item.endTime && item.startTime !== '-' && item.endTime !== '-') {
            const metrics = calculateDayNightFromTimes(item.startTime, item.endTime)
            tTot += metrics.total
            tDay += metrics.day
            tNight += metrics.night
          }
        }
      }
    }

    if (tTot > 0) {
      return {
        total: Number(tTot.toFixed(1)),
        day: Number(tDay.toFixed(1)),
        night: Number(tNight.toFixed(1))
      }
    }
  }

  return {
    total: totals?.hours ?? h?.totalHours ?? rep.totalHours ?? 0,
    day: totals?.dayHours ?? h?.dayHours ?? rep.dayHours ?? 0,
    night: totals?.nightHours ?? h?.nightHours ?? rep.nightHours ?? 0
  }
})

const totalHours = computed(() => computedHours.value.total)
const dayHours = computed(() => computedHours.value.day)
const nightHours = computed(() => computedHours.value.night)

const serviceStats = computed(() => {
  const rawList = reportStore.reportData?.serviceStats || []
  const tot = totalHours.value
  return rawList.map((svc: any) => {
    const hours = svc.stats?.hours ?? svc.hours ?? 0
    const pct = tot > 0 ? Math.round((hours / tot) * 100) : (svc.percentage ?? 100)
    return {
      serviceName: svc.serviceName,
      hours,
      percentage: pct
    }
  })
})

const calendarDays = computed(() => {
  return reportStore.reportData?.timeline || []
})

function isToday(dayNum: number): boolean {
  const today = new Date()
  return (
    today.getDate() === dayNum &&
    today.getMonth() + 1 === month.value &&
    today.getFullYear() === year.value
  )
}

function getShiftName(sigla: string): string {
  const name = turnSiglaStore.mapSiglaToNombre(sigla)
  return formatTitleCase(name || sigla)
}

interface ShiftTheme {
  bg: string
  border: string
  text: string
  timeText: string
  dot: string
}

function getShiftTheme(siglaRaw: string): ShiftTheme {
  const sigla = (siglaRaw || '').toUpperCase()

  switch (sigla) {
    case 'L': // Largo (Warm Amber)
      return {
        bg: '#fffbeb',
        border: '#fde68a',
        text: '#92400e',
        timeText: '#b45309',
        dot: '#f59e0b'
      }
    case 'N': // Noche (Twilight Indigo)
      return {
        bg: '#eef2ff',
        border: '#c7d2fe',
        text: '#3730a3',
        timeText: '#4f46e5',
        dot: '#6366f1'
      }
    case 'X': // Libre (Fresh Mint)
      return {
        bg: '#f0fdf4',
        border: '#bbf7d0',
        text: '#166534',
        timeText: '#15803d',
        dot: '#22c55e'
      }
    case 'G': // Guardia (Ruby Coral)
      return {
        bg: '#fef2f2',
        border: '#fecaca',
        text: '#991b1b',
        timeText: '#dc2626',
        dot: '#ef4444'
      }
    case 'D': // Diurno (Sky Blue)
      return {
        bg: '#eff6ff',
        border: '#bfdbfe',
        text: '#1e40af',
        timeText: '#2563eb',
        dot: '#3b82f6'
      }
    default: {
      const baseHex = turnSiglaStore.mapSiglaToColor(sigla) || '#64748b'
      return {
        bg: baseHex + '15',
        border: baseHex + '40',
        text: '#1e293b',
        timeText: '#475569',
        dot: baseHex
      }
    }
  }
}

function getShiftPillStyle(sigla: string) {
  const theme = getShiftTheme(sigla)
  return {
    backgroundColor: theme.bg,
    borderColor: theme.border,
    color: theme.text
  }
}
</script>

<style scoped lang="scss">
.staff-sheet-modal-overlay {
  position: fixed;
  inset: 0;
  z-index: 1055;
  background-color: rgba(15, 23, 42, 0.65);
  backdrop-filter: blur(8px);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 1.5rem;
}

.staff-sheet-modal-dialog {
  background: #ffffff;
  border-radius: 1.25rem;
  width: 100%;
  max-width: 1240px;
  max-height: 92vh;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  border: 1px solid rgba(226, 232, 240, 0.8);
}

.header-icon-box {
  width: 42px;
  height: 42px;
  border-radius: 12px;
  background: #eff6ff;
  display: flex;
  align-items: center;
  justify-content: center;
  border: 1px solid rgba(37, 99, 235, 0.15);
}

.btn-icon-round {
  width: 28px;
  height: 28px;
  border-radius: 50%;
  padding: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  border: none;
  background: transparent;
  color: #475569;
  transition: all 0.15s ease;

  &:hover {
    background: #e2e8f0;
    color: #0f172a;
  }
}

.month-display-label {
  min-width: 150px;
  justify-content: center;
  font-size: 0.875rem;
}

.staff-sheet-modal-body {
  flex: 1 1 auto;
  overflow-y: auto;
  min-height: 420px;
}

.loading-overlay {
  position: absolute;
  inset: 0;
  background: rgba(255, 255, 255, 0.85);
  backdrop-filter: blur(3px);
  z-index: 10;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
}

/* STAFF PROFILE CARD */
.staff-avatar-box {
  width: 48px;
  height: 48px;
  border-radius: 14px;
  background: linear-gradient(135deg, #1d4ed8 0%, #3b82f6 100%);
  color: #ffffff;
  font-weight: 700;
  font-size: 1.05rem;
  display: flex;
  align-items: center;
  justify-content: center;
  letter-spacing: 0.02em;
}

/* STAT CARDS */
.stat-card {
  transition: transform 0.15s ease, box-shadow 0.15s ease;

  &:hover {
    transform: translateY(-1px);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
  }
}

.stat-icon-wrapper {
  width: 44px;
  height: 44px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.stat-label {
  font-size: 0.775rem;
}

.tabular-nums {
  font-variant-numeric: tabular-nums;
  letter-spacing: -0.03em;
  font-size: 1.5rem;
  line-height: 1;
}

.bg-indigo {
  background-color: #6366f1 !important;
}
.text-indigo {
  color: #4f46e5 !important;
}

/* CALENDAR CARD */
.calendar-card {
  display: flex;
  flex-direction: column;
}

.days-header-row {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  background: #f8fafc;
  border-bottom: 1px solid #e2e8f0;
  padding: 0.65rem 0;
  text-align: center;
}

.day-col-header {
  font-size: 0.725rem;
  font-weight: 700;
  letter-spacing: 0.05em;
  color: #64748b;

  &.weekend-col {
    color: #94a3b8;
  }
}

.month-days-grid {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  gap: 1px;
  background: #e2e8f0;
}

.calendar-day-cell {
  background: #ffffff;
  min-height: 84px;
  padding: 0.45rem;
  display: flex;
  flex-direction: column;
  justify-content: flex-start;
  transition: background 0.15s ease;
  position: relative;

  &:hover:not(.ghost-slot) {
    background: #fbfcfe;
  }

  &.ghost-slot {
    background: #f8fafc;
    opacity: 0.55;
  }

  &.is-today {
    background: #f0f7ff !important;
  }
}

.day-number-header {
  display: flex;
  align-items: center;
  margin-bottom: 0.35rem;
}

.day-num {
  font-size: 0.8rem;
  font-weight: 600;
  color: #475569;

  &.today-badge {
    background: #2563eb;
    color: #ffffff !important;
    width: 22px;
    height: 22px;
    border-radius: 50%;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    font-size: 0.725rem;
    font-weight: 700;
    box-shadow: 0 2px 4px rgba(37, 99, 235, 0.25);
  }
}

.ghost-day-num {
  font-size: 0.775rem;
  font-weight: 500;
  color: #94a3b8;
}

.shifts-content-stack {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.shift-pill-badge {
  border-radius: 7px;
  padding: 0.3rem 0.45rem;
  display: flex;
  flex-direction: column;
  line-height: 1.2;
  border-width: 1px;
  border-style: solid;
  transition: all 0.15s ease;

  .shift-name-text {
    font-size: 0.725rem;
    font-weight: 700;
  }

  .shift-time-text {
    font-size: 0.625rem;
    margin-top: 1px;
    font-weight: 500;
  }
}

.shift-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  flex-shrink: 0;
}

.shadow-xs {
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.04);
}

.smaller {
  font-size: 0.75rem;
}

.tracking-wider {
  letter-spacing: 0.04em;
}

.last-mb-0:last-child {
  margin-bottom: 0 !important;
}

/* TRANSITIONS */
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.2s ease;
}
.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

@media print {
  .staff-sheet-modal-overlay {
    position: static;
    background: transparent;
    padding: 0;
  }
  .staff-sheet-modal-dialog {
    max-height: none;
    box-shadow: none !important;
    border: none !important;
  }
  .btn-close,
  .btn-group,
  .staff-sheet-modal-footer {
    display: none !important;
  }
}
</style>
