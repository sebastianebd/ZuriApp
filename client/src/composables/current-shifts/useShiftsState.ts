import { ref, computed } from 'vue'
import { useOptionStore } from '@/stores/option.store'

export function useShiftsState() {
  const currentDate = ref(new Date())
  const loading = ref(false)
  const showModal = ref(false)
  const selectedService = ref<string | null>(null)
  const alertComponent = ref()
  const optionStore = useOptionStore()

  const serviceOptions = computed(() => {
    return optionStore.opciones?.servicios || []
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
    nextMonth,
    prevMonth,
    openModal,
    closeModal,
    serviceOptions
  }
}
