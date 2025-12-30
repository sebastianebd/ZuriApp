import { ref, onMounted } from 'vue'
import dayGridPlugin from '@fullcalendar/daygrid'
import interactionPlugin from '@fullcalendar/interaction'
import { useReplacementStore } from '@/stores/replacement.store'

export function useCalendar() {
  const replacementStore = useReplacementStore()
  const calendarEvents = ref<any[]>([])

  // Modal State
  const modalVisible = ref(false)
  const eventoSeleccionado = ref<any>(null)

  // We don't keep the fullCalendar ref inside the composable for DOM manipulation if we can avoid it,
  // or we expect the view to bind a ref if needed.
  // Ideally, handlers should rely on the event info.

  function handleDateClick(info: any) {
    // Attempt to use the calendar API from the event info if available
    // Standard FullCalendar info has .view.calendar
    if (info.view && info.view.calendar) {
      info.view.calendar.changeView('dayGridDay', info.dateStr)
    }
  }

  function handleEventClick(info: any) {
    eventoSeleccionado.value = info.event.extendedProps
    modalVisible.value = true
  }

  function closeModal() {
    modalVisible.value = false
    eventoSeleccionado.value = null
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

  // Opciones del calendario
  const calendarOptions = ref({
    plugins: [dayGridPlugin, interactionPlugin],
    initialView: 'dayGridMonth',
    locale: 'es',
    firstDay: 1,
    events: calendarEvents, // Vinculado a la ref
    views: {
      dayGridMonth: {
        dayMaxEvents: 2 // Límite solo para la vista de mes
      },
      dayGridWeek: {
        dayMaxEvents: false // Sin límite en vista de semana
      },
      dayGridDay: {
        dayMaxEvents: false // Sin límite en vista de día
      }
    },
    showNonCurrentDates: false,
    fixedWeekCount: false,
    expandRows: true,
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
    height: '100%',
    contentHeight: '100%',
    eventClick: handleEventClick,
    dateClick: handleDateClick,
    eventDisplay: 'block',
    themeSystem: 'standard'
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

  return {
    calendarOptions,
    modalVisible,
    eventoSeleccionado,
    closeModal,
    formatDateDDMMYYYY,
    getColorByStatus
  }
}
