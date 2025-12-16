<template>
  <main>
    <div class="rounded-xl shadow-md p-4 h-[80vh] overflow-auto">
      <FullCalendar ref="fullCalendar" :options="calendarOptions" />
    </div>

    <!-- Modal de Detalles -->
    <div
      v-if="modalVisible"
      class="modal fade show d-block"
      tabindex="-1"
      role="dialog"
      style="background-color: rgba(0, 0, 0, 0.5)"
    >
      <div class="modal-dialog modal-dialog-centered" role="document">
        <div class="modal-content">
          <div class="modal-header bg-light">
            <h5 class="modal-title fw-bold text-primary">Detalle del Reemplazo</h5>
            <button type="button" class="btn-close" aria-label="Close" @click="closeModal"></button>
          </div>
          <div class="modal-body" v-if="eventoSeleccionado">
            <div class="mb-3">
              <strong class="d-block text-secondary small">Funcionario Saliente</strong>
              <span class="fs-5"
                >{{ eventoSeleccionado.nombre_saliente }}
                {{ eventoSeleccionado.apellido_saliente }}</span
              >
            </div>

            <div class="mb-3">
              <strong class="d-block text-secondary small">Reemplazante (Entrante)</strong>
              <span class="fs-5"
                >{{ eventoSeleccionado.nombre_entrante }}
                {{ eventoSeleccionado.apellido_entrante }}</span
              >
            </div>

            <div class="row mb-3">
              <div class="col-6">
                <strong class="d-block text-secondary small">Desde</strong>
                <span>{{ formatDateDDMMYYYY(eventoSeleccionado.fecha_inicio) }}</span>
              </div>
              <div class="col-6">
                <strong class="d-block text-secondary small">Hasta</strong>
                <span>{{ formatDateDDMMYYYY(eventoSeleccionado.fecha_termino) }}</span>
              </div>
            </div>

            <div class="row mb-3">
              <div class="col-6">
                <strong class="d-block text-secondary small">Servicio</strong>
                <span class="badge bg-info text-dark">{{ eventoSeleccionado.servicio }}</span>
              </div>
              <div class="col-6">
                <strong class="d-block text-secondary small">Turno</strong>
                <span>{{ eventoSeleccionado.tipo_turno }}</span>
              </div>
            </div>

            <hr />
            <div class="d-flex justify-content-between align-items-center">
              <span
                class="badge"
                :style="{ backgroundColor: getColorByStatus(eventoSeleccionado.status) }"
              >
                {{ eventoSeleccionado.status }}
              </span>
              <small class="text-muted">
                Creado el {{ formatDateDDMMYYYY(eventoSeleccionado.created_at) }} por
                {{ eventoSeleccionado.creado_por.full_name }}
              </small>
            </div>
          </div>
          <div class="modal-footer">
            <button type="button" class="btn btn-secondary btn-sm" @click="closeModal">
              Cerrar
            </button>
          </div>
        </div>
      </div>
    </div>
  </main>
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
  dayMaxEvents: 3, // Muestra "+X más" si hay muchos eventos
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
  height: '80vh',
  contentHeight: '80vh',
  eventClick: handleEventClick,
  dateClick: handleDateClick
})

function handleDateClick(info: any) {
  // Al hacer click en un día (celda vacía o fondo), cambiamos a la vista de día
  if (fullCalendar.value) {
    const calendarApi = fullCalendar.value.getApi()
    calendarApi.changeView('dayGridDay', info.dateStr)
  }
}

function handleEventClick(info: any) {
  // Aquí podrías abrir un modal con detalles del reemplazo
  // info.event.extendedProps contiene los datos originales
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
      // Ajuste de Fechas:
      // 1. Slice(0, 10) para quitar la hora y evitar desfases de zona horaria (UTC vs Local).
      // 2. Sumamos 1 día a la fecha de término porque FullCalendar considera el 'end' como exclusivo (hasta las 00:00).

      const start = r.fecha_inicio ? r.fecha_inicio.slice(0, 10) : ''
      const end = r.fecha_termino ? sumarUnDia(r.fecha_termino) : ''

      return {
        title: `${r.nombre_entrante} ${r.apellido_entrante} (${r.servicio}) ${r.tipo_turno}`,
        start: start,
        end: end,
        backgroundColor: getColorByStatus(r.status),
        borderColor: getColorByStatus(r.status),
        extendedProps: { ...r }
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
      return '#28a745' // Verde success
    case 'PENDIENTE':
      return '#ffc107' // Amarillo warning
    case 'FINALIZADO':
      return '#6c757d' // Gris
    case 'ANULADO':
      return '#dc3545' // Rojo danger
    default:
      return '#0d6efd' // Azul primary
  }
}
</script>

<style>
.fc-col-header-cell-cushion {
  text-transform: capitalize;
  color: #6f32c4;
}

.fc-daygrid-day-number {
  color: #6f32c4; /* gris oscuro tipo Bootstrap */
  font-weight: 600;
}

.fc-toolbar-title {
  text-transform: capitalize;
  color: #4d02a1; /* azul Bootstrap */
  font-weight: bold;
}
</style>
