import { computed, type Ref } from 'vue'
import dayGridPlugin from '@fullcalendar/daygrid'
import interactionPlugin from '@fullcalendar/interaction'

interface CalendarConfigOptions {
  events: Ref<any[]>
  onDateClick: (info: any) => void
  onEventClick: (info: any) => void
}

export function useCalendarConfig(options: CalendarConfigOptions) {
  const calendarOptions = computed(() => ({
    plugins: [dayGridPlugin, interactionPlugin],
    initialView: 'dayGridMonth',
    locale: 'es',
    firstDay: 1,
    events: options.events.value,
    views: {
      dayGridMonth: {
        dayMaxEvents: 3
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
    height: 'auto',
    eventClick: options.onEventClick,
    dateClick: options.onDateClick,
    eventDisplay: 'block',
    themeSystem: 'standard',
    noEventsContent: 'No hay reemplazos activos para mostrar'
  }))

  return {
    calendarOptions
  }
}
