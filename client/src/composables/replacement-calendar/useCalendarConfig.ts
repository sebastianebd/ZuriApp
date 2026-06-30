import { ref, type Ref } from 'vue'
import dayGridPlugin from '@fullcalendar/daygrid'
import interactionPlugin from '@fullcalendar/interaction'

interface CalendarConfigOptions {
  events: Ref<any[]>
  onDateClick: (info: any) => void
  onEventClick: (info: any) => void
}

export function useCalendarConfig(options: CalendarConfigOptions) {
  const calendarOptions = ref({
    plugins: [dayGridPlugin, interactionPlugin],
    initialView: 'dayGridMonth',
    locale: 'es',
    firstDay: 1,
    events: options.events,
    views: {
      dayGridMonth: {
        dayMaxEvents: 2
      },
      dayGridWeek: {
        dayMaxEvents: false
      },
      dayGridDay: {
        dayMaxEvents: false
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
    eventClick: options.onEventClick,
    dateClick: options.onDateClick,
    eventDisplay: 'block',
    themeSystem: 'standard',
    noEventsContent: 'Seleccione un servicio para ver turnos'
  })

  return {
    calendarOptions
  }
}
