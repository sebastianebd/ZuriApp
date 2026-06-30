import { ref, onMounted, computed, watch } from 'vue'
import { useReplacementStore } from '@/stores/replacement.store'
import { useOptionStore } from '@/stores/option.store'
import { formatTitleCase } from '@/utils/text-formatters'
import { getColorByStatus } from '@/utils/helpers'

export function useCalendarState() {
  const replacementStore = useReplacementStore()
  const optionStore = useOptionStore()

  const calendarEvents = ref<any[]>([])
  const selectedService = ref<string | null>(null)
  const loading = ref(false)

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

  /** FullCalendar requiere que `end` sea exclusivo (RFC 5545). 
   *  Nuestra BD guarda fecha_termino como inclusivo, por eso sumamos +1 día. */
  function toExclusiveEndDate(fechaIso: string): string {
    if (!fechaIso) return ''
    const date = new Date(fechaIso)
    date.setUTCDate(date.getUTCDate() + 1)
    return date.toISOString().slice(0, 10)
  }

  const loadReplacementsByService = async () => {
    if (!selectedService.value) {
      calendarEvents.value = []
      return
    }

    loading.value = true
    try {
      // Fetch only replacements for selected service (server-side filtering)
      await replacementStore.fetchActiveReplacementsPaginated({
        servicio: selectedService.value,
        limit: 500 // High limit for calendar view (sufficient for single service)
      })

      // Get filtered replacements from store
      const replacements = replacementStore.currentPageReplacements

      // Transform to calendar events
      calendarEvents.value = replacements.map((r: any) => {
        const start = r.fecha_inicio ? r.fecha_inicio.slice(0, 10) : ''
        const end = r.fecha_termino ? toExclusiveEndDate(r.fecha_termino) : ''

        const titleName = formatTitleCase(`${r.nombre_entrante} ${r.apellido_entrante}`)

        return {
          title: `${titleName} - ${r.tipo_turno}`,
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
      calendarEvents.value = []
    } finally {
      loading.value = false
    }
  }

  // Watch for service changes (server-side filtering)
  watch(selectedService, () => {
    loadReplacementsByService()
  })

  onMounted(async () => {
    try {
      // Set default service if available
      if (serviceOptions.value.length > 0) {
        selectedService.value = serviceOptions.value[0]
      }

      // Load replacements for default service
      if (selectedService.value) {
        await loadReplacementsByService()
      }
    } catch (error) {
      console.error('Error cargando eventos al calendario:', error)
    }
  })

  // Watch options to set default if initial load was empty
  watch(serviceOptions, async (newVal) => {
    if (!selectedService.value && newVal.length > 0) {
      selectedService.value = newVal[0]
      await loadReplacementsByService()
    }
  })

  return {
    calendarEvents,
    selectedService,
    loading,
    serviceOptions,
    modalVisible,
    eventoSeleccionado,
    handleDateClick,
    handleEventClick,
    closeModal
  }
}
