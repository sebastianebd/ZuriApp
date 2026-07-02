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
  const month = ref(1)
  const year = ref(new Date().getFullYear())

  const months = [
    'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
    'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
  ]
  const monthOptions = months.map((m, i) => ({ label: m, value: i + 1 }))
  const years = [2024, 2025, 2026]

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

  // Validation: Restrict current/future months
  const isRestricted = computed(() => {
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

    if (isRestricted.value) {
      reportStore.error = 'El mes seleccionado se encuentra en curso. Solo se pueden emitir reportes de meses cerrados.'
      reportStore.reportData = null
      return
    }

    reportStore.currentFilters.userId = selectedUser.value._id
    reportStore.currentFilters.month = month.value
    reportStore.currentFilters.year = year.value

    await reportStore.fetchReportSummary()
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
      const fullName = `${selectedUser.value.nombre}_${selectedUser.value.apellido}`.replace(/\s+/g, '_')
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
    monthOptions,
    years,
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
