import { ref, reactive, onMounted, markRaw } from 'vue'
import { storeToRefs } from 'pinia'
import { useRoute } from 'vue-router'
import { usePublicStore } from '@/stores/public-calendar.store'
import type { PublicDayEntry, PublicShiftItem } from '@/types/public-calendar.types'
import type { EventInput, DatesSetArg, EventContentArg } from '@fullcalendar/core'
import dayGridPlugin from '@fullcalendar/daygrid'
import interactionPlugin from '@fullcalendar/interaction'
import esLocale from '@fullcalendar/core/locales/es'

export function usePublicCalendar() {
  const route = useRoute()
  const publicStore = usePublicStore()
  
  const { loading, error, userInfo } = storeToRefs(publicStore)
  
  const calendarTitle = ref<string>('')

  const fetchPublicShifts = async (month: number, year: number) => {
    // Set Custom Title
    const date = new Date(year, month - 1)
    const monthName = date.toLocaleString('es-ES', { month: 'long' })
    calendarTitle.value = `${monthName.charAt(0).toUpperCase() + monthName.slice(1)} ${year}`

    const userId = route.query.uid as string
    if (!userId) {
      error.value = 'Identificador de usuario no proporcionado.'
      loading.value = false
      return
    }

    try {
      const data = await publicStore.fetchPublicShifts(userId, month, year)

      if (data.timeline) {
        const newEvents: EventInput[] = []
        data.timeline.forEach((dayEntry: PublicDayEntry) => {
          if (dayEntry.items && dayEntry.items.length > 0) {
            dayEntry.items.forEach((item: PublicShiftItem) => {
              if (item.sigla === '-' && item.hours === 0) return

              newEvents.push({
                title: item.sigla,
                start: dayEntry.date.split('T')[0],
                allDay: true,
                backgroundColor: item.color,
                borderColor: item.color,
                textColor: '#ffffff',
                extendedProps: {
                  hours: item.hours,
                  startTime: item.startTime,
                  endTime: item.endTime
                }
              })
            })
          }
        })
        calendarOptions.events = newEvents
      }
    } catch (err: any) {
      // Error state is handled by the store
      console.error('Error in public calendar:', err)
    }
  }

  const handleDatesSet = (arg: DatesSetArg) => {
    if (loading.value) return

    const midDate = new Date((arg.view.currentStart.getTime() + arg.view.currentEnd.getTime()) / 2)
    const month = midDate.getMonth() + 1
    const year = midDate.getFullYear()

    fetchPublicShifts(month, year)
  }

  const calendarOptions = reactive({
    plugins: [markRaw(dayGridPlugin), markRaw(interactionPlugin)],
    initialView: 'dayGridMonth',
    initialDate: undefined as string | undefined,
    locale: esLocale,
    firstDay: 1,
    headerToolbar: {
      left: '',
      center: '',
      right: ''
    },
    buttonText: {
      today: 'Hoy',
      month: 'Mes'
    },
    events: [] as EventInput[],
    height: 'auto',
    minHeight: '600px',
    eventDisplay: 'block',
    showNonCurrentDates: false,
    fixedWeekCount: false,
    datesSet: handleDatesSet,
    eventContent: (arg: EventContentArg) => {
      const color = arg.event.backgroundColor
      const textShadow = '1px 1px 0 #000, -1px -1px 0 #000, 1px -1px 0 #000, -1px 1px 0 #000'

      return {
        html: `<div class="fc-event-custom-content" style="
                background-color: ${color};
                border: 1px solid rgba(0,0,0,0.1);
                color: white;
                width: 100%;
                height: 100%;
                display: flex;
                align-items: center;
                justify-content: center;
                font-weight: 800;
                font-size: 1.1em;
                text-shadow: ${textShadow};
                border-radius: 6px;
                box-shadow: inset 0 1px 0 rgba(255,255,255,0.3), 0 2px 4px rgba(0,0,0,0.15);
                transform: translateY(-1px);
            ">
              ${arg.event.title}
            </div>`
      }
    }
  })

  onMounted(() => {
    const userId = route.query.uid as string
    if (!userId) {
      error.value = 'Identificador de usuario no proporcionado.'
      loading.value = false
      return
    }

    const qMonth = route.query.month ? Number(route.query.month) : null
    const qYear = route.query.year ? Number(route.query.year) : null

    let targetDate = new Date()

    if (qMonth && qYear) {
      targetDate = new Date(qYear, qMonth - 1, 1)
      calendarOptions.initialDate = targetDate.toISOString().split('T')[0]
    }

    fetchPublicShifts(targetDate.getMonth() + 1, targetDate.getFullYear())
  })

  return {
    loading,
    error,
    userInfo,
    calendarTitle,
    calendarOptions
  }
}
