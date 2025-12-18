<template>
  <div class="calendar-view p-4">
    <!-- Header -->
    <div class="d-flex justify-content-between align-items-center mb-4">
      <div>
        <h2 class="fw-bold mb-1 text-dark">Calendario de Reemplazos</h2>
        <p class="text-secondary mb-0">Visualiza y gestiona la programación de turnos</p>
      </div>
      <div class="d-none d-md-flex gap-2">
        <div
          class="badge bg-success bg-opacity-10 text-success p-2 px-3 border border-success border-opacity-25 rounded-pill"
        >
          <i class="bi bi-circle-fill me-2 small"></i>En curso
        </div>
        <div
          class="badge bg-warning bg-opacity-10 text-warning p-2 px-3 border border-warning border-opacity-25 rounded-pill"
        >
          <i class="bi bi-circle-fill me-2 small"></i>Pendiente
        </div>
      </div>
    </div>

    <!-- Calendar Card -->
    <div class="card border-0 shadow-sm rounded-4 overflow-hidden">
      <div class="card-body p-4 calendar-container">
        <FullCalendar ref="fullCalendar" :options="calendarOptions" />
      </div>
    </div>

    <!-- Modal de Detalles Rediseñado -->
    <Transition name="fade">
      <div
        v-if="modalVisible"
        class="modal fade show d-block shadow-lg"
        tabindex="-1"
        role="dialog"
        style="background-color: rgba(30, 41, 59, 0.5); backdrop-filter: blur(4px)"
      >
        <div class="modal-dialog modal-dialog-centered" role="document">
          <div class="modal-content border-0 rounded-4 overflow-hidden shadow">
            <div class="modal-header border-0 bg-primary bg-gradient text-white p-4">
              <h5 class="modal-title fw-bold">
                <i class="bi bi-info-circle-fill me-2"></i>Detalle del Reemplazo
              </h5>
              <button
                type="button"
                class="btn-close btn-close-white"
                aria-label="Close"
                @click="closeModal"
              ></button>
            </div>

            <div class="modal-body p-4" v-if="eventoSeleccionado">
              <div class="d-flex align-items-center mb-4 p-3 bg-light rounded-3 border border-1">
                <div class="avatar-info me-3">
                  <div
                    class="avatar-initials bg-primary bg-opacity-10 text-primary rounded-circle d-flex align-items-center justify-content-center fw-bold"
                  >
                    {{ eventoSeleccionado.nombre_saliente?.[0]
                    }}{{ eventoSeleccionado.apellido_saliente?.[0] }}
                  </div>
                </div>
                <div>
                  <label class="text-secondary smaller fw-bold text-uppercase mb-0"
                    >Funcionario Saliente</label
                  >
                  <h5 class="fw-bold mb-0 text-dark">
                    {{ eventoSeleccionado.nombre_saliente }}
                    {{ eventoSeleccionado.apellido_saliente }}
                  </h5>
                </div>
              </div>

              <div class="d-flex align-items-center mb-4 p-3 bg-light rounded-3 border border-1">
                <div class="avatar-info me-3">
                  <div
                    class="avatar-initials bg-success bg-opacity-10 text-success rounded-circle d-flex align-items-center justify-content-center fw-bold"
                  >
                    {{ eventoSeleccionado.nombre_entrante?.[0]
                    }}{{ eventoSeleccionado.apellido_entrante?.[0] }}
                  </div>
                </div>
                <div>
                  <label class="text-secondary smaller fw-bold text-uppercase mb-0"
                    >Reemplazante (Entrante)</label
                  >
                  <h5 class="fw-bold mb-0 text-dark">
                    {{ eventoSeleccionado.nombre_entrante }}
                    {{ eventoSeleccionado.apellido_entrante }}
                  </h5>
                </div>
              </div>

              <div class="row g-3 mb-4">
                <div class="col-6">
                  <div class="p-3 bg-light rounded-3 border border-1 h-100">
                    <label class="text-secondary smaller fw-bold text-uppercase mb-1 d-block">
                      <i class="bi bi-calendar-event me-1"></i>Desde
                    </label>
                    <span class="fw-semibold text-dark">{{
                      formatDateDDMMYYYY(eventoSeleccionado.fecha_inicio)
                    }}</span>
                  </div>
                </div>
                <div class="col-6">
                  <div class="p-3 bg-light rounded-3 border border-1 h-100">
                    <label class="text-secondary smaller fw-bold text-uppercase mb-1 d-block">
                      <i class="bi bi-calendar-check me-1"></i>Hasta
                    </label>
                    <span class="fw-semibold text-dark">{{
                      formatDateDDMMYYYY(eventoSeleccionado.fecha_termino)
                    }}</span>
                  </div>
                </div>
              </div>

              <div class="row g-3 mb-4">
                <div class="col-6">
                  <div class="p-3 bg-light rounded-3 border border-1 h-100">
                    <label class="text-secondary smaller fw-bold text-uppercase mb-1 d-block">
                      <i class="bi bi-building me-1"></i>Servicio
                    </label>
                    <span class="badge bg-info text-dark w-100 py-2">{{
                      eventoSeleccionado.servicio
                    }}</span>
                  </div>
                </div>
                <div class="col-6">
                  <div class="p-3 bg-light rounded-3 border border-1 h-100">
                    <label class="text-secondary smaller fw-bold text-uppercase mb-1 d-block">
                      <i class="bi bi-clock me-1"></i>Turno
                    </label>
                    <span class="fw-semibold text-dark">{{ eventoSeleccionado.tipo_turno }}</span>
                  </div>
                </div>
              </div>

              <div class="d-flex justify-content-between align-items-center pt-3 border-top mt-2">
                <span
                  class="badge px-3 py-2 rounded-pill"
                  :style="{ backgroundColor: getColorByStatus(eventoSeleccionado.status) }"
                >
                  <i class="bi bi-circle-fill me-1 small"></i>{{ eventoSeleccionado.status }}
                </span>
                <div class="text-end">
                  <p class="text-muted smaller mb-0">Creado por</p>
                  <p class="fw-medium text-dark small mb-0">
                    {{ eventoSeleccionado.creado_por?.full_name || 'Sistema' }}
                  </p>
                </div>
              </div>
            </div>

            <div class="modal-footer border-0 p-4 pt-0">
              <button type="button" class="btn btn-light fw-bold px-4 border" @click="closeModal">
                Cerrar
              </button>
            </div>
          </div>
        </div>
      </div>
    </Transition>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import FullCalendar from '@fullcalendar/vue3'
