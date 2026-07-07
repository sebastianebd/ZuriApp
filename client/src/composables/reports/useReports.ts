import { ref, computed, watch, onMounted } from 'vue'
import { debounce } from 'lodash-es'
import { useReportStore } from '@/stores/report.store'
import { useUserStore } from '@/stores/user.store'
import { useTurnSiglaStore } from '@/stores/turn-sigla.store'

export function useReports() {
  const reportStore = useReportStore()
  const userStore = useUserStore()
  const siglaStore = useTurnSiglaStore()

  const selectedUser = ref<any>(null)
  const userOptions = ref<any[]>([])
  const month = ref(new Date().getMonth() + 1)
  const year = ref(new Date().getFullYear())

  // Generar meses dinámicamente usando Intl (sin riesgos de typos ortográficos)
  const months = Array.from({ length: 12 }, (_, i) => {
    const d = new Date(2000, i, 1)
    const m = new Intl.DateTimeFormat('es-ES', { month: 'long' }).format(d)
    return m.charAt(0).toUpperCase() + m.slice(1) // Ej: "Enero"
  })

  // Generar años dinámicamente (desde 2023 hasta el año actual) para que nunca quede obsoleto
  const currentY = new Date().getFullYear()
  const startY = 2023
  const years = Array.from({ length: currentY - startY + 1 }, (_, i) => startY + i)

  // Debounced Search with Lodash (300ms)
  const performSearch = debounce(async (search: string, loading: (l: boolean) => void) => {
    try {
      const results = await userStore.buscarUsuarios(search)
      userOptions.value = results
    } catch (e) {
      console.error(e)
    } finally {
      loading(false)
    }
  }, 300)

  const onSearch = (search: string, loading: (l: boolean) => void) => {
    if (search.length < 1) return
    loading(true)
    performSearch(search, loading)
  }

  // Fetch users for the dropdown (Load default top 20)
  onMounted(async () => {
    reportStore.error = null // Clear any persistent errors on mount
    const defaults = await userStore.buscarUsuarios('')
    userOptions.value = defaults

    // Ensure siglas are loaded for colors
    await siglaStore.fetchSiglas()
  })

  // Validation: Check if month is current/future (Open Month / Avance)
  const isOpenMonth = computed(() => {
    const now = new Date()
    const currentYear = now.getFullYear()
    const currentMonth = now.getMonth() + 1 // 1-indexed (Jan=1)

    if (year.value > currentYear) return true
    if (year.value === currentYear && month.value >= currentMonth) return true
    return false
  })

  // Watchers to clear report when filters change
  watch([month, year, selectedUser], () => {
    reportStore.reportData = null
    reportStore.error = null
  })

  const handleGenerateReport = async () => {
    if (!selectedUser.value) return

    reportStore.currentFilters.userId = selectedUser.value._id
    reportStore.currentFilters.month = month.value
    reportStore.currentFilters.year = year.value

    await reportStore.fetchReportSummary()

    if (reportStore.reportData && !reportStore.error) {
      setTimeout(() => {
        downloadPDF()
      }, 300)
    }
  }

  // Helpers
  const getShiftColor = (sigla: string) => {
    return siglaStore.mapSiglaToColor(sigla) || '#94a3b8' // fallback to slate-400
  }

  const getShiftName = (sigla: string) => {
    return siglaStore.mapSiglaToNombre(sigla)
  }

  const formatDate = (dateStr: string | Date) => {
    const d = new Date(dateStr)
    const day = String(d.getDate()).padStart(2, '0')
    const mn = String(d.getMonth() + 1).padStart(2, '0')
    const yr = d.getFullYear()
    return `${day}/${mn}/${yr}`
  }

  const formatReportDate = (dateStr: string | Date) => {
    const d = new Date(dateStr)
    const day = String(d.getUTCDate()).padStart(2, '0')
    const mn = String(d.getUTCMonth() + 1).padStart(2, '0')
    const yr = d.getUTCFullYear()
    return `${day}/${mn}/${yr}`
  }

  const downloadPDF = () => {
    const originalTitle = document.title

    if (selectedUser.value && reportStore.reportData) {
      const monthName = months[month.value - 1]
      const fullName = `${selectedUser.value.nombre}_${selectedUser.value.apellido}`.replace(
        /\s+/g,
        '_'
      )
      document.title = `Reporte_${monthName}_${year.value}_${fullName}`
    }

    window.print()
    document.title = originalTitle
  }

  const getUserLabel = (option: any) => {
    return `${option.nombre} ${option.apellido}`
  }

  return {
    reportStore,
    selectedUser,
    userOptions,
    month,
    year,
    months,
    years,
    isOpenMonth,
    onSearch,
    handleGenerateReport,
    getShiftColor,
    getShiftName,
    formatDate,
    formatReportDate,
    downloadPDF,
    getUserLabel
  }
}
