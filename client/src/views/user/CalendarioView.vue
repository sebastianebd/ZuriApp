<template>
  <main>
    <div class="rounded-xl shadow-md p-4 h-[80vh] overflow-auto">
      <FullCalendar :options="calendarOptions" />
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

// Opciones del calendario
const calendarOptions = ref({
  plugins: [dayGridPlugin, interactionPlugin],
  initialView: 'dayGridMonth',
  locale: 'es',
  firstDay: 1,
  events: calendarEvents, // Vinculado a la ref
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
  eventClick: handleEventClick
})

function handleEventClick(info: any) {
  // Aquí podrías abrir un modal con detalles del reemplazo
  // info.event.extendedProps contiene los datos originales
  console.log('Evento clickeado:', info.event)
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