import dayGridPlugin from '@fullcalendar/daygrid'
import interactionPlugin from '@fullcalendar/interaction'
import { useReplacementStore } from '@/stores/replacement.store'

const replacementStore = useReplacementStore()
const calendarEvents = ref<any[]>([])
const fullCalendar = ref<InstanceType<typeof FullCalendar> | null>(null)

// Modal State
const modalVisible = ref(false)
const eventoSeleccionado = ref<any>(null)

// Opciones del calendario
const calendarOptions = ref({
  plugins: [dayGridPlugin, interactionPlugin],
  initialView: 'dayGridMonth',
  locale: 'es',
  firstDay: 1,
  events: calendarEvents, // Vinculado a la ref
  dayMaxEvents: 4, // Muestra "+X más" si hay muchos eventos
  headerToolbar: {
    left: 'prev,next today',
    center: 'title',
    right: 'dayGridMonth,dayGridWeek,dayGridDay'
  },
  buttonText: {
    today: 'Hoy',
    month: 'Mes',
    week: 'Semana',
    day: 'Día'
  },
  height: 'auto',
  contentHeight: 'auto',
  eventClick: handleEventClick,
  dateClick: handleDateClick,
  eventDisplay: 'block',
  themeSystem: 'standard'
})

function handleDateClick(info: any) {
  // Al hacer click en un día (celda vacía o fondo), cambiamos a la vista de día
  if (fullCalendar.value) {
    const calendarApi = fullCalendar.value.getApi()
    calendarApi.changeView('dayGridDay', info.dateStr)
  }
}

function handleEventClick(info: any) {
  console.log('Evento clickeado:', info.event)
  eventoSeleccionado.value = info.event.extendedProps
  modalVisible.value = true
}

