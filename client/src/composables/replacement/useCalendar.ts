import { ref, onMounted, computed, watch } from 'vue'
import dayGridPlugin from '@fullcalendar/daygrid'
import interactionPlugin from '@fullcalendar/interaction'
import { useReplacementStore } from '@/stores/replacement.store'
import { useOptionStore } from '@/stores/option.store'
import { formatTitleCase } from '@/utils/text-formatters'

export function useCalendar() {
  const replacementStore = useReplacementStore()
  const optionStore = useOptionStore()

  const calendarEvents = ref<any[]>([])
  const rawReplacements = ref<any[]>([])
  const selectedService = ref<string | null>(null)

  // Service Options
  const serviceOptions = computed(() => optionStore.opciones?.servicios || [])

  // Modal State
  const modalVisible = ref(false)
  const eventoSeleccionado = ref<any>(null)

  function handleDateClick(info: any) {
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
    events: calendarEvents,
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
    eventClick: handleEventClick,
    dateClick: handleDateClick,
    eventDisplay: 'block',
    themeSystem: 'standard',
    noEventsContent: 'Seleccione un servicio para ver turnos'
  })

  function sumarUnDia(fechaIso: string): string {
    if (!fechaIso) return ''
    const date = new Date(fechaIso)
    date.setUTCDate(date.getUTCDate() + 1)
    return date.toISOString().slice(0, 10)
  }

  function formatDateDDMMYYYY(fechaIso: string): string {
    if (!fechaIso) return '-'
    const [year, month, day] = fechaIso.slice(0, 10).split('-')
    return `${day}-${month}-${year}`
  }

  // Update Events based on Filter
  const updateCalendarEvents = () => {
    if (!selectedService.value) {
      calendarEvents.value = []
      return
    }

    const filtered = rawReplacements.value.filter((r) => r.servicio === selectedService.value)

    calendarEvents.value = filtered.map((r: any) => {
      const start = r.fecha_inicio ? r.fecha_inicio.slice(0, 10) : ''
      const end = r.fecha_termino ? sumarUnDia(r.fecha_termino) : ''

      const titleName = formatTitleCase(`${r.nombre_entrante} ${r.apellido_entrante}`)
      // const titleService = formatTitleCase(r.servicio) // Redundant in title if filtered by service

      return {
        title: `${titleName} - ${r.tipo_turno}`, // Changed to Show Turn Type instead of Service
        start: start,
        end: end,
        backgroundColor: getColorByStatus(r.status),
        borderColor: 'transparent',
        extendedProps: { ...r },
        classNames: ['custom-calendar-event']
      }
    })
  }

  // Watch for filter changes
  watch(selectedService, () => {
    updateCalendarEvents()
  })

  onMounted(async () => {
    try {
      // Ensure options are loaded
      if (optionStore.opciones?.servicios?.length === 0) {
        // Trigger fetch if needed, assuming logic exists elsewhere or data persists.
        // If not, we might need to fetch options here too.
        // For now assume options might be available or we wait/retry?
        // Actually best to rely on store being populated or user interaction.
      }

      const reemplazos = await replacementStore.mostrarReemplazos()
      rawReplacements.value = reemplazos

      // Set default service if available
      if (serviceOptions.value.length > 0) {
        selectedService.value = serviceOptions.value[0]
      } else {
        // Fallback or wait for options?
        // If options are async, we might need a watcher on serviceOptions
      }

      updateCalendarEvents()
    } catch (error) {
      console.error('Error cargando eventos al calendario:', error)
    }
  })

  // Watch options to set default if initial load was empty
  watch(serviceOptions, (newVal) => {
    if (!selectedService.value && newVal.length > 0) {
      selectedService.value = newVal[0]
    }
  })

  return {
    calendarOptions,
    modalVisible,
    eventoSeleccionado,
    closeModal,
    formatDateDDMMYYYY,
    getColorByStatus,
    selectedService,
    serviceOptions
  }
}
