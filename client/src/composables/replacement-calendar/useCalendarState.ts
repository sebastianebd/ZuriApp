import { ref, onMounted, computed, watch, getCurrentInstance } from 'vue'
import { useAuthStore } from '@/stores/auth.store'
import { useServiceStore } from '@/stores/service.store'
import * as ReplacementService from '@/services/replacement.service'
import { formatTitleCase } from '@/utils/text-formatters'
import { getColorByStatus } from '@/utils/helpers'

export function useCalendarState() {
  const authStore = useAuthStore()
  const serviceStore = useServiceStore()

  const calendarEvents = ref<any[]>([])
  const selectedService = ref<string>('')
  const loading = ref(false)

  // Service Options con opción "Todos los Servicios"
  const serviceOptions = computed(() => [
    { nombre: 'Todos los Servicios', _id: '' },
    ...(serviceStore.services || [])
  ])

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
   *  Nuestra BD guarda fecha_termino como inclusivo, por eso sumamos +1 día de forma segura en UTC. */
  function toExclusiveEndDate(fechaIso: string): string {
    if (!fechaIso) return ''
    const cleanDateStr = fechaIso.slice(0, 10)
    const [year, month, day] = cleanDateStr.split('-').map(Number)
    if (!year || !month || !day) return ''
    const date = new Date(Date.UTC(year, month - 1, day))
    date.setUTCDate(date.getUTCDate() + 1)
    return date.toISOString().slice(0, 10)
  }

  const loadReplacementsByService = async () => {
    loading.value = true
    try {
      const apiPrivate = authStore.usePrivateApi()
      const queryParams: any = {
        limit: 1000,
        status: 'active'
      }

      if (selectedService.value && selectedService.value.trim() !== '') {
        queryParams.servicio = selectedService.value
      }

      // Consulta directa aislada: NO sobreescribe el estado de la tabla (currentPageReplacements)
      const response = await ReplacementService.mostrarReemplazos(apiPrivate, queryParams)
      const replacements =
        response?.reemplazos ||
        (Array.isArray(response) ? response : response?.data?.reemplazos || [])

      calendarEvents.value = replacements.map((r: any) => {
        const start = r.fecha_inicio ? String(r.fecha_inicio).slice(0, 10) : ''
        const rawEnd = r.fecha_termino ? String(r.fecha_termino).slice(0, 10) : start
        const end = rawEnd ? toExclusiveEndDate(rawEnd) : ''
        const titleName = formatTitleCase(`${r.nombre_entrante || ''} ${r.apellido_entrante || ''}`)

        return {
          id: String(r._id || r.id_negocio || Math.random()),
          title: `${titleName} - ${r.tipo_turno || 'Turno'}`,
          start: start,
          end: end,
          allDay: true,
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

  // Watch for service changes
  watch(selectedService, () => {
    loadReplacementsByService()
  })

  if (getCurrentInstance()) {
    onMounted(async () => {
      try {
        if (serviceStore.services.length === 0) {
          await serviceStore.fetchServices()
        }
        await loadReplacementsByService()
      } catch (error) {
        console.error('Error cargando eventos iniciales del calendario:', error)
      }
    })
  }

  return {
    calendarEvents,
    selectedService,
    serviceOptions,
    modalVisible,
    eventoSeleccionado,
    loading,

    handleDateClick,
    handleEventClick,
    closeModal,
    refreshCalendar: loadReplacementsByService,

    getServiceName: (id: string) => serviceStore.getServiceName(id)
  }
}