function closeModal() {
  modalVisible.value = false
  eventoSeleccionado.value = null
}

onMounted(async () => {
  try {
    const reemplazos = await replacementStore.mostrarReemplazos()

    // Transformar los datos para FullCalendar
    calendarEvents.value = reemplazos.map((r: any) => {
      const start = r.fecha_inicio ? r.fecha_inicio.slice(0, 10) : ''
      const end = r.fecha_termino ? sumarUnDia(r.fecha_termino) : ''

      return {
        title: `${r.nombre_entrante} ${r.apellido_entrante} - ${r.servicio}`,
        start: start,
        end: end,
        backgroundColor: getColorByStatus(r.status),
        borderColor: 'transparent',
        extendedProps: { ...r },
        classNames: ['custom-calendar-event']
      }
    })
  } catch (error) {
    console.error('Error cargando eventos al calendario:', error)
  }
})

// Función auxiliar para sumar 1 día a una fecha (para fix de FullCalendar end exclusive)
function sumarUnDia(fechaIso: string): string {
  if (!fechaIso) return ''
  const date = new Date(fechaIso)
  date.setUTCDate(date.getUTCDate() + 1)
  return date.toISOString().slice(0, 10)
}

// Función auxiliar para formatear fechas a DD-MM-YYYY
function formatDateDDMMYYYY(fechaIso: string): string {
  if (!fechaIso) return '-'
  const [year, month, day] = fechaIso.slice(0, 10).split('-')
  return `${day}-${month}-${year}`
}

function getColorByStatus(status: string) {
  switch (status) {
    case 'EN CURSO':
      return '#10b981' // Esmerald 500
    case 'PENDIENTE':
      return '#f59e0b' // Amber 500
    case 'FINALIZADO':
      return '#64748b' // Slate 500
    case 'ANULADO':
      return '#ef4444' // Red 500
    default:
      return '#3b82f6' // Blue 500
  }
}
</script>

<style>
/* FullCalendar Customization */
.calendar-view {
  background-color: #f8fafc;
  min-height: calc(100vh - 60px);
}

.calendar-container {
  min-height: 70vh;
}

.fc-col-header-cell {
  background-color: #f1f5f9;
  padding: 12px 0 !important;
}

.fc-col-header-cell-cushion {
  text-transform: uppercase;
  color: #475569 !important;
  font-size: 0.75rem;
  font-weight: 700;
  letter-spacing: 0.05em;
  text-decoration: none !important;
}

.fc-daygrid-day-number {
  color: #64748b !important;
  font-weight: 600;
  padding: 8px !important;
  text-decoration: none !important;
}

.fc-toolbar-title {
  color: #1e293b !important;
  font-weight: 800 !important;
  font-size: 1.5rem !important;
  text-transform: capitalize;
}

.fc-button-primary {
  background-color: #ffffff !important;
  border-color: #e2e8f0 !important;
  color: #475569 !important;
  text-transform: capitalize !important;
  font-weight: 600 !important;
  padding: 8px 16px !important;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05) !important;
}

.fc-button-primary:hover {
  background-color: #f8fafc !important;
  color: #1e293b !important;
}

.fc-button-active {
  background-color: #3b82f6 !important;
  border-color: #3b82f6 !important;
  color: #ffffff !important;
}

.custom-calendar-event {
  border-radius: 4px !important;
  padding: 2px 4px !important;
  font-size: 0.8rem !important;
  font-weight: 500 !important;
  border: none !important;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.1) !important;
  cursor: pointer;
  transition: transform 0.1s ease;
}

.custom-calendar-event:hover {
  transform: scale(1.02);
  filter: brightness(0.95);
}

.fc-day-today {
  background-color: #eff6ff !important;
}

.fc-day-other {
  background-color: #fcfcfc;
}

/* Avatar Initials */
.avatar-initials {
  width: 42px;
  height: 42px;
  font-size: 1.1rem;
}

.smaller {
  font-size: 0.7rem;
}

/* Transitions */
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

/* Responsive fixes */
@media (max-width: 768px) {
  .fc-toolbar {
    flex-direction: column;
    gap: 1rem;
  }
  .fc-toolbar-title {
    font-size: 1.25rem !important;
  }
}
</style>
