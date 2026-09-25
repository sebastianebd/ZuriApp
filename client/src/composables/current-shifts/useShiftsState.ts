import { ref, computed, watch } from 'vue'
import { useServiceStore } from '@/stores/service.store'

const SHIFTS_SERVICE_KEY = 'zuriapp_shifts_selected_service'
const PREFERRED_SERVICE_KEY = 'zuriapp_preferred_service'

export function useShiftsState(props?: { historyMode?: boolean; externalFilters?: any }) {
  const currentDate = ref(new Date())
  const loading = ref(false)
  const showModal = ref(false)

  // Initialize selectedService from localStorage if available and not in historyMode
  let initialService: string | null = null
  if (!props?.historyMode && typeof localStorage !== 'undefined') {
    try {
      initialService =
        localStorage.getItem(SHIFTS_SERVICE_KEY) ||
        localStorage.getItem(PREFERRED_SERVICE_KEY) ||
        null
    } catch {
      initialService = null
    }
  }

  const selectedService = ref<string | null>(initialService)

  // Persist selectedService whenever it changes
  watch(selectedService, (newVal) => {
    if (props?.historyMode || typeof localStorage === 'undefined') return
    try {
      if (newVal) {
        localStorage.setItem(SHIFTS_SERVICE_KEY, newVal)
        localStorage.setItem(PREFERRED_SERVICE_KEY, newVal)
      } else {
        localStorage.removeItem(SHIFTS_SERVICE_KEY)
      }
    } catch {
      // Ignore storage errors in restricted environments
    }
  })

  const alertComponent = ref()
  const serviceStore = useServiceStore()

  const serviceOptions = computed(() => {
    return serviceStore.services || []
  })

  // Computeds for Date Navigation
  const currentYear = computed(() => currentDate.value.getFullYear())
  const currentMonth = computed(() => currentDate.value.getMonth())

  const formattedMonth = computed(() => {
    return new Intl.DateTimeFormat('es-ES', { month: 'long', year: 'numeric' }).format(
      currentDate.value
    )
  })

  const daysInMonth = computed(() => {
    const year = currentYear.value
    const month = currentMonth.value
    const days = []

    const lastDay = new Date(year, month + 1, 0).getDate()

    for (let i = 1; i <= lastDay; i++) {
      const d = new Date(year, month, i)
      days.push({
        date: d,
        timestamp: d.getTime(),
        dayNum: i,
        dayName: new Intl.DateTimeFormat('es-ES', { weekday: 'narrow' }).format(d)
      })
    }
    return days
  })

  const canGoNext = computed(() => {
    const today = new Date()
    const thisMonth = new Date(today.getFullYear(), today.getMonth(), 1)
    const activeMonth = new Date(currentYear.value, currentMonth.value, 1)

    return activeMonth < thisMonth
  })

  const isPastMonth = computed(() => {
    const today = new Date()
    const thisMonth = new Date(today.getFullYear(), today.getMonth(), 1)
    const activeMonth = new Date(currentYear.value, currentMonth.value, 1)

    return activeMonth < thisMonth
  })

  function nextMonth() {
    if (canGoNext.value) {
      currentDate.value = new Date(currentYear.value, currentMonth.value + 1, 1)
    }
  }

  function prevMonth() {
    currentDate.value = new Date(currentYear.value, currentMonth.value - 1, 1)
  }

  function openModal() {
    showModal.value = true
  }

  function closeModal() {
    showModal.value = false
  }

  return {
    currentDate,
    loading,
    showModal,
    selectedService,
    alertComponent,
    currentYear,
    currentMonth,
    formattedMonth,
    daysInMonth,
    canGoNext,
    isPastMonth,
    nextMonth,
    prevMonth,
    openModal,
    closeModal,
    serviceOptions
  }
}
